# 🐾 Pasitos — Guía Completa de Prompts para Claude Code
> Ejecuta cada prompt en orden. Espera a que Claude Code termine cada uno antes de continuar.
> Proyecto: Plataforma web con certificados digitales verificables, base de datos cifrada y control de roles.

---

## CONTEXTO DEL PROYECTO (léelo antes de empezar)

**Organización:** Pasitos Education & Health A.C.
**Stack sugerido:** Next.js 14 (App Router) + PostgreSQL + Prisma ORM + NextAuth.js + Node.js
**Hosting sugerido:** Railway o Vercel (front) + Supabase o Railway (base de datos)

**Datos del Excel (estructura de la BD):**
- Personas: nombre, CURP, fecha nacimiento, escolaridad, email, institución, cargo
- Cursos: ID, nombre, tipo, duración, modalidad, descripción, estado
- Inscripciones: persona + curso + módulo + fechas + calificación + resultado
- Certificados: No. certificado, fecha emisión, folio verificación, firma digital

---

## PROMPT 1 — Estructura base del proyecto

```
Crea la estructura base de un proyecto Next.js 14 con App Router llamado "pasitos-platform".

Requisitos:
- Next.js 14 con TypeScript
- Tailwind CSS
- Prisma ORM con PostgreSQL
- NextAuth.js v5 para autenticación
- shadcn/ui para componentes
- Instala también: bcryptjs, @types/bcryptjs, jose, qrcode, @types/qrcode, nodemailer, @types/nodemailer, pdf-lib, sharp

Estructura de carpetas a crear:
/app
  /api
    /auth
    /certificates
    /courses
    /users
    /verify
  /(auth)
    /login
  /(dashboard)
    /admin
    /instructor
    /student
  /verify/[folio]
/components
  /ui
  /certificates
  /dashboard
/lib
  /auth
  /crypto
  /db
  /email
/prisma
/public
  /certificates (carpeta vacía para PDFs generados)

Crea el archivo .env.example con estas variables:
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
CERTIFICATE_SIGNING_KEY= (para firma digital HMAC-SHA256)
ENCRYPTION_KEY= (para datos sensibles AES-256)
NEXT_PUBLIC_BASE_URL=

No conectes nada todavía, solo estructura y dependencias instaladas.
```

---

## PROMPT 2 — Schema de base de datos

```
En el proyecto pasitos-platform, crea el schema completo de Prisma en prisma/schema.prisma.

Modelos requeridos:

1. User (usuarios del sistema)
   - id, email, passwordHash, name, role (ADMIN | INSTRUCTOR | STUDENT)
   - createdAt, updatedAt, isActive
   - relación con StudentProfile (uno a uno, opcional)

2. StudentProfile (datos del alumno/participante)
   - id, userId (FK)
   - fullName, curp (único, cifrado), birthDate, educationLevel (enum)
   - email, institution, jobTitle
   - createdAt, updatedAt

3. Course (catálogo de cursos)
   - id, courseCode (ej: C-001), name, courseType, format
   - durationHours, modality, description, isActive
   - relación con Enrollment

4. Enrollment (inscripción a curso)
   - id, studentProfileId (FK), courseId (FK)
   - module, startDate, endDate
   - score (Decimal), result (enum: PASSED | FAILED | PENDING)
   - observations
   - relación con Certificate (uno a uno, opcional)
   - createdAt, updatedAt

5. Certificate (certificado emitido)
   - id, enrollmentId (FK, único)
   - certificateNumber (único, formato PAC-YYYY-XXXX)
   - issueDate, verificationFolio (único, formato VER-XXXX)
   - digitalSignature (string, hash HMAC-SHA256)
   - signaturePayload (JSON string con datos que se firmaron)
   - pdfPath (ruta al PDF generado)
   - isRevoked (boolean, default false)
   - revokedAt, revokedReason
   - createdAt

6. AuditLog (auditoría de acciones)
   - id, userId (FK nullable), action, entity, entityId
   - details (Json), ipAddress, createdAt

Después de crear el schema, ejecuta:
npx prisma generate

No hagas la migración todavía.
```

---

## PROMPT 3 — Seed de datos y migración

