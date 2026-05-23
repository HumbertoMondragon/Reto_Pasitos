import { prisma } from "@/lib/db";
import { verifyCertificate } from "@/lib/crypto";
import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { folio: string };
}

async function getCertificateByFolio(folio: string) {
  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [
        { verificationFolio: folio },
        { certificateNumber: folio },
      ],
    },
    include: {
      enrollment: {
        include: {
          studentProfile: { select: { fullName: true } },
          course: { select: { name: true, courseCode: true, durationHours: true } },
        },
      },
    },
  });
  return certificate;
}

export default async function VerifyFolioPage({ params }: Props) {
  const folio = decodeURIComponent(params.folio);
  const certificate = await getCertificateByFolio(folio);

  if (!certificate) {
    return <InvalidPage folio={folio} reason="not_found" />;
  }

  let signaturePayload: object;
  try {
    signaturePayload = JSON.parse(certificate.signaturePayload);
  } catch {
    return <InvalidPage folio={folio} reason="corrupted" />;
  }

  const isValid = verifyCertificate(signaturePayload, certificate.digitalSignature);

  if (!isValid) {
    return <InvalidPage folio={folio} reason="invalid_signature" />;
  }

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

function ValidPage({
  certificateNumber,
  verificationFolio,
  studentName,
  courseName,
  courseHours,
  issueDate,
  signaturePreview,
}: {
  certificateNumber: string;
  verificationFolio: string;
  studentName: string;
  courseName: string;
  courseHours: number;
  issueDate: Date;
  signaturePreview: string;
}) {
  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="text-green-600 w-14 h-14" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="text-green-600 w-5 h-5" />
          <h1 className="text-2xl font-bold text-green-700">Certificado Auténtico y Válido</h1>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Este certificado fue emitido por{" "}
          <strong>Pasitos Education &amp; Health A.C.</strong> y su autenticidad ha sido
          verificada criptográficamente.
        </p>

        <div className="bg-green-50 rounded-xl p-5 text-left space-y-3 mb-6 border border-green-200">
          <Row label="Titular" value={studentName} />
          <Row label="Curso" value={courseName} />
          <Row label="Duración" value={`${courseHours} horas`} />
          <Row label="Fecha de emisión" value={new Date(issueDate).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} />
          <Row label="No. Certificado" value={certificateNumber} mono />
          <Row label="Folio" value={verificationFolio} mono />
        </div>

        <div className="bg-gray-50 rounded-lg px-4 py-3 text-left border border-gray-200 mb-6">
          <p className="text-xs text-gray-500 font-mono break-all">
            <span className="font-semibold not-mono text-gray-600">Firma digital: </span>
            {signaturePreview}...
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <img src="/logo-pasitos.png" alt="Pasitos" className="h-6 opacity-60" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span>Pasitos Education &amp; Health A.C.</span>
        </div>

        <Link href="/verify" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Verificar otro certificado
        </Link>
      </div>
    </main>
  );
}

function RevokedPage({
  certificateNumber,
  studentName,
  courseName,
  revokedAt,
  revokedReason,
}: {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  revokedAt: Date;
  revokedReason: string;
}) {
  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 rounded-full p-4">
            <AlertTriangle className="text-orange-500 w-14 h-14" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-orange-700 mb-2">Certificado Revocado</h1>
        <p className="text-gray-500 text-sm mb-6">
          Este certificado fue encontrado pero ha sido <strong>revocado</strong> por
          Pasitos Education &amp; Health A.C. y ya no tiene validez oficial.
        </p>

        <div className="bg-orange-50 rounded-xl p-5 text-left space-y-3 mb-6 border border-orange-200">
          <Row label="Titular" value={studentName} />
          <Row label="Curso" value={courseName} />
          <Row label="No. Certificado" value={certificateNumber} mono />
          <Row label="Revocado el" value={new Date(revokedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} />
          <Row label="Motivo" value={revokedReason} />
        </div>

        <Link href="/verify" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          ← Verificar otro certificado
        </Link>
      </div>
    </main>
  );
}

function InvalidPage({ folio, reason }: { folio: string; reason: string }) {
  const messages: Record<string, string> = {
    not_found: "No existe ningún certificado con este folio o número en nuestros registros.",
    corrupted: "Los datos del certificado están dañados. Contacta a Pasitos para más información.",
    invalid_signature: "La firma digital no coincide. Este certificado podría ser falso o haber sido alterado.",
  };

  return (
    <main className="min-h-screen bg-red-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-4">
            <XCircle className="text-red-500 w-14 h-14" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-red-700 mb-2">Certificado No Encontrado o Inválido</h1>
        <p className="text-gray-600 text-sm mb-4">
          {messages[reason] ?? "No se pudo verificar este certificado."}
        </p>

        {folio && (
          <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded px-3 py-2 mb-6 break-all">
            Folio consultado: {folio}
          </p>
        )}

        <p className="text-gray-500 text-sm mb-6">
          Si crees que esto es un error o quieres reportar un certificado falso, contacta
          directamente a Pasitos Education &amp; Health A.C.
        </p>

        <a
          href="mailto:contacto@pasitos.org"
          className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Contactar a Pasitos
        </a>

        <div className="mt-4">
          <Link href="/verify" className="text-sm text-blue-600 hover:underline">
            ← Intentar con otro folio
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-sm text-gray-800 ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}
