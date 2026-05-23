import { requireRole, ok, err } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const action = searchParams.get("action") ?? undefined;
  const entity = searchParams.get("entity") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
  const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;
  const format = searchParams.get("format");

  const where = {
    ...(action && { action }),
    ...(entity && { entity }),
    ...(userId && { userId }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      },
    }),
  };

  if (format === "csv") {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { user: { select: { email: true } } },
    });

    const header = "Fecha,Usuario,Acción,Entidad,EntityId,IP,Detalles\n";
    const rows = logs.map((l) => {
      const cols = [
        l.createdAt.toISOString(),
        l.user?.email ?? "",
        l.action,
        l.entity,
        l.entityId ?? "",
        l.ipAddress ?? "",
        JSON.stringify(l.details ?? "").replace(/"/g, '""'),
      ];
      return cols.map((c) => `"${c}"`).join(",");
    });

    return new Response(header + rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="auditoria-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return ok({ logs, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) });
}
