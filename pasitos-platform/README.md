# Pasitos Platform

Plataforma web de certificación digital para Pasitos Education & Health A.C. Permite gestionar estudiantes, cursos, inscripciones y emitir certificados digitales con firma criptográfica verificable públicamente via QR.

---

## Arquitectura del sistema

```
Next.js 14 (App Router, TypeScript)
├── /app/(auth)           → Login público
├── /app/(dashboard)      → Paneles por rol (Admin / Instructor / Student)
├── /app/api              → REST API protegida por roles
├── /app/verify           → Verificación pública de certificados (sin login)
└── /public/certificates  → PDFs generados

PostgreSQL + Prisma ORM
├── User                  → Cuentas del sistema (Admin, Instructor, Student)
├── StudentProfile        → Datos del participante (CURP cifrada AES-256-GCM)
├── Course                → Catálogo de cursos (C-001, C-002, C-003)
├── Enrollment            → Inscripción participante ↔ curso
├── Certificate           → Certificado con firma digital HMAC-SHA256
└── AuditLog              → Registro de todas las acciones del sistema
```

**Seguridad:**
- Autenticación: NextAuth.js v5, JWT, bcrypt para contraseñas
- Cifrado de datos sensibles: AES-256-GCM (CURP)
- Firma de certificados: HMAC-SHA256
- Rate limiting en-memoria: login (5/15 min por IP), verificación (100/hr por IP)
- Headers de seguridad: X-Frame-Options, CSP, nosniff, Referrer-Policy

---

## Requisitos previos

- Node.js 20+
- PostgreSQL 16+
- npm 10+

---

## Instalación paso a paso