```
En pasitos-platform, realiza lo siguiente:

1. Crea el archivo prisma/seed.ts con:
   - Un usuario ADMIN: admin@pasitos.org / password: Admin2025! (hasheado con bcrypt)
   - Un usuario INSTRUCTOR: instructor@pasitos.org / password: Instructor2025!
   - Los 3 cursos del catálogo de Pasitos:
     * C-001: Puericultura, 80 horas, Capacitación Técnica, Presencial/Online, Activo
     * C-002: Asistente Educativo, 80 horas, Capacitación Técnica, Presencial/Online, Activo
     * C-003: Primeros Auxilios Pediátricos, 50 horas, Taller Práctico, Presencial/Online, Activo
   - 3 estudiantes de ejemplo con datos ficticios
   - 3 inscripciones de ejemplo (una por curso, todas PASSED)
   - NO generes certificados todavía en el seed

2. Crea el archivo lib/db.ts con el cliente Prisma singleton:
   - Patrón correcto para Next.js (evitar múltiples instancias en dev)

3. Ejecuta la migración inicial:
   npx prisma migrate dev --name init

4. Ejecuta el seed:
   npx prisma db seed

Muéstrame el output de la migración y el seed.
```

---

## PROMPT 4 — Autenticación y seguridad base

```
En pasitos-platform, implementa el sistema de autenticación y seguridad:

1. Configura NextAuth.js v5 en auth.ts (raíz del proyecto):
   - Provider: Credentials (email + password)
   - Valida contra BD con bcrypt
   - JWT con rol incluido (ADMIN | INSTRUCTOR | STUDENT)
   - Session incluye: id, email, name, role
   - Callbacks para enriquecer el token y session con el rol

2. Crea app/api/auth/[...nextauth]/route.ts

3. Crea middleware.ts en la raíz que proteja rutas:
   - /dashboard/* → requiere autenticación
   - /admin/* → requiere rol ADMIN
   - /api/certificates/* → requiere autenticación
   - /api/users/* → requiere rol ADMIN
   - /verify/* → PÚBLICA (sin autenticación)

4. Crea lib/crypto.ts con funciones para:
   - encryptField(text: string): string — AES-256-GCM para CURP y datos sensibles
   - decryptField(encrypted: string): string
   - signCertificate(payload: object): string — HMAC-SHA256 con CERTIFICATE_SIGNING_KEY
   - verifyCertificate(payload: object, signature: string): boolean
   - generateCertificateNumber(): string — formato PAC-YYYY-XXXX autoincremental
   - generateVerificationFolio(): string — formato VER-XXXXXXXX (8 chars hex aleatorio)

5. Crea lib/auth/permissions.ts con helpers:
   - canIssuesCertificates(role): boolean
   - canManageUsers(role): boolean
   - canViewAllStudents(role): boolean

Usa variables de entorno, nunca hardcodees claves.
```

---

## PROMPT 5 — API de cursos y estudiantes

```
En pasitos-platform, crea las rutas API para gestión de datos:

1. app/api/courses/route.ts
   - GET: lista todos los cursos activos (público) o todos si es admin
   - POST: crea nuevo curso (solo ADMIN)
   
2. app/api/courses/[id]/route.ts
   - GET: detalle de curso
   - PUT: actualiza curso (solo ADMIN)
   - DELETE: desactiva curso (soft delete, solo ADMIN)

3. app/api/users/route.ts
   - GET: lista usuarios paginada (solo ADMIN)
   - POST: crea nuevo usuario con rol asignado (solo ADMIN)

4. app/api/users/[id]/route.ts
   - GET: detalle usuario
   - PUT: actualiza usuario
   - DELETE: desactiva usuario (soft delete)

5. app/api/students/route.ts
   - GET: lista estudiantes con sus inscripciones (ADMIN e INSTRUCTOR)
   - POST: registra nuevo estudiante + usuario (ADMIN e INSTRUCTOR)
   
6. app/api/students/[id]/route.ts
   - GET: perfil completo con inscripciones y certificados
   - PUT: actualiza datos del estudiante

7. app/api/enrollments/route.ts
   - POST: inscribe estudiante a curso (ADMIN e INSTRUCTOR)
   
8. app/api/enrollments/[id]/route.ts
   - PUT: actualiza calificación y resultado

Todos los endpoints deben:
- Verificar autenticación con getServerSession
- Registrar acciones en AuditLog
- Retornar errores descriptivos en JSON
- Usar transacciones Prisma donde aplique
- Descifrar CURP antes de retornar al frontend (solo ADMIN)
```

