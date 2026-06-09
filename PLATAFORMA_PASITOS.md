# Plataforma Digital Pasitos
## Propuesta de Sistema de Certificados Digitales

**Presentado a: Pasitos Education & Health A.C.**

---

## ¿De qué trata esta propuesta?

Se desarrolló una plataforma web a medida para Pasitos que digitaliza y automatiza por completo el proceso de emitir, entregar y verificar los certificados de sus programas de formación.

El resultado: cada alumno recibe su certificado firmado digitalmente en su correo en segundos, con un código QR que cualquier empleador puede escanear para confirmar que es auténtico — sin llamar a Pasitos, sin correos de por medio, sin trámites.

---

## El problema que resuelve

Hoy en día, emitir un certificado en Pasitos probablemente implica:
- Diseñar o llenar un formato manualmente
- Imprimir, firmar y escanear el documento
- Enviarlo por correo o entregarlo en persona
- Responder llamadas o correos de empleadores preguntando si el certificado es válido
- Guardar expedientes en carpetas físicas o en archivos de Excel

Esto consume tiempo del equipo, no deja trazabilidad clara de quién emitió qué, y los certificados en papel o PDF sin firma son **fácilmente falsificables**.

---

## La solución en una sola imagen

```
ANTES                              DESPUÉS
──────────────────────────         ──────────────────────────────────
Diseñar certificado (manual)       Instructor llena formulario web
     ↓                                          ↓
Imprimir y firmar                  Sistema genera PDF automáticamente
     ↓                                          ↓
Escanear y enviar por correo       PDF con firma digital llega al alumno
     ↓                                          ↓
Guardar en carpeta / Excel         Todo queda en la base de datos
     ↓                                          ↓
Responder verificaciones           QR en el certificado: verificación
  por teléfono o correo              instantánea sin intermediarios

TIEMPO: 30–60 min por certificado  TIEMPO: 2–3 min por certificado
```

---

## El diferenciador: firma digital igual a la del SAT

Este es el punto más importante de la plataforma y lo que la distingue de simplemente enviar un PDF por correo.

### ¿Qué es la firma digital?

Cuando el SAT emite una factura electrónica (CFDI), le pone un **sello digital** — una cadena matemática única que prueba que esa factura es auténtica y que nadie la alteró. Si alguien modifica un solo dato, el sello deja de ser válido y la factura se detecta como falsa.

**La Plataforma Pasitos hace exactamente lo mismo con sus certificados.**

Cada certificado lleva impreso al final del documento:

```
──────────────────────────────────────────────────────────────────
Sello Digital — Pasitos Education & Health A.C.
Cadena original: ||PAC-2026-0001|María González|GOLM...|Puericultura|9.5|...|PASITOS-AC||
Sello digital (RSA-SHA256): U76AueeDipyIbFRWgaBDvjch2bkSwZq...ko08w==
```

### ¿Qué garantiza esto para Pasitos?

| Garantía | Qué significa en la práctica |
|---|---|
| **Autenticidad** | Solo Pasitos puede generar ese sello. Nadie más tiene la clave. |
| **Integridad** | Si alguien cambia el nombre o la calificación, el sello deja de ser válido. |
| **No repudio** | Pasitos no puede negar haber emitido un certificado que tiene su sello. |
| **Verificación libre** | Cualquier empresa puede verificarlo sin contactar a Pasitos. |

### ¿Cómo verifica alguien un certificado?

1. Escanea el QR del certificado con cualquier teléfono
2. Se abre una página con el nombre, curso, calificación y fecha
3. El sistema confirma si el sello digital es válido o no
4. En menos de 5 segundos, sin llamadas, sin correos

Esto eleva a Pasitos al mismo nivel de credibilidad que instituciones con sistemas de certificación formales.

---

## ¿Qué puede hacer la plataforma?

### Para el equipo de Pasitos

- **Registrar alumnos** con todos sus datos (CURP, nivel educativo, institución, cargo)
- **Importar alumnos desde Excel** para migrar datos existentes sin captura manual
- **Crear y administrar cursos** con código, modalidad, horas y descripción
- **Inscribir alumnos** en cursos y registrar cada módulo con su calificación y evidencia
- **Emitir certificados** con un clic — el PDF se genera y se envía automáticamente
- **Revocar certificados** si se emitieron por error, con motivo registrado
- **Consultar el historial completo** de cada alumno: qué cursó, cuándo, con qué calificación
- **Ver quién hizo qué y cuándo** a través del registro de auditoría

### Para los alumnos

- Reciben su certificado en su correo en segundos
- Pueden descargarlo en cualquier momento desde su panel
- El QR siempre funciona — no expira

### Para empleadores e instituciones externas

- Verifican la autenticidad escaneando el QR, sin registro ni cuenta
- Ven nombre completo, curso, duración, calificación y fecha de emisión
- Obtienen confirmación inmediata de si el sello digital es válido

---

## Roles del sistema

| Rol | Quién lo usaría en Pasitos | Qué puede hacer |
|---|---|---|
| **Administrador** | Dueño / dirección | Todo: usuarios, importaciones, auditoría, revocar certificados |
| **Instructor** | Personal que da los cursos | Registrar alumnos, inscribir, emitir certificados |
| **Alumno** | Cada persona certificada | Ver y descargar sus propios certificados |

---

## ¿Cuánto cuesta operar la plataforma?

