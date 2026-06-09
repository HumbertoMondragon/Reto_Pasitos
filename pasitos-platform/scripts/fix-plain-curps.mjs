/**
 * One-time script: encrypts any StudentProfile CURPs that are still in plain text.
 * Safe to re-run — skips records that are already in encrypted format (iv:tag:data).
 */
import { createCipheriv, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function encryptField(text) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function isAlreadyEncrypted(value) {
  return value.split(":").length === 3;
}

async function main() {
  const profiles = await prisma.studentProfile.findMany({ select: { id: true, curp: true } });
  let fixed = 0;

  for (const p of profiles) {
    if (isAlreadyEncrypted(p.curp)) continue;

    const encrypted = encryptField(p.curp.toUpperCase());
    await prisma.studentProfile.update({ where: { id: p.id }, data: { curp: encrypted } });
    console.log(`  ✓ Cifrado: ${p.curp.slice(0, 4)}************`);
    fixed++;
  }

  console.log(`\nListo. ${fixed} CURP(s) cifradas, ${profiles.length - fixed} ya estaban cifradas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
