import { PrismaClient, Role, EducationLevel, EnrollmentResult } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pasitos.org" },
    update: {},
    create: {
      email: "admin@pasitos.org",
      passwordHash: await bcrypt.hash("Admin2025!", 12),
      name: "Administrador Pasitos",
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@pasitos.org" },
    update: {},
    create: {
      email: "instructor@pasitos.org",
      passwordHash: await bcrypt.hash("Instructor2025!", 12),
      name: "Instructor Pasitos",
      role: Role.INSTRUCTOR,
      isActive: true,
    },
  });

  console.log("✓ Users created:", adminUser.email, instructorUser.email);

  // Courses
  const course1 = await prisma.course.upsert({
    where: { courseCode: "C-001" },
    update: {},
    create: {
      courseCode: "C-001",
      name: "Puericultura",
      courseType: "Capacitación Técnica",
      format: "Presencial/Online",
      durationHours: 80,
      modality: "Presencial/Online",
      description: "Curso de capacitación técnica en puericultura para el cuidado integral del niño.",
      isActive: true,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { courseCode: "C-002" },
    update: {},
    create: {
      courseCode: "C-002",
      name: "Asistente Educativo",
      courseType: "Capacitación Técnica",
      format: "Presencial/Online",
      durationHours: 80,
      modality: "Presencial/Online",
      description: "Formación técnica para asistentes educativos en centros de desarrollo infantil.",
      isActive: true,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { courseCode: "C-003" },
    update: {},
    create: {
      courseCode: "C-003",
      name: "Primeros Auxilios Pediátricos",
      courseType: "Taller Práctico",
      format: "Presencial/Online",
      durationHours: 50,
      modality: "Presencial/Online",
      description: "Taller práctico de primeros auxilios orientado a la atención pediátrica.",
      isActive: true,
    },
  });

  console.log("✓ Courses created:", course1.courseCode, course2.courseCode, course3.courseCode);

  // Students
  const studentData = [
    {
      email: "estudiante1@example.com",
      name: "María González López",
      curp: "GOLM900101MDFNRR01",
      birthDate: new Date("1990-01-01"),
      educationLevel: EducationLevel.BACHELOR,
      institution: "Guardería Arcoíris",
      jobTitle: "Educadora",
    },
    {
      email: "estudiante2@example.com",
      name: "Ana Martínez Ruiz",
      curp: "MARA850515MDFRTNN02",
      birthDate: new Date("1985-05-15"),
      educationLevel: EducationLevel.HIGH_SCHOOL,
      institution: "Centro Infantil Semillas",
      jobTitle: "Puericulturista",
    },
    {
      email: "estudiante3@example.com",
      name: "Laura Sánchez Torres",
      curp: "SATL920830MDFNRR03",
      birthDate: new Date("1992-08-30"),
      educationLevel: EducationLevel.TECHNICAL,
      institution: "Estancia Infantil Los Girasoles",
      jobTitle: "Asistente Educativo",
    },
  ];

  const courses = [course1, course2, course3];
  const students = [];

  for (let i = 0; i < studentData.length; i++) {
    const sd = studentData[i];
    const studentUser = await prisma.user.upsert({
      where: { email: sd.email },
      update: {},
      create: {
        email: sd.email,
        passwordHash: await bcrypt.hash("Estudiante2025!", 12),
        name: sd.name,
        role: Role.STUDENT,
        isActive: true,
      },
    });

    const profile = await prisma.studentProfile.upsert({
      where: { curp: sd.curp },
      update: {},
      create: {
        userId: studentUser.id,
        fullName: sd.name,
        curp: sd.curp,
        birthDate: sd.birthDate,
        educationLevel: sd.educationLevel,
        email: sd.email,
        institution: sd.institution,
        jobTitle: sd.jobTitle,
      },
    });

    students.push({ user: studentUser, profile });

    // Enrollment — one per student per course, all PASSED
    const startDate = new Date("2025-01-15");
    const endDate = new Date("2025-04-15");

    await prisma.enrollment.upsert({
      where: {
        id: `seed-enrollment-${i + 1}`,
      },
      update: {},
      create: {
        id: `seed-enrollment-${i + 1}`,
        studentProfileId: profile.id,
        courseId: courses[i].id,
        module: "Módulo Único",
        startDate,
        endDate,
        score: 9.0,
        result: EnrollmentResult.PASSED,
        observations: "Alumno con excelente desempeño.",
      },
    });
  }

  console.log("✓ Students and enrollments created:", students.length);
  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
