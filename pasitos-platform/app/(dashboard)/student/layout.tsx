import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Award, LogOut } from "lucide-react";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-blue-900 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Pasitos Education &amp; Health A.C.</p>
            <p className="text-sm font-medium">{session.user.name}</p>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink href="/student" icon={<BookOpen className="w-4 h-4" />} label="Mis Cursos" />
            <NavLink href="/student/certificates" icon={<Award className="w-4 h-4" />} label="Mis Certificados" />
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-blue-300 hover:text-white hover:bg-blue-800 transition-colors">
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

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-blue-200 hover:text-white hover:bg-blue-800 transition-colors">
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
