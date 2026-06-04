# Plataforma Digital Pasitos
## Sistema de Gestión de Cursos y Certificados Digitales

**Pasitos Education & Health A.C.**

---

## ¿Qué es la Plataforma Pasitos?

La Plataforma Pasitos es un sistema web completo diseñado para digitalizar y automatizar todo el ciclo de vida de los programas de formación de Pasitos Education & Health A.C.: desde el registro de alumnos y la gestión de cursos, hasta la emisión, entrega y verificación pública de certificados digitales con validez criptográfica.

El sistema elimina los procesos manuales, los certificados en papel y la verificación por llamada telefónica, reemplazándolos con flujos digitales seguros, trazables y accesibles desde cualquier dispositivo.

---

## ¿Qué problema resuelve?

| Situación anterior | Con la Plataforma Pasitos |
|---|---|
| Certificados en papel, fáciles de falsificar | Certificados digitales con firma criptográfica |
| Verificación manual por teléfono o correo | Verificación pública instantánea vía QR o folio |
| Expedientes de alumnos en hojas de cálculo | Base de datos centralizada y encriptada |
| Envío manual de documentos por correo | Entrega automática al correo del alumno |
| Sin trazabilidad de quién emitió qué | Registro de auditoría completo de cada acción |
| Datos sensibles (CURP) sin protección | CURP cifrada con AES-256-GCM en la base de datos |

---

## Funcionalidades principales

### 1. Gestión de Alumnos
- Registro completo de perfil: nombre, CURP, nivel educativo, institución, cargo
- Importación masiva desde archivos Excel (para migración de datos existentes)
- Historial de inscripciones y certificados por alumno
- Búsqueda y filtrado por nombre, CURP o institución

### 2. Gestión de Cursos
- Catálogo de cursos con código, nombre, tipo, modalidad (presencial/virtual) y horas
- Descripción detallada por curso
- Activar/desactivar cursos sin eliminarlos

### 3. Inscripciones y Módulos
- Registro de inscripción por alumno y curso
- Desglose por módulos con nombre, competencia, calificación y evidencia
- Registro de fechas de inicio/fin, resultado y observaciones

### 4. Emisión de Certificados Digitales
- Generación automática de PDF de dos páginas (certificado + boleta de calificaciones)
- Firma digital HMAC-SHA256 que garantiza la integridad del documento
- Código QR incrustado con enlace directo de verificación
- Folio único e irrepetible por certificado
- Envío automático al correo electrónico del alumno

### 5. Verificación Pública de Autenticidad
- Portal público accesible sin registro ni contraseña
- Verificación por folio/número de certificado o por CURP del alumno
- Resultado inmediato: nombre, curso, fecha de emisión, calificación
- Detección de certificados revocados o alterados

### 6. Revocación y Control de Integridad
- Los administradores pueden revocar certificados con motivo registrado
- Verificación de integridad del sistema que detecta modificaciones no autorizadas en la BD

### 7. Registro de Auditoría
- Cada acción queda registrada: quién, qué, cuándo y desde qué IP
- Historial de emisiones, revocaciones, accesos e importaciones
- Trazabilidad completa para cumplimiento normativo

---

## Roles de usuario

La plataforma tiene tres niveles de acceso:

### Administrador
- Acceso total al sistema
- Gestión de usuarios y roles
- Visualización de todos los alumnos y certificados
- Importación masiva de datos (Excel)
- Configuración del sistema
- Revocación de certificados
- Consulta del log de auditoría
- Verificación de integridad del sistema

### Instructor
- Gestión de sus alumnos asignados
- Inscripción de alumnos en cursos
- Registro de módulos y calificaciones
- Emisión de certificados a sus alumnos
- Reenvío de certificados por correo

### Alumno
- Visualización de sus certificados emitidos
- Descarga de PDF en cualquier momento
- Acceso a sus enlaces de verificación personal

### Público (sin registro)
- Verificación de autenticidad de cualquier certificado
- Acceso solo por folio o CURP — no requiere cuenta

---

## Flujo de trabajo completo

