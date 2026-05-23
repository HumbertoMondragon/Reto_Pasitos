import { prisma } from "@/lib/db";
import Link from "next/link";
import { Shield, Award, BookOpen, CheckCircle } from "lucide-react";

async function getPublicCourses() {
  return prisma.course.findMany({ where: { isActive: true }, orderBy: { courseCode: "asc" } });
}

export default async function HomePage() {
  const courses = await getPublicCourses();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-blue-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-300" />
            <div>
              <p className="font-bold text-sm leading-tight">Pasitos</p>
              <p className="text-xs text-blue-300 leading-tight">Education &amp; Health A.C.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/verify" className="text-sm text-blue-300 hover:text-white transition-colors hidden sm:block">
              Verificar Certificado
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-800/60 rounded-full px-4 py-1.5 text-xs text-blue-200 mb-6 border border-blue-700">
            <Shield className="w-3.5 h-3.5" />
            Certificados con firma digital HMAC-SHA256
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
            Plataforma de Certificación
            <span className="block text-blue-300 mt-1">Pasitos Education &amp; Health A.C.</span>
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">
            Capacitación técnica en puericultura, asistencia educativa y primeros auxilios pediátricos.
            Certificados digitales verificables en línea.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Acceder a mi cuenta
            </Link>
            <Link
              href="/verify"
              className="border border-blue-400 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              Verificar mi certificado
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            ¿Por qué nuestros certificados son confiables?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-blue-700" />}
              title="Firma Digital"
              description="Cada certificado lleva una firma criptográfica HMAC-SHA256. Si alguien altera los datos, la verificación falla."
            />
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="Verificación Instantánea"
              description="Escanea el QR del certificado y verifica su autenticidad en segundos desde cualquier dispositivo."
            />
            <FeatureCard
              icon={<Award className="w-8 h-8 text-yellow-600" />}
              title="Registro Permanente"
              description="Los certificados quedan registrados en nuestra base de datos segura y pueden verificarse en cualquier momento."
            />
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6 text-blue-800" />
            <h2 className="text-2xl font-bold text-gray-900">Cursos Disponibles</h2>
          </div>
          {courses.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No hay cursos activos en este momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((c) => (
                <div key={c.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    {c.courseCode}
                  </span>
                  <h3 className="font-bold text-gray-900 mt-2 mb-1">{c.name}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{c.durationHours} horas</span>
                    <span>{c.modality}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Verify CTA */}
      <section className="py-16 px-4 bg-blue-950 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="w-10 h-10 text-blue-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">¿Tienes un certificado de Pasitos?</h2>
          <p className="text-blue-200 mb-6 text-sm">
            Verifica su autenticidad en segundos. Solo necesitas el folio de verificación o el
            número de certificado que aparece en el documento.
          </p>
          <Link
            href="/verify"
            className="inline-block bg-white text-blue-900 px-8 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            Verificar mi certificado →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-semibold text-white">Pasitos Education &amp; Health A.C.</p>
            <p className="mt-0.5">Plataforma de certificación digital</p>
          </div>
          <div className="flex gap-5">
            <a href="mailto:contacto@pasitos.org" className="hover:text-white transition-colors">
              contacto@pasitos.org
            </a>
            <Link href="/verify" className="hover:text-white transition-colors">Verificar certificado</Link>
            <Link href="/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
