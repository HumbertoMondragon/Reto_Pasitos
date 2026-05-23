import { buildCertificatePDF } from "@/lib/certificates/template";
import { requireRole } from "@/lib/api/helpers";
import { auth } from "@/auth";

/** Preview endpoint — returns a sample PDF without creating a DB record.
 *  Accessible in development (any user) or in production for ADMIN only. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Solo administradores" }), { status: 403 });
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify/VER-PREVIEW1`;

  const pdfBytes = await buildCertificatePDF({
    studentName: "María Guadalupe Hernández Ramírez",
    curp: "HERM900115MDFRNR08",
    courseName: "Puericultura",
    courseHours: 80,
    startDate: new Date("2025-01-13"),
    endDate: new Date("2025-04-25"),
    score: 9.5,
    certificateNumber: "PAC-2025-PREV",
    issueDate: new Date(),
    verificationFolio: "VER-PREVIEW1",
    verifyUrl,
    digitalSignatureHash: "a".repeat(64),
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="certificado-preview.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
