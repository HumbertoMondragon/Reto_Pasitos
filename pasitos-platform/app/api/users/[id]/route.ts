import { prisma } from "@/lib/db";
import { requireAuth, requireRole, logAction, ok, err } from "@/lib/api/helpers";
import bcrypt from "bcryptjs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) return err("Usuario no encontrado", 404);
  return ok(user);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  // Only admins can update other users; users can update themselves
  if (session!.user.role !== "ADMIN" && session!.user.id !== params.id) {
    return err("Sin permisos suficientes", 403);
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return err("Usuario no encontrado", 404);

  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.password) updateData.passwordHash = await bcrypt.hash(body.password, 12);
  // Only admins can change roles and active status
  if (session!.user.role === "ADMIN") {
    if (body.role) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
  });

  await logAction({
    userId: session!.user.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: params.id,
    details: { fields: Object.keys(updateData) },
  });

  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return err("Usuario no encontrado", 404);

  await prisma.user.update({ where: { id: params.id }, data: { isActive: false } });

  await logAction({
    userId: session!.user.id,
    action: "USER_DEACTIVATED",
    entity: "User",
    entityId: params.id,
  });

  return ok({ message: "Usuario desactivado" });
}
