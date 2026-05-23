import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Props {
  searchParams: { page?: string };
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  INSTRUCTOR: "Instructor",
  STUDENT: "Estudiante",
};

const roleBadge: Record<string, "default" | "secondary" | "destructive"> = {
  ADMIN: "default",
  INSTRUCTOR: "secondary",
  STUDENT: "secondary",
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
          <p className="text-sm text-gray-500">{total} usuarios registrados</p>
        </div>
        <Link
          href="/admin/users/new"
          className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors self-start"
        >
          + Nuevo Usuario
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Registrado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={roleBadge[u.role] ?? "secondary"}>
                    {roleLabels[u.role] ?? u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {u.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("es-MX")}</td>
                <td className="px-4 py-3 text-right">
                  {u.isActive && (
                    <DeactivateButton userId={u.id} />
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No hay usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?page=${p}`}
              className={`px-3 py-1.5 rounded text-sm ${p === page ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function DeactivateButton({ userId }: { userId: string }) {
  return (
    <form action={`/api/users/${userId}`} method="DELETE">
      <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium">
        Desactivar
      </button>
    </form>
  );
}
