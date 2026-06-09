// Mock all external dependencies before any imports
jest.mock("@/lib/db", () => ({
  prisma: {
    enrollment: { findUnique: jest.fn(), update: jest.fn() },
    certificate: { create: jest.fn(), update: jest.fn(), count: jest.fn() },
  },
}));

jest.mock("@/lib/certificates/pdf-generator", () => ({
  generateCertificatePDF: jest.fn().mockResolvedValue("/certificates/PAC-2025-0001.pdf"),
}));

jest.mock("@/lib/email/sender", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/email/templates", () => ({
  certificateIssuedEmail: jest.fn().mockReturnValue({ subject: "Test", html: "<p>Test</p>" }),
}));

jest.mock("@/lib/api/helpers", () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

import { issueCertificate } from "@/lib/certificates/signer";
import { prisma } from "@/lib/db";
import { EnrollmentResult } from "@prisma/client";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const mockEnrollmentBase = {
  id: "enrollment-1",
  studentProfileId: "profile-1",
  courseId: "course-1",
  module: "Módulo 1",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-03-31"),
  score: { toString: () => "9.5" } as unknown as import("@prisma/client").Prisma.Decimal,
  result: EnrollmentResult.PASSED,
  observations: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  modality: null,
  certificate: null,
  modules: [],
  studentProfile: {
    id: "profile-1",
    userId: "user-1",
    fullName: "Ana García",
    curp: "mock-encrypted-curp",
    birthDate: null,
    educationLevel: "BACHELOR" as const,
    email: "ana@example.com",
    institution: null,
    jobTitle: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  course: {
    id: "course-1",
    courseCode: "C-001",
    name: "Puericultura",
    courseType: "Capacitación",
    format: null,
    durationHours: 80,
    modality: "Presencial",
    description: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// decryptField mock must handle the encrypted CURP value
jest.mock("@/lib/crypto", () => ({
  ...jest.requireActual("@/lib/crypto"),
  decryptField: jest.fn().mockReturnValue("GARA900101MDFRCN01"),
  generateCertificateNumber: jest.fn().mockResolvedValue("PAC-2025-0001"),
  generateVerificationFolio: jest.fn().mockReturnValue("VER-ABCD1234"),
  buildCadenaOriginal: jest.fn().mockReturnValue("||PAC-2025-0001|Ana García|GARA...|Puericultura|9.5|2025-01-01|PASITOS-AC||"),
  signCertificateRSA: jest.fn().mockReturnValue("mock-rsa-signature"),
}));

describe("issueCertificate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.certificate.create as jest.Mock).mockResolvedValue({
      id: "cert-1",
      enrollmentId: "enrollment-1",
      certificateNumber: "PAC-2025-0001",
      verificationFolio: "VER-ABCD1234",
      issueDate: new Date(),
      digitalSignature: "mocksignature",
      signaturePayload: "{}",
      pdfPath: null,
      isRevoked: false,
      revokedAt: null,
      revokedReason: null,
      createdAt: new Date(),
    });
    (mockPrisma.certificate.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.enrollment.update as jest.Mock).mockResolvedValue({});
  });

  test("lanza error si la inscripción no existe", async () => {
    (mockPrisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(issueCertificate("nonexistent", "user-1")).rejects.toThrow("Inscripción no encontrada");
  });

  test("emite certificado aunque el resultado sea FAILED (sin módulos)", async () => {
    (mockPrisma.enrollment.findUnique as jest.Mock).mockResolvedValue({
      ...mockEnrollmentBase,
      result: EnrollmentResult.FAILED,
    });
    (mockPrisma.enrollment.update as jest.Mock).mockResolvedValue({});
    const result = await issueCertificate("enrollment-1", "user-1");
    expect(result.certificateNumber).toBeDefined();
  });

  test("lanza error si ya existe un certificado para la inscripción", async () => {
    (mockPrisma.enrollment.findUnique as jest.Mock).mockResolvedValue({
      ...mockEnrollmentBase,
      certificate: { id: "existing-cert" },
    });
    await expect(issueCertificate("enrollment-1", "user-1")).rejects.toThrow(
      "Ya existe un certificado"
    );
  });

  test("genera certificado y retorna el número en formato PAC-YYYY-XXXX", async () => {
    (mockPrisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollmentBase);

    const result = await issueCertificate("enrollment-1", "user-1");

    expect(result.certificateNumber).toMatch(/^PAC-\d{4}-\d{4}$/);
    expect(mockPrisma.certificate.create).toHaveBeenCalledTimes(1);
  });

  test("incluye verificationFolio con formato VER-XXXXXXXX", async () => {
    (mockPrisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollmentBase);

    const result = await issueCertificate("enrollment-1", "user-1");

    expect(result.verificationFolio).toMatch(/^VER-[0-9A-F]{8}$/);
  });

  test("no interrumpe el flujo si la generación de PDF falla", async () => {
    (mockPrisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollmentBase);
    const { generateCertificatePDF } = jest.requireMock("@/lib/certificates/pdf-generator");
    generateCertificatePDF.mockRejectedValueOnce(new Error("PDF error"));

    // Should not throw
    await expect(issueCertificate("enrollment-1", "user-1")).resolves.toBeDefined();
  });

  test("no interrumpe el flujo si el envío de email falla", async () => {
    (mockPrisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollmentBase);
    const { sendEmail } = jest.requireMock("@/lib/email/sender");
    sendEmail.mockRejectedValueOnce(new Error("SMTP error"));

    await expect(issueCertificate("enrollment-1", "user-1")).resolves.toBeDefined();
  });
});
