import { requireRole, logAction, ok, err } from "@/lib/api/helpers";
import { parseExcelFile } from "@/lib/import/excel-parser";
import { prisma } from "@/lib/db";
import { encryptField, signCertificate } from "@/lib/crypto";
import { Role, EnrollmentResult } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return err("Se requiere un archivo Excel (.xlsx)");

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors: parseErrors, preview } = parseExcelFile(buffer);

  // If only preview requested
  if (formData.get("preview") === "true") {
    return ok({ preview, totalRows: rows.length + parseErrors.length, parseErrors });
  }

  let studentsCreated = 0;
  let studentsUpdated = 0;
  let enrollmentsCreated = 0;
  let certificatesImported = 0;
  const importErrors: { rowIndex: number; message: string }[] = [];

  for (const row of rows) {
    try {
      await prisma.$transaction(async (tx) => {
        // Find course by name
        const course = await tx.course.findFirst({
          where: { name: { equals: row.courseName, mode: "insensitive" } },
        });
        if (!course) throw new Error(`Curso no encontrado: "${row.courseName}"`);

        // Encrypt CURP
        const encryptedCurp = encryptField(row.curp);

        // Find or create StudentProfile by CURP
        let profile = await tx.studentProfile.findUnique({ where: { curp: encryptedCurp } });

        if (!profile) {
          // Find or create User by email
          let user = await tx.user.findUnique({ where: { email: row.email } });
          if (!user) {
            user = await tx.user.create({
              data: {
                email: row.email,
                passwordHash: await bcrypt.hash(row.curp.slice(0, 8), 12),
                name: row.fullName,
                role: Role.STUDENT,
              },
            });
          }

          profile = await tx.studentProfile.create({
            data: {
              userId: user.id,
              fullName: row.fullName,
              curp: encryptedCurp,
              birthDate: row.birthDate,
              educationLevel: row.educationLevel,
              email: row.email,
              institution: row.institution,
              jobTitle: row.jobTitle,
            },
          });
          studentsCreated++;
        } else {
          // Update profile with latest data
          await tx.studentProfile.update({
            where: { id: profile.id },
            data: {
              fullName: row.fullName,
              institution: row.institution,
              jobTitle: row.jobTitle,
            },
          });
          studentsUpdated++;
        }

        // Create enrollment
        const enrollment = await tx.enrollment.create({
          data: {
            studentProfileId: profile.id,
            courseId: course.id,
            module: row.module,
            startDate: row.startDate,
            endDate: row.endDate,
            score: row.score,
            result: row.result,
            observations: row.observations,
          },
        });
        enrollmentsCreated++;

        // Import existing certificate if present (no PDF regeneration)
        if (
          row.certificateNumber &&
          row.verificationFolio &&
          row.result === EnrollmentResult.PASSED
        ) {
          const existing = await tx.certificate.findUnique({
            where: { certificateNumber: row.certificateNumber },
          });

          if (!existing) {
            const issueDate = row.issueDate ?? new Date();
            const signaturePayload = {
              certificateNumber: row.certificateNumber,
              studentName: row.fullName,
              curp: row.curp,
              courseName: row.courseName,
              score: row.score?.toString() ?? "N/A",
              issueDate: issueDate.toISOString(),
              organizationId: "PASITOS-AC",
            };
            const digitalSignature = signCertificate(signaturePayload);

            await tx.certificate.create({
              data: {
                enrollmentId: enrollment.id,
                certificateNumber: row.certificateNumber,
                verificationFolio: row.verificationFolio,
                issueDate,
                digitalSignature,
                signaturePayload: JSON.stringify(signaturePayload),
              },
            });
            certificatesImported++;
          }
        }
      });
    } catch (e: unknown) {
      importErrors.push({
        rowIndex: row.rowIndex,
        message: e instanceof Error ? e.message : "Error desconocido",
      });
    }
  }

  await logAction({
    userId: session!.user.id,
    action: "IMPORT_COMPLETED",
    entity: "Import",
    details: {
      studentsCreated,
      studentsUpdated,
      enrollmentsCreated,
      certificatesImported,
      parseErrors: parseErrors.length,
      importErrors: importErrors.length,
    },
  });

  return ok({
    summary: {
      studentsCreated,
      studentsUpdated,
      enrollmentsCreated,
      certificatesImported,
      totalProcessed: rows.length,
      parseErrors: parseErrors.length,
      importErrors: importErrors.length,
    },
    parseErrors,
    importErrors,
  });
}
