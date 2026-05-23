import { prisma } from "@/lib/db";
import { requireAuth, requireRole, logAction, ok, err } from "@/lib/api/helpers";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const certificate = await prisma.certificate.findUnique({
    where: { id: params.id },
    include: { enrollment: { include: { studentProfile: true, course: true } } },
  });
  if (!certificate) return err("Certificado no encontrado", 404);

  // If requesting PDF download
  const { searchParams } = new URL(req.url);
  if (searchParams.get("download") === "pdf") {
    if (!certificate.pdfPath) return err("PDF no generado aún", 404);
    try {
      const filePath = path.join(process.cwd(), "public", certificate.pdfPath);
      const fileBuffer = await readFile(filePath);
      await logAction({
        userId: session!.user.id,
        action: "CERT_DOWNLOADED",
        entity: "Certificate",
        entityId: params.id,
      });
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`,
        },
      });
    } catch {
      return err("No se pudo leer el archivo PDF", 500);
    }
  }

  await logAction({
    userId: session!.user.id,
    action: "CERT_VIEWED",
    entity: "Certificate",
    entityId: params.id,
  });

  return ok(certificate);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const certificate = await prisma.certificate.findUnique({ where: { id: params.id } });
  if (!certificate) return err("Certificado no encontrado", 404);
  if (certificate.isRevoked) return err("El certificado ya está revocado", 400);

  const body = await req.json().catch(() => ({}));
  if (!body.reason) return err("Se requiere el motivo de revocación (reason)");

  await prisma.certificate.update({
    where: { id: params.id },
    data: { isRevoked: true, revokedAt: new Date(), revokedReason: body.reason },
  });

  await logAction({
    userId: session!.user.id,
    action: "CERT_REVOKED",
    entity: "Certificate",
    entityId: params.id,
    details: { reason: body.reason },
  });

  return ok({ message: "Certificado revocado correctamente" });
}