---

## PROMPT 6 — Sistema de certificados digitales

```
En pasitos-platform, implementa el sistema completo de certificados digitales.

Este es el núcleo del proyecto. Sigue estos pasos exactos:

1. Crea lib/certificates/signer.ts:
   - Función issueCertificate(enrollmentId: string, issuedByUserId: string):
     * Verifica que la inscripción existe y tiene resultado PASSED
     * Verifica que no existe ya un certificado para esa inscripción
     * Genera certificateNumber (PAC-YYYY-XXXX con contador en BD)
     * Genera verificationFolio (VER- + 8 chars hex)
     * Construye el signaturePayload como objeto JSON con:
       { certificateNumber, studentName, curp, courseName, score, issueDate, organizationId: "PASITOS-AC" }
     * Firma el payload con HMAC-SHA256 → digitalSignature
     * Guarda el certificado en BD
     * Genera el PDF (llama a generateCertificatePDF)
     * Registra en AuditLog
     * Retorna el certificado completo

2. Crea lib/certificates/pdf-generator.ts:
   - Usa pdf-lib para generar el PDF del certificado
   - Diseño profesional con:
     * Logo de Pasitos (usa placeholder si no existe el archivo)
     * Nombre del alumno en grande
     * Nombre del curso
     * Fecha de emisión
     * Número de certificado
     * Folio de verificación
     * QR code que apunte a: {NEXT_PUBLIC_BASE_URL}/verify/{folio}
     * Texto de firma digital: "Firmado digitalmente por Pasitos Education & Health A.C."
     * Hash de verificación visible (primeros 16 chars de la firma)
   - Guarda el PDF en public/certificates/{certificateNumber}.pdf
   - Genera el QR con la librería qrcode

3. Crea app/api/certificates/route.ts:
   - POST: emite certificado para una inscripción (solo ADMIN e INSTRUCTOR)
   - GET: lista certificados con filtros (solo ADMIN e INSTRUCTOR)

4. Crea app/api/certificates/[id]/route.ts:
   - GET: descarga el PDF del certificado
   - DELETE: revoca certificado (solo ADMIN, requiere razón)

5. Crea app/api/certificates/[id]/verify/route.ts:
   - GET público: verifica autenticidad del certificado por folio o número
   - Re-calcula la firma y compara con la guardada en BD
   - Retorna: isValid, studentName, courseName, issueDate, isRevoked, revokedReason

El flujo de verificación garantiza:
- Integridad: si cualquier dato del certificado es alterado, la firma no coincide
- Autenticidad: solo Pasitos puede generar firmas válidas (clave secreta en servidor)
- No repudio: el payload firmado queda guardado en BD
```

---

## PROMPT 7 — Página pública de verificación

```
En pasitos-platform, crea la página pública de verificación de certificados.

Esta página es la más importante para el público — aquí llegan cuando escanean el QR.

1. Crea app/verify/[folio]/page.tsx:
   - Server component que recibe el folio como parámetro
   - Llama al API interno de verificación
   - Muestra resultado visualmente:
   
   SI ES VÁLIDO (isValid: true, isRevoked: false):
   - Fondo verde suave con ícono de escudo/palomita grande
   - Título: "✓ Certificado Auténtico y Válido"
   - Datos del certificado: nombre, curso, fecha de emisión, No. de certificado
   - Mensaje: "Este certificado fue emitido por Pasitos Education & Health A.C. y su autenticidad ha sido verificada criptográficamente."
   - Hash de verificación visible: "Firma digital: [primeros 32 chars]..."
   - Logo de Pasitos
   
   SI ES INVÁLIDO o NO EXISTE:
   - Fondo rojo suave con ícono de alerta
   - Título: "✗ Certificado No Encontrado o Inválido"
   - Mensaje de que podría ser falso
   - Botón para contactar a Pasitos
   
   SI ESTÁ REVOCADO:
   - Fondo amarillo/naranja
   - Título: "⚠ Certificado Revocado"
   - Fecha y razón de revocación

2. Crea también app/verify/page.tsx:
   - Formulario simple para buscar por folio o número de certificado manualmente
   - Sin login requerido
   - Diseño limpio y profesional

3. El diseño de la página de verificación debe:
   - Funcionar perfectamente en móvil (es donde llegarán desde el QR)
   - Cargar rápido (Server Side Rendering)
   - Ser visualmente confiable y profesional
   - Mostrar claramente el nombre de Pasitos Education & Health A.C.
   - NO requerir ningún login

Usa Tailwind CSS para el diseño. Hazlo responsivo y confiable visualmente.
```

