import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") redirect("/login");

  const name  = session.user.name ?? session.user.email ?? "I";
  const email = session.user.email ?? "";
  const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div className="flex h-screen bg-[#F9F7FF] overflow-hidden">
      <Sidebar role="INSTRUCTOR" userName={name} userEmail={email} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-[#E9D5FF] px-6 flex items-center justify-between md:pl-6 pl-16 shadow-[0_1px_3px_rgba(124,58,237,0.06)]">
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[#111827] leading-tight">{name}</p>
              <p className="text-xs text-[#6B7280] leading-tight">{email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
            <span className="badge-instructor hidden sm:inline-flex">INSTRUCTOR</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
