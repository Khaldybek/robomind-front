const ACCESS = "robomind_access_token";
const REFRESH = "robomind_refresh_token";
const ACCESS_EXPIRES_AT = "robomind_access_expires_at";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH);
}

/**
 * expiresIn — TTL access в секундах (сервер); сохраняем время истечения для UI/проактивного refresh.
 */
export function setTokens(
  access: string,
  refresh?: string | null,
  expiresInSeconds?: number,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS, access);
  if (refresh) localStorage.setItem(REFRESH, refresh);
  else localStorage.removeItem(REFRESH);
  if (typeof expiresInSeconds === "number" && expiresInSeconds > 0) {
    localStorage.setItem(
      ACCESS_EXPIRES_AT,
      String(Date.now() + expiresInSeconds * 1000),
    );
  } else {
    localStorage.removeItem(ACCESS_EXPIRES_AT);
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(ACCESS_EXPIRES_AT);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
