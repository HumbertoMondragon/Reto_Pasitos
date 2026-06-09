# Pasitos Platform

Sistema de gestión de cursos y certificados digitales con firma RSA para **Pasitos Education & Health A.C.**

Cada certificado emitido lleva un **sello digital RSA-2048** impreso en el PDF — el mismo mecanismo criptográfico que utiliza el SAT de México en sus Comprobantes Fiscales Digitales (CFDI) — que garantiza autenticidad e integridad verificables públicamente sin intermediarios.

---

## Características principales

- **Firma digital RSA-2048** impresa en cada certificado (cadena original + sello digital, estilo SAT/CFDI)
- **Verificación pública por QR** — cualquier persona confirma autenticidad en segundos sin cuenta ni registro
- **Cifrado AES-256-GCM** de datos personales sensibles (CURP) en la base de datos
- **HMAC-SHA256** de integridad interna con comparación en tiempo constante
- **3 roles**: Administrador, Instructor, Alumno
- **Importación masiva** desde Excel
- **Envío automático** de certificados PDF por correo
- **Registro de auditoría** completo (quién, qué, cuándo, desde qué IP)
- **Rate limiting** en endpoints críticos (login y verificación pública)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend / Backend | Next.js 14 + React 18 + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 7 |
| Autenticación | NextAuth.js 5 (JWT + RBAC) |
| Criptografía | Node.js `crypto` nativo — RSA-2048, HMAC-SHA256, AES-256-GCM |
| PDF | pdf-lib |
| Correo | Nodemailer (SMTP) |
| Contenedores | Docker + Docker Compose |

---

## Inicio rápido (desarrollo)

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`

### Pasos

```powershell
# 1. Levantar la base de datos
docker-compose up db -d

# 2. Instalar dependencias
pnpm install

# 3. Crear tablas en la BD
pnpm prisma db push

# 4. Poblar con datos de prueba
pnpm prisma db seed

# 5. Iniciar el servidor
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

### Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@pasitos.org` | `Admin2025!` |
| Instructor | `instructor@pasitos.org` | `Instructor2025!` |
| Alumno | `estudiante1@example.com` | `Estudiante2025!` |

---

## Variables de entorno

El archivo `.env` ya está configurado para desarrollo. Para producción, genera claves seguras:

```powershell
# Claves HMAC y cifrado
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # CERTIFICATE_SIGNING_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # ENCRYPTION_KEY

# Par de claves RSA (sello digital)
node scripts/generate-rsa-keys.mjs
```

---

## Estructura del proyecto

```
├── app/                  # Páginas y API Routes (Next.js App Router)
│   ├── (auth)/           # Login
│   ├── (dashboard)/      # Paneles admin / instructor / alumno
│   ├── api/              # Endpoints REST
│   └── verify/           # Portal público de verificación
├── components/           # Componentes React reutilizables
├── lib/
│   ├── crypto/           # RSA-2048, HMAC-SHA256, AES-256-GCM
│   ├── certificates/     # Generación de PDF y emisión con firma
│   ├── email/            # Plantillas y envío SMTP
│   ├── audit/            # Logger de auditoría
│   └── rate-limit/       # Limitador de intentos por IP
├── prisma/               # Schema y seed de la base de datos
├── scripts/              # Generación de claves y utilidades
└── public/templates/     # Plantillas PNG del certificado
```

---

## Cómo funciona el sello digital

```
Al emitir:
  1. Se construye la cadena original:
     ||PAC-2026-0001|Nombre Alumno|CURP|Curso|9.5|2026-06-09T...|PASITOS-AC||
  2. Se firma con RSA-2048 (clave privada del servidor) → Sello Digital en Base64
  3. Se imprime al pie del PDF junto con la cadena original
  4. Se envía al correo del alumno

Al verificar (escanear QR):
  ✓ Firma válida + no revocado  → Certificado AUTÉNTICO
  ✗ Firma inválida              → Certificado FALSIFICADO o ALTERADO
  ✗ Revocado                   → Certificado REVOCADO
```

---

## Comandos útiles

```powershell
pnpm dev                            # Servidor de desarrollo
pnpm build                          # Build de producción
pnpm test                           # Pruebas unitarias
pnpm test:coverage                  # Cobertura de pruebas
pnpm prisma studio                  # UI visual de la base de datos
pnpm prisma db push                 # Sincronizar schema con la BD
pnpm prisma db seed                 # Poblar con datos de prueba
node scripts/generate-rsa-keys.mjs  # Generar par de claves RSA
```

---

## Documentación adicional

- [`ONBOARDING.md`](./ONBOARDING.md) — Guía de despliegue a producción
- [`PLATAFORMA_PASITOS.md`](./PLATAFORMA_PASITOS.md) — Descripción ejecutiva completa de la plataforma

---

*Desarrollado para Pasitos Education & Health A.C.*
