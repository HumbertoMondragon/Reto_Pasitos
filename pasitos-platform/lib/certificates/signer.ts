import { prisma } from "@/lib/db";
import { decryptField, generateCertificateNumber, generateVerificationFolio, signCertificate } from "@/lib/crypto";
import { generateCertificatePDF } from "./pdf-generator";
import { logAction } from "@/lib/api/helpers";
import { sendEmail } from "@/lib/email/sender";
import { certificateIssuedEmail } from "@/lib/email/templates";
import { EnrollmentResult } from "@prisma/client";

export async function issueCertificate(enrollmentId: string, issuedByUserId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      studentProfile: true,
      course: true,
      certificate: true,
      modules: { orderBy: { moduleNumber: "asc" } },
    },
  });

  if (!enrollment) throw new Error("Inscripción no encontrada");
  if (enrollment.result !== EnrollmentResult.PASSED) {
    throw new Error("El alumno no ha aprobado el curso — no se puede emitir certificado");
  }
  if (enrollment.certificate) {
    throw new Error("Ya existe un certificado para esta inscripción");
  }

  const certificateNumber = await generateCertificateNumber();
  const verificationFolio = generateVerificationFolio();
  const issueDate = new Date();

  const curp = decryptField(enrollment.studentProfile.curp);

  const signaturePayload = {
    certificateNumber,
    studentName: enrollment.studentProfile.fullName,
    curp,
    courseName: enrollment.course.name,
    score: enrollment.score?.toString() ?? "N/A",
    issueDate: issueDate.toISOString(),
    organizationId: "PASITOS-AC",
  };

  const digitalSignature = signCertificate(signaturePayload);

  const certificate = await prisma.certificate.create({
    data: {
      enrollmentId,
      certificateNumber,
      verificationFolio,
      issueDate,
      digitalSignature,
      signaturePayload: JSON.stringify(signaturePayload),
    },
  });

  // Generate PDF — failure is non-fatal
  try {
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${verificationFolio}`;
    const pdfPath = await generateCertificatePDF({
      studentName: enrollment.studentProfile.fullName,
      curp,
      courseName: enrollment.course.name,
      courseHours: enrollment.course.durationHours,
      startDate: enrollment.startDate ?? issueDate,
      endDate: enrollment.endDate ?? issueDate,
      score: Number(enrollment.score ?? 0),
      certificateNumber,
      issueDate,
      verificationFolio,
      verifyUrl,
      digitalSignatureHash: digitalSignature,
      modality: enrollment.modality ?? undefined,
      observations: enrollment.observations ?? undefined,
      modules: enrollment.modules.map((m) => ({
        moduleNumber: m.moduleNumber,
        moduleName: m.moduleName,
        competency: m.competency,
        score: Number(m.score),
        evidence: m.evidence,
        result: m.result,
      })),
    });

    await prisma.certificate.update({ where: { id: certificate.id }, data: { pdfPath } });
    certificate.pdfPath = pdfPath;
  } catch (e) {
    console.error("[CertPDF] Generation failed:", e);
  }

  // Send email — failure is non-fatal
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify/${verificationFolio}`;
    const pdfUrl = certificate.pdfPath ? `${baseUrl}${certificate.pdfPath}` : undefined;
    const { subject, html } = certificateIssuedEmail({
      studentName: enrollment.studentProfile.fullName,
      courseName: enrollment.course.name,
      certificateNumber,
      verificationFolio,
      verifyUrl,
      pdfUrl,
      issueDate,
    });
    await sendEmail(enrollment.studentProfile.email, subject, html);
  } catch (e) {
    console.error("[CertEmail] Failed to send:", e);
  }

  await logAction({
    userId: issuedByUserId,
    action: "CERT_ISSUED",
    entity: "Certificate",
    entityId: certificate.id,
    details: { certificateNumber, verificationFolio, enrollmentId },
  });

  return { ...certificate, signaturePayload };
}