---

## PROMPT 8 — Dashboard Admin

```
En pasitos-platform, crea el dashboard completo para el rol ADMIN.

1. Crea el layout app/(dashboard)/admin/layout.tsx:
   - Sidebar con navegación: Dashboard, Estudiantes, Cursos, Certificados, Usuarios, Auditoría
   - Header con nombre del usuario logueado y botón de logout
   - Protegido (solo ADMIN, redirige si no tiene rol)
   - Diseño limpio y profesional con Tailwind + shadcn/ui

2. Crea app/(dashboard)/admin/page.tsx (Dashboard principal):
   - Tarjetas de resumen: Total estudiantes, Total certificados emitidos, Cursos activos, Certificados este mes
   - Tabla de últimas inscripciones (5 más recientes)
   - Tabla de últimos certificados emitidos (5 más recientes)
   - Acciones rápidas: "Registrar estudiante", "Emitir certificado", "Ver auditoría"

3. Crea app/(dashboard)/admin/students/page.tsx:
   - Tabla completa de estudiantes con búsqueda y filtros
   - Columnas: Nombre, CURP (masked), Institución, Cursos inscritos, Certificados
   - Botón para registrar nuevo estudiante
   - Click en fila → ver detalle del estudiante

4. Crea app/(dashboard)/admin/students/[id]/page.tsx:
   - Perfil completo del estudiante
   - Lista de inscripciones con calificaciones
   - Lista de certificados emitidos con botón de descarga PDF
   - Botón para inscribir a nuevo curso
   - Botón para emitir certificado (si inscripción PASSED sin certificado)

5. Crea app/(dashboard)/admin/certificates/page.tsx:
   - Lista de todos los certificados
   - Filtros por curso, fecha, estado (vigente/revocado)
   - Acciones: Ver, Descargar PDF, Revocar
   - Contador de certificados emitidos por mes

6. Crea app/(dashboard)/admin/users/page.tsx:
   - Gestión de usuarios del sistema
   - Crear usuarios con roles (ADMIN, INSTRUCTOR, STUDENT)
   - Activar/desactivar usuarios
```

---

## PROMPT 9 — Dashboard Instructor y Estudiante

```
En pasitos-platform, crea los dashboards para los roles INSTRUCTOR y STUDENT.

INSTRUCTOR (app/(dashboard)/instructor/):

1. layout.tsx — igual que admin pero con navegación reducida:
   Mis Grupos, Registrar Alumno, Emitir Certificado

2. page.tsx — Dashboard:
   - Mis cursos asignados
   - Alumnos pendientes de calificar
   - Certificados emitidos esta semana
   - Acceso rápido a registrar alumno y calificar

3. students/page.tsx:
   - Solo los estudiantes de sus cursos
   - Puede registrar nuevos alumnos
   - Puede actualizar calificaciones
   - Puede emitir certificados (si el alumno aprobó)

4. enroll/page.tsx:
   - Formulario para registrar nuevo alumno:
     * Datos personales: nombre completo, CURP, fecha nacimiento, escolaridad
     * Email, institución, cargo
     * Selección de curso del catálogo
     * Fechas inicio/fin
     * Calificación y resultado

STUDENT (app/(dashboard)/student/):

1. layout.tsx — Navegación: Mis Cursos, Mis Certificados

2. page.tsx — Dashboard:
   - Bienvenida con nombre
   - Mis cursos: lista de inscripciones con estado y calificación
   - Mis certificados: lista con botón de descarga

3. certificates/page.tsx:
   - Lista de certificados obtenidos
   - Para cada uno: nombre del curso, fecha, No. certificado, folio
   - Botón "Descargar PDF"
   - Botón "Ver verificación pública" (abre /verify/{folio})
   - QR de verificación visible en pantalla

Todos los dashboards deben ser responsivos y usar shadcn/ui.
```

