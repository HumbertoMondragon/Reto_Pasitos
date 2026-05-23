import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { QRCodeDisplay } from "@/components/certificates/qr-code";
import { Download, ExternalLink, Award } from "lucide-react";

export default async function StudentCertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.studentProfile.findFirst({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { certificate: { isNot: null } },
        include: { course: true, certificate: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) redirect("/student");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Certificados</h1>
        <p className="text-sm text-gray-500 mt-1">
          {profile.enrollments.length} certificado{profile.enrollments.length !== 1 ? "s" : ""} obtenido{profile.enrollments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {profile.enrollments.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aún no tienes certificados</p>
          <p className="text-sm text-gray-400 mt-1">Los certificados aparecen aquí una vez que apruebes un curso y sean emitidos por tu instructor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {profile.enrollments.map((e) => {
            const cert = e.certificate!;
            const verifyUrl = `${baseUrl}/verify/${cert.verificationFolio}`;
            return (
              <div key={cert.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 py-4 text-white">
                  <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Pasitos Education &amp; Health A.C.</p>
                  <p className="font-bold mt-0.5">Constancia de Capacitación</p>
                </div>

                {/* Content */}
                <div className="p-5 flex gap-4">
                  {/* Info */}
                  <div className="flex-1 space-y-2.5">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Curso</p>
                      <p className="font-semibold text-gray-900">{e.course.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Titular</p>
                      <p className="text-sm text-gray-800">{profile.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fecha de emisión</p>
                      <p className="text-sm text-gray-800">{new Date(cert.issueDate).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">No. Certificado</p>
                      <p className="font-mono text-xs text-gray-700">{cert.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Folio</p>
                      <p className="font-mono text-xs text-gray-700">{cert.verificationFolio}</p>
                    </div>
                  </div>

                  {/* QR */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <QRCodeDisplay url={verifyUrl} size={100} />
                    <p className="text-xs text-gray-400 text-center">Escanea para verificar</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t px-5 py-3 flex items-center gap-2 bg-gray-50">
                  {cert.pdfPath && (
                    <a
                      href={`/api/certificates/${cert.id}?download=pdf`}
                      className="flex items-center gap-1.5 text-xs bg-blue-800 text-white px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar PDF
                    </a>
                  )}
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver verificación pública
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