```
1. REGISTRO
   Instructor registra al alumno con su CURP, nivel educativo e institución

2. INSCRIPCIÓN
   Instructor inscribe al alumno en un curso e ingresa los módulos evaluados
   (nombre del módulo, competencia, calificación, evidencia)

3. EMISIÓN
   Sistema genera:
   ├─ Payload JSON con todos los datos del certificado
   ├─ Firma digital HMAC-SHA256 del payload
   ├─ Folio único y número de verificación
   ├─ PDF de 2 páginas con QR incrustado
   └─ Envío automático al correo del alumno

4. ENTREGA
   Alumno recibe el certificado en su correo con:
   ├─ PDF adjunto listo para imprimir o compartir
   └─ Enlace directo de verificación pública

5. VERIFICACIÓN
   Cualquier persona puede escanear el QR o entrar al portal y confirmar:
   ├─ Que el certificado fue emitido por Pasitos
   ├─ Que los datos no han sido alterados
   └─ Que el certificado no ha sido revocado
```

---

## Beneficios para la organización

### Credibilidad institucional
Los certificados con firma criptográfica y verificación pública elevan el nivel de confianza de los programas de Pasitos. Empleadores y otras instituciones pueden confirmar la autenticidad en segundos, sin necesidad de contactar a la organización.

### Eficiencia operativa
- La emisión de un certificado, que antes podía tardar horas (diseño, impresión, firma, entrega), ahora toma segundos desde el sistema.
- La importación masiva desde Excel permite migrar datos históricos sin captura manual.
- El envío automático por correo elimina la coordinación logística.

### Escalabilidad
El sistema puede gestionar miles de alumnos y certificados sin degradación de rendimiento. Es igualmente eficiente para 50 alumnos que para 50,000.

### Cumplimiento y trazabilidad
El log de auditoría registra cada acción con usuario, fecha, hora e IP. Esto permite:
- Responder a auditorías internas o externas
- Identificar irregularidades
- Demostrar buenas prácticas de gobernanza de datos

### Reducción de costos
- Eliminación de papel, impresión, tinta y almacenamiento físico
- Eliminación del tiempo de respuesta a solicitudes de verificación
- Centralización de datos que antes estaban dispersos en múltiples hojas de cálculo

### Protección legal
La firma digital y el folio único crean evidencia técnica de que un certificado fue emitido por Pasitos en una fecha específica. Esto protege a la organización ante reclamaciones de documentos falsos.

---

## Ciberseguridad de la plataforma

La plataforma implementa múltiples capas de seguridad siguiendo estándares de la industria:

### Autenticación y control de acceso
- **Contraseñas hasheadas con bcrypt** (12 rondas de salt): las contraseñas nunca se almacenan en texto plano. Incluso si la base de datos fuera comprometida, las contraseñas no podrían recuperarse.
- **Tokens JWT firmados** (NextAuth.js): las sesiones son sin estado y firmadas criptográficamente, lo que impide manipulación de tokens.
- **Control de acceso basado en roles (RBAC)**: cada endpoint verifica el rol del usuario antes de ejecutar cualquier acción. Un instructor no puede acceder a datos de administrador, ni un alumno a datos de otros alumnos.

### Protección de datos sensibles
- **Cifrado AES-256-GCM de la CURP**: el campo más sensible del alumno se almacena cifrado en la base de datos. Se usa:
  - AES-256 (estándar internacional de cifrado)
  - Modo GCM (Galois/Counter Mode): proporciona cifrado **y** autenticación del dato
  - IV (vector de inicialización) único por registro: dos CURPs idénticas producen valores cifrados distintos
  - Auth Tag de 16 bytes: detecta cualquier manipulación del dato cifrado
- Solo el servidor con la clave `ENCRYPTION_KEY` puede descifrar estos datos.

### Integridad de certificados
- **Firma HMAC-SHA256**: al emitir un certificado, el sistema crea un hash criptográfico del payload (nombre, CURP, curso, calificación, fecha, folio). Este hash se almacena junto al certificado.
- **Comparación en tiempo constante**: al verificar un certificado, el sistema recalcula el hash y lo compara usando un algoritmo resistente a ataques de temporización (timing attacks), que son una técnica avanzada de ataque que mide el tiempo de respuesta para inferir si una firma es válida.
- Si un atacante modifica cualquier dato del certificado en la base de datos (nombre, calificación, fecha), la firma dejará de coincidir y el certificado aparecerá como **inválido** en el portal de verificación.

