import { prisma } from "@/lib/db";
import Link from "next/link";
import { Search } from "lucide-react";

interface Props {
  searchParams: { search?: string; page?: string };
}

export default async function InstructorStudentsPage({ searchParams }: Props) {
  const search   = searchParams.search ?? "";
  const page     = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 20;

  const [students, total] = await prisma.$transaction([
    prisma.studentProfile.findMany({
      where: search ? { fullName: { contains: search, mode: "insensitive" } } : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fullName: "asc" },
      include: {
        enrollments: {
          include: {
            course: true,
            certificate: { select: { pdfPath: true, certificateNumber: true, verificationFolio: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.studentProfile.count({
      where: search ? { fullName: { contains: search, mode: "insensitive" } } : undefined,
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const resultLabel: Record<string, { label: string; cls: string }> = {
    PASSED:  { label: "Aprobado",  cls: "badge-active" },
    FAILED:  { label: "Reprobado", cls: "badge-revoked" },
    PENDING: { label: "Pendiente", cls: "badge-pending" },
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Mis Alumnos</h1>
          <p className="text-sm text-[#6B7280]">{total} participantes registrados</p>
        </div>
        <Link href="/instructor/enroll" className="btn-primary self-start">
          + Registrar Alumno
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nombre..."
            className="input-pasitos pl-9"
          />
        </div>
        <button type="submit" className="btn-secondary">Buscar</button>
      </form>

      {/* Student cards */}
      <div className="space-y-4">
        {students.map((s) => (
          <div key={s.id} className="card-pasitos p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-[#111827]">{s.fullName}</h3>
                <p className="text-xs text-[#6B7280]">{s.email}{s.institution ? ` · ${s.institution}` : ""}</p>
              </div>
              <a
                href={`/instructor/students/${s.id}/enroll`}
                className="text-xs text-[#7C3AED] hover:text-[#6B21A8] font-medium whitespace-nowrap border border-[#E9D5FF] rounded-lg px-3 py-1 hover:bg-[#F9F7FF] transition-colors"
              >
                + Inscribir al curso
              </a>
            </div>

            {s.enrollments.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">Sin inscripciones</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-pasitos">
                  <thead>
                    <tr>
                      <th>Curso</th>
                      <th>Estado</th>
                      <th>Certificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.enrollments.map((e) => {
                      const res = resultLabel[e.result] ?? { label: e.result, cls: "badge-pending" };
                      return (
                        <tr key={e.id}>
                          <td className="text-[#374151]">
                            <p className="font-medium">{e.course.name}</p>
                            {e.score != null && (
                              <p className="text-xs text-[#6B7280] mt-0.5">Calif. {Number(e.score).toFixed(1)}</p>
                            )}
                          </td>
                          <td><span className={res.cls}>{res.label}</span></td>
                          <td>
                            {e.certificate ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="badge-active">Emitido</span>
                                {e.certificate.pdfPath && (
                                  <a
                                    href={e.certificate.pdfPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#7C3AED] hover:text-[#6B21A8] hover:underline font-medium"
                                  >
                                    Descargar PDF
                                  </a>
                                )}
                              </div>
                            ) : (
                              <a
                                href={`/instructor/emit-cert/${e.id}`}
                                className="inline-block text-xs bg-[#7C3AED] text-white px-3 py-1 rounded-lg hover:bg-[#6B21A8] transition-colors"
                              >
                                Emitir cert.
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {students.length === 0 && (
          <div className="card-pasitos p-10 text-center text-[#9CA3AF]">
            No se encontraron estudiantes
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-[#7C3AED] text-white"
                  : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E9D5FF]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
