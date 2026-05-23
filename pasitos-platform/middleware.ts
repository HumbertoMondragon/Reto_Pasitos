import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes — always accessible
  if (pathname.startsWith("/verify")) return NextResponse.next();
  if (pathname.startsWith("/api/health")) return NextResponse.next();

  // Auth-required routes
  const requiresAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/api/certificates") ||
    pathname.startsWith("/api/users") ||
    pathname.startsWith("/api/students") ||
    pathname.startsWith("/api/enrollments") ||
    pathname.startsWith("/api/courses") ||
    pathname.startsWith("/api/import") ||
    pathname.startsWith("/api/audit") ||
    pathname.startsWith("/api/admin");

  if (requiresAuth && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin-only routes
  const requiresAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/users") ||
    pathname.startsWith("/api/audit") ||
    pathname.startsWith("/api/admin");

  if (requiresAdmin && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)" ],
};
