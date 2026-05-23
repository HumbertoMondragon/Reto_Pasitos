"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download, AlertTriangle } from "lucide-react";

interface Summary {
  studentsCreated: number;
  studentsUpdated: number;
  enrollmentsCreated: number;
  certificatesImported: number;
  totalProcessed: number;
  parseErrors: number;
  importErrors: number;
}

interface ParseError {
  rowIndex: number;
  field: string;
  message: string;
  rawValue?: string;
}

interface ImportError {
  rowIndex: number;
  message: string;
}

type Stage = "idle" | "preview" | "importing" | "done";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setError("Solo se aceptan archivos Excel (.xlsx o .xls)");
      return;
    }
    setError("");
    setFile(f);
    setStage("preview");

    // Fetch preview
    const fd = new FormData();
    fd.append("file", f);
    fd.append("preview", "true");
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al leer el archivo"); setStage("idle"); return; }
    setPreview(data.preview ?? []);
    setPreviewTotal(data.totalRows ?? 0);
    setParseErrors(data.parseErrors ?? []);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleImport() {
    if (!file) return;
    setStage("importing");
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Error durante la importación"); setStage("preview"); return; }
    setSummary(data.summary);
    setParseErrors(data.parseErrors ?? []);
    setImportErrors(data.importErrors ?? []);
    setStage("done");
  }

  function downloadErrorReport() {
    const allErrors = [
      ...parseErrors.map((e) => `Fila ${e.rowIndex} | Campo: ${e.field} | ${e.message}${e.rawValue ? ` | Valor: "${e.rawValue}"` : ""}`),
      ...importErrors.map((e) => `Fila ${e.rowIndex} | Error de importación: ${e.message}`),
    ];
    const blob = new Blob([allErrors.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `errores-importacion-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFile(null);
    setStage("idle");
    setPreview([]);
    setPreviewTotal(0);
    setSummary(null);
    setParseErrors([]);
    setImportErrors([]);
    setError("");
  }

  const previewHeaders = preview.length > 0 ? Object.keys(preview[0]).slice(0, 6) : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar desde Excel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Importa estudiantes, inscripciones y certificados desde el Excel de Pasitos.
        </p>
      </div>

      {/* Drop zone */}
      {stage === "idle" && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">Arrastra tu archivo Excel aquí</p>
          <p className="text-sm text-gray-500">o haz clic para seleccionarlo</p>
          <p className="text-xs text-gray-400 mt-2">Formatos: .xlsx, .xls</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Preview */}
      {(stage === "preview" || stage === "importing") && preview.length > 0 && (
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Vista previa — {file?.name}</p>
              <p className="text-sm text-gray-500">
                {previewTotal} filas detectadas · {parseErrors.length} errores de validación
              </p>
            </div>
            <Upload className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {previewHeaders.map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {previewHeaders.map((h) => (
                      <td key={h} className="px-4 py-2 text-gray-700 max-w-[160px] truncate">{row[h] ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parseErrors.length > 0 && (
            <div className="px-5 py-3 border-t bg-yellow-50">
              <p className="text-xs font-semibold text-yellow-800 flex items-center gap-1 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                {parseErrors.length} fila(s) con errores de validación (serán omitidas):
              </p>
              <ul className="text-xs text-yellow-700 space-y-0.5 max-h-32 overflow-y-auto">
                {parseErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>Fila {e.rowIndex}: [{e.field}] {e.message}</li>
                ))}
                {parseErrors.length > 10 && <li>... y {parseErrors.length - 10} más</li>}
              </ul>
            </div>
          )}

          <div className="px-5 py-4 border-t flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={stage === "importing" || previewTotal - parseErrors.length === 0}
              className="bg-blue-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {stage === "importing" ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importar {previewTotal - parseErrors.length} filas
                </>
              )}
            </button>
            <button onClick={reset} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {stage === "done" && summary && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-bold text-green-800">Importación completada</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox label="Estudiantes creados" value={summary.studentsCreated} color="text-blue-700" />
              <StatBox label="Estudiantes actualizados" value={summary.studentsUpdated} color="text-blue-500" />
              <StatBox label="Inscripciones" value={summary.enrollmentsCreated} color="text-purple-700" />
              <StatBox label="Certificados importados" value={summary.certificatesImported} color="text-green-700" />
            </div>
            {(parseErrors.length > 0 || importErrors.length > 0) && (
              <p className="mt-4 text-sm text-yellow-700">
                ⚠ {parseErrors.length + importErrors.length} fila(s) con errores fueron omitidas.
              </p>
            )}
          </div>

          {/* Error table */}
          {(parseErrors.length > 0 || importErrors.length > 0) && (
            <div className="bg-white rounded-xl border">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <p className="font-semibold text-gray-900">
                  Errores ({parseErrors.length + importErrors.length})
                </p>
                <button
                  onClick={downloadErrorReport}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar reporte
                </button>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-500">Fila</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-500">Campo</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-500">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parseErrors.map((e, i) => (
                      <tr key={`p-${i}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono">{e.rowIndex}</td>
                        <td className="px-4 py-2 text-gray-600">{e.field}</td>
                        <td className="px-4 py-2 text-red-600">{e.message}{e.rawValue ? ` — "${e.rawValue}"` : ""}</td>
                      </tr>
                    ))}
                    {importErrors.map((e, i) => (
                      <tr key={`i-${i}`} className="hover:bg-gray-50 bg-orange-50">
                        <td className="px-4 py-2 font-mono">{e.rowIndex}</td>
                        <td className="px-4 py-2 text-gray-600">importación</td>
                        <td className="px-4 py-2 text-orange-600">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={reset} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Importar otro archivo
          </button>
        </div>
      )}

      {/* Column mapping reference */}
      <details className="bg-gray-50 rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 select-none">
          Columnas esperadas en el Excel
        </summary>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-gray-600">
          {[
            "Nombre Completo", "CURP", "Fecha de Nacimiento",
            "Último Grado de Estudio", "Correo Electrónico", "Institución/Guardería",
            "Cargo o Puesto", "Curso", "Módulo",
            "Fecha de Inicio", "Fecha de Término", "Calificación",
            "Resultado", "No. de Certificado", "Fecha de Emisión",
            "Folio Verificación", "Observaciones",
          ].map((col) => (
            <span key={col} className="font-mono bg-white border rounded px-2 py-0.5">{col}</span>
          ))}
        </div>
      </details>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 text-center border">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
