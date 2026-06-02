"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPass]   = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        setError("Credenciales incorrectas o cuenta inactiva.");
        return;
      }

      const res     = await fetch("/api/auth/session");
      const session = await res.json();
      const role    = session?.user?.role;

      if (role === "ADMIN")       router.push("/admin");
      else if (role === "INSTRUCTOR") router.push("/instructor");
      else                            router.push("/student");
    } catch {
      setError("Error al conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] flex items-center justify-center px-4 py-12">
      {/* Logo sobre la card */}
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-[#7C3AED]">Pasitos</p>
          <p className="text-sm text-[#6B7280] mt-0.5">Education &amp; Health A.C.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-pasitos-md border border-[#E9D5FF] p-8">
          <h1 className="text-lg font-semibold text-[#111827] mb-1">Iniciar sesión</h1>
          <p className="text-sm text-[#6B7280] mb-6">Accede a tu cuenta de la plataforma</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-pasitos">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="usuario@pasitos.org"
                className="input-pasitos"
              />
            </div>

            <div>
              <label className="label-pasitos">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-pasitos pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center flex py-2.5"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setError("Para recuperar tu contraseña, contacta al administrador del sistema.")}
            className="mt-4 w-full text-center text-sm text-[#7C3AED] hover:text-[#6B21A8] hover:underline transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>

          <div className="mt-6 pt-5 border-t border-[#E9D5FF] text-center">
            <a href="/verify" className="text-xs text-[#6B7280] hover:text-[#7C3AED] transition-colors">
              Verificar un certificado →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
