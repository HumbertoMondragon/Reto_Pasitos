"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EVIDENCE_OPTIONS = [
  "Examen escrito",
  "Examen práctico",
  "Lista de cotejo",
  "Demostración",
];

const MODALITY_OPTIONS = ["Presencial", "Online", "Híbrido"];

interface ModuleRow {
  moduleName: string;
  competency: string;
  score: string;
  evidence: string;
  result: string;
}

function emptyModule(): ModuleRow {
  return { moduleName: "", competency: "", score: "", evidence: EVIDENCE_OPTIONS[0], result: "Acreditado" };
}

interface Props {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  backHref: string;
}

const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent";

export default function EmitCertForm({ enrollmentId, studentName, courseName, backHref }: Props) {
  const router = useRouter();
  const [modality, setModality]       = useState("");
  const [observations, setObs]        = useState("");
  const [modules, setModules]         = useState<ModuleRow[]>([emptyModule()]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [issued, setIssued]           = useState<{ certificateNumber: string; verificationFolio: string; pdfPath: string | null } | null>(null);

  function updateModule(i: number, field: keyof ModuleRow, value: string) {
    setModules((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  function addRow() {
    if (modules.length < 5) setModules((prev) => [...prev, emptyModule()]);
  }

  function removeRow(i: number) {
    setModules((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const filledModules = modules
      .filter((m) => m.moduleName.trim())
      .map((m, i) => ({
        moduleNumber: i + 1,
        moduleName:   m.moduleName.trim(),
        competency:   m.competency.trim(),
        score:        parseFloat(m.score) || 0,
        evidence:     m.evidence,
        result:       m.result,
      }));

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          modality:     modality || undefined,
          observations: observations.trim() || undefined,
          modules:      filledModules,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al emitir certificado");
        setLoading(false);
        return;
      }
      setIssued({
        certificateNumber: data.certificateNumber,
        verificationFolio: data.verificationFolio,
        pdfPath: data.pdfPath ?? null,
      });
    } catch {
      setError("Error de red al emitir certificado");
      setLoading(false);
    }
  }

  if (issued) {
    return (
      <div className="card-pasitos p-8 max-w-lg mx-auto space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-green-100 rounded-full p-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#111827]">Certificado emitido</h2>
          <p className="text-sm text-[#6B7280]">El certificado fue generado y firmado correctamente.</p>
        </div>

        <div className="bg-[#F9F7FF] rounded-xl border border-[#E9D5FF] p-5 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B7280] font-medium">Alumno</span>
            <span className="text-[#111827] font-semibold">{studentName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B7280] font-medium">Curso</span>
            <span className="text-[#111827]">{courseName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B7280] font-medium">No. Certificado</span>
            <span className="font-mono text-[#7C3AED] text-xs">{issued.certificateNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B7280] font-medium">Folio</span>
            <span className="font-mono text-[#7C3AED] text-xs">{issued.verificationFolio}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {issued.pdfPath && (
            <a
              href={issued.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center flex gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Descargar PDF
            </a>
          )}
          <a href={`/verify/${issued.verificationFolio}`} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full justify-center flex text-center">
            Verificar certificado
          </a>
          <a href={backHref} className="text-sm text-[#6B7280] hover:text-[#7C3AED] text-center">
            ← Volver a la lista
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Context */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm">
        <p className="font-semibold text-purple-900">{studentName}</p>
        <p className="text-purple-700">{courseName}</p>
      </div>

      {/* Modalidad y Observaciones */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-1 border-b">
          Información del curso
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Modalidad</label>
            <select value={modality} onChange={(e) => setModality(e.target.value)} className={inp}>
              <option value="">— Selecciona —</option>
              {MODALITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Observaciones del instructor <span className="text-gray-400">(máx. 300 caracteres)</span>
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObs(e.target.value)}
            maxLength={300}
            rows={3}
            className={inp}
            placeholder="Observaciones opcionales..."
          />
          <p className="text-xs text-gray-400 text-right mt-0.5">{observations.length}/300</p>
        </div>
      </div>

      {/* Tabla de módulos */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Módulos evaluados</h2>
          {modules.length < 5 && (
            <button type="button" onClick={addRow} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
              + Agregar módulo
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 text-left font-medium w-48">Nombre del módulo</th>
                <th className="pb-2 text-left font-medium">Competencia evaluada</th>
                <th className="pb-2 text-left font-medium w-20">Calif.</th>
                <th className="pb-2 text-left font-medium w-44">Evidencia</th>
                <th className="pb-2 text-left font-medium w-36">Resultado</th>
                <th className="pb-2 w-6" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {modules.map((m, i) => (
                <tr key={i}>
                  <td className="py-2 pr-2">
                    <input
                      value={m.moduleName}
                      onChange={(e) => updateModule(i, "moduleName", e.target.value)}
                      placeholder="Nombre..."
                      className={inp}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      value={m.competency}
                      onChange={(e) => updateModule(i, "competency", e.target.value)}
                      placeholder="Competencia..."
                      className={inp}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      value={m.score}
                      onChange={(e) => updateModule(i, "score", e.target.value)}
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="0-10"
                      className={inp}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={m.evidence}
                      onChange={(e) => updateModule(i, "evidence", e.target.value)}
                      className={inp}
                    >
                      {EVIDENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={m.result}
                      onChange={(e) => updateModule(i, "result", e.target.value)}
                      className={inp}
                    >
                      <option value="Acreditado">Acreditado</option>
                      <option value="No acreditado">No acreditado</option>
                    </select>
                  </td>
                  <td className="py-2">
                    {modules.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-base leading-none">
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <a href={backHref} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          Cancelar
        </a>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Emitiendo..." : "Emitir Certificado"}
        </button>
      </div>
    </form>
  );
}
