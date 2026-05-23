import { prisma } from "@/lib/db";
import { requireRole, logAction, ok, err } from "@/lib/api/helpers";
import { encryptField, decryptField } from "@/lib/crypto";
import { EducationLevel, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = 20;

  const [profiles, total] = await prisma.$transaction([
    prisma.studentProfile.findMany({
      where: search
        ? { fullName: { contains: search, mode: "insensitive" } }
        : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fullName: "asc" },
      include: {
        enrollments: { include: { course: true, certificate: true } },
      },
    }),
    prisma.studentProfile.count({
      where: search ? { fullName: { contains: search, mode: "insensitive" } } : undefined,
    }),
  ]);

  const isAdmin = session!.user.role === "ADMIN";
  const data = profiles.map((p) => ({
    ...p,
    curp: isAdmin ? decryptField(p.curp) : p.curp.slice(0, 4) + "**************",
  }));

  return ok({ students: data, total, page, pageSize });
}

export async function POST(req: Request) {
  const { error, session } = await requireRole(["ADMIN", "INSTRUCTOR"]);
  if (error) return error;

  const body = await req.json();
  const { fullName, curp, birthDate, educationLevel, email, institution, jobTitle, password } = body;

  if (!fullName || !curp || !email) {
    return err("Campos requeridos: fullName, curp, email");
  }

  if (curp.length !== 18) return err("CURP debe tener 18 caracteres");

  const encryptedCurp = encryptField(curp.toUpperCase());

  const result = await prisma.$transaction(async (tx) => {
    const existingCurp = await tx.studentProfile.findUnique({ where: { curp: encryptedCurp } });
    if (existingCurp) throw new Error("CURP_DUPLICATE");

    const existingEmail = await tx.user.findUnique({ where: { email } });
    if (existingEmail) throw new Error("EMAIL_DUPLICATE");

    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password ?? curp.slice(0, 8), 12),
        name: fullName,
        role: Role.STUDENT,
      },
    });

    const profile = await tx.studentProfile.create({
      data: {
        userId: user.id,
        fullName,
        curp: encryptedCurp,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        educationLevel: (educationLevel as EducationLevel) ?? EducationLevel.OTHER,
        email,
        institution,
        jobTitle,
      },
    });

    return { user, profile };
  }).catch((e: Error) => {
    if (e.message === "CURP_DUPLICATE") throw { status: 409, message: "Ya existe un estudiante con esa CURP" };
    if (e.message === "EMAIL_DUPLICATE") throw { status: 409, message: "Ya existe un usuario con ese email" };
    throw e;
  });

  await logAction({
    userId: session!.user.id,
    action: "STUDENT_CREATED",
    entity: "StudentProfile",
    entityId: result.profile.id,
    details: { fullName, email },
  });

  return ok({ ...result.profile, curp }, 201);
}
