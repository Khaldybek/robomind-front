import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";
import type { LoginRequest } from "@/lib/api/types";
import { parseLoginResponse } from "@/lib/api/auth-api";
import type { AuthLoginUser } from "@/lib/api/auth-api";
import { setTokens } from "@/lib/auth/tokens";

export type StudentLoginResult = {
  access: string;
  refresh: string | null;
  expiresIn?: number;
  user?: AuthLoginUser;
};

export async function loginStudent(
  body: LoginRequest,
): Promise<StudentLoginResult> {
  const res = await apiFetch(STUDENT_ROUTES.AUTH_LOGIN, {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({
      email: body.email.trim(),
      password: body.password,
      deviceId: body.deviceId,
    }),
  });
  await throwIfNotOk(res);
  const data =
    (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  const parsed = parseLoginResponse(data);
  if (!parsed.access) {
    throw new Error("В ответе логина нет accessToken");
  }
  return {
    access: parsed.access,
    refresh: parsed.refresh,
    expiresIn: parsed.expiresIn,
    user: parsed.user,
  };
}

export function persistSession(
  access: string,
  refresh: string | null,
  expiresInSeconds?: number,
): void {
  setTokens(access, refresh, expiresInSeconds);
}

/** Тело `POST /auth/register` (см. docs/API-STUDENT-PANEL.md). Лишние поля бэкенд отклоняет. */
export type RegisterStudentBody = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic?: string | null;
  iin: string;
  schoolId: string;
  /** Если указан — ответ как у login (токены + user). */
  deviceId?: string;
};

export async function registerStudent(
  body: RegisterStudentBody,
): Promise<unknown> {
  const res = await apiFetch(STUDENT_ROUTES.AUTH_REGISTER, {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await apiFetch(STUDENT_ROUTES.AUTH_FORGOT_PASSWORD, {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email: email.trim() }),
  });
  await throwIfNotOk(res);
}

export async function resetPasswordByToken(
  token: string,
  password: string,
): Promise<unknown> {
  const res = await apiFetch(STUDENT_ROUTES.AUTH_RESET_PASSWORD, {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ token, password }),
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export async function verifyEmailWithToken(token: string): Promise<unknown> {
  const q = `?token=${encodeURIComponent(token)}`;
  const res = await apiFetch(`${STUDENT_ROUTES.AUTH_VERIFY_EMAIL}${q}`, {
    method: "GET",
    skipAuth: true,
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}
