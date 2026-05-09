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
import { AuthCardMascot } from "@/components/auth/auth-card-mascot";

export function LoginForm() {
  const t = useTranslations("Auth.login");
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
    <div className="relative mx-auto w-full max-w-md overflow-visible pb-28 sm:pb-24">
      <form
        onSubmit={onSubmit}
        className="relative z-[2] space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 pr-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.1)] sm:p-8 sm:pr-8"
      >
        <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
        <p className="ds-text-caption text-slate-600">{t("hint")}</p>
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
          className="ui-btn ui-btn--1 w-full"
          disabled={pending}
        >
          {pending ? t("submitting") : t("submit")}
        </button>
        <p className="text-center">
          <Link
            href="/forgot-password"
            className="ds-text-caption text-ds-primary hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </p>
      </form>
      <AuthCardMascot />
    </div>
  );
}
