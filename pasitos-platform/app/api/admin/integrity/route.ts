import { requireRole, ok, err } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { verifyCertificate } from "@/lib/crypto";

export async function GET(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const certificates = await prisma.certificate.findMany({
    select: {
      id: true,
      certificateNumber: true,
      signaturePayload: true,
      digitalSignature: true,
      isRevoked: true,
    },
  });

  let valid = 0;
  let invalid = 0;
  let revoked = 0;
  const invalidList: { id: string; certificateNumber: string }[] = [];

  for (const cert of certificates) {
    if (cert.isRevoked) { revoked++; continue; }

    try {
      const payload = JSON.parse(cert.signaturePayload);
      if (verifyCertificate(payload, cert.digitalSignature)) {
        valid++;
      } else {
        invalid++;
        invalidList.push({ id: cert.id, certificateNumber: cert.certificateNumber });
      }
    } catch {
      invalid++;
      invalidList.push({ id: cert.id, certificateNumber: cert.certificateNumber });
    }
  }

  return ok({ total: certificates.length, valid, invalid, revoked, invalidList });
}
