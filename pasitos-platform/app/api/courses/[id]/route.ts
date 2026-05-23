import { prisma } from "@/lib/db";
import { requireRole, logAction, ok, err } from "@/lib/api/helpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course) return err("Curso no encontrado", 404);
  return ok(course);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course) return err("Curso no encontrado", 404);

  const body = await req.json();
  const updated = await prisma.course.update({
    where: { id: params.id },
    data: {
      name: body.name ?? course.name,
      courseType: body.courseType ?? course.courseType,
      format: body.format ?? course.format,
      durationHours: body.durationHours != null ? Number(body.durationHours) : course.durationHours,
      modality: body.modality ?? course.modality,
      description: body.description ?? course.description,
      isActive: body.isActive ?? course.isActive,
    },
  });

  await logAction({
    userId: session!.user.id,
    action: "COURSE_UPDATED",
    entity: "Course",
    entityId: params.id,
    details: body,
  });

  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course) return err("Curso no encontrado", 404);

  await prisma.course.update({ where: { id: params.id }, data: { isActive: false } });

  await logAction({
    userId: session!.user.id,
    action: "COURSE_DEACTIVATED",
    entity: "Course",
    entityId: params.id,
  });

  return ok({ message: "Curso desactivado" });
}
