import { prisma } from "@/lib/db";
import { verifyCertificate } from "@/lib/crypto";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface Props { params: { folio: string } }

async function getCertificateByFolio(folio: string) {
  return prisma.certificate.findFirst({
    where: { OR: [{ verificationFolio: folio }, { certificateNumber: folio }] },
    include: {
      enrollment: {
        include: {
          studentProfile: { select: { fullName: true } },
          course: { select: { name: true, courseCode: true, durationHours: true } },
        },
      },
    },
  });
}

export default async function VerifyFolioPage({ params }: Props) {
  const folio       = decodeURIComponent(params.folio);
  const certificate = await getCertificateByFolio(folio);

  if (!certificate) return <InvalidPage folio={folio} reason="not_found" />;

  let signaturePayload: object;
  try { signaturePayload = JSON.parse(certificate.signaturePayload); }
  catch { return <InvalidPage folio={folio} reason="corrupted" />; }

  const isValid = verifyCertificate(signaturePayload, certificate.digitalSignature);
  if (!isValid) return <InvalidPage folio={folio} reason="invalid_signature" />;

  if (certificate.isRevoked) {
    return (
      <RevokedPage
        certificateNumber={certificate.certificateNumber}
        studentName={certificate.enrollment.studentProfile.fullName}
        courseName={certificate.enrollment.course.name}
        revokedAt={certificate.revokedAt!}
        revokedReason={certificate.revokedReason ?? "Sin motivo especificado"}
      />
    );
  }

  return (
    <ValidPage
      certificateNumber={certificate.certificateNumber}
      verificationFolio={certificate.verificationFolio}
      studentName={certificate.enrollment.studentProfile.fullName}
      courseName={certificate.enrollment.course.name}
      courseHours={certificate.enrollment.course.durationHours}
      issueDate={certificate.issueDate}
      signaturePreview={certificate.digitalSignature.slice(0, 32)}
    />
  );
}

function ValidPage({ certificateNumber, verificationFolio, studentName, courseName, courseHours, issueDate, signaturePreview }: {
  certificateNumber: string; verificationFolio: string; studentName: string;
  courseName: string; courseHours: number; issueDate: Date; signaturePreview: string;
}) {
  return (
    <PageShell bg="bg-[#F0FDF4]">
      <div className="bg-white rounded-2xl border-t-4 border-[#15803D] shadow-pasitos-md max-w-lg w-full p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-100 rounded-full p-4 mb-3">
            <CheckCircle2 className="w-12 h-12 text-[#15803D]" />
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#15803D]" />
            <h1 className="text-xl font-semibold text-[#15803D]">Certificado Auténtico y Válido</h1>
          </div>
          <p className="text-sm text-[#6B7280] text-center mt-2">
            Emitido por <strong>Pasitos Education &amp; Health A.C.</strong> y verificado criptográficamente.
          </p>
        </div>

        <div className="bg-[#F0FDF4] rounded-xl border border-green-200 p-5 space-y-3 mb-5">
          <Row label="Titular"          value={studentName} />
          <Row label="Curso"            value={courseName} />
          <Row label="Duración"         value={`${courseHours} horas`} />
          <Row label="Fecha de emisión" value={new Date(issueDate).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} />
          <Row label="No. Certificado"  value={certificateNumber} mono />
          <Row label="Folio"            value={verificationFolio} mono />
        </div>

        <div className="bg-[#F9F7FF] rounded-lg border border-[#E9D5FF] px-4 py-3 mb-5">
          <p className="text-xs text-[#6B7280] font-mono break-all">
            <span className="font-semibold not-mono">Firma digital: </span>{signaturePreview}…
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-[#6B7280] mb-2 font-semibold">Pasitos Education &amp; Health A.C.</p>
          <Link href="/verify" className="text-sm text-[#7C3AED] hover:text-[#6B21A8] hover:underline">
            ← Verificar otro certificado
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function RevokedPage({ certificateNumber, studentName, courseName, revokedAt, revokedReason }: {
  certificateNumber: string; studentName: string; courseName: string;
  revokedAt: Date; revokedReason: string;
}) {
  return (
    <PageShell bg="bg-[#FFFBEB]">
      <div className="bg-white rounded-2xl border-t-4 border-[#D97706] shadow-pasitos-md max-w-lg w-full p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-amber-100 rounded-full p-4 mb-3">
            <AlertTriangle className="w-12 h-12 text-[#D97706]" />
          </div>
          <h1 className="text-xl font-semibold text-[#D97706]">Certificado Revocado</h1>
          <p className="text-sm text-[#6B7280] text-center mt-2">
            Este certificado fue revocado por <strong>Pasitos Education &amp; Health A.C.</strong> y ya no tiene validez oficial.
          </p>
        </div>

        <div className="bg-[#FFFBEB] rounded-xl border border-amber-200 p-5 space-y-3 mb-5">
          <Row label="Titular"          value={studentName} />
          <Row label="Curso"            value={courseName} />
          <Row label="No. Certificado"  value={certificateNumber} mono />
          <Row label="Revocado el"      value={new Date(revokedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} />
          <Row label="Motivo"           value={revokedReason} />
        </div>

        <div className="text-center">
          <Link href="/verify" className="text-sm text-[#7C3AED] hover:underline">
            ← Verificar otro certificado
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function InvalidPage({ folio, reason }: { folio: string; reason: string }) {
  const messages: Record<string, string> = {
    not_found:         "No existe ningún certificado con este folio o número en nuestros registros.",
    corrupted:         "Los datos del certificado están dañados. Contacta a Pasitos para más información.",
    invalid_signature: "La firma digital no coincide. Este certificado podría ser falso o haber sido alterado.",
  };

  return (
    <PageShell bg="bg-[#FFF5F5]">
      <div className="bg-white rounded-2xl border-t-4 border-red-600 shadow-pasitos-md max-w-lg w-full p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-red-100 rounded-full p-4 mb-3">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-red-700">Certificado No Válido</h1>
          <p className="text-sm text-[#6B7280] text-center mt-2">
            {messages[reason] ?? "No se pudo verificar este certificado."}
          </p>
        </div>

        {folio && (
          <div className="bg-[#F9F7FF] rounded-lg border border-[#E9D5FF] px-4 py-3 mb-5 text-center">
            <p className="text-xs text-[#6B7280] font-mono break-all">Folio consultado: {folio}</p>
          </div>
        )}

        <p className="text-sm text-[#6B7280] text-center mb-5">
          Si crees que esto es un error, contacta directamente a Pasitos Education &amp; Health A.C.
        </p>

        <div className="flex flex-col items-center gap-3">
          <a href="mailto:contacto@pasitos.org" className="btn-danger px-6">
            Contactar a Pasitos
          </a>
          <Link href="/verify" className="text-sm text-[#7C3AED] hover:underline">
            ← Intentar con otro folio
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <main className={`min-h-screen ${bg} flex flex-col items-center justify-center px-4 py-12 gap-4`}>
      <div className="text-center mb-2">
        <p className="text-2xl font-bold text-[#7C3AED]">Pasitos</p>
        <p className="text-xs text-[#6B7280]">Education &amp; Health A.C.</p>
      </div>
      {children}
    </main>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
      <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">{label}</span>
      <span className={`text-sm text-[#111827] ${mono ? "font-mono text-[#7C3AED]" : "font-medium"}`}>{value}</span>
    </div>
  );
}
