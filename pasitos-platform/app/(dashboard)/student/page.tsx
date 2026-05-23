import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Award, BookOpen } from "lucide-react";

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        orderBy: { createdAt: "desc" },
        include: {
          course: true,
          certificate: true,
        },
      },
    },
  });

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Tu perfil de estudiante aún no ha sido configurado.</p>
        <p className="text-sm text-gray-400 mt-2">Contacta a tu instructor o al administrador.</p>
      </div>
    );
  }

  const totalCerts = profile.enrollments.filter((e) => e.certificate).length;
  const passed = profile.enrollments.filter((e) => e.result === "PASSED").length;

  const resultColor: Record<string, string> = {
    PASSED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium mb-1">Bienvenido(a) de nuevo</p>
        <h1 className="text-2xl font-bold">{profile.fullName}</h1>
        <p className="text-blue-200 text-sm mt-1">{profile.institution ?? profile.email}</p>

        <div className="flex gap-6 mt-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-300" />
            <div>
              <p className="text-xl font-bold">{profile.enrollments.length}</p>
              <p className="text-xs text-blue-300">Cursos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-300" />
            <div>
              <p className="text-xl font-bold">{totalCerts}</p>
              <p className="text-xs text-blue-300">Certificados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl font-bold">{passed}</span>
            <p className="text-xs text-blue-300">Aprobados</p>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mis Cursos</h2>
        {profile.enrollments.length === 0 ? (
          <p className="text-gray-400 text-sm">Aún no tienes inscripciones. Contacta a tu instructor.</p>
        ) : (
          <div className="space-y-3">
            {profile.enrollments.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{e.course.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {e.course.courseCode} · {e.course.durationHours} hrs
                    {e.module ? ` · ${e.module}` : ""}
                  </p>
                  {(e.startDate || e.endDate) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {e.startDate ? new Date(e.startDate).toLocaleDateString("es-MX") : "—"}
                      {" → "}
                      {e.endDate ? new Date(e.endDate).toLocaleDateString("es-MX") : "—"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {e.score != null && (
                    <span className="text-lg font-bold text-gray-800">{Number(e.score).toFixed(1)}</span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${resultColor[e.result] ?? ""}`}>
                    {e.result === "PASSED" ? "Aprobado" : e.result === "FAILED" ? "Reprobado" : "Pendiente"}
                  </span>
                  {e.certificate && (
                    <Badge variant="default" className="text-xs">Con certificado</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates quick list */}
      {totalCerts > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Mis Certificados</h2>
            <Link href="/student/certificates" className="text-sm text-blue-600 hover:underline">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {profile.enrollments.filter((e) => e.certificate).slice(0, 3).map((e) => (
              <div key={e.certificate!.id} className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{e.course.name}</p>
                  <p className="font-mono text-xs text-gray-500">{e.certificate!.certificateNumber}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e.certificate!.pdfPath && (
                    <a href={`/api/certificates/${e.certificate!.id}?download=pdf`} className="text-xs bg-blue-800 text-white px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-colors">
                      Descargar PDF
                    </a>
                  )}
                  <a href={`/verify/${e.certificate!.verificationFolio}`} target="_blank" rel="noopener noreferrer" className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    Verificar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
