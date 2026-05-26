import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, Color } from "pdf-lib";
import QRCode from "qrcode";
import { readFile } from "fs/promises";
import path from "path";

const PW = 1280;
const PH = 853;

const C = {
  purple_dark: rgb(107 / 255, 33 / 255, 168 / 255),  // #6B21A8
  gray_dark:   rgb(55  / 255, 65  / 255, 81  / 255),  // #374151
  gray_deeper: rgb(17  / 255, 24  / 255, 39  / 255),  // #111827
  purple:      rgb(124 / 255, 58  / 255, 237 / 255),  // #7C3AED
  green:       rgb(21  / 255, 128 / 255, 61  / 255),  // #15803D
  gray_mid:    rgb(107 / 255, 114 / 255, 128 / 255),  // #6B7280
};

export interface CertificateTemplateData {
  studentName: string;
  curp: string;
  courseName: string;
  courseHours: number;
  startDate: Date;
  endDate: Date;
  score: number;
  certificateNumber: string;
  issueDate: Date;
  verificationFolio: string;
  verifyUrl: string;
  digitalSignatureHash: string;
  modality?: string;
  observations?: string;
  modules?: Array<{
    moduleNumber: number;
    moduleName: string;
    competency: string;
    score: number;
    evidence: string;
    result: string;
  }>;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

// Draws text converting from canvas coords (top-left origin) to pdf-lib (bottom-left origin).
// align=center: x is the center point.
// align=right: x is the right edge.
// no align: x is the left edge.
function dt(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  canvasX: number,
  canvasY: number,
  color: Color,
  align: "left" | "center" | "right" = "left",
) {
  const tw = font.widthOfTextAtSize(text, size);
  let x = canvasX;
  if (align === "center") x = canvasX - tw / 2;
  else if (align === "right") x = canvasX - tw;
  const y = PH - canvasY;
  page.drawText(text, { x, y, size, font, color });
}

function truncate(text: string, font: PDFFont, size: number, maxW: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxW) return text;
  let s = text;
  while (s.length > 0 && font.widthOfTextAtSize(s + "…", size) > maxW) s = s.slice(0, -1);
  return s + "…";
}

function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxW) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function makeQr(doc: PDFDocument, url: string) {
  const buf = await QRCode.toBuffer(url, { type: "png", width: 120, margin: 1 });
  return doc.embedPng(buf);
}

async function buildPage1(
  doc: PDFDocument,
  data: CertificateTemplateData,
  bold: PDFFont,
  regular: PDFFont,
): Promise<void> {
  const imgBytes = await readFile(path.join(process.cwd(), "public", "templates", "h1.png"));
  const bg = await doc.embedPng(imgBytes);
  const page = doc.addPage([PW, PH]);
  page.drawImage(bg, { x: 0, y: 0, width: PW, height: PH });

  // No. certificado: x=1145, y=95, size=22, bold, #6B21A8, center
  dt(page, data.certificateNumber, bold, 22, 1145, 95, C.purple_dark, "center");

  // Fecha emisión: x=1090, y=145, size=14, #374151
  dt(page, fmtDate(data.issueDate), regular, 14, 1090, 145, C.gray_dark);

  // Nombre alumno: x=640, y=340, size=52, bold, #111827, center
  dt(page, data.studentName.toUpperCase(), bold, 52, 640, 340, C.gray_deeper, "center");

  // CURP: x=640, y=390, size=16, #374151, center
  dt(page, data.curp, regular, 16, 640, 390, C.gray_dark, "center");

  // Nombre curso: x=640, y=490, size=46, bold, #7C3AED, center, MAYÚSCULAS
  dt(page, data.courseName.toUpperCase(), bold, 46, 640, 490, C.purple, "center");

  // Folio: x=1105, y=690, size=22, bold, #7C3AED, center
  dt(page, data.verificationFolio, bold, 22, 1105, 690, C.purple, "center");

  // QR 80×80: canvas top-left (1065, 715) → pdf bottom-left y = PH - 715 - 80
  try {
    const qrImg = await makeQr(doc, data.verifyUrl);
    page.drawImage(qrImg, { x: 1065, y: PH - 715 - 80, width: 80, height: 80 });
  } catch { /* non-fatal */ }
}

