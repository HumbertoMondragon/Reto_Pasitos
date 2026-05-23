import { prisma } from "@/lib/db";

export default async function InstructorEnrollPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { courseCode: "asc" },
  });

  const educationLevels = [
    { value: "PRIMARY", label: "Primaria" },
    { value: "SECONDARY", label: "Secundaria" },
    { value: "HIGH_SCHOOL", label: "Preparatoria / Bachillerato" },
    { value: "TECHNICAL", label: "Técnico" },
    { value: "BACHELOR", label: "Licenciatura" },
    { value: "MASTER", label: "Maestría" },
    { value: "DOCTORATE", label: "Doctorado" },
    { value: "OTHER", label: "Otro" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Alumno</h1>
        <p className="text-sm text-gray-500 mt-1">Llena los datos del participante e inscríbelo a un curso.</p>
      </div>

      <form action="/api/students" method="POST" className="bg-white rounded-xl border p-6 space-y-5">
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-1 border-b">Datos Personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nombre Completo *</Label>
              <input name="fullName" required className={inputCls} placeholder="Nombre completo del participante" />
            </div>
            <div>
              <Label>CURP *</Label>
              <input name="curp" required maxLength={18} minLength={18} className={`${inputCls} uppercase font-mono`} placeholder="18 caracteres" />
            </div>
            <div>
              <Label>Fecha de Nacimiento</Label>
              <input name="birthDate" type="date" className={inputCls} />
            </div>
            <div>
              <Label>Último Grado de Estudio</Label>
              <select name="educationLevel" className={inputCls}>
                {educationLevels.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Correo Electrónico *</Label>
              <input name="email" type="email" required className={inputCls} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <Label>Institución / Guardería</Label>
              <input name="institution" className={inputCls} placeholder="Nombre de la institución" />
            </div>
            <div>
              <Label>Cargo o Puesto</Label>
              <input name="jobTitle" className={inputCls} placeholder="Ej. Educadora, Puericulturista" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-1 border-b">Inscripción al Curso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Curso *</Label>
              <select name="courseId" required className={inputCls}>
                <option value="">— Selecciona un curso —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} — {c.name} ({c.durationHours} hrs)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Módulo</Label>
              <input name="module" className={inputCls} placeholder="Ej. Módulo Único" />
            </div>
            <div />
            <div>
              <Label>Fecha de Inicio</Label>
              <input name="startDate" type="date" className={inputCls} />
            </div>
            <div>
              <Label>Fecha de Término</Label>
              <input name="endDate" type="date" className={inputCls} />
            </div>
            <div>
              <Label>Calificación (0–10)</Label>
              <input name="score" type="number" min="0" max="10" step="0.1" className={inputCls} placeholder="Ej. 9.0" />
            </div>
            <div>
              <Label>Resultado</Label>
              <select name="result" className={inputCls}>
                <option value="PENDING">Pendiente</option>
                <option value="PASSED">Aprobado</option>
                <option value="FAILED">Reprobado</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Observaciones</Label>
              <textarea name="observations" rows={2} className={inputCls} placeholder="Observaciones opcionales..." />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-2">
          <a href="/instructor/students" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </a>
          <button type="submit" className="px-6 py-2 bg-blue-800 text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
            Registrar Alumno
          </button>
        </div>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
