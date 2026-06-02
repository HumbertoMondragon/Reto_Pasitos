"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Download, ExternalLink, AlertTriangle } from "lucide-react";

type Tab = "folio" | "curp";

interface CertResult {
  certificateNumber: string;
  verificationFolio: string;
  courseName: string;
  courseCode: string;
  issueDate: string;
  pdfPath: string | null;
  isRevoked: boolean;
}

interface CurpResponse {
  found: boolean;
  studentName?: string;
  certificates?: CertResult[];
}

export default function VerifyPage() {
  const router  = useRouter();
  const [tab, setTab]       = useState<Tab>("folio");

  // Folio tab
  const [query, setQuery]   = useState("");
  const [folioError, setFolioError] = useState("");

  // CURP tab
  const [curp, setCurp]     = useState("");
  const [curpError, setCurpError]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<CurpResponse | null>(null);

  function handleFolioSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) { setFolioError("Ingresa un folio o número de certificado."); return; }
    setFolioError("");
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  async function handleCurpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = curp.trim().toUpperCase();
    if (trimmed.length !== 18) { setCurpError("La CURP debe tener exactamente 18 caracteres."); return; }
    setCurpError("");
    setResult(null);
    setLoading(true);
    try {
      const res  = await fetch(`/api/verify/curp?curp=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setCurpError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-[#7C3AED]">Pasitos</p>
          <p className="text-sm text-[#6B7280] mt-0.5">Education &amp; Health A.C.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E9D5FF] shadow-pasitos-md overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex flex-col items-center">
            <div className="bg-[#EDE9FE] rounded-full p-4 mb-3">
              <ShieldCheck className="w-9 h-9 text-[#7C3AED]" />
            </div>
            <h1 className="text-xl font-semibold text-[#111827] text-center">
              Verificación de Certificados
            </h1>
            <p className="text-sm text-[#6B7280] text-center mt-1">
              Confirma la autenticidad de un certificado emitido por Pasitos
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E9D5FF] mx-8">
            <button
              onClick={() => { setTab("folio"); setResult(null); }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === "folio"
                  ? "text-[#7C3AED] border-b-2 border-[#7C3AED]"
                  : "text-[#6B7280] hover:text-[#7C3AED]"
              }`}
            >
              Folio / N° Certificado
            </button>
            <button
              onClick={() => { setTab("curp"); setResult(null); }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === "curp"
                  ? "text-[#7C3AED] border-b-2 border-[#7C3AED]"
                  : "text-[#6B7280] hover:text-[#7C3AED]"
              }`}
            >
              Por CURP
            </button>
          </div>

          <div className="p-8 space-y-4">
            {/* ── Tab: Folio ── */}
            {tab === "folio" && (
              <form onSubmit={handleFolioSubmit} className="space-y-4">
                <div>
                  <label htmlFor="folio" className="label-pasitos">Folio o número de certificado</label>
                  <input
                    id="folio"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ej. VER-A1B2C3D4 o PAC-2025-0001"
                    className="input-pasitos font-mono"
                  />
                  {folioError && <p className="text-red-500 text-xs mt-1">{folioError}</p>}
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                  <Search className="w-4 h-4" />
                  Verificar autenticidad
                </button>
              </form>
            )}

            {/* ── Tab: CURP ── */}
            {tab === "curp" && (
              <>
                <form onSubmit={handleCurpSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="curp" className="label-pasitos">CURP del participante</label>
                    <input
                      id="curp"
                      type="text"
                      value={curp}
                      onChange={(e) => setCurp(e.target.value.toUpperCase())}
                      maxLength={18}
                      placeholder="18 caracteres"
                      className="input-pasitos font-mono uppercase tracking-widest"
                    />
                    {curpError && <p className="text-red-500 text-xs mt-1">{curpError}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                  >
                    <Search className="w-4 h-4" />
                    {loading ? "Buscando..." : "Buscar certificados"}
                  </button>
                </form>

                {/* Results */}
                {result && !result.found && (
                  <div className="bg-[#FFF5F5] border border-red-200 rounded-xl px-4 py-4 text-center text-sm text-red-700">
                    No se encontró ningún certificado para esa CURP.
                  </div>
                )}

                {result?.found && (
                  <div className="space-y-3">
                    <div className="bg-[#F9F7FF] border border-[#E9D5FF] rounded-xl px-4 py-3">
                      <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wide">Titular</p>
                      <p className="text-base font-semibold text-[#111827]">{result.studentName}</p>
                    </div>

                    {result.certificates!.length === 0 ? (
                      <p className="text-sm text-[#6B7280] text-center py-2">Este participante no tiene certificados emitidos aún.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                          {result.certificates!.length} certificado(s) encontrado(s)
                        </p>
                        {result.certificates!.map((cert) => (
                          <div
                            key={cert.certificateNumber}
                            className={`rounded-xl border p-4 space-y-2 ${
                              cert.isRevoked
                                ? "bg-[#FFFBEB] border-amber-200"
                                : "bg-[#F0FDF4] border-green-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-[#111827]">{cert.courseName}</p>
                                <p className="text-xs text-[#6B7280] mt-0.5">
                                  {cert.courseCode} · Emitido el{" "}
                                  {new Date(cert.issueDate).toLocaleDateString("es-MX", {
                                    day: "2-digit", month: "long", year: "numeric",
                                  })}
                                </p>
                                <p className="text-xs font-mono text-[#7C3AED] mt-1">{cert.certificateNumber}</p>
                              </div>
                              {cert.isRevoked && (
                                <span className="flex items-center gap-1 text-xs text-amber-700 font-medium whitespace-nowrap">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Revocado
                                </span>
                              )}
                            </div>

                            <div className="flex gap-3 pt-1">
                              {cert.pdfPath && (
                                <a
                                  href={cert.pdfPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#6B21A8] font-medium"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Descargar PDF
                                </a>
                              )}
                              <a
                                href={`/verify/${cert.verificationFolio}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#7C3AED] font-medium"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Verificar
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-2 border-t border-[#E9D5FF] text-center space-y-1">
            <p className="text-xs text-[#6B7280]">
              Sistema de verificación de Pasitos Education &amp; Health A.C.
            </p>
            <p className="text-xs">
              <a href="mailto:contacto@pasitos.org" className="text-[#7C3AED] hover:underline">
                contacto@pasitos.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
