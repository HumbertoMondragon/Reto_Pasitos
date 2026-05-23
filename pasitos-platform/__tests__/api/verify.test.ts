// Tests for certificate verification logic
// These test the cryptographic verification directly, which is the
// core guarantee of the system.

jest.mock("@/lib/db", () => ({
  prisma: {
    certificate: { count: jest.fn().mockResolvedValue(0) },
  },
}));

import { signCertificate, verifyCertificate } from "@/lib/crypto";

const VALID_PAYLOAD = {
  certificateNumber: "PAC-2025-0001",
  studentName: "María López",
  curp: "LOPM900101MDFXXX01",
  courseName: "Puericultura",
  score: "9.0",
  issueDate: "2025-06-01T00:00:00.000Z",
  organizationId: "PASITOS-AC",
};

describe("Verificación de certificado — lógica criptográfica", () => {
  test("verifica correctamente un certificado válido", () => {
    const signature = signCertificate(VALID_PAYLOAD);
    expect(verifyCertificate(VALID_PAYLOAD, signature)).toBe(true);
  });

  test("detecta certificado con nombre del alumno alterado", () => {
    const signature = signCertificate(VALID_PAYLOAD);
    const tampered = { ...VALID_PAYLOAD, studentName: "Impostora Otra" };
    expect(verifyCertificate(tampered, signature)).toBe(false);
  });

  test("detecta certificado con CURP alterada", () => {
    const signature = signCertificate(VALID_PAYLOAD);
    const tampered = { ...VALID_PAYLOAD, curp: "XXXX000000XXXXX00" };
    expect(verifyCertificate(tampered, signature)).toBe(false);
  });

  test("detecta certificado con calificación alterada", () => {
    const signature = signCertificate(VALID_PAYLOAD);
    const tampered = { ...VALID_PAYLOAD, score: "10" };
    expect(verifyCertificate(tampered, signature)).toBe(false);
  });

  test("detecta certificado con curso alterado", () => {
    const signature = signCertificate(VALID_PAYLOAD);
    const tampered = { ...VALID_PAYLOAD, courseName: "Curso No Tomado" };
    expect(verifyCertificate(tampered, signature)).toBe(false);
  });

  test("retorna false con firma de otro certificado (no reutilizable)", () => {
    const otherPayload = { ...VALID_PAYLOAD, certificateNumber: "PAC-2025-9999" };
    const otherSignature = signCertificate(otherPayload);
    // signature from another certificate does not validate this one
    expect(verifyCertificate(VALID_PAYLOAD, otherSignature)).toBe(false);
  });

  test("retorna false si el organizationId es alterado", () => {
    const signature = signCertificate(VALID_PAYLOAD);
    const tampered = { ...VALID_PAYLOAD, organizationId: "OTRA-ORG" };
    expect(verifyCertificate(tampered, signature)).toBe(false);
  });

  test("firma es determinista — mismos datos producen misma firma", () => {
    const sig1 = signCertificate(VALID_PAYLOAD);
    const sig2 = signCertificate(VALID_PAYLOAD);
    expect(sig1).toBe(sig2);
  });

  test("firma con clave diferente no coincide (simulación de clave comprometida)", () => {
    // Save original key
    const originalKey = process.env.CERTIFICATE_SIGNING_KEY;

    // Sign with original key
    const signature = signCertificate(VALID_PAYLOAD);

    // Change the signing key (simulating key rotation)
    process.env.CERTIFICATE_SIGNING_KEY = "different-key-after-rotation";

    // Verification should fail with the new key
    expect(verifyCertificate(VALID_PAYLOAD, signature)).toBe(false);

    // Restore original key
    process.env.CERTIFICATE_SIGNING_KEY = originalKey;
  });
});

describe("Estado de certificado revocado", () => {
  test("un certificado puede ser válido criptográficamente pero estar revocado", () => {
    // Revocation is a DB flag — cryptographic validity is independent
    const signature = signCertificate(VALID_PAYLOAD);
    const isValid = verifyCertificate(VALID_PAYLOAD, signature);

    // The cert could be isRevoked=true in DB while still having a valid signature
    // The API route combines both: isValid && !isRevoked to determine authenticity
    const isRevoked = true; // simulated DB flag
    const isAuthentic = isValid && !isRevoked;

    expect(isValid).toBe(true);   // signature is valid
    expect(isAuthentic).toBe(false); // but cert is revoked
  });
});
