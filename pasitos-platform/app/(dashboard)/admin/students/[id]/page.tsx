import { prisma } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";

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

  const enrollmentsWithoutCert = profile.enrollments.filter((e) => !e.certificate);

  const resultLabel: Record<string, { label: string; cls: string }> = {
    PASSED:  { label: "Aprobado",  cls: "badge-active" },
    FAILED:  { label: "Reprobado", cls: "badge-revoked" },
    PENDING: { label: "Pendiente", cls: "badge-pending" },
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
      {enrollmentsWithoutCert.length > 0 && (
        <div className="bg-[#F9F7FF] border border-[#E9D5FF] rounded-xl p-4">
          <p className="text-sm font-medium text-[#6B21A8] mb-3">
            {enrollmentsWithoutCert.length} inscripción(es) pendiente(s) de certificado:
          </p>
          <div className="flex flex-wrap gap-2">
            {enrollmentsWithoutCert.map((e) => (
              <IssueCertButton key={e.id} enrollmentId={e.id} courseName={e.course.name} studentId={params.id} />
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
                    {(() => { const r = resultLabel[e.result] ?? { label: e.result, cls: "badge-pending" }; return <span className={r.cls}>{r.label}</span>; })()}
                  </td>
                  <td className="px-4 py-3">
                    {e.certificate ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-[#7C3AED]">{e.certificate.certificateNumber}</span>
                        {e.certificate.pdfPath && (
                          <a
                            href={e.certificate.pdfPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#7C3AED] hover:text-[#6B21A8]"
                            title="Descargar PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <a
                          href={`/verify/${e.certificate.verificationFolio}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#9CA3AF] hover:text-[#6B7280]"
                          title="Verificar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
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

function IssueCertButton({ enrollmentId, courseName, studentId }: { enrollmentId: string; courseName: string; studentId: string }) {
  return (
    <a
      href={`/admin/students/${studentId}/emit-cert/${enrollmentId}`}
      className="inline-block text-xs bg-[#7C3AED] text-white px-3 py-1.5 rounded-lg hover:bg-[#6B21A8] transition-colors"
    >
      Emitir cert. — {courseName}
    </a>
  );
}

