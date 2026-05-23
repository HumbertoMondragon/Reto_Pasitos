import { prisma } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, Mail } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function StudentDetailPage({ params }: Props) {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { email: true, isActive: true, role: true } },
      enrollments: {
        orderBy: { createdAt: "desc" },
        include: {
          course: true,
          certificate: true,
        },
      },
    },
  });

  if (!profile) notFound();

  let curp = "No disponible";
  try { curp = decryptField(profile.curp); } catch {}

  const passedWithoutCert = profile.enrollments.filter(
    (e) => e.result === "PASSED" && !e.certificate
  );

  const resultColor: Record<string, string> = {
    PASSED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/students" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="CURP" value={curp} mono />
        <Field label="Fecha de nacimiento" value={profile.birthDate ? new Date(profile.birthDate).toLocaleDateString("es-MX") : "—"} />
        <Field label="Escolaridad" value={profile.educationLevel} />
        <Field label="Institución" value={profile.institution ?? "—"} />
        <Field label="Cargo" value={profile.jobTitle ?? "—"} />
        <Field label="Estado de cuenta" value={profile.user.isActive ? "Activo" : "Inactivo"} />
      </div>

      {/* Quick actions */}
      {passedWithoutCert.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-medium text-green-800 mb-3">
            {passedWithoutCert.length} inscripción(es) aprobada(s) sin certificado:
          </p>
          <div className="flex flex-wrap gap-2">
            {passedWithoutCert.map((e) => (
              <IssueCertButton key={e.id} enrollmentId={e.id} courseName={e.course.name} />
            ))}
          </div>
        </div>
      )}

      {/* Enrollments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Inscripciones</h2>
          <Link href={`/admin/students/${params.id}/enroll`} className="text-sm text-blue-600 hover:underline">
            + Nueva inscripción
          </Link>
        </div>
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Calificación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Resultado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Certificado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {profile.enrollments.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.course.name}</td>
                  <td className="px-4 py-3 text-gray-600">{e.module ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{e.score != null ? Number(e.score).toFixed(1) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultColor[e.result] ?? ""}`}>
                      {e.result}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.certificate ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-600">{e.certificate.certificateNumber}</span>
                        {e.certificate.pdfPath && (
                          <a
                            href={`/api/certificates/${e.certificate.id}?download=pdf`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Descargar PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <a
                          href={`/verify/${e.certificate.verificationFolio}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                          title="Verificar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <ResendEmailButton certId={e.certificate.id} />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin certificado</span>
                    )}
                  </td>
                </tr>
              ))}
              {profile.enrollments.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-xs">Sin inscripciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function IssueCertButton({ enrollmentId, courseName }: { enrollmentId: string; courseName: string }) {
  return (
    <form action="/api/certificates" method="POST">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <button
        type="submit"
        className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
      >
        Emitir cert. — {courseName}
      </button>
    </form>
  );
}

function ResendEmailButton({ certId }: { certId: string }) {
  return (
    <form action={`/api/certificates/${certId}/resend`} method="POST">
      <button
        type="submit"
        className="text-blue-500 hover:text-blue-700 transition-colors"
        title="Reenviar certificado por email"
      >
        <Mail className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