async function buildPage2(
  doc: PDFDocument,
  data: CertificateTemplateData,
  bold: PDFFont,
  regular: PDFFont,
): Promise<void> {
  const imgBytes = await readFile(path.join(process.cwd(), "public", "templates", "h2.png"));
  const bg = await doc.embedPng(imgBytes);
  const page = doc.addPage([PW, PH]);
  page.drawImage(bg, { x: 0, y: 0, width: PW, height: PH });

  const period = `${fmtDate(data.startDate)} – ${fmtDate(data.endDate)}`;

  // No. certificado: x=1190, y=52, size=18, bold, #6B21A8, right
  dt(page, data.certificateNumber, bold, 18, 1190, 52, C.purple_dark, "right");

  // Fecha emisión: x=1090, y=107, size=13, #374151
  dt(page, fmtDate(data.issueDate), regular, 13, 1090, 107, C.gray_dark);

  // Nombre: x=340, y=183, size=15, bold, #111827
  dt(page, data.studentName, bold, 15, 340, 183, C.gray_deeper);

  // CURP: x=601, y=183, size=15, #374151
  dt(page, data.curp, regular, 15, 601, 183, C.gray_dark);

  // Programa: x=887, y=183, size=15, #374151
  dt(page, truncate(data.courseName, regular, 15, 360), regular, 15, 887, 183, C.gray_dark);

  // Período: x=340, y=248, size=14, #374151
  dt(page, period, regular, 14, 340, 248, C.gray_dark);

  // Duración: x=626, y=248, size=14, #374151
  dt(page, `${data.courseHours} horas`, regular, 14, 626, 248, C.gray_dark);

  // Modalidad: x=887, y=248, size=14, #374151
  if (data.modality) {
    dt(page, data.modality, regular, 14, 887, 248, C.gray_dark);
  }

  // Tabla de módulos — y base=370, incremento=45
  const modules = data.modules ?? [];
  for (let i = 0; i < Math.min(modules.length, 5); i++) {
    const m = modules[i];
    const rowY = 370 + i * 45;

    dt(page, truncate(m.moduleName, regular, 12, 180), regular, 12, 120, rowY, C.gray_dark);
    dt(page, truncate(m.competency, regular, 12, 340), regular, 12, 385, rowY, C.gray_dark);
    dt(page, Number(m.score).toFixed(1), bold, 16, 807, rowY, C.purple, "center");
    dt(page, m.evidence, regular, 12, 965, rowY, C.gray_dark, "center");
    const resColor = m.result === "Acreditado" ? C.green : C.gray_dark;
    dt(page, m.result, regular, 12, 1135, rowY, resColor, "center");
  }

  // Calificación final: x=113, y=748, size=32, bold, #7C3AED, center
  dt(page, Number(data.score).toFixed(1), bold, 32, 113, 748, C.purple, "center");

  // "/10": x=155, y=748, size=18, #6B7280
  dt(page, "/10", regular, 18, 155, 748, C.gray_mid);

  // "ACREDITADO": x=113, y=790, size=13, bold, #15803D, center
  dt(page, "ACREDITADO", bold, 13, 113, 790, C.green, "center");

  // Observaciones con wrap: x=435, y=755, size=11, #374151, maxWidth=320
  if (data.observations) {
    const lines = wrapText(data.observations, regular, 11, 320);
    lines.slice(0, 3).forEach((line, i) => {
      dt(page, line, regular, 11, 435, 755 + i * 14, C.gray_dark);
    });
  }

  // Folio: x=990, y=800, size=14, bold, #7C3AED
  dt(page, data.verificationFolio, bold, 14, 990, 800, C.purple);

  // QR 80×80: canvas top-left (1170, 748) → pdf y = PH - 748 - 80
  try {
    const qrImg = await makeQr(doc, data.verifyUrl);
    page.drawImage(qrImg, { x: 1170, y: PH - 748 - 80, width: 80, height: 80 });
  } catch { /* non-fatal */ }
}

export async function buildCertificatePDF(data: CertificateTemplateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  await buildPage1(doc, data, bold, regular);
  await buildPage2(doc, data, bold, regular);

  return doc.save();
}
