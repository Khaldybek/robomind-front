"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  loginSuperAdmin,
  persistSuperAdminSession,
} from "@/lib/api/super-admin/auth";
import {
  clearSuperAdminTokens,
  getSuperAdminRefreshToken,
} from "@/lib/auth/super-admin-tokens";
import { apiAuthLogout } from "@/lib/api/auth-api";
import { isApiConfigured } from "@/lib/env";

function Inner() {
  const t = useTranslations("SuperAdminLogin");
  const tc = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (searchParams.get("logout") === "1") {
      const rt = getSuperAdminRefreshToken();
      void apiAuthLogout(rt).finally(() => clearSuperAdminTokens());
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
      const { access, refresh, expiresIn, user } = await loginSuperAdmin(
        email,
        password,
      );
      persistSuperAdminSession(
        access,
        refresh,
        expiresIn,
        user?.role,
      );
      router.push("/super-admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-5 rounded-ds-card border border-ds-gray-border bg-ds-white p-8 shadow-lg"
    >
      <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
      <input
        type="email"
        className="ds-input"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        className="ds-input"
        placeholder={t("passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p className="ds-text-small text-ds-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="ui-btn ui-btn--1 w-full" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </button>
      <p className="text-center">
        <Link href="/" className="ds-text-caption text-ds-primary">
          {t("backHome")}
        </Link>
      </p>
    </form>
  );
}

function SuperAdminLoginSuspenseFallback() {
  const t = useTranslations("SuperAdminLogin");
  return <p className="text-center">{t("suspenseLoading")}</p>;
}

export function SuperAdminLoginForm() {
  return (
    <Suspense fallback={<SuperAdminLoginSuspenseFallback />}>
      <Inner />
    </Suspense>
  );
}
