"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, Award, UserCog, ClipboardList, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Estudiantes", icon: Users },
  { href: "/admin/courses", label: "Cursos", icon: BookOpen },
  { href: "/admin/certificates", label: "Certificados", icon: Award },
  { href: "/admin/users", label: "Usuarios", icon: UserCog },
  { href: "/admin/audit", label: "Auditoría", icon: ClipboardList },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

const instructorLinks = [
  { href: "/instructor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/instructor/students", label: "Mis Grupos", icon: Users },
  { href: "/instructor/enroll", label: "Registrar Alumno", icon: BookOpen },
];

interface SidebarProps {
  role: string;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = role === "ADMIN" ? adminLinks : instructorLinks;

  const nav = (
    <nav className="flex flex-col gap-1 mt-2">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/admin" && href !== "/instructor" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-blue-700 text-white"
                : "text-blue-100 hover:bg-blue-700/50"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-900 text-white p-2 rounded-lg shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-60 bg-blue-900 text-white flex flex-col z-50 transition-transform duration-200",
          "md:translate-x-0 md:static md:flex",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 py-5 border-b border-blue-800">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Pasitos Platform</p>
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <span className="text-xs text-blue-300">{role === "ADMIN" ? "Administrador" : "Instructor"}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
        <div className="px-4 py-4 border-t border-blue-800">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-sm text-blue-300 hover:text-white text-left py-1 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