---

## PROMPT 10 — Login y páginas públicas

```
En pasitos-platform, crea las páginas de acceso público y autenticación.

1. app/(auth)/login/page.tsx:
   - Formulario de login: email + contraseña
   - Manejo de errores (credenciales incorrectas, cuenta inactiva)
   - Botón "Olvidé mi contraseña" (de momento solo muestra "contacta al administrador")
   - Logo de Pasitos Education & Health A.C.
   - Diseño profesional y limpio
   - Al iniciar sesión exitosamente, redirige según rol:
     * ADMIN → /admin
     * INSTRUCTOR → /instructor
     * STUDENT → /student

2. app/page.tsx (página principal pública):
   - Landing page sencilla de Pasitos
   - Header con logo y botón "Iniciar sesión"
   - Sección hero: "Plataforma de Certificación Pasitos Education & Health A.C."
   - Sección de cursos disponibles (obtenidos de la API pública)
   - Sección "Verifica tu certificado" con link a /verify
   - Footer con datos de contacto de Pasitos
   - Diseño profesional con los colores de Pasitos (si no sabes los colores, usa azul oscuro y verde como colores base)

3. Crea componentes reutilizables en components/:
   - components/ui/page-header.tsx — header con logo y usuario logueado
   - components/ui/loading-spinner.tsx
   - components/ui/error-message.tsx
   - components/certificates/certificate-card.tsx — tarjeta de certificado con QR
   - components/dashboard/stats-card.tsx — tarjeta de estadística

4. app/not-found.tsx — Página 404 personalizada con link al inicio
5. app/error.tsx — Página de error con mensaje amigable
```

---

## PROMPT 11 — Email de certificados y notificaciones

```
En pasitos-platform, implementa el sistema de notificaciones por email.

1. Crea lib/email/templates.ts con funciones que retornan HTML de emails:
   - certificateIssuedEmail(data: { studentName, courseName, certificateNumber, verificationFolio, verifyUrl, pdfUrl }):
     * Asunto: "Tu certificado de [Curso] — Pasitos Education & Health A.C."
     * HTML profesional con logo de Pasitos
     * Datos del certificado
     * Botón grande "Ver mi certificado" → link al PDF
     * Botón "Verificar autenticidad" → link a /verify/{folio}
     * Texto: "Este certificado tiene firma digital y puede verificarse en cualquier momento"
     * Instrucciones para guardar el PDF de forma segura

2. Crea lib/email/sender.ts:
   - Función sendEmail(to, subject, html) usando nodemailer
   - Configuración con variables de entorno SMTP
   - Manejo de errores sin que rompa el flujo principal
   - Log en consola de emails enviados (útil en desarrollo)

3. Integra el envío de email en lib/certificates/signer.ts:
   - Después de generar el PDF exitosamente
   - Envía el email de certificado al email del estudiante
   - Si el envío falla, loguea el error pero NO revierte el certificado

4. Crea app/api/email/test/route.ts (solo en desarrollo):
   - Endpoint para probar el envío de email
   - Solo funciona si NODE_ENV === 'development'

5. Agrega en el panel de admin:
   - Botón "Reenviar certificado por email" en el detalle de cada certificado
   - Endpoint app/api/certificates/[id]/resend/route.ts que reenvía el email
```

---

## PROMPT 12 — Importación desde Excel