```bash
# 1. Entrar al proyecto
cd pasitos-platform

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env

# 4. Editar .env con tus valores reales

# 5. Iniciar el Prisma local dev server en una terminal separada
npx prisma dev

# 6. En otra terminal, sincronizar el schema con la BD
npx prisma db push

# 7. Poblar con datos iniciales
npx prisma db seed

# 8. Iniciar el servidor de desarrollo
npm run dev
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL del Prisma local proxy (`prisma+postgres://...`) |
| `DIRECT_DATABASE_URL` | Conexión directa a PostgreSQL (`postgresql://user:pass@host/db`) |
| `NEXTAUTH_SECRET` | Clave aleatoria para JWT (mínimo 32 caracteres) |
| `NEXTAUTH_URL` | URL base de la app (ej: `http://localhost:3000`) |
| `CERTIFICATE_SIGNING_KEY` | Clave secreta para firma HMAC-SHA256 de certificados |
| `ENCRYPTION_KEY` | Clave hex 64 chars (256 bits) para cifrado AES-256-GCM |
| `NEXT_PUBLIC_BASE_URL` | URL pública de la app (se incluye en QR de certificados) |
| `SMTP_HOST` | Servidor SMTP para envío de emails |
| `SMTP_PORT` | Puerto SMTP (ej: 587) |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASSWORD` | Contraseña SMTP |

Para generar claves seguras:
```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CERTIFICATE_SIGNING_KEY
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (debe ser exactamente 64 chars hex = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Cómo correr en desarrollo

```bash
# Terminal 1 — Prisma dev server (requerido)
npx prisma dev

# Terminal 2 — Next.js
npm run dev
```

Accesos por defecto (después del seed):
- Admin: `admin@pasitos.org` / `Admin2025!`
- Instructor: `instructor@pasitos.org` / `Instructor2025!`

---

## Deploy en Railway / Vercel

### Railway (recomendado — incluye PostgreSQL)

1. Crear proyecto en Railway
2. Agregar servicio PostgreSQL → copiar `DATABASE_URL`
3. Agregar las variables de entorno en el panel de Railway
4. Conectar repositorio → Railway detecta Next.js automáticamente
5. Ejecutar el seed en la consola de Railway: `npx prisma db seed`

### Vercel + Supabase

1. Crear proyecto en Supabase → copiar connection string
2. Importar repositorio en Vercel
3. Agregar todas las variables de entorno en Vercel
4. En build command: `npx prisma generate && next build`

---

## Cómo funciona la firma digital de certificados

### Para técnicos

Cada certificado genera un **payload firmado**:

```json
{
  "certificateNumber": "PAC-2025-0001",
  "studentName": "Juan Pérez",
  "curp": "PERJ900101HDFRZN01",
  "courseName": "Puericultura",
  "score": "9.5",
  "issueDate": "2025-06-01T00:00:00.000Z",
  "organizationId": "PASITOS-AC"
}
```

Este payload se firma con HMAC-SHA256 usando la `CERTIFICATE_SIGNING_KEY`:

```
digitalSignature = HMAC-SHA256(JSON.stringify(payload), CERTIFICATE_SIGNING_KEY)
```

La firma y el payload se guardan en la BD. Al verificar el certificado, el sistema:

1. Recupera el certificado de la BD por su folio
2. Re-calcula la firma con el payload guardado
3. Compara con la firma almacenada usando **comparación de tiempo constante** (evita timing attacks)
4. Si coinciden → auténtico. Si no → alterado o inválido.

### Para no técnicos

Cuando Pasitos emite un certificado, el sistema crea una "huella digital matemática" usando una clave secreta que solo Pasitos conoce. Al escanear el QR, el sistema recalcula esa huella y la compara con la guardada. Si coincide → auténtico y sin modificaciones. Si alguien intentó cambiar cualquier dato, la huella ya no coincide.

---

## Cómo verificar manualmente un certificado

```bash
# Usando curl
curl https://tu-dominio.com/api/certificates/VER-XXXXXXXX/verify

# O visitar en el navegador:
https://tu-dominio.com/verify/VER-XXXXXXXX
```

---

## Cómo hacer backup de la CERTIFICATE_SIGNING_KEY

**CRÍTICO:** Esta clave es la base de toda la verificación del sistema.

1. Guardar en un **gestor de contraseñas** (Bitwarden, 1Password, KeePass)
2. Guardar una copia cifrada offline (pendrive en lugar seguro)
3. Nunca incluirla en repositorios de código

### ¿Qué pasa si se pierde la signing key?

Los certificados ya emitidos **no podrán verificarse automáticamente** — la verificación retornará "inválido". Los PDFs físicos siguen siendo válidos como documentos. Con los datos originales en BD, se pueden re-firmar todos los certificados con una nueva clave.

### ¿Qué pasa si la signing key se compromete?

1. Generar una nueva clave inmediatamente y actualizar la variable de entorno
2. Reiniciar la app en producción
3. Re-firmar todos los certificados existentes con la nueva clave

---

## ¿Qué garantiza el sistema?

| Garantía | Cómo se implementa |
|---|---|
| **Integridad** | Si cualquier campo del certificado es alterado en la BD, la firma HMAC no coincide |
| **Autenticidad** | Solo quien tiene la `CERTIFICATE_SIGNING_KEY` puede generar firmas válidas |
| **Trazabilidad** | Toda acción queda registrada en el AuditLog con usuario, IP y timestamp |
| **QR verificable** | El QR apunta siempre a `/verify/{folio}` en el servidor oficial de Pasitos |

Lo que el sistema **no garantiza:**
- No es firma de persona física (no usa e.firma SAT)
- No es firma notarial ni tiene valor probatorio legal formal
- Es equivalente a un sello de seguridad de organización

---

## Cómo personalizar la plantilla del certificado PDF

El PDF se genera en `lib/certificates/pdf-generator.ts`. Para ajustar el diseño, modifica ese archivo y prueba en:

```
GET /api/certificates/preview  (solo en desarrollo o para ADMIN)
```

Para agregar el logo de Pasitos: colocar `public/logo-pasitos.png` y será incluido automáticamente.

---

## Backup y restore de la base de datos

```bash
# Backup
pg_dump $DIRECT_DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup-20250601.sql.gz | psql $DIRECT_DATABASE_URL
```
