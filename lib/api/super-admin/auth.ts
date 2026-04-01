import { getPublicApiBaseUrl } from "@/lib/env";
import {
  parseLoginResponse,
  type AuthLoginUser,
} from "@/lib/api/auth-api";
import { getRoleFromAccessToken } from "@/lib/auth/jwt-payload";
import { setSuperAdminTokens } from "@/lib/auth/super-admin-tokens";

export async function loginSuperAdmin(
  email: string,
  password: string,
): Promise<{
  access: string;
  refresh: string | null;
  expiresIn?: number;
  user?: AuthLoginUser;
}> {
  const base = getPublicApiBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL");

  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }

  if (!res.ok) {
    const msg =
      (typeof data.message === "string" && data.message) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const parsed = parseLoginResponse(data);
  if (!parsed.access) throw new Error("Нет accessToken в ответе");

  const userRole = parsed.user?.role?.trim();
  const jwtRole = getRoleFromAccessToken(parsed.access);
  if (userRole && userRole !== "super_admin") {
    throw new Error(
      `Доступ только для супер-администратора (роль в ответе: ${userRole})`,
    );
  }
  if (jwtRole && jwtRole !== "super_admin") {
    throw new Error(
      `Доступ только для супер-администратора (роль в JWT: ${jwtRole})`,
    );
  }
  if (!userRole && !jwtRole) {
    throw new Error(
      "Не удалось определить роль: нужен user.role в ответе или claim role в JWT",
    );
  }

  return {
    access: parsed.access,
    refresh: parsed.refresh,
    expiresIn: parsed.expiresIn,
    user: parsed.user,
  };
}

export function persistSuperAdminSession(
  access: string,
  refresh: string | null,
  expiresInSeconds?: number,
  declaredRole?: string,
): void {
  setSuperAdminTokens(access, refresh, expiresInSeconds, {
    declaredRole,
  });
}
