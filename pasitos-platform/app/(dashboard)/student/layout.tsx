import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Award, LogOut } from "lucide-react";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  const name = session.user.name ?? session.user.email ?? "Alumno";
  const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F9F7FF]">
      <header className="bg-white border-b border-[#E9D5FF] shadow-[0_1px_3px_rgba(124,58,237,0.06)]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-[#7C3AED] leading-none">Pasitos</p>
            <p className="text-[10px] text-[#6B7280]">Education &amp; Health A.C.</p>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/student"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#6B7280] hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Cursos</span>
            </Link>
            <Link
              href="/student/certificates"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#6B7280] hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-colors"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Certificados</span>
            </Link>
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-[#E9D5FF]">
              <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="text-xs text-[#6B7280] hidden sm:block max-w-[120px] truncate">{name}</span>
            </div>
            <form action="/api/auth/signout" method="POST" className="ml-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#6B7280] hover:bg-[#EDE9FE] hover:text-[#7C3AED] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