```
En pasitos-platform, crea el módulo de importación masiva desde Excel.

El Excel actual de Pasitos tiene esta estructura (hoja "Registro de Inscripciones"):
- Columnas: Nombre Completo, CURP, Fecha de Nacimiento, Último Grado de Estudio, 
  Correo Electrónico, Institución/Guardería, Cargo o Puesto, Curso, Módulo,
  Fecha de Inicio, Fecha de Término, Calificación (0-10), Resultado, 
  No. de Certificado, Fecha de Emisión, Folio Verificación, Observaciones

1. Instala: xlsx (librería para leer Excel)
   npm install xlsx

2. Crea lib/import/excel-parser.ts:
   - Función parseExcelFile(buffer: Buffer): ParsedRow[]
   - Mapea las columnas del Excel de Pasitos al modelo de datos de la BD
   - Valida cada fila: CURP de 18 chars, email válido, calificación 0-10, etc.
   - Retorna filas válidas y array de errores con número de fila

3. Crea app/api/import/route.ts:
   - POST: recibe archivo Excel (multipart/form-data)
   - Solo ADMIN
   - Llama a parseExcelFile
   - Para cada fila válida:
     * Crea o actualiza StudentProfile (busca por CURP)
     * Crea o actualiza el User asociado (email como username)
     * Crea la Enrollment
     * Si ya existe certificado en el Excel (tiene No. de Certificado), 
       importa también el certificado (SIN regenerar PDF, solo el registro)
   - Usa transacción Prisma para toda la importación
   - Retorna resumen: X estudiantes creados, Y inscripciones importadas, Z errores

4. Crea app/(dashboard)/admin/import/page.tsx:
   - Interfaz de importación con:
     * Drag & drop de archivo Excel
     * Preview de las primeras 5 filas antes de importar
     * Botón "Importar todo"
     * Progress bar durante la importación
     * Resultado: tabla con éxitos y errores
     * Botón para descargar reporte de errores

5. Documenta en un comentario del código el mapping exacto de columnas.
```

---

## PROMPT 13 — Auditoría y seguridad avanzada

```
En pasitos-platform, implementa la auditoría completa y medidas de seguridad avanzada.

1. Crea un middleware de auditoría lib/audit/logger.ts:
   - Función logAction(params: { userId, action, entity, entityId, details, request })
   - Guarda en AuditLog de forma asíncrona (no bloquea la respuesta)
   - Captura IP del request
   - Acciones predefinidas como constantes:
     * AUTH_LOGIN, AUTH_LOGOUT, AUTH_FAILED
     * CERT_ISSUED, CERT_REVOKED, CERT_VIEWED, CERT_DOWNLOADED
     * STUDENT_CREATED, STUDENT_UPDATED
     * USER_CREATED, USER_DEACTIVATED
     * IMPORT_STARTED, IMPORT_COMPLETED

2. Integra el logger en todos los API routes existentes.

3. Crea app/(dashboard)/admin/audit/page.tsx:
   - Tabla de auditoría con filtros: usuario, acción, fecha, entidad
   - Paginación (50 registros por página)
   - Export a CSV de los logs filtrados
   - Vista de detalle por registro (JSON de details)

4. Agrega rate limiting básico:
   - Instala: npm install @upstash/ratelimit @upstash/redis
   - O implementa rate limiting en memoria para desarrollo
   - Límite en login: 5 intentos por IP en 15 minutos
   - Límite en /verify: 100 requests por IP por hora

5. Agrega headers de seguridad en next.config.js:
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Content-Security-Policy básica

6. Crea endpoint app/api/health/route.ts:
   - GET público que verifica: DB conectada, variables de entorno presentes
   - Útil para monitoring

7. Documenta en README.md:
   - Cómo funciona la firma digital de certificados
   - Cómo verificar manualmente un certificado
   - Cómo hacer backup de la CERTIFICATE_SIGNING_KEY
   - QUÉ PASA si se pierde la signing key (los certificados existentes ya no son verificables)
```

---

## PROMPT 14 — Tests y documentación

