import * as XLSX from "xlsx";
import { EducationLevel, EnrollmentResult } from "@prisma/client";

// Column mapping for Pasitos Excel "Registro de Inscripciones"
// Key: exact column header in Excel (trimmed), Value: internal field name
const COLUMN_MAP: Record<string, string> = {
  "Nombre Completo": "fullName",
  "CURP": "curp",
  "Fecha de Nacimiento": "birthDate",
  "Último Grado de Estudio": "educationLevel",
  "Correo Electrónico": "email",
  "Institución/Guardería": "institution",
  "Cargo o Puesto": "jobTitle",
  "Curso": "courseName",
  "Módulo": "module",
  "Fecha de Inicio": "startDate",
  "Fecha de Término": "endDate",
  "Calificación": "score",
  "Resultado": "result",
  "No. de Certificado": "certificateNumber",
  "Fecha de Emisión": "issueDate",
  "Folio Verificación": "verificationFolio",
  "Observaciones": "observations",
};

const EDUCATION_MAP: Record<string, EducationLevel> = {
  primaria: EducationLevel.PRIMARY,
  secundaria: EducationLevel.SECONDARY,
  preparatoria: EducationLevel.HIGH_SCHOOL,
  bachillerato: EducationLevel.HIGH_SCHOOL,
  "preparatoria/bachillerato": EducationLevel.HIGH_SCHOOL,
  técnico: EducationLevel.TECHNICAL,
  tecnico: EducationLevel.TECHNICAL,
  licenciatura: EducationLevel.BACHELOR,
  maestría: EducationLevel.MASTER,
  maestria: EducationLevel.MASTER,
  doctorado: EducationLevel.DOCTORATE,
};

const RESULT_MAP: Record<string, EnrollmentResult> = {
  aprobado: EnrollmentResult.PASSED,
  aprobada: EnrollmentResult.PASSED,
  passed: EnrollmentResult.PASSED,
  reprobado: EnrollmentResult.FAILED,
  reprobada: EnrollmentResult.FAILED,
  failed: EnrollmentResult.FAILED,
  pendiente: EnrollmentResult.PENDING,
  pending: EnrollmentResult.PENDING,
};

export interface ParsedRow {
  rowIndex: number;
  fullName: string;
  curp: string;
  birthDate?: Date;
  educationLevel: EducationLevel;
  email: string;
  institution?: string;
  jobTitle?: string;
  courseName: string;
  module?: string;
  startDate?: Date;
  endDate?: Date;
  score?: number;
  result: EnrollmentResult;
  certificateNumber?: string;
  issueDate?: Date;
  verificationFolio?: string;
  observations?: string;
}

export interface ParseError {
  rowIndex: number;
  field: string;
  message: string;
  rawValue?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: ParseError[];
  preview: Record<string, string>[];
}

function parseExcelDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // Excel serial date
    return XLSX.SSF.parse_date_code(value)
      ? new Date((value - 25569) * 86400 * 1000)
      : undefined;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export function parseExcelFile(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

  // Try to find the right sheet
  const sheetName =
    workbook.SheetNames.find((n) =>
      n.toLowerCase().includes("inscripcion") || n.toLowerCase().includes("registro")
    ) ?? workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rawRows.length === 0) {
    return { rows: [], errors: [{ rowIndex: 0, field: "sheet", message: "La hoja está vacía" }], preview: [] };
  }

  // Normalize headers
  const normalizeRow = (raw: Record<string, unknown>): Record<string, unknown> => {
    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(raw)) {
      const mapped = COLUMN_MAP[key.trim()];
      if (mapped) normalized[mapped] = val;
    }
    return normalized;
  };

  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  // Preview: first 5 raw rows
  const preview = rawRows.slice(0, 5).map((r) => {
    const obj: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) obj[k] = String(v);
    return obj;
  });

  rawRows.forEach((raw, idx) => {
    const rowIndex = idx + 2; // 1-indexed + header row
    const row = normalizeRow(raw);
    const rowErrors: ParseError[] = [];

    const fullName = String(row.fullName ?? "").trim();
    const curp = String(row.curp ?? "").trim().toUpperCase();
    const email = String(row.email ?? "").trim().toLowerCase();
    const courseName = String(row.courseName ?? "").trim();

    if (!fullName) rowErrors.push({ rowIndex, field: "fullName", message: "Nombre requerido" });
    if (!curp) {
      rowErrors.push({ rowIndex, field: "curp", message: "CURP requerida" });
    } else if (curp.length !== 18) {
      rowErrors.push({ rowIndex, field: "curp", message: `CURP debe tener 18 chars (tiene ${curp.length})`, rawValue: curp });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      rowErrors.push({ rowIndex, field: "email", message: "Email inválido", rawValue: String(row.email ?? "") });
    }
    if (!courseName) rowErrors.push({ rowIndex, field: "courseName", message: "Nombre del curso requerido" });

    const scoreRaw = row.score !== "" ? Number(row.score) : undefined;
    if (scoreRaw !== undefined && (isNaN(scoreRaw) || scoreRaw < 0 || scoreRaw > 10)) {
      rowErrors.push({ rowIndex, field: "score", message: "Calificación debe ser 0–10", rawValue: String(row.score) });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    const edLevel = EDUCATION_MAP[String(row.educationLevel ?? "").toLowerCase().trim()] ?? EducationLevel.OTHER;
    const result = RESULT_MAP[String(row.result ?? "").toLowerCase().trim()] ?? EnrollmentResult.PENDING;

    rows.push({
      rowIndex,
      fullName,
      curp,
      birthDate: parseExcelDate(row.birthDate),
      educationLevel: edLevel,
      email,
      institution: String(row.institution ?? "").trim() || undefined,
      jobTitle: String(row.jobTitle ?? "").trim() || undefined,
      courseName,
      module: String(row.module ?? "").trim() || undefined,
      startDate: parseExcelDate(row.startDate),
      endDate: parseExcelDate(row.endDate),
      score: scoreRaw,
      result,
      certificateNumber: String(row.certificateNumber ?? "").trim() || undefined,
      issueDate: parseExcelDate(row.issueDate),
      verificationFolio: String(row.verificationFolio ?? "").trim() || undefined,
      observations: String(row.observations ?? "").trim() || undefined,
    });
  });

  return { rows, errors, preview };
}
