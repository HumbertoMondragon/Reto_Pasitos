import { prisma } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search } from "lucide-react";

interface Props {
  searchParams: { search?: string; page?: string };
}

export default async function AdminStudentsPage({ searchParams }: Props) {
  const search = searchParams.search ?? "";
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 20;

  const [students, total] = await prisma.$transaction([
    prisma.studentProfile.findMany({
      where: search ? { fullName: { contains: search, mode: "insensitive" } } : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fullName: "asc" },
      include: {
        enrollments: { include: { certificate: true } },
      },
    }),
    prisma.studentProfile.count({
      where: search ? { fullName: { contains: search, mode: "insensitive" } } : undefined,
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-sm text-gray-500">{total} registros</p>
        </div>
        <Link
          href="/admin/students/new"
          className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors self-start"
        >
          + Registrar Estudiante
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors">
          Buscar
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">CURP</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Institución</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cursos</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Certificados</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((s) => {
              let maskedCurp = "****";
              try { maskedCurp = decryptField(s.curp).slice(0, 4) + "**************"; } catch {}
              const certs = s.enrollments.filter((e) => e.certificate).length;
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{maskedCurp}</td>
                  <td className="px-4 py-3 text-gray-600">{s.institution ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{s.enrollments.length}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={certs > 0 ? "default" : "secondary"}>{certs}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/students/${s.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                      Ver detalle →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No se encontraron estudiantes</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-1.5 rounded text-sm ${p === page ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
