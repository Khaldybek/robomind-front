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
    <div className="relative mx-auto max-w-md overflow-visible pb-24 sm:pb-20">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,46,31,0.3) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-12 h-32 w-32 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)" }}
        aria-hidden
      />

      <form
        onSubmit={onSubmit}
        className="relative z-[2] overflow-hidden rounded-2xl bg-white shadow-xl"
        style={{ border: "2px solid rgba(255,46,31,0.12)", boxShadow: "0 8px 40px rgba(38,38,38,0.12)" }}
      >
        {/* Color top bar */}
        <div
          className="h-2 w-full"
          style={{ background: "linear-gradient(90deg, #ff2e1f 0%, #ff7a30 50%, #f59e0b 100%)" }}
        />

        <div className="px-8 pb-8 pt-6">
          {/* Robot icon */}
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #ff2e1f 0%, #ff7a30 100%)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
                <circle cx="12" cy="8" r="3.5" fill="white" opacity="0.95" />
                <rect x="8" y="13" width="8" height="7" rx="2" fill="white" opacity="0.9" />
                <rect x="5" y="15" width="3" height="4" rx="1.5" fill="white" opacity="0.7" />
                <rect x="16" y="15" width="3" height="4" rx="1.5" fill="white" opacity="0.7" />
                <circle cx="10" cy="8" r="1" fill="#ff2e1f" opacity="0.7" />
                <circle cx="14" cy="8" r="1" fill="#ff2e1f" opacity="0.7" />
              </svg>
            </span>
            <div>
              <h1 className="text-xl font-black text-ds-black">{t("title")}</h1>
              <p className="text-xs text-ds-gray-text">{t("hint")}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ds-gray-text">
                {t("emailLabel")}
              </label>
              <input
                type="text"
                className="w-full rounded-xl border-2 border-ds-gray-border bg-ds-gray-light/50 px-4 py-3 text-sm font-medium text-ds-black transition-all placeholder:text-ds-gray-text/60 focus:border-ds-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                placeholder={t("emailPlaceholder")}
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-ds-gray-text">
                  {t("passwordLabel")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-ds-primary hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <input
                type="password"
                className="w-full rounded-xl border-2 border-ds-gray-border bg-ds-gray-light/50 px-4 py-3 text-sm font-medium text-ds-black transition-all focus:border-ds-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: "rgba(255,46,31,0.3)", background: "rgba(255,46,31,0.05)", color: "#cc1a0d" }}
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-xl py-3 text-sm font-black text-white shadow-lg shadow-ds-primary/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-60 disabled:hover:scale-100"
              style={{ background: pending ? "#aaa" : "linear-gradient(90deg, #ff2e1f 0%, #ff7a30 100%)" }}
              disabled={pending}
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
                  </svg>
                  {t("submitting")}
                </span>
              ) : t("submit")}
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-ds-gray-text">
              Нет аккаунта?{" "}
              <Link href="/register" className="font-bold text-ds-primary hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </form>
      <AuthCardMascot />
    </div>
  );
}
