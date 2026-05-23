import { prisma } from "@/lib/db";
import { requireRole, logAction, ok, err } from "@/lib/api/helpers";
import { EnrollmentResult } from "@prisma/client";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const enrollment = await prisma.enrollment.findUnique({ where: { id: params.id } });
  if (!enrollment) return err("Inscripción no encontrada", 404);

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.score != null) updateData.score = body.score;
  if (body.result) {
    if (!Object.values(EnrollmentResult).includes(body.result)) {
      return err(`Resultado inválido. Valores: ${Object.values(EnrollmentResult).join(", ")}`);
    }
    updateData.result = body.result as EnrollmentResult;
  }
  if (body.module !== undefined) updateData.module = body.module;
  if (body.startDate) updateData.startDate = new Date(body.startDate);
  if (body.endDate) updateData.endDate = new Date(body.endDate);
  if (body.observations !== undefined) updateData.observations = body.observations;

  const updated = await prisma.enrollment.update({
    where: { id: params.id },
    data: updateData,
    include: { course: true, studentProfile: true },
  });

  await logAction({
    userId: session!.user.id,
    action: "ENROLLMENT_UPDATED",
    entity: "Enrollment",
    entityId: params.id,
    details: { fields: Object.keys(updateData), result: body.result },
  });

  return ok(updated);
}
