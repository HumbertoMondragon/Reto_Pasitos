"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Course { id: string; courseCode: string; name: string; durationHours: number }

const inp = "input-pasitos";
const lbl = "label-pasitos";

interface Props {
  studentProfileId: string;
  studentName: string;
  backHref: string;
}

export default function EnrollExistingForm({ studentProfileId, studentName, backHref }: Props) {
  const router = useRouter();
  const [courses, setCourses]         = useState<Course[]>([]);
  const [courseId, setCourseId]       = useState("");
  const [module, setModule]           = useState("Módulo Único");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [observations, setObs]        = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? d ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) { setError("Selecciona un curso"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProfileId,
          courseId,
          module: module.trim() || "Módulo Único",
          startDate: startDate || undefined,
          endDate:   endDate   || undefined,
          observations: observations.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al inscribir");
        return;
      }
      router.push(backHref);
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Alumno */}
      <div className="bg-[#F9F7FF] border border-[#E9D5FF] rounded-xl px-5 py-4">
        <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wide mb-0.5">Alumno</p>
        <p className="text-base font-semibold text-[#111827]">{studentName}</p>
      </div>

      {/* Datos de inscripción */}
      <div className="card-pasitos p-6 space-y-4">
        <h2 className="text-xs font-semibold text-[#6B21A8] uppercase tracking-wide pb-1 border-b border-[#E9D5FF]">
          Datos de la Inscripción
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lbl}>Curso *</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required className={inp}>
              <option value="">— Selecciona un curso —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.name} ({c.durationHours} hrs)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={lbl}>Módulo</label>
            <input value={module} onChange={(e) => setModule(e.target.value)} className={inp} placeholder="Módulo Único" />
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
            <textarea
              value={observations}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              className={inp}
              placeholder="Observaciones opcionales..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex justify-end gap-3">
        <a href={backHref} className="btn-secondary">Cancelar</a>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Inscribiendo..." : "Inscribir al Curso"}
        </button>
      </div>
    </form>
  );
}
