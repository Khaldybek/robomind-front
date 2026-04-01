import { getPublicApiBaseUrl } from "@/lib/env";
import {
  parseLoginResponse,
  type AuthLoginUser,
} from "@/lib/api/auth-api";
import { getRoleFromAccessToken } from "@/lib/auth/jwt-payload";
import { setSchoolAdminTokens } from "@/lib/auth/school-admin-tokens";

export async function loginSchoolAdmin(
  email: string,
  password: string,
): Promise<{
  access: string;
  refresh: string | null;
  expiresIn?: number;
  user: AuthLoginUser;
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
  if (!parsed.access) {
    throw new Error("В ответе нет accessToken");
  }
  if (!parsed.user || parsed.user.role !== "school_admin") {
    throw new Error(
      "Вход только для администратора школы (ожидается role: school_admin)",
    );
  }
  const jwtRole = getRoleFromAccessToken(parsed.access);
  if (jwtRole && jwtRole !== "school_admin") {
    throw new Error(
      `Роль в JWT (${jwtRole}) не подходит для панели школы`,
    );
  }

  return {
    access: parsed.access,
    refresh: parsed.refresh,
    expiresIn: parsed.expiresIn,
    user: parsed.user,
  };
}

export function persistSchoolAdminSession(
  access: string,
  refresh: string | null,
  expiresInSeconds?: number,
  declaredRole?: string,
): void {
  setSchoolAdminTokens(access, refresh, expiresInSeconds, {
    declaredRole,
  });
}
