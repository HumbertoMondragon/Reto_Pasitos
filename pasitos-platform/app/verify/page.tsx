"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Ingresa un folio de verificación o número de certificado.");
      return;
    }
    setError("");
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Logo / header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 rounded-full p-4 mb-3">
            <Shield className="text-blue-800 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-blue-900 text-center">Verificación de Certificados</h1>
          <p className="text-gray-500 text-sm text-center mt-1">
            Pasitos Education &amp; Health A.C.
          </p>
        </div>

        <p className="text-gray-600 text-sm text-center mb-6">
          Ingresa el <strong>folio de verificación</strong> (VER-XXXXXXXX) o el{" "}
          <strong>número de certificado</strong> (PAC-YYYY-XXXX) que aparece en el documento.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folio" className="block text-sm font-medium text-gray-700 mb-1">
              Folio o número de certificado
            </label>
            <input
              id="folio"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej. VER-A1B2C3D4 o PAC-2025-0001"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Verificar autenticidad
          </button>
        </form>

        <div className="mt-8 border-t pt-6 text-center text-xs text-gray-400 space-y-1">
          <p>
            Este sistema verifica que el certificado fue emitido por Pasitos Education &amp; Health A.C.
            y que no ha sido alterado.
          </p>
          <p className="mt-2">
            ¿Tienes dudas?{" "}
            <a href="mailto:contacto@pasitos.org" className="text-blue-600 hover:underline">
              contacto@pasitos.org
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
