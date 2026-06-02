# Pasitos Platform

Sistema de gestión de cursos y certificados digitales para Pasitos Education & Health A.C.

---

## Requisitos previos

- **Docker Desktop** — para correr la base de datos PostgreSQL
- **Node.js 20+**
- **pnpm** — gestor de paquetes del proyecto

> **Importante:** este proyecto usa `pnpm`. NO uses `npm` ni `npx` para correr comandos de este proyecto o Prisma.

Instalar pnpm si no lo tienes:
```powershell
npm install -g pnpm
```

---

## Cómo correr el proyecto en desarrollo

### 1. Iniciar la base de datos con Docker

El proyecto usa Docker **solo para la base de datos** PostgreSQL. El resto (Next.js) corre localmente con `pnpm dev`.

```powershell
# Desde dentro de pasitos-platform/
docker-compose up db -d
```

Esto levanta:
- **PostgreSQL** en `localhost:5432`
- **Adminer** (UI visual de la BD) en `localhost:8080`

También puedes simplemente abrir Docker Desktop y asegurarte de que el contenedor `pasitos-platform-db-1` esté en estado **Running**.

### 2. Instalar dependencias (solo primera vez o al cambiar packages)

```powershell
pnpm install
```

### 3. Sincronizar el esquema de base de datos

**Primera vez**, o cada vez que se modifica `prisma/schema.prisma`:

```powershell
pnpm prisma db push
```

Esto crea o actualiza las tablas en la BD **y** regenera el cliente de Prisma automáticamente.

### 4. Poblar la BD con datos de prueba (solo primera vez)

```powershell
pnpm prisma db seed
```

### 5. Iniciar el servidor de desarrollo

```powershell
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

---

## Variables de entorno

El archivo `.env` ya está configurado para desarrollo local. No necesitas cambiarlo para correr el proyecto.

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/pasitos?sslmode=disable"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/pasitos?sslmode=disable"

NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000

CERTIFICATE_SIGNING_KEY=dev-signing-key-change-in-production-use-generate-keys-script
ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> Para producción, genera claves seguras para `NEXTAUTH_SECRET`, `CERTIFICATE_SIGNING_KEY` y `ENCRYPTION_KEY`.

---

## Usuarios de prueba (después del seed)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@pasitos.org` | `Admin2025!` |
| Instructor | `instructor@pasitos.org` | `Instructor2025!` |
| Estudiante | `estudiante1@example.com` | `Estudiante2025!` |

---

## Comandos Prisma

Todos los comandos de Prisma se corren con `pnpm`, no con `npx`:

```powershell
# Sincronizar schema con la BD y regenerar cliente (el más usado)
pnpm prisma db push

# Solo regenerar el cliente sin tocar la BD
pnpm prisma generate

# Abrir Prisma Studio (UI visual de la BD en el navegador)
pnpm prisma studio

# Correr el seed
pnpm prisma db seed
```

---

## Solución de problemas frecuentes

### Error: `Cannot find module '.prisma/client/default'`

El cliente de Prisma fue eliminado o no se generó. Solución:

```powershell
Remove-Item -Recurse -Force node_modules\.prisma\client
pnpm prisma db push
```

Después reinicia el servidor (`Ctrl+C` y `pnpm dev`).

### Error: `Unknown argument 'modality'` (o cualquier campo desconocido en Prisma)

El cliente generado no coincide con el schema actual. Solución:

```powershell
pnpm prisma generate
```

Reinicia el servidor después. Si persiste, usa la solución de arriba (borrar y regenerar).

### Error P1001: `Can't reach database server at 127.0.0.1:5432`

Docker Desktop no está corriendo o el contenedor de la BD está detenido.

1. Abrir Docker Desktop
2. Verificar que el contenedor PostgreSQL esté en estado **Running**
3. O correr: `docker-compose up db -d`

### Error al hacer seed: `Table does not exist`

