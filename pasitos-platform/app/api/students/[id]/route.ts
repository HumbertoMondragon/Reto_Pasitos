import { prisma } from "@/lib/db";
import { requireRole, logAction, ok, err } from "@/lib/api/helpers";
import { decryptField, encryptField } from "@/lib/crypto";
import { EducationLevel } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR", "STUDENT"]);
  if (error) return error;

  const profile = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      enrollments: {
        include: {
          course: true,
          certificate: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) return err("Estudiante no encontrado", 404);

  const isAdmin = session!.user.role === "ADMIN";
  return ok({
    ...profile,
    curp: isAdmin ? decryptField(profile.curp) : profile.curp.slice(0, 4) + "**************",
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const profile = await prisma.studentProfile.findUnique({ where: { id: params.id } });
  if (!profile) return err("Estudiante no encontrado", 404);

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.fullName) updateData.fullName = body.fullName;
  if (body.curp) updateData.curp = encryptField(body.curp.toUpperCase());
  if (body.birthDate) updateData.birthDate = new Date(body.birthDate);
  if (body.educationLevel) updateData.educationLevel = body.educationLevel as EducationLevel;
  if (body.email) updateData.email = body.email;
  if (body.institution !== undefined) updateData.institution = body.institution;
  if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;

  const updated = await prisma.studentProfile.update({
    where: { id: params.id },
    data: updateData,
  });

  await logAction({
    userId: session!.user.id,
    action: "STUDENT_UPDATED",
    entity: "StudentProfile",
    entityId: params.id,
    details: { fields: Object.keys(updateData) },
  });

  return ok(updated);
}
