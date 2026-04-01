import { getPublicApiBaseUrl } from "@/lib/env";
import {
  getSuperAdminAccessToken,
  getSuperAdminRefreshToken,
  getSuperAdminUserId,
  setSuperAdminTokens,
  clearSuperAdminTokens,
} from "@/lib/auth/super-admin-tokens";
import { getUserIdFromAccessToken } from "@/lib/auth/jwt-user-id";
import { apiAuthRefresh } from "@/lib/api/auth-api";
import { parseJsonSafe, throwIfNotOk } from "@/lib/api/client";

export { parseJsonSafe, throwIfNotOk };

function buildUrl(path: string): string {
  const base = getPublicApiBaseUrl();
  if (!base) throw new Error("Задайте NEXT_PUBLIC_API_BASE_URL");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export type SuperAdminFetchOptions = RequestInit & {
  skipAuth?: boolean;
  _authRetry?: boolean;
};

let superRefreshLock: Promise<boolean> | null = null;

async function tryRefreshSuperAdmin(): Promise<boolean> {
  const rt = getSuperAdminRefreshToken();
  if (!rt) return false;
  if (superRefreshLock) return superRefreshLock;
  superRefreshLock = (async () => {
    try {
      const next = await apiAuthRefresh(rt);
      setSuperAdminTokens(next.access, next.refresh, next.expiresIn);
      return true;
    } catch {
      clearSuperAdminTokens();
      return false;
    } finally {
      superRefreshLock = null;
    }
  })();
  return superRefreshLock;
}

export async function apiSuperAdminFetch(
  path: string,
  options: SuperAdminFetchOptions = {},
): Promise<Response> {
  const { skipAuth, _authRetry, ...init } = options;
  const headers = new Headers(init.headers);

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (
    init.body &&
    typeof init.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (isFormData) {
    headers.delete("Content-Type");
  }

  if (!skipAuth && typeof window !== "undefined") {
    const token = getSuperAdminAccessToken();
    const xUserId =
      getSuperAdminUserId() ||
      (token ? getUserIdFromAccessToken(token) : null);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    /** Бэкенд: x-user-id обязателен без JWT; с JWT часто тоже нужен для сопоставления актора */
    if (xUserId) {
      headers.set("x-user-id", xUserId);
    }
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (
    res.status === 401 &&
    !skipAuth &&
    !_authRetry &&
    typeof window !== "undefined" &&
    getSuperAdminRefreshToken()
  ) {
    const ok = await tryRefreshSuperAdmin();
    if (ok) {
      return apiSuperAdminFetch(path, { ...options, _authRetry: true });
    }
  }

  return res;
}
