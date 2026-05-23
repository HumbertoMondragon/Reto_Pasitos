"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RefreshCw, Shield, Database, HardDrive, Key } from "lucide-react";

interface HealthData {
  status: "ok" | "degraded";
  db: { status: string; latencyMs: number | null };
  env: { status: string; missing: string[] };
}

interface IntegrityResult {
  total: number;
  valid: number;
  invalid: number;
  revoked: number;
  invalidList: { id: string; certificateNumber: string }[];
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
      <CheckCircle className="w-3.5 h-3.5" /> Activo
    </span>
  ) : (
    <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
      <XCircle className="w-3.5 h-3.5" /> Error
    </span>
  );
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);

  async function fetchHealth() {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    }
    setHealthLoading(false);
  }

  async function runIntegrityCheck() {
    setIntegrityLoading(true);
    setIntegrity(null);
    try {
      const res = await fetch("/api/admin/integrity");
      const data = await res.json();
      setIntegrity(data);
    } catch {
      setIntegrity(null);
    }
    setIntegrityLoading(false);
  }

  useEffect(() => { fetchHealth(); }, []);

  const requiredEnvKeys = [
    "DATABASE_URL",
    "DIRECT_DATABASE_URL",
    "NEXTAUTH_SECRET",
    "CERTIFICATE_SIGNING_KEY",
    "ENCRYPTION_KEY",
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-sm text-gray-500 mt-1">Estado del servidor, base de datos y claves de cifrado.</p>
      </div>

      {/* System status */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Estado del Sistema</h2>
          </div>
          <button
            onClick={fetchHealth}
            disabled={healthLoading}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {healthLoading ? (
          <p className="text-sm text-gray-400">Verificando...</p>
        ) : health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={<Database className="w-4 h-4 text-gray-400" />}
              label="Base de datos"
              value={<StatusBadge ok={health.db.status === "ok"} />}
              sub={health.db.latencyMs != null ? `${health.db.latencyMs} ms de latencia` : undefined}
            />
            <InfoRow
              icon={<HardDrive className="w-4 h-4 text-gray-400" />}
              label="Variables de entorno"
              value={<StatusBadge ok={health.env.status === "ok"} />}
              sub={health.env.missing.length > 0 ? `Faltantes: ${health.env.missing.join(", ")}` : "Todas presentes"}
            />
          </div>
        ) : (
          <p className="text-sm text-red-600">No se pudo conectar al health endpoint.</p>
        )}
      </div>

      {/* Encryption keys status */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Claves de Cifrado</h2>
        </div>
        <p className="text-xs text-gray-500">
          Solo se muestra si las claves están configuradas — nunca se muestra el valor.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requiredEnvKeys.map((key) => (
            <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <span className="text-xs font-mono text-gray-700">{key}</span>
              <StatusBadge ok={health?.env.missing.indexOf(key) === -1} />
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠ Si cambias <strong>CERTIFICATE_SIGNING_KEY</strong>, los certificados existentes no podrán
          verificarse hasta que sean re-firmados. Haz backup antes de cualquier cambio.
        </p>
      </div>

      {/* Integrity check */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Verificación de Integridad</h2>
        </div>
        <p className="text-sm text-gray-500">
          Re-verifica la firma HMAC-SHA256 de todos los certificados activos. Detecta si algún
          certificado fue alterado en la base de datos.
        </p>

        <button
          onClick={runIntegrityCheck}
          disabled={integrityLoading}
          className="flex items-center gap-2 bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {integrityLoading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Verificando...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Verificar integridad
            </>
          )}
        </button>

        {integrity && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Total" value={integrity.total} color="text-gray-900" />
              <StatBox label="Válidos" value={integrity.valid} color="text-green-700" />
              <StatBox label="Revocados" value={integrity.revoked} color="text-yellow-700" />
              <StatBox label="Inválidos" value={integrity.invalid} color={integrity.invalid > 0 ? "text-red-700" : "text-gray-400"} />
            </div>

            {integrity.invalid === 0 ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Todos los certificados activos tienen firmas válidas.
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm font-semibold text-red-800 mb-2">
                  {integrity.invalid} certificado(s) con firma inválida:
                </p>
                <ul className="text-xs text-red-700 space-y-1 font-mono">
                  {integrity.invalidList.map((c) => (
                    <li key={c.id}>{c.certificateNumber} — ID: {c.id}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Version info */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Información del Sistema</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="Plataforma" value={<span className="text-gray-700">Pasitos Platform</span>} />
          <InfoRow label="Entorno" value={<span className="font-mono text-gray-700">{process.env.NODE_ENV ?? "production"}</span>} />
          <InfoRow label="Framework" value={<span className="text-gray-700">Next.js 14 (App Router)</span>} />
          <InfoRow label="Firma digital" value={<span className="text-gray-700">HMAC-SHA256</span>} />
          <InfoRow label="Cifrado de datos" value={<span className="text-gray-700">AES-256-GCM</span>} />
          <InfoRow label="Autenticación" value={<span className="text-gray-700">NextAuth.js v5 + JWT</span>} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  sub,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5">{icon}</span>}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <div className="mt-0.5">{value}</div>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center border">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
