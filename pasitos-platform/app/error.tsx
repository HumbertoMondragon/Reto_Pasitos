"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Algo salió mal</h1>
        <p className="text-gray-500 mb-8">
          Ocurrió un error inesperado. Si el problema persiste, contacta al administrador.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link href="/" className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
            Ir al inicio
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-6 font-mono">ID: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
