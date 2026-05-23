import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logAuditAction } from "@/lib/audit/logger";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireRole(role: string | string[]) {
  const { error, session } = await requireAuth();
  if (error || !session) return { error: error!, session: null };
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Sin permisos suficientes" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function logAction(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: object;
  ipAddress?: string;
}) {
  await logAuditAction(params);
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