Las tablas aún no han sido creadas en la BD. Correr primero:

```powershell
pnpm prisma db push
pnpm prisma db seed
```

### Cambios en el código no se reflejan / errores raros después de modificar schema

El servidor de Next.js cacha el cliente de Prisma. Siempre reiniciar `pnpm dev` después de cualquier `prisma db push` o `prisma generate`.

---

## Estructura del proyecto

```
pasitos-platform/
├── app/
│   ├── (auth)/login/              # Página de inicio de sesión
│   ├── (dashboard)/
│   │   ├── admin/                 # Panel de administrador
│   │   ├── instructor/            # Panel de instructor
│   │   └── student/               # Panel de estudiante
│   ├── api/                       # API Routes (Next.js App Router)
│   └── verify/                    # Verificación pública de certificados (sin login)
├── components/
│   ├── dashboard/sidebar.tsx      # Barra lateral del dashboard
│   ├── emit-cert-form.tsx         # Formulario de emisión de certificados
│   └── instructor/                # Componentes del panel de instructor
├── lib/
│   ├── certificates/
│   │   ├── template.ts            # Generación del PDF con pdf-lib (coordenadas y layout)
│   │   ├── pdf-generator.ts       # Punto de entrada para generar el PDF
│   │   └── signer.ts              # Firma digital y emisión del certificado en BD
│   ├── crypto.ts                  # Cifrado AES-256-GCM y firma HMAC-SHA256
│   └── db.ts                      # Cliente de Prisma (singleton)
├── prisma/
│   ├── schema.prisma              # Esquema de la base de datos
│   └── seed.ts                    # Datos de prueba
├── public/
│   └── templates/
│       ├── h1.png                 # Plantilla página 1 del certificado (1280×853px)
│       └── h2.png                 # Plantilla página 2 / boleta (1280×853px)
├── docker-compose.yml             # Solo el servicio `db` se usa en desarrollo
└── .env                           # Variables de entorno (ya configurado para desarrollo)
```

---

## Rutas principales de la app

| Ruta | Descripción | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/verify` | Verificar certificado por folio o número | Público |
| `/admin` | Dashboard de administrador | Admin |
| `/admin/students` | Lista de estudiantes | Admin |
| `/admin/certificates` | Lista de certificados emitidos | Admin |
| `/instructor` | Dashboard de instructor | Instructor |
| `/instructor/students` | Lista de alumnos y sus inscripciones | Instructor |
| `/instructor/enroll` | Registrar nuevo alumno e inscripción | Instructor |
| `/api/certificates/preview` | Preview del PDF generado (solo desarrollo) | Admin |

---

## Cómo funciona el certificado digital

1. El instructor o admin llena el formulario de emisión (modalidad, módulos evaluados, observaciones)
2. El sistema guarda los módulos en `EnrollmentModule` y la modalidad en `Enrollment`
3. Se genera un payload JSON con los datos del certificado y se firma con HMAC-SHA256
4. Se genera el PDF de dos páginas usando las plantillas PNG (`h1.png`, `h2.png`) con pdf-lib
5. El QR del certificado apunta a `/verify/{folio}` donde cualquier persona puede verificar su autenticidad

---

## Backup de la base de datos

```powershell
# Backup
pg_dump "postgresql://postgres:postgres@127.0.0.1:5432/pasitos" | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup-20250601.sql.gz | psql "postgresql://postgres:postgres@127.0.0.1:5432/pasitos"
```

---

## Seguridad importante para producción

- Cambiar **todas** las claves en `.env` antes de hacer deploy
- `CERTIFICATE_SIGNING_KEY` es crítica — si se pierde, los certificados ya emitidos no podrán verificarse. Guardarla en un gestor de contraseñas
- `ENCRYPTION_KEY` debe ser exactamente 64 caracteres hexadecimales (32 bytes)

Generar claves seguras:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"   # CERTIFICATE_SIGNING_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # ENCRYPTION_KEY
```
