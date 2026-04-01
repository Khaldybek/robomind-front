import { getPublicApiBaseUrl } from "@/lib/env";
import { ApiRequestError } from "@/lib/api/types";

export type AuthLoginUser = {
  id: string;
  role: string;
  email: string;
  firstName?: string;
  lastName?: string;
  schoolId?: string | null;
};

/** Ответ POST /auth/login и POST /auth/refresh */
export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user?: AuthLoginUser;
};

export type ParsedTokens = {
  access: string;
  refresh: string | null;
  expiresIn?: number;
};

export function parseAuthTokenPayload(data: Record<string, unknown>): ParsedTokens {
  const access = String(
    data.accessToken ?? data.access_token ?? "",
  ).trim();
  const r = data.refreshToken ?? data.refresh_token;
  const refresh =
    r != null && String(r).length > 0 ? String(r) : null;
  const expiresIn =
    typeof data.expiresIn === "number" ? data.expiresIn : undefined;
  return { access, refresh, expiresIn };
}

function parseErrorBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** Ротация refresh: новая пара токенов */
export async function apiAuthRefresh(refreshToken: string): Promise<ParsedTokens> {
  const base = getPublicApiBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL");

  const res = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const text = await res.text();
  const raw = (parseErrorBody(text) as Record<string, unknown>) ?? {};

  if (!res.ok) {
    const msg =
      (typeof raw.message === "string" && raw.message) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiRequestError(msg, res.status, raw);
  }

  const parsed = parseAuthTokenPayload(raw);
  if (!parsed.access) {
    throw new Error("В ответе refresh нет accessToken");
  }
  return parsed;
}

/** Отзыв текущей refresh-сессии (204) */
export async function apiAuthLogout(refreshToken?: string | null): Promise<void> {
  const base = getPublicApiBaseUrl();
  if (!base) return;
  try {
    await fetch(`${base}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        refreshToken ? { refreshToken } : {},
      ),
    });
  } catch {
    /* сеть — всё равно чистим локально */
  }
}

/** Все refresh-сессии пользователя (204) */
export async function apiAuthLogoutAll(accessToken: string): Promise<void> {
  const base = getPublicApiBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL");

  const res = await fetch(`${base}/auth/logout-all`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    const raw = parseErrorBody(text);
    throw new ApiRequestError(
      typeof raw === "object" &&
        raw &&
        "message" in raw &&
        typeof (raw as { message: string }).message === "string"
        ? (raw as { message: string }).message
        : res.statusText,
      res.status,
      raw,
    );
  }
}

export function parseLoginResponse(
  data: Record<string, unknown>,
): ParsedTokens & { user?: AuthLoginUser } {
  const tokens = parseAuthTokenPayload(data);
  let user: AuthLoginUser | undefined;
  if (data.user && typeof data.user === "object") {
    const u = data.user as Record<string, unknown>;
    user = {
      id: String(u.id ?? ""),
      role: String(u.role ?? ""),
      email: String(u.email ?? ""),
      firstName:
        u.firstName != null
          ? String(u.firstName)
          : u.first_name != null
            ? String(u.first_name)
            : undefined,
      lastName:
        u.lastName != null
          ? String(u.lastName)
          : u.last_name != null
            ? String(u.last_name)
            : undefined,
      schoolId:
        u.schoolId != null
          ? String(u.schoolId)
          : u.school_id != null
            ? String(u.school_id)
            : null,
    };
  }
  return { ...tokens, user };
}
