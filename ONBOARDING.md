# Pasitos Platform — Guía de Onboarding

Guía paso a paso para poner en producción la plataforma de certificados digitales de Pasitos Education & Health A.C.

---

## Paso 1: Configurar servidor / hosting

**Opción A — Railway (recomendada)**

1. Crear cuenta en [railway.app](https://railway.app)
2. Crear nuevo proyecto → "Deploy from GitHub repo"
3. Seleccionar el repositorio `pasitos-platform`
4. Railway detecta Next.js automáticamente

**Opción B — Servidor propio / VPS**

1. Instalar Docker y Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo apt install docker-compose-plugin
   ```
2. Clonar el repositorio en el servidor
3. Seguir el resto de pasos con Docker Compose

---

## Paso 2: Configurar base de datos

**Con Railway:**
1. En tu proyecto de Railway → "New Service" → "Database" → PostgreSQL
2. Railway crea la BD y expone `DATABASE_URL` automáticamente

**Con Docker Compose:**
```bash
# La BD se crea automáticamente al levantar el stack
docker compose up -d db
```

**Con Supabase (alternativa gratuita):**
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a Settings → Database → Connection String → copiar URI

---

## Paso 3: Generar y guardar claves criptográficas

Este es el paso más importante. Las claves generadas aquí protegen todos los certificados.

```bash
node scripts/generate-keys.js
```

El script imprime tres valores. **Guárdalos AHORA en un gestor de contraseñas** (Bitwarden, 1Password, KeePass) antes de continuar:

| Variable | Uso | Qué pasa si se pierde |
|---|---|---|
| `NEXTAUTH_SECRET` | Firma los JWT de sesión | Las sesiones activas se invalidan |
| `CERTIFICATE_SIGNING_KEY` | Firma digital de certificados | Los certificados existentes no verifican |
| `ENCRYPTION_KEY` | Cifra la CURP en la BD | La CURP de los estudiantes no se puede descifrar |

---

## Paso 4: Configurar variables de entorno

Crea el archivo `.env` (nunca subir a git):

```bash
cp .env.example .env
```

Editar `.env` con los valores reales:

```env
# Base de datos — obtenida en el Paso 2
DATABASE_URL=postgresql://usuario:contraseña@host:5432/pasitos
DIRECT_DATABASE_URL=postgresql://usuario:contraseña@host:5432/pasitos

# NextAuth — obtenida en el Paso 3
NEXTAUTH_SECRET=<valor del generate-keys.js>
NEXTAUTH_URL=https://tu-dominio.com

# Certificados — obtenida en el Paso 3
CERTIFICATE_SIGNING_KEY=<valor del generate-keys.js>
ENCRYPTION_KEY=<valor del generate-keys.js>

# URL pública (aparece en los QR de los certificados)
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com

# Email SMTP (opcional pero recomendado)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=pasitos@tu-dominio.com
SMTP_PASSWORD=<contraseña de aplicación>
```

**Configuración SMTP con Gmail:**
1. Activar verificación en 2 pasos en la cuenta de Google
2. Ir a Seguridad → "Contraseñas de aplicaciones"
3. Generar contraseña para "Correo" → usar en `SMTP_PASSWORD`

---

## Paso 5: Ejecutar migraciones y seed

```bash
# Con Prisma local dev server (desarrollo)
npx prisma dev        # Terminal 1
npx prisma db push    # Terminal 2
npx prisma db seed    # Terminal 2

# En producción (Railway/servidor con acceso directo a la BD)
npx prisma db push
npx prisma db seed
```

El seed crea:
- Usuario admin: `admin@pasitos.org` / `Admin2025!`
- Usuario instructor: `instructor@pasitos.org` / `Instructor2025!`
- Los 3 cursos del catálogo (C-001, C-002, C-003)

**Cambiar contraseñas inmediatamente después del primer login.**

---

## Paso 6: Importar datos del Excel existente

1. Acceder al panel de administración: `https://tu-dominio.com/admin`
2. Ir a **Importar** en el menú lateral
3. Arrastrar el archivo Excel de Pasitos (formato .xlsx)
4. Revisar la vista previa de las primeras 5 filas
5. Verificar que no haya errores de validación (CURP de 18 chars, email válido, etc.)
6. Clic en **Importar X filas**
7. Descargar el reporte de errores si hubo filas omitidas

El Excel debe tener estas columnas (hoja "Registro de Inscripciones"):
- Nombre Completo, CURP, Fecha de Nacimiento, Último Grado de Estudio
- Correo Electrónico, Institución/Guardería, Cargo o Puesto
- Curso, Módulo, Fecha de Inicio, Fecha de Término
- Calificación, Resultado, No. de Certificado, Fecha de Emisión
- Folio Verificación, Observaciones

---

## Paso 7: Configurar correo SMTP

Para que los certificados se envíen por email al emitirlos:

1. Configurar las variables `SMTP_*` en el `.env` (ver Paso 4)
2. Probar el envío desde el panel admin:
   ```
   GET /api/email/test  (solo en desarrollo)
   ```
3. Verificar que llegue el email de prueba

Si no configuras SMTP, los certificados se emiten igual pero sin envío de email. Puedes reenviar manualmente desde el perfil del estudiante.

---

## Paso 8: Probar verificación de certificado

1. Emitir un certificado de prueba:
   - Admin → Estudiantes → seleccionar un estudiante con inscripción PASSED
   - Clic en "Emitir cert." junto a la inscripción

2. Verificar el certificado de dos formas:
   - **Via QR:** Escanear el QR del PDF con un celular
   - **Manual:** Ir a `https://tu-dominio.com/verify` e ingresar el folio

3. Debe mostrar pantalla verde con "✓ Certificado Auténtico y Válido"

4. Verificar integridad completa:
   - Admin → Configuración → "Verificar integridad"
   - Debe mostrar todos los certificados como válidos

---

## Verificación final — checklist

- [ ] App accesible en `https://tu-dominio.com`
- [ ] Login funciona con admin y instructor
- [ ] Base de datos conectada (Admin → Configuración → Estado del Sistema)
- [ ] Variables de entorno configuradas sin faltantes
- [ ] Datos importados desde Excel
- [ ] Al menos un certificado emitido y verificado via QR
- [ ] Email SMTP funcionando (si aplica)
- [ ] Contraseñas del seed cambiadas por contraseñas seguras
- [ ] Backups programados (`scripts/backup.sh`)
- [ ] Claves guardadas en gestor de contraseñas

---

## Contacto y soporte

Para preguntas sobre la plataforma o ajustes al diseño del certificado,
contactar al equipo técnico con acceso al repositorio.

**No compartir** las claves del Paso 3 por canales no cifrados (WhatsApp, email normal).
