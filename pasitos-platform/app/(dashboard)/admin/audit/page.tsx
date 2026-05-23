"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw, ChevronLeft, ChevronRight, Info } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  createdAt: string;
  details?: object;
  user?: { email: string; name: string };
}

const ACTION_OPTIONS = [
  "AUTH_LOGIN", "AUTH_LOGOUT", "AUTH_FAILED",
  "CERT_ISSUED", "CERT_REVOKED", "CERT_VIEWED", "CERT_DOWNLOADED", "CERT_EMAIL_RESENT",
  "STUDENT_CREATED", "STUDENT_UPDATED",
  "USER_CREATED", "USER_UPDATED", "USER_DEACTIVATED",
  "IMPORT_STARTED", "IMPORT_COMPLETED",
  "ENROLLMENT_CREATED", "ENROLLMENT_UPDATED",
  "COURSE_CREATED", "COURSE_UPDATED",
];

const ACTION_COLORS: Record<string, string> = {
  AUTH_LOGIN: "bg-green-100 text-green-800",
  AUTH_FAILED: "bg-red-100 text-red-800",
  AUTH_LOGOUT: "bg-gray-100 text-gray-700",
  CERT_ISSUED: "bg-blue-100 text-blue-800",
  CERT_REVOKED: "bg-red-100 text-red-700",
  CERT_VIEWED: "bg-purple-100 text-purple-700",
  CERT_DOWNLOADED: "bg-indigo-100 text-indigo-700",
  IMPORT_COMPLETED: "bg-yellow-100 text-yellow-800",
  USER_DEACTIVATED: "bg-orange-100 text-orange-700",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (action) params.set("action", action);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch(`/api/audit?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [action, dateFrom, dateTo, page]);

  useEffect(() => { fetchLogs(1); setPage(1); }, [action, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function downloadCsv() {
    const params = new URLSearchParams({ format: "csv" });
    if (action) params.set("action", action);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    window.open(`/api/audit?${params}`, "_blank");
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoría del Sistema</h1>
          <p className="text-sm text-gray-500 mt-1">{total} registros encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
          <button
            onClick={downloadCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-800 text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Acción</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Todas las acciones</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs">Cargando...</td></tr>
              )}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs">Sin registros para los filtros seleccionados</td></tr>
              )}
              {!loading && logs.map((log) => (
                <>
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs font-mono">
                      {new Date(log.createdAt).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {log.user ? (
                        <span title={log.user.name}>{log.user.email}</span>
                      ) : (
                        <span className="text-gray-400">Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <span className="font-medium">{log.entity}</span>
                      {log.entityId && <span className="text-gray-400 ml-1 font-mono">{log.entityId.slice(0, 8)}…</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{log.ipAddress ?? "—"}</td>
                    <td className="px-4 py-3">
                      {log.details && (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Info className="w-3.5 h-3.5" />
                          {expandedId === log.id ? "Ocultar" : "Ver"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === log.id && log.details && (
                    <tr key={`${log.id}-detail`} className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <pre className="text-xs text-gray-700 bg-white border rounded p-3 overflow-x-auto max-h-48">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
            <span>Página {page} de {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
