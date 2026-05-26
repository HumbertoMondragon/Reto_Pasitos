import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EmitCertForm from "@/components/emit-cert-form";

interface Props {
  params: { id: string; enrollmentId: string };
}

export default async function AdminEmitCertPage({ params }: Props) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: params.enrollmentId },
    include: {
      studentProfile: { select: { id: true, fullName: true } },
      course:         { select: { name: true } },
      certificate:    { select: { id: true } },
    },
  });

  if (!enrollment || enrollment.studentProfile.id !== params.id) notFound();
  if (enrollment.certificate) {
    return (
      <div className="max-w-xl space-y-4">
        <p className="text-sm text-gray-600">Este estudiante ya tiene un certificado emitido para este curso.</p>
        <Link href={`/admin/students/${params.id}`} className="text-blue-600 hover:underline text-sm">
          ← Volver al perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/students/${params.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emitir Certificado</h1>
          <p className="text-sm text-gray-500">Completa los datos del curso antes de emitir</p>
        </div>
      </div>

      <EmitCertForm
        enrollmentId={params.enrollmentId}
        studentName={enrollment.studentProfile.fullName}
        courseName={enrollment.course.name}
        backHref={`/admin/students/${params.id}`}
      />
    </div>
  );
}
