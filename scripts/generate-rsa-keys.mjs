import { generateKeyPairSync } from "crypto";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding:  { type: "spki",  format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

// Flatten PEM to single line for .env (replace real newlines with \n literal)
const flatPrivate = privateKey.trim().replace(/\n/g, "\\n");
const flatPublic  = publicKey.trim().replace(/\n/g, "\\n");

console.log("Copia estas dos líneas en tu .env:\n");
console.log(`RSA_PRIVATE_KEY="${flatPrivate}"`);
console.log(`RSA_PUBLIC_KEY="${flatPublic}"`);
