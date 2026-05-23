import { prisma } from "@/lib/db";
import { requireRole, logAction, ok, err } from "@/lib/api/helpers";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = 20;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count(),
  ]);

  return ok({ users, total, page, pageSize });
}

export async function POST(req: Request) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { email, password, name, role } = body;

  if (!email || !password || !name || !role) {
    return err("Campos requeridos: email, password, name, role");
  }

  if (!Object.values(Role).includes(role)) {
    return err(`Rol inválido. Valores permitidos: ${Object.values(Role).join(", ")}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return err("Ya existe un usuario con ese email", 409);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      name,
      role: role as Role,
    },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  await logAction({
    userId: session!.user.id,
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    details: { email, name, role },
  });

  return ok(user, 201);
}
