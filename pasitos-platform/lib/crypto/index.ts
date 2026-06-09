import { createCipheriv, createDecipheriv, createHmac, createSign, createVerify, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY is not set");
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  return buf;
}

function getSigningKey(): string {
  const key = process.env.CERTIFICATE_SIGNING_KEY;
  if (!key) throw new Error("CERTIFICATE_SIGNING_KEY is not set");
  return key;
}

export function encryptField(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:encrypted — all hex
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptField(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const [ivHex, authTagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export function signCertificate(payload: object): string {
  const key = getSigningKey();
  const data = JSON.stringify(payload, Object.keys(payload).sort());
  return createHmac("sha256", key).update(data).digest("hex");
}

export function verifyCertificate(payload: object, signature: string): boolean {
  try {
    const expected = signCertificate(payload);
    // Constant-time comparison to prevent timing attacks
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

// ── RSA-SHA256 (sello digital SAT-style) ─────────────────────────────────────

export interface CadenaOriginalPayload {
  certificateNumber: string;
  studentName: string;
  curp: string;
  courseName: string;
  score: string;
  issueDate: string;
  organizationId: string;
}

export function buildCadenaOriginal(p: CadenaOriginalPayload): string {
  return `||${p.certificateNumber}|${p.studentName}|${p.curp}|${p.courseName}|${p.score}|${p.issueDate}|${p.organizationId}||`;
}

function getRsaPrivateKey(): string {
  const raw = process.env.RSA_PRIVATE_KEY;
  if (!raw) throw new Error("RSA_PRIVATE_KEY is not set");
  return raw.replace(/\\n/g, "\n");
}

function getRsaPublicKey(): string {
  const raw = process.env.RSA_PUBLIC_KEY;
  if (!raw) throw new Error("RSA_PUBLIC_KEY is not set");
  return raw.replace(/\\n/g, "\n");
}

export function signCertificateRSA(cadenaOriginal: string): string {
  const sign = createSign("RSA-SHA256");
  sign.update(cadenaOriginal, "utf8");
  return sign.sign(getRsaPrivateKey(), "base64");
}

export function verifyCertificateRSA(cadenaOriginal: string, signature: string): boolean {
  try {
    const verify = createVerify("RSA-SHA256");
    verify.update(cadenaOriginal, "utf8");
    return verify.verify(getRsaPublicKey(), signature, "base64");
  } catch {
    return false;
  }
}

export async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  // Count existing certificates for this year to get next sequence
  const prefix = `PAC-${year}-`;
  const count = await prisma.certificate.count({
    where: { certificateNumber: { startsWith: prefix } },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}${seq}`;
}

export function generateVerificationFolio(): string {
  return `VER-${randomBytes(4).toString("hex").toUpperCase()}`;
}
