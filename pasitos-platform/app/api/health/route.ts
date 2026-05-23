import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "DIRECT_DATABASE_URL",
  "NEXTAUTH_SECRET",
  "CERTIFICATE_SIGNING_KEY",
  "ENCRYPTION_KEY",
];

export async function GET() {
  const start = Date.now();

  // Check environment variables
  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

  // Check database connectivity
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs: number | null = null;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
  }

  const healthy = dbStatus === "ok" && missingEnv.length === 0;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - start,
      db: { status: dbStatus, latencyMs: dbLatencyMs },
      env: {
        status: missingEnv.length === 0 ? "ok" : "missing",
        missing: missingEnv,
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