```
En pasitos-platform, agrega tests críticos y documenta el sistema.

1. Instala dependencias de testing:
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest @types/jest

2. Crea jest.config.js y jest.setup.ts con configuración básica para Next.js.

3. Crea tests unitarios en __tests__/lib/crypto.test.ts:
   - Test: signCertificate genera firma consistente
   - Test: verifyCertificate retorna true para firma válida
   - Test: verifyCertificate retorna false si se altera cualquier campo del payload
   - Test: verifyCertificate retorna false con firma incorrecta
   - Test: encryptField → decryptField recupera el valor original
   - Test: campos diferentes producen cifrados diferentes

4. Crea tests en __tests__/lib/signer.test.ts:
   - Mock de Prisma y PDF generator
   - Test: no emite certificado si calificación es reprobatoria
   - Test: no emite certificado duplicado
   - Test: genera número de certificado en formato correcto PAC-YYYY-XXXX

5. Crea __tests__/api/verify.test.ts:
   - Test: verifica correctamente un certificado válido
   - Test: detecta certificado con firma alterada
   - Test: retorna estado revocado correctamente

6. Crea README.md completo con:
   - Descripción del proyecto
   - Arquitectura del sistema (texto, no diagrama)
   - Requisitos previos e instalación paso a paso
   - Variables de entorno y cómo configurarlas
   - Cómo correr en desarrollo
   - Cómo hacer deploy en Railway/Vercel
   - Cómo funciona el sistema de firma digital (explicado para no-técnicos)
   - Sección: "¿Qué garantiza el sistema?"
     * Que el certificado no fue alterado (integridad)
     * Que fue emitido por Pasitos (autenticidad)
     * Que el QR lleva siempre a la verificación oficial
   - Cómo personalizar la plantilla del certificado PDF
   - Cómo hacer backup y restore de la base de datos

Ejecuta los tests al final: npm test
```

---

## PROMPT 15 — Configuración de deploy y producción

```
En pasitos-platform, prepara todo para el deploy en producción.

1. Crea Dockerfile:
   - Multi-stage build: build stage + production stage
   - Node 20 Alpine
   - Copia solo lo necesario para producción
   - EXPOSE 3000
   - CMD para next start

2. Crea docker-compose.yml para desarrollo local:
   - Servicio app (Next.js)
   - Servicio db (PostgreSQL 16)
   - Servicio adminer (interfaz web para la BD, solo en dev)
   - Volumen persistente para la BD
   - Variables de entorno desde .env

3. Crea .github/workflows/deploy.yml si quieren CI/CD:
   - Trigger: push a main
   - Jobs: install, lint, test, build
   - (Dejar comentado el deploy automático, que ellos lo configuren)

4. Crea scripts/generate-keys.js:
   - Script para generar CERTIFICATE_SIGNING_KEY y ENCRYPTION_KEY seguros
   - Outputs: valores listos para pegar en .env
   - Instrucción: "Guarda estas claves en un lugar seguro. Si las pierdes, 
     los certificados existentes no podrán verificarse."

5. Crea scripts/backup.sh:
   - Script de backup de PostgreSQL a archivo .sql.gz con fecha
   - Instrucciones de uso en comentario

6. Actualiza next.config.js para producción:
   - output: 'standalone' para Docker
   - Optimizaciones de imágenes
   - Headers de seguridad

7. Crea una página app/(dashboard)/admin/settings/page.tsx:
   - Info del sistema: versión, DB status, storage usado
   - Botón "Verificar integridad" — re-verifica las firmas de todos los certificados y muestra cuántas son válidas
   - Sección de información sobre las claves de cifrado (sin mostrarlas, solo estado)

8. Documenta el proceso de onboarding en ONBOARDING.md:
   - Paso 1: Configurar servidor / hosting
   - Paso 2: Configurar base de datos
   - Paso 3: Generar y guardar claves con generate-keys.js
   - Paso 4: Configurar variables de entorno
   - Paso 5: Ejecutar migraciones y seed
   - Paso 6: Importar datos del Excel existente
   - Paso 7: Configurar correo SMTP
   - Paso 8: Probar verificación de certificado
```

---

## PROMPT 16 — Plantilla del certificado personalizada

