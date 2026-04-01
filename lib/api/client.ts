import { getPublicApiBaseUrl } from "@/lib/env";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/lib/auth/tokens";
import { apiAuthRefresh } from "@/lib/api/auth-api";
import { ApiRequestError } from "@/lib/api/types";

function buildUrl(path: string): string {
  const base = getPublicApiBaseUrl();
  if (!base) {
    throw new Error(
      "Задайте NEXT_PUBLIC_API_BASE_URL (см. .env.example и docs/API-STUDENT-PANEL.md)",
    );
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export type FetchOptions = RequestInit & {
  skipAuth?: boolean;
  _authRetry?: boolean;
};

let studentRefreshPromise: Promise<boolean> | null = null;

async function tryRefreshStudentTokens(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  if (studentRefreshPromise) return studentRefreshPromise;
  studentRefreshPromise = (async () => {
    try {
      const next = await apiAuthRefresh(rt);
      setTokens(next.access, next.refresh, next.expiresIn);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      studentRefreshPromise = null;
    }
  })();
  return studentRefreshPromise;
}

export async function apiFetch(
  path: string,
  options: FetchOptions = {},
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
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      const devId = process.env.NEXT_PUBLIC_DEV_USER_ID?.trim();
      if (devId) {
        headers.set("x-user-id", devId);
      }
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
    getRefreshToken()
  ) {
    const refreshed = await tryRefreshStudentTokens();
    if (refreshed) {
      return apiFetch(path, { ...options, _authRetry: true });
    }
  }

  return res;
}

export async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function errorMessageFromResponse(res: Response, body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
    if (Array.isArray(m) && m.length > 0) {
      return m
        .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
        .join("; ");
    }
  }
  if (res.statusText) return res.statusText;
  return `HTTP ${res.status}`;
}

export async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await parseJsonSafe<unknown>(res);
  throw new ApiRequestError(
    errorMessageFromResponse(res, body),
    res.status,
    body,
  );
}
