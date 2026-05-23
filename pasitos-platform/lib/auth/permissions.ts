import { Role } from "@prisma/client";

export function canIssueCertificates(role: string): boolean {
  return role === Role.ADMIN || role === Role.INSTRUCTOR;
}

export function canManageUsers(role: string): boolean {
  return role === Role.ADMIN;
}

export function canViewAllStudents(role: string): boolean {
  return role === Role.ADMIN || role === Role.INSTRUCTOR;
}
