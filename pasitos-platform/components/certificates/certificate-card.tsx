import { QRCodeDisplay } from "./qr-code";
import { Download, ExternalLink } from "lucide-react";

interface CertificateCardProps {
  certId: string;
  certificateNumber: string;
  verificationFolio: string;
  studentName: string;
  courseName: string;
  issueDate: Date;
  pdfPath?: string | null;
  baseUrl: string;
}

export function CertificateCard({
  certId,
  certificateNumber,
  verificationFolio,
  studentName,
  courseName,
  issueDate,
  pdfPath,
  baseUrl,
}: CertificateCardProps) {
  const verifyUrl = `${baseUrl}/verify/${verificationFolio}`;

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 py-4 text-white">
        <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">
          Pasitos Education &amp; Health A.C.
        </p>
        <p className="font-bold mt-0.5">Constancia de Capacitación</p>
      </div>

      <div className="p-5 flex gap-4">
        <div className="flex-1 space-y-2.5">
          <InfoRow label="Titular" value={studentName} />
          <InfoRow label="Curso" value={courseName} />
          <InfoRow label="Fecha de emisión" value={new Date(issueDate).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })} />
          <InfoRow label="No. Certificado" value={certificateNumber} mono />
          <InfoRow label="Folio" value={verificationFolio} mono />
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <QRCodeDisplay url={verifyUrl} size={100} />
          <p className="text-xs text-gray-400">Verificar</p>
        </div>
      </div>

      <div className="border-t px-5 py-3 flex items-center gap-2 bg-gray-50">
        {pdfPath && (
          <a
            href={`/api/certificates/${certId}?download=pdf`}
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
          Verificar
        </a>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm text-gray-800 ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}
