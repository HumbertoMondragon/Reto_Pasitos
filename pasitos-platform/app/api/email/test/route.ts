import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sender";
import { certificateIssuedEmail } from "@/lib/email/templates";

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Solo disponible en desarrollo" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");
  if (!to) return NextResponse.json({ error: "Parámetro requerido: to" }, { status: 400 });

  const { subject, html } = certificateIssuedEmail({
    studentName: "María González López",
    courseName: "Puericultura",
    certificateNumber: "PAC-2025-0001",
    verificationFolio: "VER-A1B2C3D4",
    verifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/verify/VER-A1B2C3D4`,
    pdfUrl: undefined,
    issueDate: new Date(),
  });

  const sent = await sendEmail(to, subject, html);
  return NextResponse.json({ sent, to, subject });
}
