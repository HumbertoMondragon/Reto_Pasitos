/**
 * Certificate PDF template for Pasitos Education & Health A.C.
 *
 * Design tokens:
 *   DARK_BLUE  rgb(0, 0.20, 0.42)   — borders, headings, course name
 *   GOLD       rgb(0.78, 0.59, 0.07) — accent lines, info box border
 *   DARK_GRAY  rgb(0.30, 0.30, 0.30) — secondary text
 *   WHITE      rgb(1, 1, 1)
 *
 * Fonts (standard pdf-lib, no embedding required):
 *   Helvetica-Bold    — titles, student name, cert number
 *   Helvetica         — body text, labels
 *   Helvetica-Oblique — "Se hace constar que:" tagline
 *
 * Page: Letter landscape 792 × 612 pts
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// ── Design tokens ────────────────────────────────────────────────────────────
export const COLORS = {
  DARK_BLUE: rgb(0, 0.20, 0.42),
  GOLD:      rgb(0.78, 0.59, 0.07),
  DARK_GRAY: rgb(0.30, 0.30, 0.30),
  MID_GRAY:  rgb(0.55, 0.55, 0.55),
  LIGHT_BG:  rgb(0.96, 0.96, 0.98),
  BLACK:     rgb(0, 0, 0),
  WHITE:     rgb(1, 1, 1),
};

export const FONTS = {
  TITLE:   "Helvetica-Bold",
  BODY:    "Helvetica",
  ITALIC:  "Helvetica-Oblique",
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
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

function cx(page: ReturnType<PDFDocument["addPage"]>, font: import("pdf-lib").PDFFont, text: string, size: number, y: number, color: import("pdf-lib").Color, pageWidth: number) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (pageWidth - w) / 2, y, size, font, color });
}

/** Builds the certificate PDF and returns the raw bytes. Does not write to disk. */
export async function buildCertificatePDF(data: CertificateTemplateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Letter landscape: 792 × 612 pts
  const page = doc.addPage([792, 612]);
  const W = 792;
  const H = 612;

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const italic  = await doc.embedFont(StandardFonts.HelveticaOblique);

  // ── Background ─────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COLORS.WHITE });

  // ── Outer border — dark blue, 8 pts ────────────────────────────────────────
  page.drawRectangle({
    x: 4, y: 4, width: W - 8, height: H - 8,
    borderColor: COLORS.DARK_BLUE, borderWidth: 8,
    color: COLORS.WHITE,
  });

  // ── Inner border — gold, 1.5 pts ───────────────────────────────────────────
  page.drawRectangle({
    x: 16, y: 16, width: W - 32, height: H - 32,
    borderColor: COLORS.GOLD, borderWidth: 1.5,
    color: COLORS.WHITE,
  });

  // ── Header band ────────────────────────────────────────────────────────────
  const headerH = 82;
  page.drawRectangle({ x: 8, y: H - headerH - 8, width: W - 16, height: headerH, color: COLORS.DARK_BLUE });

  // Logo — if public/logo-pasitos.png exists, embed it on the left of the header
  const logoPath = path.join(process.cwd(), "public", "logo-pasitos.png");
  let logoEmbedded = false;
  if (existsSync(logoPath)) {
    try {
      const logoBytes = await readFile(logoPath);
      const logoImg = await doc.embedPng(logoBytes);
      const logoH = 56;
      const logoW = (logoImg.width / logoImg.height) * logoH;
      page.drawImage(logoImg, { x: 28, y: H - headerH + 8, width: logoW, height: logoH });
      logoEmbedded = true;
    } catch {
      // logo load failed — fall through to text-only header
    }
  }

  // Organization name — centered, or offset right if logo present
  const orgText = "PASITOS EDUCATION & HEALTH A.C.";
  const orgSize = 17;
  const orgW = bold.widthOfTextAtSize(orgText, orgSize);
  const orgX = logoEmbedded ? (W - orgW) / 2 + 20 : (W - orgW) / 2;
  page.drawText(orgText, { x: orgX, y: H - 54, size: orgSize, font: bold, color: COLORS.WHITE });

  const tagLine = "Capacitación y Certificación Profesional";
  const tagW = regular.widthOfTextAtSize(tagLine, 9.5);
  const tagX = logoEmbedded ? (W - tagW) / 2 + 20 : (W - tagW) / 2;
  page.drawText(tagLine, { x: tagX, y: H - 70, size: 9.5, font: regular, color: COLORS.GOLD });

  // ── Main title ─────────────────────────────────────────────────────────────
  const titleY = H - 126;
  cx(page, bold, "CONSTANCIA DE CAPACITACIÓN", 22, titleY, COLORS.DARK_BLUE, W);

  // Gold rule under title
  page.drawLine({ start: { x: 100, y: titleY - 8 }, end: { x: W - 100, y: titleY - 8 }, thickness: 1.2, color: COLORS.GOLD });

  // ── Body copy ──────────────────────────────────────────────────────────────
  cx(page, italic, "Se hace constar que:", 11, H - 162, COLORS.DARK_GRAY, W);

  // Student name
  cx(page, bold, data.studentName.toUpperCase(), 20, H - 192, COLORS.DARK_BLUE, W);
  page.drawLine({ start: { x: 130, y: H - 199 }, end: { x: W - 130, y: H - 199 }, thickness: 0.8, color: COLORS.GOLD });

  // CURP
  cx(page, regular, `CURP: ${data.curp}`, 9.5, H - 214, COLORS.MID_GRAY, W);

  cx(page, regular, "Ha completado satisfactoriamente el curso de:", 10.5, H - 240, COLORS.BLACK, W);

  // Course name
  cx(page, bold, data.courseName, 15, H - 262, COLORS.DARK_BLUE, W);

  // Course details
  const details = `${data.courseHours} horas  ·  Del ${fmtDate(data.startDate)} al ${fmtDate(data.endDate)}  ·  Calificación: ${data.score.toFixed(1)}`;
  cx(page, regular, details, 9.5, H - 284, COLORS.DARK_GRAY, W);

  // ── Thin separator above bottom section ────────────────────────────────────
  page.drawLine({ start: { x: 26, y: 148 }, end: { x: W - 26, y: 148 }, thickness: 0.5, color: COLORS.GOLD });

  // ── Bottom section — 3 columns ─────────────────────────────────────────────
  const bottomY = 128;

  // Left — signature block
  page.drawLine({ start: { x: 48, y: bottomY }, end: { x: 216, y: bottomY }, thickness: 0.8, color: COLORS.BLACK });
  const dirLabel = "Directora General";
  const dirW = regular.widthOfTextAtSize(dirLabel, 9.5);
  page.drawText(dirLabel, { x: 48 + (168 - dirW) / 2, y: bottomY - 14, size: 9.5, font: bold, color: COLORS.BLACK });
  const orgSig = "Pasitos Education & Health A.C.";
  const orgSigW = regular.widthOfTextAtSize(orgSig, 8.5);
  page.drawText(orgSig, { x: 48 + (168 - orgSigW) / 2, y: bottomY - 27, size: 8.5, font: regular, color: COLORS.DARK_GRAY });

  // Center — QR code
  try {
    const qrBuf = await QRCode.toBuffer(data.verifyUrl, {
      type: "png",
      width: 140,
      margin: 1,
      color: { dark: "#001433", light: "#ffffff" },
    });
    const qrImg = await doc.embedPng(qrBuf);
    const qrSz = 86;
    const qrX = (W - qrSz) / 2;
    const qrY = bottomY - qrSz + 6;
    page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSz, height: qrSz });
    const qrLabel = "Escanea para verificar";
    const qrLabelW = regular.widthOfTextAtSize(qrLabel, 7.5);
    page.drawText(qrLabel, { x: (W - qrLabelW) / 2, y: qrY - 12, size: 7.5, font: regular, color: COLORS.MID_GRAY });
  } catch {
    // QR failure is non-fatal
  }

  // Right — info box
  const infoX = W - 232;
  const infoW = 202;
  page.drawRectangle({ x: infoX, y: bottomY - 86, width: infoW, height: 86, color: COLORS.LIGHT_BG, borderColor: COLORS.GOLD, borderWidth: 1 });
  const infoLines = [
    { label: "No. Certificado:", value: data.certificateNumber },
    { label: "Folio verificación:", value: data.verificationFolio },
    { label: "Fecha de emisión:", value: fmtDate(data.issueDate) },
  ];
  infoLines.forEach(({ label, value }, i) => {
    const lineY = bottomY - 18 - i * 24;
    page.drawText(label, { x: infoX + 10, y: lineY, size: 8, font: bold, color: COLORS.DARK_BLUE });
    page.drawText(value, { x: infoX + 10, y: lineY - 11, size: 8.5, font: regular, color: COLORS.BLACK });
  });

  // ── Footer ─────────────────────────────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pasitos.org";
  const footerText = `Verifica la autenticidad de este documento en: ${baseUrl}/verify`;
  cx(page, regular, footerText, 7.5, 36, COLORS.DARK_GRAY, W);

  const hashText = `Firma digital SHA-256: ${data.digitalSignatureHash.slice(0, 32)}…`;
  cx(page, regular, hashText, 6.5, 25, COLORS.MID_GRAY, W);

  return doc.save();
}
