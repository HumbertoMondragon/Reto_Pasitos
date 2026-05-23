import { prisma } from "@/lib/db";
import { requireRole, logAction, ok, err } from "@/lib/api/helpers";
import { sendEmail } from "@/lib/email/sender";
import { certificateIssuedEmail } from "@/lib/email/templates";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const certificate = await prisma.certificate.findUnique({
    where: { id: params.id },
    include: {
      enrollment: {
        include: {
          studentProfile: { select: { fullName: true, email: true } },
          course: { select: { name: true } },
        },
      },
    },
  });

  if (!certificate) return err("Certificado no encontrado", 404);
  if (certificate.isRevoked) return err("No se puede reenviar un certificado revocado", 400);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify/${certificate.verificationFolio}`;
  const pdfUrl = certificate.pdfPath ? `${baseUrl}${certificate.pdfPath}` : undefined;

  const { subject, html } = certificateIssuedEmail({
    studentName: certificate.enrollment.studentProfile.fullName,
    courseName: certificate.enrollment.course.name,
    certificateNumber: certificate.certificateNumber,
    verificationFolio: certificate.verificationFolio,
    verifyUrl,
    pdfUrl,
    issueDate: certificate.issueDate,
  });

  const sent = await sendEmail(certificate.enrollment.studentProfile.email, subject, html);

  await logAction({
    userId: session!.user.id,
    action: "CERT_EMAIL_RESENT",
    entity: "Certificate",
    entityId: params.id,
    details: { to: certificate.enrollment.studentProfile.email, sent },
  });

  if (!sent) return err("No se pudo enviar el correo. Verifica la configuración SMTP.", 500);
  return ok({ message: "Correo reenviado exitosamente", to: certificate.enrollment.studentProfile.email });
}
