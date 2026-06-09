// Set required env vars for all tests
process.env.ENCRYPTION_KEY = "0".repeat(64); // 32 bytes of zeros
process.env.CERTIFICATE_SIGNING_KEY = "test-signing-key-for-unit-tests-only";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
