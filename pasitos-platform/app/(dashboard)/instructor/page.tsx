import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Award, ClipboardList } from "lucide-react";
import Link from "next/link";

export default async function InstructorDashboard() {
  const session = await auth();

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [totalStudents, pendingGrades, certsThisWeek, recentPending] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.enrollment.count({ where: { result: "PENDING" } }),
    prisma.certificate.count({ where: { isRevoked: false, issueDate: { gte: startOfWeek } } }),
    prisma.enrollment.findMany({
      where: { result: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        studentProfile: { select: { fullName: true } },
        course: { select: { name: true, courseCode: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {session?.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Panel de Instructor — Pasitos Education &amp; Health A.C.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Estudiantes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-yellow-50 rounded-xl p-3">
              <ClipboardList className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingGrades}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pendientes de Calificar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-green-50 rounded-xl p-3">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certsThisWeek}</p>
              <p className="text-xs text-gray-500 mt-0.5">Certificados Esta Semana</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/instructor/enroll" className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
          + Registrar Alumno
        </Link>
        <Link href="/instructor/students" className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Ver Mis Grupos
        </Link>
      </div>

      {/* Pending grades table */}
      {pendingGrades > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alumnos Pendientes de Calificar</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="pb-2 text-left font-medium">Estudiante</th>
                  <th className="pb-2 text-left font-medium">Curso</th>
                  <th className="pb-2 text-left font-medium">Estado</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentPending.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{e.studentProfile.fullName}</td>
                    <td className="py-2 text-gray-600">{e.course.courseCode} — {e.course.name}</td>
                    <td className="py-2">
                      <Badge variant="secondary">PENDING</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <Link href={`/instructor/students`} className="text-blue-600 text-xs hover:underline">
                        Calificar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
