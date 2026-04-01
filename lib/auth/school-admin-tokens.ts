import { getRoleFromAccessToken } from "@/lib/auth/jwt-payload";

const ACCESS = "robomind_school_admin_access_token";
const REFRESH = "robomind_school_admin_refresh_token";
/** Роль с последнего успешного логина, если в JWT ещё нет claim `role`. */
const DECLARED_ROLE = "robomind_school_admin_declared_role";

export type SchoolAdminTokensOptions = {
  declaredRole?: string;
};

export function getSchoolAdminAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS);
}

export function getSchoolAdminRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH);
}

export function setSchoolAdminTokens(
  access: string,
  refresh?: string | null,
  expiresInSeconds?: number,
  options?: SchoolAdminTokensOptions,
): void {
  if (typeof window === "undefined") return;
  const role = getRoleFromAccessToken(access);
  if (role && role !== "school_admin") {
    clearSchoolAdminTokens();
    throw new Error("Токен не для администратора школы");
  }
  localStorage.setItem(ACCESS, access);
  if (refresh) localStorage.setItem(REFRESH, refresh);
  else localStorage.removeItem(REFRESH);
  const EX = "robomind_school_admin_expires_at";
  if (typeof expiresInSeconds === "number" && expiresInSeconds > 0) {
    localStorage.setItem(EX, String(Date.now() + expiresInSeconds * 1000));
  } else {
    localStorage.removeItem(EX);
  }
  if (options?.declaredRole != null && options.declaredRole !== "") {
    localStorage.setItem(DECLARED_ROLE, options.declaredRole);
  }
}

export function clearSchoolAdminTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem("robomind_school_admin_expires_at");
  localStorage.removeItem(DECLARED_ROLE);
}

export function isSchoolAdminAuthenticated(): boolean {
  const t = getSchoolAdminAccessToken();
  if (!t) return false;
  const jwtRole = getRoleFromAccessToken(t);
  if (jwtRole === "school_admin") return true;
  if (jwtRole) return false;
  return (
    typeof window !== "undefined" &&
    localStorage.getItem(DECLARED_ROLE) === "school_admin"
  );
}
