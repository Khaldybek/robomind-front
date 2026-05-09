"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { getOrCreateDeviceId } from "@/lib/device-id";
import {
  loginStudent,
  persistSession,
} from "@/lib/api/student/auth";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

export function LoginForm() {
  const t = useTranslations("Auth.login");
  const tp = useTranslations("AuthPages");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { refreshProfile, applyUserFromLogin } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      return;
    }
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) {
      setError(t("errorDeviceId"));
      return;
    }
    setPending(true);
    try {
      const tokens = await loginStudent({
        email: login.trim(),
        password,
        deviceId,
      });
      persistSession(tokens.access, tokens.refresh, tokens.expiresIn);
      if (tokens.user) {
        applyUserFromLogin(tokens.user);
      }
      await refreshProfile();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 403) {
          router.replace("/403-device");
          return;
        }
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("errorGeneric"));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <form
        onSubmit={onSubmit}
        className="auth-student-form auth-student-glass-panel flex min-h-0 w-full flex-col space-y-5 rounded-[28px] p-6 sm:min-h-[min(32rem,calc(100dvh-10rem))] sm:justify-center sm:p-8 sm:py-10"
      >
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
          {t("title")}
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">{t("hint")}</p>
        <div>
          <label className="ds-text-small mb-1 block text-ds-black">
            {t("emailLabel")}
          </label>
          <input
            type="text"
            className="ds-input"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            placeholder={t("emailPlaceholder")}
            required
          />
        </div>
        <div>
          <label className="ds-text-small mb-1 block text-ds-black">
            {t("passwordLabel")}
          </label>
          <input
            type="password"
            className="ds-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <div
            className="rounded-xl border border-rose-200/85 bg-rose-50/95 px-4 py-3 text-sm leading-relaxed text-rose-950"
            role="alert"
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          className="ui-btn w-full rounded-xl border border-transparent bg-[color:var(--ds-error)] py-3.5 text-base font-semibold text-white shadow-md shadow-rose-900/15 transition hover:brightness-[1.06] active:brightness-[0.96] disabled:cursor-not-allowed disabled:opacity-55"
          disabled={pending}
        >
          {pending ? t("submitting") : t("submit")}
        </button>
        <p className="text-center text-sm text-slate-600">
          {tp("footerRegisterLead")}{" "}
          <Link
            href="/register"
            prefetch={false}
            className="font-bold text-[color:var(--ds-error)] underline-offset-2 hover:underline"
          >
            {tp("footerRegisterAction")}
          </Link>
        </p>
        <p className="text-center">
          <Link
            href="/forgot-password"
            prefetch={false}
            className="text-xs text-slate-500 underline-offset-2 transition hover:text-slate-700 hover:underline sm:text-sm"
          >
            {t("forgotPassword")}
          </Link>
        </p>
      </form>
    </div>
  );
}
