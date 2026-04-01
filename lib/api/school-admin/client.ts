import { getPublicApiBaseUrl } from "@/lib/env";
import {
  getSchoolAdminAccessToken,
  getSchoolAdminRefreshToken,
  setSchoolAdminTokens,
  clearSchoolAdminTokens,
} from "@/lib/auth/school-admin-tokens";
import { apiAuthRefresh } from "@/lib/api/auth-api";
import { parseJsonSafe, throwIfNotOk } from "@/lib/api/client";

export { parseJsonSafe, throwIfNotOk };

function buildUrl(path: string): string {
  const base = getPublicApiBaseUrl();
  if (!base) {
    throw new Error("Задайте NEXT_PUBLIC_API_BASE_URL");
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export type SchoolAdminFetchOptions = RequestInit & {
  skipAuth?: boolean;
  _authRetry?: boolean;
};

let schoolRefreshLock: Promise<boolean> | null = null;

async function tryRefreshSchoolAdmin(): Promise<boolean> {
  const rt = getSchoolAdminRefreshToken();
  if (!rt) return false;
  if (schoolRefreshLock) return schoolRefreshLock;
  schoolRefreshLock = (async () => {
    try {
      const next = await apiAuthRefresh(rt);
      setSchoolAdminTokens(next.access, next.refresh, next.expiresIn);
      return true;
    } catch {
      clearSchoolAdminTokens();
      return false;
    } finally {
      schoolRefreshLock = null;
    }
  })();
  return schoolRefreshLock;
}

export async function apiSchoolAdminFetch(
  path: string,
  options: SchoolAdminFetchOptions = {},
): Promise<Response> {
  const { skipAuth, _authRetry, ...init } = options;
  const headers = new Headers(init.headers);

  if (
    init.body &&
    typeof init.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && typeof window !== "undefined") {
    const token = getSchoolAdminAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
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
    getSchoolAdminRefreshToken()
  ) {
    const ok = await tryRefreshSchoolAdmin();
    if (ok) {
      return apiSchoolAdminFetch(path, { ...options, _authRetry: true });
    }
  }

  return res;
}
