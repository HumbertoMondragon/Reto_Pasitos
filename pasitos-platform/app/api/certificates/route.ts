import { prisma } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api/helpers";
import { issueCertificate } from "@/lib/certificates/signer";

export async function POST(req: Request) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const body = await req.json();
  const { enrollmentId } = body;
  if (!enrollmentId) return err("Campo requerido: enrollmentId");

  try {
    const certificate = await issueCertificate(enrollmentId, session!.user.id);
    return ok(certificate, 201);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error al emitir certificado";
    return err(message, 400);
  }
}

export async function GET(req: Request) {
  const { error } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const isRevoked = searchParams.get("isRevoked");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (courseId) where.enrollment = { courseId };
  if (isRevoked !== null) where.isRevoked = isRevoked === "true";

  const [certificates, total] = await prisma.$transaction([
    prisma.certificate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { issueDate: "desc" },
      include: {
        enrollment: {
          include: {
            studentProfile: { select: { fullName: true, email: true } },
            course: { select: { name: true, courseCode: true } },
          },
        },
      },
    }),
    prisma.certificate.count({ where }),
  ]);

  return ok({ certificates, total, page, pageSize });
}
