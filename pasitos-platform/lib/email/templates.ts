export interface CertificateEmailData {
  studentName: string;
  courseName: string;
  certificateNumber: string;
  verificationFolio: string;
  verifyUrl: string;
  pdfUrl?: string;
  issueDate: Date;
}

export function certificateIssuedEmail(data: CertificateEmailData): { subject: string; html: string } {
  const subject = `Tu certificado de ${data.courseName} — Pasitos Education & Health A.C.`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0d2a52;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Pasitos Education &amp; Health A.C.</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:800;">¡Felicidades, ${data.studentName}!</h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Has obtenido tu constancia de capacitación.</p>
            </td>
          </tr>

          <!-- Course badge -->
          <tr>
            <td style="padding:28px 32px 0;text-align:center;">
              <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 24px;">
                <p style="margin:0;font-size:11px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Curso completado</p>
                <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#1e3a5f;">${data.courseName}</p>
              </div>
            </td>
          </tr>

          <!-- Certificate details -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Titular</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${data.studentName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">No. de Certificado</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;font-family:monospace;">${data.certificateNumber}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Folio de Verificación</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;font-family:monospace;">${data.verificationFolio}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Fecha de Emisión</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;">${new Date(data.issueDate).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA buttons -->
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              ${data.pdfUrl ? `
              <a href="${data.pdfUrl}" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;margin:0 6px 10px;">
                ⬇ Ver mi certificado (PDF)
              </a>
              ` : ""}
              <a href="${data.verifyUrl}" style="display:inline-block;background:#ffffff;color:#1e3a5f;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;border:2px solid #1e3a5f;margin:0 6px 10px;">
                ✓ Verificar autenticidad
              </a>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
                <p style="margin:0;font-size:12px;color:#166534;font-weight:700;">🔒 Certificado con firma digital</p>
                <p style="margin:6px 0 0;font-size:12px;color:#166534;line-height:1.5;">
                  Este certificado cuenta con firma criptográfica HMAC-SHA256. Cualquier persona puede
                  verificar su autenticidad escaneando el código QR del documento o visitando el enlace
                  de verificación. <strong>Guarda tu PDF en un lugar seguro.</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                <strong>Recomendaciones para guardar tu certificado:</strong><br/>
                • Descarga el PDF y guárdalo en la nube (Google Drive, Dropbox, etc.)<br/>
                • Comparte el folio de verificación con empleadores o instituciones<br/>
                • El código QR en el PDF lleva directamente a la verificación pública
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                Este correo fue enviado por <strong>Pasitos Education &amp; Health A.C.</strong><br/>
                <a href="mailto:contacto@pasitos.org" style="color:#1e3a5f;text-decoration:none;">contacto@pasitos.org</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
