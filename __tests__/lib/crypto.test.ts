// Mock @/lib/db since crypto/index.ts imports prisma at module level
jest.mock("@/lib/db", () => ({
  prisma: {
    certificate: {
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

import {
  encryptField,
  decryptField,
  signCertificate,
  verifyCertificate,
  generateCertificateNumber,
  generateVerificationFolio,
} from "@/lib/crypto";
import { prisma } from "@/lib/db";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("signCertificate / verifyCertificate", () => {
  const payload = {
    certificateNumber: "PAC-2025-0001",
    studentName: "Ana García",
    curp: "GARA900101MDFRCN01",
    courseName: "Puericultura",
    score: "9.5",
    issueDate: "2025-06-01T00:00:00.000Z",
    organizationId: "PASITOS-AC",
  };

  test("signCertificate genera firma consistente para el mismo payload", () => {
    const sig1 = signCertificate(payload);
    const sig2 = signCertificate(payload);
    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex = 64 chars
  });

  test("verifyCertificate retorna true para firma válida", () => {
    const signature = signCertificate(payload);
    expect(verifyCertificate(payload, signature)).toBe(true);
  });

  test("verifyCertificate retorna false si se altera studentName", () => {
    const signature = signCertificate(payload);
    const tampered = { ...payload, studentName: "Otro Nombre" };
    expect(verifyCertificate(tampered, signature)).toBe(false);
  });

  test("verifyCertificate retorna false si se altera courseName", () => {
    const signature = signCertificate(payload);
    const tampered = { ...payload, courseName: "Curso Falso" };
    expect(verifyCertificate(tampered, signature)).toBe(false);
  });

  test("verifyCertificate retorna false si se altera score", () => {
    const signature = signCertificate(payload);
    const tampered = { ...payload, score: "10" };
    expect(verifyCertificate(tampered, signature)).toBe(false);
  });

  test("verifyCertificate retorna false con firma incorrecta", () => {
    const badSignature = "a".repeat(64);
    expect(verifyCertificate(payload, badSignature)).toBe(false);
  });

  test("verifyCertificate retorna false con firma vacía", () => {
    expect(verifyCertificate(payload, "")).toBe(false);
  });
});

describe("encryptField / decryptField", () => {
  test("encryptField → decryptField recupera el valor original", () => {
    const original = "GARA900101MDFRCN01";
    const encrypted = encryptField(original);
    expect(decryptField(encrypted)).toBe(original);
  });

  test("encryptField produce valores diferentes para el mismo input (IV aleatorio)", () => {
    const text = "GARA900101MDFRCN01";
    const enc1 = encryptField(text);
    const enc2 = encryptField(text);
    expect(enc1).not.toBe(enc2); // different IVs
    // But both decrypt to the same value
    expect(decryptField(enc1)).toBe(text);
    expect(decryptField(enc2)).toBe(text);
  });

  test("campos diferentes producen cifrados diferentes", () => {
    const enc1 = encryptField("AAAA900101HDFXXX01");
    const enc2 = encryptField("BBBB900101HDFYYY02");
    expect(enc1).not.toBe(enc2);
  });

  test("decryptField lanza error si el formato es inválido", () => {
    expect(() => decryptField("not-valid-encrypted")).toThrow();
  });
});

describe("generateCertificateNumber", () => {
  test("retorna formato PAC-YYYY-XXXX con el año actual", async () => {
    (mockPrisma.certificate.count as jest.Mock).mockResolvedValue(0);
    const certNumber = await generateCertificateNumber();
    const year = new Date().getFullYear();
    expect(certNumber).toMatch(new RegExp(`^PAC-${year}-\\d{4}$`));
  });

  test("incrementa la secuencia basándose en el conteo de certificados", async () => {
    (mockPrisma.certificate.count as jest.Mock).mockResolvedValue(5);
    const certNumber = await generateCertificateNumber();
    const year = new Date().getFullYear();
    expect(certNumber).toBe(`PAC-${year}-0006`);
  });
});

describe("generateVerificationFolio", () => {
  test("retorna formato VER-XXXXXXXX", () => {
    const folio = generateVerificationFolio();
    expect(folio).toMatch(/^VER-[0-9A-F]{8}$/);
  });

  test("genera folios únicos en cada llamada", () => {
    const folios = new Set(Array.from({ length: 20 }, () => generateVerificationFolio()));
    expect(folios.size).toBe(20);
  });
});
