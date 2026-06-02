import { prisma } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const curp = searchParams.get("curp")?.trim().toUpperCase() ?? "";

  if (curp.length !== 18) {
    return NextResponse.json({ error: "La CURP debe tener exactamente 18 caracteres" }, { status: 400 });
  }

  // Fetch all profiles with their certificates
  const profiles = await prisma.studentProfile.findMany({
    select: {
      id: true,
      curp: true,
      fullName: true,
      enrollments: {
        select: {
          course: { select: { name: true, courseCode: true } },
          certificate: {
            select: {
              certificateNumber: true,
              verificationFolio: true,
              issueDate: true,
              pdfPath: true,
              isRevoked: true,
            },
          },
        },
      },
    },
  });

  // Decrypt each CURP and compare (AES-GCM is non-deterministic so we must compare decrypted)
  let match: typeof profiles[number] | null = null;
  for (const p of profiles) {
    try {
      if (decryptField(p.curp) === curp) { match = p; break; }
    } catch { /* plain-text or corrupted — skip */ }
  }

  if (!match) {
    return NextResponse.json({ found: false });
  }

  const certificates = match.enrollments
    .filter((e) => e.certificate !== null)
    .map((e) => ({
      certificateNumber: e.certificate!.certificateNumber,
      verificationFolio: e.certificate!.verificationFolio,
      courseName: e.course.name,
      courseCode: e.course.courseCode,
      issueDate: e.certificate!.issueDate,
      pdfPath: e.certificate!.pdfPath,
      isRevoked: e.certificate!.isRevoked,
    }));

  return NextResponse.json({ found: true, studentName: match.fullName, certificates });
}