```
En pasitos-platform, personaliza la generación del PDF del certificado.

Contexto: Pasitos ya tiene una plantilla de certificado en Word/imagen.
El objetivo es replicarla digitalmente con pdf-lib.

1. Crea lib/certificates/template.ts con la función buildCertificatePDF(data):
   
   data debe incluir:
   - studentName: string
   - curp: string
   - courseName: string
   - courseHours: number
   - startDate: Date
   - endDate: Date
   - score: number
   - certificateNumber: string
   - issueDate: Date
   - verificationFolio: string
   - verifyUrl: string (para el QR)
   - digitalSignatureHash: string (primeros 32 chars, visible en el doc)

   El PDF debe tener (tamaño carta, horizontal recomendado):
   - Fondo blanco con borde decorativo doble (azul marino exterior, dorado interior)
   - Encabezado: "PASITOS EDUCATION & HEALTH A.C." en azul marino
   - Subtítulo: "RFC: [RFC de Pasitos si lo tienes]" — si no, omitir
   - Título grande centrado: "CONSTANCIA DE CAPACITACIÓN"  
   - Texto: "Se hace constar que:"
   - Nombre del alumno en grande y negritas
   - CURP del alumno
   - Texto: "Ha completado satisfactoriamente el curso de:"
   - Nombre del curso en grande
   - Horas del curso
   - Fechas de inicio y término
   - Calificación obtenida
   - Sección inferior izquierda: Firma (línea) + "Directora General"
   - Sección inferior centro: QR code (3x3 cm)
   - Sección inferior derecha: 
     * "No. Certificado: PAC-YYYY-XXXX"
     * "Folio verificación: VER-XXXXXXXX"
     * "Fecha de emisión: DD/MM/YYYY"
   - Pie de página: "Verifica la autenticidad en: {NEXT_PUBLIC_BASE_URL}/verify"
   - Muy pequeño: "Firma digital SHA-256: {primeros 32 chars del hash}"

2. El QR debe generarse con la librería qrcode apuntando a la URL de verificación

3. Agrega soporte para logo:
   - Si existe el archivo public/logo-pasitos.png, incorpóralo en el header del PDF
   - Si no existe, solo muestra el texto del nombre de la organización

4. Crea un endpoint de prueba app/api/certificates/preview/route.ts:
   - GET: genera un certificado de ejemplo con datos ficticios
   - Retorna el PDF directamente (Content-Type: application/pdf)
   - Solo funciona en desarrollo o para ADMIN
   - Útil para ajustar el diseño sin emitir certificados reales

5. Una vez funcionando, documenta qué colores y fuentes usa para que Pasitos
   pueda solicitar ajustes en un prompt futuro.
```

---

## NOTAS FINALES PARA EL EQUIPO DE PASITOS

### Sobre la firma digital
El sistema usa **HMAC-SHA256** (estándar criptográfico industrial). Cada certificado tiene:
- Un **payload firmado**: datos del certificado en el momento de emisión
- Una **firma digital**: hash criptográfico del payload con clave secreta
- Un **folio de verificación**: ID público para consultar el certificado

Cuando alguien escanea el QR, el sistema re-calcula la firma con los datos actuales de la BD y compara con la firma guardada. Si coinciden → auténtico. Si alguien alteró la BD → las firmas no coinciden → inválido.

### Lo que el sistema NO hace (y por qué)
- **No usa firma de persona física** (requeriría e.firma SAT con certificado .cer/.key personal)
- **No es FIEL ni firma notarial** — es firma digital de organización, equivalente a un sello de seguridad
- Si Pasitos en el futuro quiere firmas con e.firma SAT, se puede extender el sistema

### Seguridad de la clave
- La `CERTIFICATE_SIGNING_KEY` es la clave maestra del sistema
- **Hacer backup en lugar seguro** (gestión de contraseñas como Bitwarden o 1Password)
- Si se pierde: los certificados ya emitidos no podrán verificarse automáticamente (pero siguen siendo PDFs válidos)
- Si se compromete: cambiar la clave y re-firmar todos los certificados existentes

### Subir la plantilla del certificado
Cuando tengas la plantilla, envía a Claude Code:
```
Tengo la plantilla del certificado de Pasitos. Aquí está la imagen: [adjunta imagen]
Ajusta lib/certificates/template.ts para que el PDF se parezca lo más posible a esta plantilla.
```
