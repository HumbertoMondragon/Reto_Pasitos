# Pasitos Platform
### Sistema de Gestión de Cursos y Certificados Digitales

Plataforma web desarrollada a medida para **Pasitos Education & Health A.C.** que digitaliza y automatiza el ciclo completo de formación: registro de alumnos, inscripciones por módulos, emisión de certificados y verificación pública de autenticidad.

---

## El diferenciador: sello digital igual al del SAT

Cada certificado lleva impreso un **sello digital RSA-2048** — el mismo mecanismo criptográfico que usa el SAT de México en sus Comprobantes Fiscales Digitales (CFDI). Esto significa que cualquier empleador o institución puede escanear el QR del certificado y verificar en segundos que es auténtico, sin llamar a Pasitos, sin correos, sin intermediarios.

```
──────────────────────────────────────────────────────────────────────
Sello Digital — Pasitos Education & Health A.C.
Cadena original: ||PAC-2026-0001|María González|GOLM...|Puericultura|9.5|...|PASITOS-AC||
Sello digital (RSA-SHA256): U76AueeDipyIbFRWgaBDvjch2bkSwZq...ko08w==
```

Si alguien altera el nombre, la calificación o cualquier dato del certificado, el sello deja de ser válido automáticamente.

---

## ¿Qué resuelve?

| Antes | Con Pasitos Platform |
|---|---|
| Certificados en papel, falsificables | Sello digital RSA impreso en el PDF |
| Verificación por llamada o correo | Verificación pública instantánea por QR |
| Expedientes en Excel | Base de datos centralizada y cifrada |
| Envío manual de documentos | Entrega automática al correo del alumno |
| Sin trazabilidad | Auditoría completa de cada acción |
| CURP en texto plano | CURP cifrada con AES-256-GCM |
| 30–60 min por certificado | 2–3 min por certificado |

---

## Funcionalidades

- **Emisión de certificados PDF** con sello RSA, QR y boleta de calificaciones por módulo
- **Portal de verificación pública** — sin cuenta, sin registro, solo el folio o QR
- **Gestión de alumnos** con importación masiva desde Excel
- **Inscripciones por módulos** con competencias, calificaciones y evidencias
- **3 roles**: Administrador · Instructor · Alumno
- **Revocación de certificados** con motivo registrado
- **Registro de auditoría** — quién, qué, cuándo, desde qué IP
- **Rate limiting** — protección contra fuerza bruta y scraping

---

## Seguridad

| Mecanismo | Qué protege |
|---|---|
| RSA-2048 | Autenticidad e integridad del certificado (impreso en el PDF) |
| HMAC-SHA256 | Integridad interna en la base de datos |
| AES-256-GCM | CURP cifrada en reposo — ilegible sin la clave del servidor |
| bcrypt (12 rondas) | Contraseñas de usuarios |
| JWT firmado | Sesiones de usuario — no manipulables |
| RBAC | Control de acceso por rol en cada endpoint |
| Headers HTTP | CSP, X-Frame-Options, nosniff, Permissions-Policy |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 + React 18 + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 7 |
| Autenticación | NextAuth.js 5 |
| Criptografía | Node.js `crypto` nativo — RSA-2048, HMAC-SHA256, AES-256-GCM |
| PDF | pdf-lib |
| Correo | Nodemailer (SMTP) |
| Contenedores | Docker + Docker Compose |

---

## Inicio rápido

**Requisitos:** Docker Desktop · Node.js 20+ · pnpm (`npm install -g pnpm`)

```powershell
docker-compose up db -d      # 1. Base de datos
pnpm install                 # 2. Dependencias
pnpm prisma db push          # 3. Crear tablas
pnpm prisma db seed          # 4. Datos de prueba
pnpm dev                     # 5. Servidor → http://localhost:3000
```

### Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@pasitos.org` | `Admin2025!` |
| Instructor | `instructor@pasitos.org` | `Instructor2025!` |
| Alumno | `estudiante1@example.com` | `Estudiante2025!` |

---

## Estructura del proyecto

```
├── app/
│   ├── (auth)/login/          # Inicio de sesión
│   ├── (dashboard)/
│   │   ├── admin/             # Panel administrador
│   │   ├── instructor/        # Panel instructor
│   │   └── student/           # Panel alumno
│   ├── api/                   # Endpoints REST
│   └── verify/                # Portal público de verificación (sin login)
├── components/                # Componentes React reutilizables
├── lib/
│   ├── crypto/                # RSA-2048, HMAC-SHA256, AES-256-GCM
│   ├── certificates/          # Generación de PDF y emisión con firma
│   ├── email/                 # Plantillas y envío SMTP
│   ├── audit/                 # Logger de auditoría
│   └── rate-limit/            # Limitador de intentos por IP
├── prisma/                    # Schema y seed de la base de datos
├── scripts/                   # Generación de claves RSA y utilidades
└── public/templates/          # Plantillas PNG del certificado
```

---

## Variables de entorno para producción

Copiar `.env.example` a `.env` y generar claves seguras:

```powershell
# Cifrado y HMAC
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"   # CERTIFICATE_SIGNING_KEY

# Par de claves RSA (sello digital)
node scripts/generate-rsa-keys.mjs
```

> La `RSA_PRIVATE_KEY` es crítica — guárdala en un gestor de contraseñas. Sin ella, los nuevos certificados no tendrán sello válido.

---

## Comandos útiles

```powershell
pnpm dev                            # Servidor de desarrollo
pnpm build && pnpm start            # Build y servidor de producción
pnpm test                           # Pruebas unitarias
pnpm test:coverage                  # Cobertura de pruebas (~93% en módulo crítico)
pnpm prisma studio                  # UI visual de la base de datos
node scripts/generate-rsa-keys.mjs  # Regenerar par de claves RSA
```

---

## Documentación

| Archivo | Contenido |
|---|---|
| [`PLATAFORMA_PASITOS.md`](./PLATAFORMA_PASITOS.md) | Descripción ejecutiva completa — qué hace, cuánto cuesta, beneficios, seguridad |
| [`ONBOARDING.md`](./ONBOARDING.md) | Guía paso a paso para despliegue en producción |

---

*Desarrollado para Pasitos Education & Health A.C. · Next.js · PostgreSQL · RSA-2048 · AES-256-GCM*
