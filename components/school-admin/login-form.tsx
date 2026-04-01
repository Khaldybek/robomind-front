"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  loginSchoolAdmin,
  persistSchoolAdminSession,
} from "@/lib/api/school-admin/auth";
import {
  clearSchoolAdminTokens,
  getSchoolAdminRefreshToken,
} from "@/lib/auth/school-admin-tokens";
import { apiAuthLogout } from "@/lib/api/auth-api";
import { isApiConfigured } from "@/lib/env";

export function SchoolAdminLoginForm() {
  const t = useTranslations("SchoolAdminLogin");
  const tc = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (searchParams.get("logout") === "1") {
      const rt = getSchoolAdminRefreshToken();
      void apiAuthLogout(rt).finally(() => clearSchoolAdminTokens());
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      return;
    }
    setPending(true);
    try {
      const { access, refresh, expiresIn, user } = await loginSchoolAdmin(
        email,
        password,
      );
      persistSchoolAdminSession(access, refresh, expiresIn, user.role);
      router.push("/school-admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md space-y-6 rounded-[var(--radius-ds-section)] border border-white/80 bg-white/95 p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)] backdrop-blur-md lg:mx-0 lg:max-w-none"
    >
      <div>
        <h1 className="ds-text-h2 text-balance text-ds-black">{t("title")}</h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-ds-gray-text">
          {t("lead")}
        </p>
      </div>
      <div>
        <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
          {t("emailLabel")}
        </label>
        <input
          type="email"
          className="ds-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="admin@school.kz"
        />
      </div>
      <div>
        <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
          {t("passwordLabel")}
        </label>
        <input
          type="password"
          className="ds-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="ds-text-small text-ds-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="ui-btn ui-btn--1 w-full py-3 text-base font-medium shadow-lg shadow-ds-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        disabled={pending}
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      <p className="text-center">
        <Link
          href="/"
          className="ds-text-caption font-medium text-ds-primary hover:underline"
        >
          {t("backStudents")}
        </Link>
      </p>
      <details className="rounded-xl border border-ds-gray-border/80 bg-ds-gray-light/50 p-3">
        <summary className="cursor-pointer ds-text-caption font-medium text-ds-gray-text">
          {t("devSummary")}
        </summary>
        <p className="ds-text-caption mt-2 text-ds-gray-text">{t("devDetail")}</p>
      </details>
    </form>
  );
}
