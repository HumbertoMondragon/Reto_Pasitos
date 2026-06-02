"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, Award, UserCog,
  ClipboardList, Settings, Menu, X, LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin",              label: "Dashboard",      icon: LayoutDashboard },
  { href: "/admin/students",     label: "Estudiantes",    icon: Users },
  { href: "/admin/courses",      label: "Cursos",         icon: BookOpen },
  { href: "/admin/certificates", label: "Certificados",   icon: Award },
  { href: "/admin/users",        label: "Usuarios",       icon: UserCog },
  { href: "/admin/audit",        label: "Auditoría",      icon: ClipboardList },
  { href: "/admin/settings",     label: "Configuración",  icon: Settings },
];

const instructorLinks = [
  { href: "/instructor",          label: "Dashboard",        icon: LayoutDashboard },
  { href: "/instructor/students", label: "Mis Grupos",       icon: Users },
  { href: "/instructor/enroll",   label: "Registrar Alumno", icon: BookOpen },
];

interface SidebarProps {
  role: string;
  userName: string;
  userEmail?: string;
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = role === "ADMIN" ? adminLinks : instructorLinks;

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const nav = (
    <nav className="flex flex-col gap-0.5 mt-2">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/admin" && href !== "/instructor" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-150 rounded-r-lg",
              active
                ? "bg-[#EDE9FE] text-[#7C3AED] border-l-[3px] border-[#7C3AED] pl-[9px]"
                : "text-[#6B7280] hover:bg-[#F5F3FF] hover:text-[#6B21A8] border-l-[3px] border-transparent pl-[9px]"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full w-60 bg-white border-r border-[#E9D5FF] flex flex-col z-50 transition-transform duration-200",
        "md:translate-x-0 md:static md:flex",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#E9D5FF]">
        <p className="text-xl font-bold text-[#7C3AED] leading-none">Pasitos</p>
        <p className="text-[11px] text-[#6B7280] mt-0.5">Education &amp; Health A.C.</p>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-4">{nav}</div>

      {/* Footer: user + logout */}
      <div className="px-4 py-4 border-t border-[#E9D5FF]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#111827] truncate">{userName}</p>
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
              role === "ADMIN" ? "bg-[#EDE9FE] text-[#6B21A8]" : "bg-blue-100 text-blue-800"
            )}>
              {role === "ADMIN" ? "Administrador" : "Instructor"}
            </span>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 text-xs text-[#6B7280] hover:text-[#7C3AED] transition-colors w-full py-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-[#7C3AED] text-white p-2 rounded-lg shadow-pasitos-btn"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {sidebarContent}
    </>
  );
}
