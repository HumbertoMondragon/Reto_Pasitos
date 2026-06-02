import { prisma } from "@/lib/db";
import { Users, Award, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalStudents, totalCerts, activeCourses, certsThisMonth, recentEnrollments, recentCerts] =
    await Promise.all([
      prisma.studentProfile.count(),
      prisma.certificate.count({ where: { isRevoked: false } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.certificate.count({ where: { isRevoked: false, issueDate: { gte: startOfMonth } } }),
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          studentProfile: { select: { fullName: true } },
          course: { select: { name: true, courseCode: true } },
        },
      }),
      prisma.certificate.findMany({
        take: 5,
        orderBy: { issueDate: "desc" },
        where: { isRevoked: false },
        include: {
          enrollment: {
            include: {
              studentProfile: { select: { fullName: true } },
              course: { select: { name: true } },
            },
          },
        },
      }),
    ]);

  return { totalStudents, totalCerts, activeCourses, certsThisMonth, recentEnrollments, recentCerts };
}

const resultLabel: Record<string, { label: string; cls: string }> = {
  PASSED:  { label: "Aprobado",  cls: "badge-active" },
  FAILED:  { label: "Reprobado", cls: "badge-revoked" },
  PENDING: { label: "Pendiente", cls: "badge-pending" },
};

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { title: "Total Estudiantes",      value: stats.totalStudents,   icon: Users,      },
    { title: "Certificados Emitidos",  value: stats.totalCerts,      icon: Award,      },
    { title: "Cursos Activos",         value: stats.activeCourses,   icon: BookOpen,   },
    { title: "Certificados Este Mes",  value: stats.certsThisMonth,  icon: TrendingUp, },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Panel de administración — Pasitos Education &amp; Health A.C.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ title, value, icon: Icon }) => (
          <div key={title} className="card-pasitos p-5 flex items-center gap-4">
            <div className="bg-[#EDE9FE] rounded-xl p-3 shrink-0">
              <Icon className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827]">{value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/students/new" className="btn-primary">
          + Registrar Estudiante
        </Link>
        <Link href="/admin/certificates" className="btn-secondary">
          Ver Certificados
        </Link>
        <Link href="/admin/audit" className="btn-secondary">
          Ver Auditoría
        </Link>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas inscripciones */}
        <div className="card-pasitos overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E9D5FF]">
            <h2 className="text-sm font-semibold text-[#111827]">Últimas Inscripciones</h2>
          </div>
          <table className="w-full table-pasitos">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Curso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentEnrollments.map((e) => {
                const res = resultLabel[e.result] ?? { label: e.result, cls: "badge-pending" };
                return (
                  <tr key={e.id}>
                    <td className="font-medium text-[#111827]">{e.studentProfile.fullName}</td>
                    <td className="text-[#6B7280]">{e.course.courseCode}</td>
                    <td><span className={res.cls}>{res.label}</span></td>
                  </tr>
                );
              })}
              {stats.recentEnrollments.length === 0 && (
                <tr><td colSpan={3} className="text-center text-[#6B7280] text-xs py-6">Sin inscripciones aún</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Últimos certificados */}
        <div className="card-pasitos overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E9D5FF] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111827]">Últimos Certificados</h2>
            <Link href="/admin/certificates" className="text-xs text-[#7C3AED] hover:text-[#6B21A8] font-medium">
              Ver todos →
            </Link>
          </div>
          <table className="w-full table-pasitos">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>No. Certificado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentCerts.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-[#111827]">{c.enrollment.studentProfile.fullName}</td>
                  <td className="font-mono text-xs text-[#7C3AED]">{c.certificateNumber}</td>
                  <td className="text-[#6B7280] text-xs">
                    {new Date(c.issueDate).toLocaleDateString("es-MX")}
                  </td>
                </tr>
              ))}
              {stats.recentCerts.length === 0 && (
                <tr><td colSpan={3} className="text-center text-[#6B7280] text-xs py-6">Sin certificados aún</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
