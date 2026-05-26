import { prisma } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api/helpers";
import { issueCertificate } from "@/lib/certificates/signer";

export async function POST(req: Request) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const body = await req.json();
  const { enrollmentId, modality, observations, modules } = body;
  if (!enrollmentId) return err("Campo requerido: enrollmentId");

  try {
    // Persist modality/observations to the enrollment before issuing
    if (modality || observations) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          ...(modality     ? { modality }     : {}),
          ...(observations ? { observations } : {}),
        },
      });
    }

    // Create module records
    if (Array.isArray(modules) && modules.length > 0) {
      await prisma.enrollmentModule.createMany({
        data: modules.map((m: Record<string, unknown>, i: number) => ({
          enrollmentId,
          moduleNumber: Number(m.moduleNumber) || i + 1,
          moduleName:   String(m.moduleName   ?? ""),
          competency:   String(m.competency   ?? ""),
          score:        Number(m.score        ?? 0),
          evidence:     String(m.evidence     ?? ""),
          result:       String(m.result       ?? ""),
        })),
      });
    }

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
  const courseId  = searchParams.get("courseId");
  const isRevoked = searchParams.get("isRevoked");
  const page      = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize  = 20;

  const where: Record<string, unknown> = {};
  if (courseId)            where.enrollment = { courseId };
  if (isRevoked !== null)  where.isRevoked  = isRevoked === "true";

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
            course:          { select: { name: true, courseCode: true } },
          },
        },
      },
    }),
    prisma.certificate.count({ where }),
  ]);

  return ok({ certificates, total, page, pageSize });
}
