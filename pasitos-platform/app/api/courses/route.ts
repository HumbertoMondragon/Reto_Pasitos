import { prisma } from "@/lib/db";
import { requireRole, logAction, ok, err } from "@/lib/api/helpers";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const courses = await prisma.course.findMany({
    where: isAdmin ? undefined : { isActive: true },
    orderBy: { courseCode: "asc" },
  });

  return ok(courses);
}

export async function POST(req: Request) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { courseCode, name, courseType, format, durationHours, modality, description } = body;

  if (!courseCode || !name || !courseType || !durationHours || !modality) {
    return err("Campos requeridos: courseCode, name, courseType, durationHours, modality");
  }

  const existing = await prisma.course.findUnique({ where: { courseCode } });
  if (existing) return err("Ya existe un curso con ese código", 409);

  const course = await prisma.course.create({
    data: { courseCode, name, courseType, format, durationHours: Number(durationHours), modality, description },
  });

  await logAction({
    userId: session!.user.id,
    action: "COURSE_CREATED",
    entity: "Course",
    entityId: course.id,
    details: { courseCode, name },
  });

  return ok(course, 201);
}
