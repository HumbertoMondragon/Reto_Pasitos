import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        include: { studentProfile: { select: { fullName: true } }, course: { select: { name: true, courseCode: true } } },
      }),
      prisma.certificate.findMany({
        take: 5,
        orderBy: { issueDate: "desc" },
        where: { isRevoked: false },
        include: { enrollment: { include: { studentProfile: { select: { fullName: true } }, course: { select: { name: true } } } } },
      }),
    ]);

  return { totalStudents, totalCerts, activeCourses, certsThisMonth, recentEnrollments, recentCerts };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { title: "Total Estudiantes", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Certificados Emitidos", value: stats.totalCerts, icon: Award, color: "text-green-600", bg: "bg-green-50" },
    { title: "Cursos Activos", value: stats.activeCourses, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Certificados Este Mes", value: stats.certsThisMonth, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const resultColors: Record<string, string> = {
    PASSED: "default",
    FAILED: "destructive",
    PENDING: "secondary",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Panel de administración — Pasitos Education &amp; Health A.C.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${s.bg} rounded-xl p-3`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/students/new" className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
          + Registrar Estudiante
        </Link>
        <Link href="/admin/certificates" className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          Emitir Certificado
        </Link>
        <Link href="/admin/audit" className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Ver Auditoría
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent enrollments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Últimas Inscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="pb-2 text-left font-medium">Estudiante</th>
                  <th className="pb-2 text-left font-medium">Curso</th>
                  <th className="pb-2 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{e.studentProfile.fullName}</td>
                    <td className="py-2 text-gray-600">{e.course.courseCode}</td>
                    <td className="py-2">
                      <Badge variant={resultColors[e.result] as "default" | "destructive" | "secondary"}>
                        {e.result}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {stats.recentEnrollments.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-400 text-xs">Sin inscripciones aún</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent certificates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Últimos Certificados</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="pb-2 text-left font-medium">Estudiante</th>
                  <th className="pb-2 text-left font-medium">No. Cert.</th>
                  <th className="pb-2 text-left font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentCerts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{c.enrollment.studentProfile.fullName}</td>
                    <td className="py-2 font-mono text-xs text-gray-600">{c.certificateNumber}</td>
                    <td className="py-2 text-gray-500 text-xs">{new Date(c.issueDate).toLocaleDateString("es-MX")}</td>
                  </tr>
                ))}
                {stats.recentCerts.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-gray-400 text-xs">Sin certificados aún</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
