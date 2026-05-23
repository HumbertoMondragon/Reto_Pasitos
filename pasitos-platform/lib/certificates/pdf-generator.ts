import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { buildCertificatePDF } from "./template";

export type { CertificateTemplateData as CertificateData } from "./template";

/** Generates the certificate PDF, saves it to public/certificates/, and returns the public path. */
export async function generateCertificatePDF(
  data: import("./template").CertificateTemplateData
): Promise<string> {
  const pdfBytes = await buildCertificatePDF(data);

  const dir = path.join(process.cwd(), "public", "certificates");
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const filename = `${data.certificateNumber}.pdf`;
  await writeFile(path.join(dir, filename), pdfBytes);

  return `/certificates/${filename}`;
}