### Protección contra ataques automatizados
- **Rate limiting en endpoints críticos**:
  - Login: máximo 5 intentos por IP cada 15 minutos (previene ataques de fuerza bruta)
  - Verificación pública: máximo 100 solicitudes por IP por hora (previene scraping masivo)
- Los límites se aplican por dirección IP y se reinician automáticamente.

### Cabeceras de seguridad HTTP
El servidor envía las siguientes cabeceras de seguridad en cada respuesta:

| Cabecera | Protección |
|---|---|
| `X-Frame-Options: DENY` | Previene ataques de clickjacking (iframes maliciosos) |
| `X-Content-Type-Options: nosniff` | Previene ataques de MIME-type sniffing |
| `Referrer-Policy: strict-origin-when-cross-origin` | Controla qué información de URL se comparte al navegar |
| `Content-Security-Policy` | Restringe qué scripts y recursos puede cargar la página (previene XSS) |
| `Permissions-Policy` | Desactiva acceso a cámara, micrófono y geolocalización |

### Gestión de claves criptográficas
La plataforma usa tres claves secretas distintas:
1. **`NEXTAUTH_SECRET`**: firma los tokens de sesión de usuarios
2. **`CERTIFICATE_SIGNING_KEY`**: firma los certificados digitales
3. **`ENCRYPTION_KEY`**: cifra los campos sensibles en la base de datos

Estas claves se generan con `crypto.randomBytes()` de Node.js (generador criptográficamente seguro) y nunca viajan por la red ni se incluyen en el código fuente.

### Base de datos segura
- Contraseñas de acceso a PostgreSQL configuradas por entorno
- Conexión local o SSL en producción
- Modelo de datos con relaciones y restricciones de integridad referencial
- Backups programables con `pg_dump`

### Registro de auditoría como capa de detección
Cada operación sensible genera una entrada en `AuditLog` con:
- Usuario que realizó la acción
- Tipo de acción (`CERT_ISSUED`, `CERT_REVOKED`, `LOGIN`, etc.)
- Entidad afectada (ID del certificado, alumno, etc.)
- Dirección IP
- Timestamp (UTC)
- Detalles adicionales en JSON

Esto permite detectar comportamientos anómalos (p.ej., un instructor emitiendo certificados fuera de horario desde una IP desconocida) y responder ante incidentes.

---

## Arquitectura tecnológica

### Stack principal

| Capa | Tecnología | Función |
|---|---|---|
| Frontend | Next.js 14 + React 18 + TypeScript | Interfaz de usuario moderna y segura |
| Estilos | Tailwind CSS + shadcn/ui | Diseño responsive y consistente |
| Backend | Next.js API Routes (Node.js 20) | Lógica de negocio y API REST |
| Autenticación | NextAuth.js 5 | Sesiones JWT con protección RBAC |
| ORM | Prisma 7 | Acceso seguro y tipado a la base de datos |
| Base de datos | PostgreSQL 16 | Almacenamiento relacional robusto |
| PDF | pdf-lib | Generación de certificados PDF en servidor |
| QR | qrcode | Generación de códigos QR de verificación |
| Email | Nodemailer (SMTP) | Entrega de certificados por correo |
| Criptografía | Node.js `crypto` nativo | AES-256-GCM, HMAC-SHA256 |
| Contenedores | Docker + Docker Compose | Entorno reproducible y portable |

### Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET / USUARIOS                       │
└──────────────┬───────────────────────────┬──────────────────────┘
               │                           │
    ┌──────────▼──────────┐    ┌───────────▼────────────┐
    │  Dashboard privado  │    │  Portal de verificación │
    │  (Admin/Instructor/ │    │       (Público)         │
    │      Alumno)        │    │   /verify?folio=XXX     │
    └──────────┬──────────┘    └───────────┬────────────┘
               │                           │
    ┌──────────▼───────────────────────────▼────────────┐
    │               NEXT.JS APP SERVER                    │
    │  ┌────────────────┐    ┌─────────────────────────┐ │
    │  │  Middleware     │    │      API Routes          │ │
    │  │  (Auth + RBAC) │    │  /api/certificates       │ │
    │  │  Rate Limiting │    │  /api/students           │ │
    │  └────────────────┘    │  /api/verify             │ │
    │                        │  /api/import             │ │
    │  ┌─────────────────────▼─────────────────────┐    │ │
    │  │              LIBRERÍAS CORE                │    │ │
    │  │  crypto/ → AES-256-GCM, HMAC-SHA256        │    │ │
    │  │  certificates/ → PDF, firma, folio         │    │ │
    │  │  email/ → Nodemailer SMTP                  │    │ │
    │  │  audit/ → Logger de acciones               │    │ │
    │  └─────────────────────┬─────────────────────┘    │ │
    └────────────────────────┼───────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │      POSTGRESQL 16           │
              │  Users, Students, Courses    │
              │  Enrollments, Certificates   │
              │  AuditLogs                   │
              │  (CURP cifrada con AES-256)  │
              └─────────────────────────────┘
