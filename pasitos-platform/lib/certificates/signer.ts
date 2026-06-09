import { prisma } from "@/lib/db";
import { buildCadenaOriginal, decryptField, generateCertificateNumber, generateVerificationFolio, signCertificate, signCertificateRSA } from "@/lib/crypto";
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
  if (enrollment.certificate) throw new Error("Ya existe un certificado para esta inscripción");

  // Derive score and result from modules if they exist; otherwise fall back to enrollment values
  const hasModules = enrollment.modules.length > 0;

  const calculatedScore = hasModules
    ? enrollment.modules.reduce((sum, m) => sum + Number(m.score), 0) / enrollment.modules.length
    : Number(enrollment.score ?? 0);

  const calculatedResult = hasModules
    ? enrollment.modules.every((m) => m.result === "Acreditado")
      ? EnrollmentResult.PASSED
      : EnrollmentResult.FAILED
    : enrollment.result;

  // Persist derived values back to enrollment
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { score: calculatedScore, result: calculatedResult },
  });

  const certificateNumber = await generateCertificateNumber();
  const verificationFolio = generateVerificationFolio();
  const issueDate = new Date();

  const curp = decryptField(enrollment.studentProfile.curp);

  const signaturePayload = {
    certificateNumber,
    studentName: enrollment.studentProfile.fullName,
    curp,
    courseName: enrollment.course.name,
    score: calculatedScore.toFixed(1),
    issueDate: issueDate.toISOString(),
    organizationId: "PASITOS-AC",
  };

  const digitalSignature = signCertificate(signaturePayload);

  const cadenaOriginal = buildCadenaOriginal({
    certificateNumber,
    studentName: enrollment.studentProfile.fullName,
    curp,
    courseName: enrollment.course.name,
    score: calculatedScore.toFixed(1),
    issueDate: issueDate.toISOString(),
    organizationId: "PASITOS-AC",
  });

  let rsaSignature: string | null = null;
  try {
    rsaSignature = signCertificateRSA(cadenaOriginal);
  } catch {
    // RSA key not configured — certificate still issues without it
  }

  const certificate = await prisma.certificate.create({
    data: {
      enrollmentId,
      certificateNumber,
      verificationFolio,
      issueDate,
      digitalSignature,
      signaturePayload: JSON.stringify(signaturePayload),
      rsaSignature,
      cadenaOriginal,
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
      score: calculatedScore,
      certificateNumber,
      issueDate,
      verificationFolio,
      verifyUrl,
      digitalSignatureHash: digitalSignature,
      rsaSignature: rsaSignature ?? undefined,
      cadenaOriginal,
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
    details: { certificateNumber, verificationFolio, enrollmentId, score: calculatedScore, result: calculatedResult },
  });

  return { ...certificate, signaturePayload };
}
