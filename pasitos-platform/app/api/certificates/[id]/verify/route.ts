import { prisma } from "@/lib/db";
import { verifyCertificate } from "@/lib/crypto";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit/logger";

// Public endpoint — no auth required
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Rate limit: 100 requests per IP per hour
  const ip = getClientIp(req) ?? "unknown";
  const rl = checkRateLimit(`verify:${ip}`, 100, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intenta más tarde." }, { status: 429 });
  }

  const folio = params.id;

  // Accept verification folio (VER-...) or certificate number (PAC-...)
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [
        { verificationFolio: folio },
        { certificateNumber: folio },
        { id: folio },
      ],
    },
    include: {
      enrollment: {
        include: {
          studentProfile: { select: { fullName: true } },
          course: { select: { name: true, courseCode: true, durationHours: true } },
        },
      },
    },
  });

  if (!certificate) {
    return NextResponse.json({
      isValid: false,
      isRevoked: false,
      error: "Certificado no encontrado",
    }, { status: 404 });
  }

  // Re-compute signature and compare
  let signaturePayload: object;
  try {
    signaturePayload = JSON.parse(certificate.signaturePayload);
  } catch {
    return NextResponse.json({ isValid: false, isRevoked: certificate.isRevoked, error: "Payload corrupto" });
  }

  const isValid = verifyCertificate(signaturePayload, certificate.digitalSignature);

  return NextResponse.json({
    isValid,
    isRevoked: certificate.isRevoked,
    revokedAt: certificate.revokedAt,
    revokedReason: certificate.revokedReason,
    certificateNumber: certificate.certificateNumber,
    verificationFolio: certificate.verificationFolio,
    issueDate: certificate.issueDate,
    studentName: certificate.enrollment.studentProfile.fullName,
    courseName: certificate.enrollment.course.name,
    courseCode: certificate.enrollment.course.courseCode,
    courseHours: certificate.enrollment.course.durationHours,
    digitalSignaturePreview: certificate.digitalSignature.slice(0, 32),
  });
}
