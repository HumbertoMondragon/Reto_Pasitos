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
  rsaSignature?: string;
  cadenaOriginal?: string;
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

function splitAt(str: string, n: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += n) chunks.push(str.slice(i, i + n));
  return chunks;
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

  // No. certificado: x=1148, y=97, size=17, bold, #6B21A8, center, boxW=140
  dt(page, data.certificateNumber, bold, 17, 1148, 97, C.purple_dark, "center");

  // Fecha emisión: x=1148, y=163, size=14, #374151, center — debajo del ícono de calendario
  dt(page, fmtDate(data.issueDate), regular, 14, 1168, 163, C.gray_dark, "center");

  // Nombre alumno: x=640, y=340, size=52, bold, #111827, center
  dt(page, data.studentName.toUpperCase(), bold, 52, 640, 340, C.gray_deeper, "center");

  // CURP: solo valor (etiqueta ya impresa en plantilla), x=640, y=392, size=15, center
  dt(page, data.curp, regular, 15, 656, 378, C.gray_dark, "center");

  // Nombre curso: x=640, y=490, size=46, bold, #7C3AED, center, MAYÚSCULAS
  dt(page, data.courseName.toUpperCase(), bold, 46, 640, 490, C.purple, "center");

  // Folio: x=1105, y=695, size=15, bold, #7C3AED, center
  dt(page, data.verificationFolio, bold, 15, 1105, 695, C.purple, "center");

  // QR 72×72: canvas top-left (1063, 705) → pdf bottom-left y = PH - 705 - 72
  try {
    const qrImg = await makeQr(doc, data.verifyUrl);
    page.drawImage(qrImg, { x: 1063, y: PH - 455 - 72, width: 72, height: 72 });
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

  // Fecha emisión: x=1148, y=128, size=12, #374151, center — debajo del ícono de calendario
  dt(page, fmtDate(data.issueDate), regular, 12, 1148, 128, C.gray_dark, "center");

  // Nombre: x=268, y=188, size=14, bold, #111827, maxWidth=290
  dt(page, truncate(data.studentName, bold, 14, 290), bold, 14, 268, 188, C.gray_deeper);

  // CURP: x=580, y=183, size=14, #374151, maxWidth=240
  dt(page, truncate(data.curp, regular, 14, 240), regular, 14, 580, 183, C.gray_dark);

  // Programa: x=860, y=191, size=15, #374151
  dt(page, truncate(data.courseName, regular, 15, 360), regular, 15, 860, 191, C.gray_dark);

  // Período: x=268, y=253, size=11, #374151
  dt(page, period, regular, 11, 268, 253, C.gray_dark);

  // Duración: x=556, y=253, size=14, #374151
  dt(page, `${data.courseHours} horas`, regular, 14, 588, 253, C.gray_dark);

  // Modalidad: x=860, y=256, size=14, #374151
  if (data.modality) {
    dt(page, data.modality, regular, 14, 860, 256, C.gray_dark);
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

  // ── Footer ────────────────────────────────────────────────────────────────
  // Calificación final
  dt(page, Number(data.score).toFixed(1), bold, 40, 200, 672, C.purple, "center");

  // "/10"
  dt(page, "/10", regular, 24, 242, 672, C.gray_mid);

  // "ACREDITADO"
  dt(page, "ACREDITADO", bold, 16, 200, 694, C.green, "center");

  // Observaciones con wrap
  if (data.observations) {
    const lines = wrapText(data.observations, regular, 14, 320);
    lines.slice(0, 3).forEach((line, i) => {
      dt(page, line, regular, 14, 412, 664 + i * 17, C.gray_dark);
    });
  }

  // Folio
  dt(page, data.verificationFolio, bold, 14, 914, 700, C.purple);

  // QR 76×76
  try {
    const qrImg = await makeQr(doc, data.verifyUrl);
    page.drawImage(qrImg, { x: 1092, y: PH - 644 - 76, width: 76, height: 76 });
  } catch { /* non-fatal */ }

  // ── Sello Digital RSA (estilo SAT) ────────────────────────────────────────
  if (data.rsaSignature && data.cadenaOriginal) {
    const sepCanvasY = 756;   // 728 + 28 (1 cm abajo)
    const xBase     = 68;    // 40  + 28 (1 cm a la derecha)
    const xContent  = 78;    // 50  + 28

    page.drawLine({
      start: { x: xBase, y: PH - sepCanvasY },
      end:   { x: PW - 40, y: PH - sepCanvasY },
      thickness: 0.4,
      color: C.gray_mid,
    });

    const sz = 7.5;
    const lh = 10;
    let cy = sepCanvasY + 9;

    dt(page, "Sello Digital — Pasitos Education & Health A.C.", bold, 8, xBase, cy, C.gray_mid);
    cy += lh + 1;

    dt(page, "Cadena original:", bold, sz, xBase, cy, C.gray_mid);
    cy += lh;
    for (const chunk of splitAt(data.cadenaOriginal, 175)) {
      dt(page, chunk, regular, sz, xContent, cy, C.gray_mid);
      cy += lh;
    }

    dt(page, "Sello digital (RSA-SHA256):", bold, sz, xBase, cy, C.gray_mid);
    cy += lh;
    for (const chunk of splitAt(data.rsaSignature, 175)) {
      dt(page, chunk, regular, sz, xContent, cy, C.gray_mid);
      cy += lh;
    }
  }
}

export async function buildCertificatePDF(data: CertificateTemplateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  await buildPage1(doc, data, bold, regular);
  await buildPage2(doc, data, bold, regular);

  return doc.save();
}
