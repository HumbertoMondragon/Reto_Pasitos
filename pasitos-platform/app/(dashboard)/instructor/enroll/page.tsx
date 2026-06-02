"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const educationLevels = [
  { value: "PRIMARY",     label: "Primaria" },
  { value: "SECONDARY",   label: "Secundaria" },
  { value: "HIGH_SCHOOL", label: "Preparatoria / Bachillerato" },
  { value: "TECHNICAL",   label: "Técnico" },
  { value: "BACHELOR",    label: "Licenciatura" },
  { value: "MASTER",      label: "Maestría" },
  { value: "DOCTORATE",   label: "Doctorado" },
  { value: "OTHER",       label: "Otro" },
];

interface Course { id: string; courseCode: string; name: string; durationHours: number }

const inp = "input-pasitos";
const lbl = "label-pasitos";

export default function InstructorEnrollPage() {
  const router = useRouter();
  const [courses, setCourses]   = useState<Course[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Student fields
  const [fullName, setFullName]           = useState("");
  const [curp, setCurp]                   = useState("");
  const [birthDate, setBirthDate]         = useState("");
  const [educationLevel, setEduLevel]     = useState("OTHER");
  const [email, setEmail]                 = useState("");
  const [institution, setInstitution]     = useState("");
  const [jobTitle, setJobTitle]           = useState("");

  // Enrollment fields
  const [courseId, setCourseId]           = useState("");
  const [module, setModule]               = useState("Módulo Único");
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");
  const [observations, setObservations]   = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? d ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // 1 — Crear alumno
      const studentRes = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          curp: curp.trim().toUpperCase(),
          birthDate: birthDate || undefined,
          educationLevel,
          email: email.trim(),
          institution: institution.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
        }),
      });

      const studentData = await studentRes.json();
      if (!studentRes.ok) {
        setError(studentData.error ?? "Error al registrar al alumno");
        setLoading(false);
        return;
      }

      const studentProfileId = studentData.id;

      // 2 — Crear inscripción si hay curso seleccionado
      if (courseId) {
        const enrollRes = await fetch("/api/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentProfileId,
            courseId,
            module: module.trim() || "Módulo Único",
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            observations: observations.trim() || undefined,
          }),
        });

        if (!enrollRes.ok) {
          const enrollData = await enrollRes.json();
          // El alumno ya fue creado — avisar pero no fallar completamente
          setError(`Alumno registrado pero error en inscripción: ${enrollData.error ?? "Error desconocido"}`);
          setLoading(false);
          return;
        }
      }

      setSuccess("Alumno registrado exitosamente.");
      setTimeout(() => router.push("/instructor/students"), 1200);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Registrar Alumno</h1>
        <p className="text-sm text-[#6B7280] mt-1">Llena los datos del participante e inscríbelo a un curso.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos personales */}
        <div className="card-pasitos p-6 space-y-4">
          <h2 className="text-xs font-semibold text-[#6B21A8] uppercase tracking-wide pb-1 border-b border-[#E9D5FF]">
            Datos Personales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={lbl}>Nombre Completo *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inp} placeholder="Nombre completo del participante" />
            </div>
            <div>
              <label className={lbl}>CURP *</label>
              <input value={curp} onChange={(e) => setCurp(e.target.value.toUpperCase())} required maxLength={18} minLength={18} className={`${inp} uppercase font-mono`} placeholder="18 caracteres" />
            </div>
            <div>
              <label className={lbl}>Fecha de Nacimiento</label>
              <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} type="date" className={inp} />
            </div>
            <div>
              <label className={lbl}>Último Grado de Estudio</label>
              <select value={educationLevel} onChange={(e) => setEduLevel(e.target.value)} className={inp}>
                {educationLevels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Correo Electrónico *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className={inp} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className={lbl}>Institución / Guardería</label>
              <input value={institution} onChange={(e) => setInstitution(e.target.value)} className={inp} placeholder="Nombre de la institución" />
            </div>
            <div>
              <label className={lbl}>Cargo o Puesto</label>
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inp} placeholder="Ej. Educadora, Puericulturista" />
            </div>
          </div>
        </div>

        {/* Inscripción */}
        <div className="card-pasitos p-6 space-y-4">
          <h2 className="text-xs font-semibold text-[#6B21A8] uppercase tracking-wide pb-1 border-b border-[#E9D5FF]">
            Inscripción al Curso <span className="normal-case text-[#6B7280] font-normal">(opcional)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={lbl}>Curso</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inp}>
                <option value="">— Selecciona un curso —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.courseCode} — {c.name} ({c.durationHours} hrs)</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Módulo</label>
              <input value={module} onChange={(e) => setModule(e.target.value)} className={inp} placeholder="Ej. Módulo Único" />
            </div>
            <div />
            <div>
              <label className={lbl}>Fecha de Inicio</label>
              <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" className={inp} />
            </div>
            <div>
              <label className={lbl}>Fecha de Término</label>
              <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Observaciones</label>
              <textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} className={inp} placeholder="Observaciones opcionales..." />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <div className="flex justify-end gap-3">
          <a href="/instructor/students" className="btn-secondary">Cancelar</a>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Registrando..." : "Registrar Alumno"}
          </button>
        </div>
      </form>
    </div>
  );
}
