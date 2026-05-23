import { prisma } from "@/lib/db";
import { requireRole, logAction, ok, err } from "@/lib/api/helpers";
import { EnrollmentResult } from "@prisma/client";

export async function POST(req: Request) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const body = await req.json();
  const { studentProfileId, courseId, module, startDate, endDate, score, result, observations } = body;

  if (!studentProfileId || !courseId) {
    return err("Campos requeridos: studentProfileId, courseId");
  }

  const [profile, course] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { id: studentProfileId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);

  if (!profile) return err("Estudiante no encontrado", 404);
  if (!course) return err("Curso no encontrado", 404);

  const enrollment = await prisma.enrollment.create({
    data: {
      studentProfileId,
      courseId,
      module,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      score: score != null ? score : undefined,
      result: (result as EnrollmentResult) ?? EnrollmentResult.PENDING,
      observations,
    },
    include: { course: true, studentProfile: true },
  });

  await logAction({
    userId: session!.user.id,
    action: "STUDENT_ENROLLED",
    entity: "Enrollment",
    entityId: enrollment.id,
    details: { studentProfileId, courseId, result },
  });

  return ok(enrollment, 201);
}
