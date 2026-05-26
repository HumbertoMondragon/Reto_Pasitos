import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search } from "lucide-react";

interface Props {
  searchParams: { search?: string; page?: string };
}

export default async function InstructorStudentsPage({ searchParams }: Props) {
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
        enrollments: {
          include: { course: true, certificate: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.studentProfile.count({
      where: search ? { fullName: { contains: search, mode: "insensitive" } } : undefined,
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const resultColor: Record<string, string> = {
    PASSED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Grupos</h1>
          <p className="text-sm text-gray-500">{total} estudiantes</p>
        </div>
        <Link
          href="/instructor/enroll"
          className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors self-start"
        >
          + Registrar Alumno
        </Link>
      </div>

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

      <div className="space-y-4">
        {students.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{s.fullName}</h3>
                <p className="text-xs text-gray-500">{s.email} · {s.institution ?? "Sin institución"}</p>
              </div>
            </div>

            {s.enrollments.length === 0 ? (
              <p className="text-sm text-gray-400">Sin inscripciones</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b">
                      <th className="pb-2 text-left font-medium">Curso</th>
                      <th className="pb-2 text-left font-medium">Calificación</th>
                      <th className="pb-2 text-left font-medium">Resultado</th>
                      <th className="pb-2 text-left font-medium">Certificado</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {s.enrollments.map((e) => (
                      <tr key={e.id}>
                        <td className="py-2 text-gray-700">{e.course.name}</td>
                        <td className="py-2">
                          {e.score != null ? (
                            <span className="font-medium">{Number(e.score).toFixed(1)}</span>
                          ) : (
                            <UpdateGradeForm enrollmentId={e.id} />
                          )}
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultColor[e.result] ?? ""}`}>
                            {e.result}
                          </span>
                        </td>
                        <td className="py-2">
                          {e.certificate ? (
                            <Badge variant="default" className="text-xs">Emitido</Badge>
                          ) : e.result === "PASSED" ? (
                            <IssueCertForm enrollmentId={e.id} />
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {students.length === 0 && (
          <div className="bg-white rounded-xl border p-10 text-center text-gray-400">No se encontraron estudiantes</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?page=${p}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-1.5 rounded text-sm ${p === page ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UpdateGradeForm({ enrollmentId }: { enrollmentId: string }) {
  return (
    <form action={`/api/enrollments/${enrollmentId}`} method="PUT" className="flex items-center gap-1">
      <input
        name="score"
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="0-10"
        className="w-16 border border-gray-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <select name="result" className="border border-gray-300 rounded px-1 py-0.5 text-xs">
        <option value="PENDING">PENDING</option>
        <option value="PASSED">PASSED</option>
        <option value="FAILED">FAILED</option>
      </select>
      <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700">
        ✓
      </button>
    </form>
  );
}

function IssueCertForm({ enrollmentId }: { enrollmentId: string }) {
  return (
    <a
      href={`/instructor/emit-cert/${enrollmentId}`}
      className="inline-block text-xs bg-green-700 text-white px-2 py-1 rounded hover:bg-green-800 transition-colors"
    >
      Emitir cert.
    </a>
  );
}