```

---

## Proceso de verificación de un certificado (detalle técnico)

```
EMISIÓN (al crear el certificado):
1. Sistema toma: nombre alumno, CURP, curso, calificación, fecha, folio único
2. Serializa estos datos en JSON (payload)
3. Calcula HMAC-SHA256(payload, CERTIFICATE_SIGNING_KEY) → firma digital
4. Almacena: payload + firma en la tabla Certificate
5. Genera PDF con QR que apunta a /verify/{folio}
6. Envía PDF por correo al alumno

VERIFICACIÓN (cuando alguien escanea el QR):
1. Portal recibe el folio de la URL
2. Consulta la BD: obtiene el payload y la firma almacenada
3. Recalcula HMAC-SHA256(payload, CERTIFICATE_SIGNING_KEY)
4. Compara la firma recalculada vs la almacenada (en tiempo constante)
5. Si coinciden → certificado AUTÉNTICO ✓
   Si no coinciden → certificado ALTERADO ✗
   Si está revocado → certificado REVOCADO ✗
```

Un atacante que intente modificar los datos de un certificado directamente en la base de datos vería que su certificado "alterado" falla la verificación, ya que no tiene acceso a la clave de firma para recalcular la firma válida.

---

## Despliegue y operación

### Opciones de hosting
La plataforma puede desplegarse en:
- **Railway** (recomendado para inicio): despliegue con un clic, BD incluida, escalable
- **VPS (cualquier proveedor)**: Ubuntu 22.04 con Docker, control total
- **Supabase + Vercel**: BD en Supabase, app en Vercel (plan gratuito disponible)

### Requisitos mínimos de producción
- Node.js 20+
- PostgreSQL 16
- Cuenta SMTP (Gmail con contraseña de aplicación, SendGrid, Resend, etc.)
- Variables de entorno con claves criptográficas únicas y seguras
- HTTPS habilitado (obligatorio — los certificados viajan por correo)

### Mantenimiento
- **Backups automáticos**: se puede programar `pg_dump` diario
- **Monitoreo**: endpoint `/api/health` para verificar estado del sistema
- **Actualizaciones**: `pnpm install && pnpm prisma db push && pnpm build`

---

## Resumen ejecutivo

La Plataforma Pasitos transforma la gestión de certificados de formación de un proceso manual y vulnerable en un sistema digital seguro, automatizado y verificable públicamente.

**Lo que aporta:**
- Credibilidad institucional mediante certificados con firma criptográfica
- Eficiencia operativa al automatizar emisión, entrega y verificación
- Protección de datos sensibles (CURP) mediante cifrado AES-256-GCM
- Trazabilidad total con registro de auditoría de cada acción
- Escalabilidad sin costo adicional por volumen

**Lo que protege:**
- La reputación de Pasitos ante certificados falsificados
- Los datos personales de los alumnos (CURP, correo, historial)
- La integridad de los registros ante modificaciones no autorizadas
- La organización ante ataques automatizados con rate limiting

**Lo que simplifica:**
- El trabajo del instructor: registro, inscripción y emisión en minutos
- El trabajo del administrador: importación masiva, auditoría centralizada
- La experiencia del alumno: certificado en su correo con QR listo para compartir
- La verificación por terceros: cualquier persona puede confirmar autenticidad sin intermediarios

---

*Plataforma desarrollada para Pasitos Education & Health A.C.*
*Stack: Next.js 14 · PostgreSQL · Prisma · NextAuth.js · pdf-lib · AES-256-GCM · HMAC-SHA256*
