import { parseJwtPayload } from "@/lib/auth/jwt-payload";

/**
 * Извлекает идентификатор пользователя из JWT access (claims: sub, userId, user_id).
 */
export function getUserIdFromAccessToken(access: string): string | null {
  const payload = parseJwtPayload(access);
  if (!payload) return null;
  if (typeof payload.sub === "string" && payload.sub.trim()) {
    return payload.sub.trim();
  }
  const u = payload.userId ?? payload.user_id;
  if (typeof u === "string" && u.trim()) return u.trim();
  return null;
}
