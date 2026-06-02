import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EnrollExistingForm from "@/components/enroll-existing-form";

interface Props { params: { studentId: string } }

export default async function InstructorEnrollStudentPage({ params }: Props) {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: params.studentId },
    select: { id: true, fullName: true, email: true },
  });

  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/instructor/students" className="text-[#9CA3AF] hover:text-[#6B7280]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Nueva Inscripción</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Inscribe al alumno en un curso adicional</p>
        </div>
      </div>

      <EnrollExistingForm
        studentProfileId={profile.id}
        studentName={profile.fullName}
        backHref="/instructor/students"
      />
    </div>
  );
}
