import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";

interface Props {
  searchParams: { page?: string; isRevoked?: string };
}

export default async function AdminCertificatesPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 20;
  const filterRevoked = searchParams.isRevoked;

  const where: Record<string, unknown> = {};
  if (filterRevoked === "true") where.isRevoked = true;
  else if (filterRevoked === "false") where.isRevoked = false;

  const [certificates, total, certsThisMonth] = await Promise.all([
    prisma.certificate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { issueDate: "desc" },
      include: {
        enrollment: {
          include: {
            studentProfile: { select: { fullName: true } },
            course: { select: { name: true, courseCode: true } },
          },
        },
      },
    }),
    prisma.certificate.count({ where }),
    prisma.certificate.count({
      where: { issueDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, isRevoked: false },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificados</h1>
          <p className="text-sm text-gray-500">{total} total · {certsThisMonth} este mes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/admin/certificates" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filterRevoked ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          Todos
        </Link>
        <Link href="?isRevoked=false" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterRevoked === "false" ? "bg-green-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          Vigentes
        </Link>
        <Link href="?isRevoked=true" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterRevoked === "true" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          Revocados
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No. Certificado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {certificates.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.certificateNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/admin/students/${c.enrollment.studentProfile ? "" : ""}`} className="hover:underline">
                    {c.enrollment.studentProfile.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.enrollment.course.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.issueDate).toLocaleDateString("es-MX")}</td>
                <td className="px-4 py-3">
                  {c.isRevoked ? (
                    <Badge variant="destructive">Revocado</Badge>
                  ) : (
                    <Badge variant="default">Vigente</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.pdfPath && (
                      <a href={`/api/certificates/${c.id}?download=pdf`} className="text-blue-600 hover:text-blue-800" title="Descargar PDF">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <a href={`/verify/${c.verificationFolio}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700" title="Verificar">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {!c.isRevoked && (
                      <RevokeButton certId={c.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {certificates.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No hay certificados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?page=${p}${filterRevoked ? `&isRevoked=${filterRevoked}` : ""}`}
              className={`px-3 py-1.5 rounded text-sm ${p === page ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function RevokeButton({ certId }: { certId: string }) {
  return (
    <form action={`/api/certificates/${certId}`} method="DELETE">
      <button type="submit" className="text-xs text-red-500 hover:text-red-700 font-medium" title="Revocar">
        Revocar
      </button>
    </form>
  );
}
