import { prisma } from "@/lib/db";

export const AuditAction = {
  AUTH_LOGIN: "AUTH_LOGIN",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  AUTH_FAILED: "AUTH_FAILED",
  CERT_ISSUED: "CERT_ISSUED",
  CERT_REVOKED: "CERT_REVOKED",
  CERT_VIEWED: "CERT_VIEWED",
  CERT_DOWNLOADED: "CERT_DOWNLOADED",
  CERT_EMAIL_RESENT: "CERT_EMAIL_RESENT",
  STUDENT_CREATED: "STUDENT_CREATED",
  STUDENT_UPDATED: "STUDENT_UPDATED",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  IMPORT_STARTED: "IMPORT_STARTED",
  IMPORT_COMPLETED: "IMPORT_COMPLETED",
  COURSE_CREATED: "COURSE_CREATED",
  COURSE_UPDATED: "COURSE_UPDATED",
  ENROLLMENT_CREATED: "ENROLLMENT_CREATED",
  ENROLLMENT_UPDATED: "ENROLLMENT_UPDATED",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? undefined;
}

export async function logAuditAction(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: object;
  request?: Request;
}) {
  const ipAddress = params.request ? getClientIp(params.request) : undefined;
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details as object,
        ipAddress,
      },
    });
  } catch {
    // audit failures must not break the main flow
  }
}
