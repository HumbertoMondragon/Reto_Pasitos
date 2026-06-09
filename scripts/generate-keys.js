#!/usr/bin/env node
/**
 * Generates secure cryptographic keys for Pasitos Platform.
 *
 * Run: node scripts/generate-keys.js
 *
 * IMPORTANT: Save these keys in a secure password manager (Bitwarden, 1Password, etc.)
 * If you lose the CERTIFICATE_SIGNING_KEY, existing certificates cannot be verified.
 */

const { randomBytes } = require("crypto");

function generate(bytes) {
  return randomBytes(bytes).toString("hex");
}

const signingKey = generate(64);   // 512-bit key for HMAC-SHA256
const encryptionKey = generate(32); // 256-bit key for AES-256-GCM
const nextauthSecret = generate(32); // 256-bit for NextAuth JWT

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║       PASITOS PLATFORM — Generador de Claves Seguras     ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

console.log("Copia estas líneas en tu archivo .env de producción:\n");
console.log("─".repeat(60));
console.log(`NEXTAUTH_SECRET=${nextauthSecret}`);
console.log(`CERTIFICATE_SIGNING_KEY=${signingKey}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log("─".repeat(60));

console.log("\n⚠  ADVERTENCIAS IMPORTANTES:");
console.log("   1. Guarda estas claves en un gestor de contraseñas ahora.");
console.log("   2. NUNCA subas estas claves a git o las compartas por email.");
console.log("   3. Si pierdes CERTIFICATE_SIGNING_KEY:");
console.log("      - Los certificados existentes NO podrán verificarse.");
console.log("      - Deberás re-firmar todos los certificados con la nueva clave.");
console.log("   4. Si CERTIFICATE_SIGNING_KEY se compromete:");
console.log("      - Genera una nueva clave y actualiza el servidor inmediatamente.");
console.log("      - Ejecuta el script de re-firma para todos los certificados.\n");