### Costo mensual de operación (estimado)

| Opción de hospedaje | Costo mensual aprox. | Ideal para |
|---|---|---|
| **Railway** (recomendado) | $5 – $15 USD | Hasta ~500 certificados/mes |
| **VPS básico** (DigitalOcean, Hetzner) | $6 – $12 USD | Más control, misma capacidad |
| **Vercel + Supabase** | $0 – $25 USD | Empezar sin costo, escalar después |

No hay costo por número de certificados emitidos, por número de alumnos registrados ni por verificaciones realizadas.

### Costo del correo electrónico

| Opción | Costo | Límite |
|---|---|---|
| Gmail con contraseña de aplicación | Gratis | ~500 correos/día |
| Resend | Gratis hasta 3,000/mes | Recomendado si el volumen crece |

**Costo total mensual estimado para Pasitos: $5 – $15 USD al mes.**

---

## ¿Cuánto tiempo y dinero ahorra?

| Proceso | Tiempo estimado |
|---|---|
| Proceso manual actual | 30 – 60 minutos por certificado |
| Con la plataforma | 2 – 3 minutos por certificado |
| **Ahorro por certificado** | **~27 – 57 minutos** |

Si Pasitos emite **100 certificados al año**: ahorro de 45–95 horas de trabajo del equipo.

---

## Cumplimiento legal

### Ley Federal de Protección de Datos Personales (LFPDPPP)

La plataforma cumple con la obligación de proteger datos personales sensibles mediante:

- **CURP cifrada** con AES-256-GCM en la base de datos
- **Contraseñas hasheadas** — nunca en texto plano
- **Registro de auditoría** — trazabilidad de accesos
- **Control de acceso por roles** — cada usuario solo ve lo que le corresponde
- **HTTPS obligatorio** en producción

### ¿Los certificados tienen validez legal?

Los certificados son documentos de formación privada. La firma RSA no los convierte en títulos oficiales SEP, pero sí:
- Prueba criptográficamente que Pasitos los emitió
- Los protege ante falsificaciones
- Eleva la credibilidad institucional al nivel de empresas con certificación formal

---

## Seguridad

| Qué protege | Cómo |
|---|---|
| Certificados contra falsificación | Firma digital RSA-2048 (mismo nivel que el SAT) |
| CURP de los alumnos | Cifrado AES-256-GCM |
| Contraseñas del equipo | Hash bcrypt 12 rondas |
| Sesiones de usuario | Tokens JWT firmados |
| Accesos no autorizados | Control de roles estricto |
| Ataques de fuerza bruta | Límite de 5 intentos de login por IP / 15 min |
| Datos en tránsito | HTTPS obligatorio |
| Trazabilidad | Log de auditoría completo |

---

## Plan de mantenimiento

### Operación diaria (sin intervención técnica)
El equipo de Pasitos opera la plataforma completamente desde el navegador — sin conocimiento técnico.

### Mantenimiento técnico

| Tarea | Frecuencia |
|---|---|
| Actualizar dependencias de seguridad | Cada 3–6 meses |
| Backup de la base de datos | Automático o semanal |
| Renovar certificado HTTPS | Cada 90 días (automático) |
| Regenerar claves RSA | Solo si se sospecha compromiso |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida de clave privada RSA | Guardar en gestor de contraseñas (Bitwarden, 1Password). Certs anteriores siguen válidos. |
| Caída del servidor | Hosting con SLA. Backup diario de BD. |
| Brecha de datos | CURPs y contraseñas cifradas. Auditoría de accesos. HTTPS. |
| Correo en spam | Configurar SPF/DKIM en el dominio de Pasitos. |

---

## Comparativa

| Opción | Costo | Firma digital | Control de datos |
|---|---|---|---|
| **Plataforma Pasitos** | ~$10 USD/mes | RSA-2048 (nivel SAT) | Total — datos propios |
| Canva / Word + correo manual | $0–15 USD/mes | Ninguna | Disperso en correos |
| Coursera for Business | $250–500 USD/mes | Sí | En servidores externos |
| Docusign / Adobe Sign | $30–50 USD/mes | Sí | No aplica a certificados |

---

## Hoja de ruta

- Reportes y estadísticas por curso, instructor y mes
- Notificaciones por WhatsApp Business
- App móvil para alumnos
- Múltiples plantillas de certificado por tipo de curso
- Firma electrónica avanzada (NOM-151) si Pasitos busca validez oficial

---

## Resumen para la toma de decisión

| Pregunta | Respuesta |
|---|---|
| ¿Qué es? | Sistema web de gestión y certificación digital con firma RSA |
| ¿Cuánto cuesta operar? | ~$5–15 USD al mes |
| ¿Cuánto ahorra? | 45–95 horas por cada 100 certificados |
| ¿Es seguro? | Mismo nivel criptográfico que el SAT para las facturas |
| ¿Cumple la ley? | Sí — LFPDPPP, datos cifrados, auditoría, control de acceso |
| ¿Necesita mantenimiento constante? | No — mantenimiento técnico cada 3–6 meses |
| ¿Puede crecer con Pasitos? | Sí — soporta miles de alumnos y funcionalidades futuras |

---

*Plataforma desarrollada a medida para Pasitos Education & Health A.C.*
*Tecnologías: Next.js · PostgreSQL · RSA-2048 · AES-256-GCM · HMAC-SHA256*
