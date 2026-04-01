import { getUserIdFromAccessToken } from "@/lib/auth/jwt-user-id";
import { getRoleFromAccessToken } from "@/lib/auth/jwt-payload";

const ACCESS = "robomind_super_admin_access_token";
const REFRESH = "robomind_super_admin_refresh_token";
const USER_ID = "robomind_super_admin_user_id";
const DECLARED_ROLE = "robomind_super_admin_declared_role";

export type SuperAdminTokensOptions = {
  declaredRole?: string;
};

export function getSuperAdminAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS);
}

export function getSuperAdminRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH);
}

/** Кэш UUID супер-админа для заголовка x-user-id (бэкенд требует вместе с JWT). */
export function getSuperAdminUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID);
}

export function setSuperAdminTokens(
  access: string,
  refresh?: string | null,
  expiresInSeconds?: number,
  options?: SuperAdminTokensOptions,
): void {
  if (typeof window === "undefined") return;
  const role = getRoleFromAccessToken(access);
  if (role && role !== "super_admin") {
    clearSuperAdminTokens();
    throw new Error("Токен не для супер-администратора");
  }
  localStorage.setItem(ACCESS, access);
  if (refresh) localStorage.setItem(REFRESH, refresh);
  else localStorage.removeItem(REFRESH);
  const EX = "robomind_super_admin_expires_at";
  if (typeof expiresInSeconds === "number" && expiresInSeconds > 0) {
    localStorage.setItem(EX, String(Date.now() + expiresInSeconds * 1000));
  } else {
    localStorage.removeItem(EX);
  }
  const uid = getUserIdFromAccessToken(access);
  if (uid) localStorage.setItem(USER_ID, uid);
  if (options?.declaredRole != null && options.declaredRole !== "") {
    localStorage.setItem(DECLARED_ROLE, options.declaredRole);
  }
}

export function clearSuperAdminTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem("robomind_super_admin_expires_at");
  localStorage.removeItem(USER_ID);
  localStorage.removeItem(DECLARED_ROLE);
}

export function isSuperAdminAuthenticated(): boolean {
  const t = getSuperAdminAccessToken();
  if (!t) return false;
  const jwtRole = getRoleFromAccessToken(t);
  if (jwtRole === "super_admin") return true;
  if (jwtRole) return false;
  return (
    typeof window !== "undefined" &&
    localStorage.getItem(DECLARED_ROLE) === "super_admin"
  );
}
