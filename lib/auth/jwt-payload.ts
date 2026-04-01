/**
 * Декодирует payload JWT access (без проверки подписи — только для клиентских проверок роли).
 */
export function parseJwtPayload(access: string): Record<string, unknown> | null {
  try {
    const parts = access.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as Record<string, unknown>;
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

/** Роль из JWT: `role`, `role_name` или первый элемент `roles[]`. */
export function getRoleFromAccessToken(access: string): string | null {
  const payload = parseJwtPayload(access);
  if (!payload) return null;
  const r = payload.role ?? payload.role_name;
  if (typeof r === "string" && r.trim()) return r.trim();
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    const first = payload.roles[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return null;
}
