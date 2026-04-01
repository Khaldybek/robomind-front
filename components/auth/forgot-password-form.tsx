"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { requestPasswordReset } from "@/lib/api/student/auth";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth.forgot");
  const tc = useTranslations("Common");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      return;
    }
    setPending(true);
    try {
      await requestPasswordReset(email);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError(t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-ds-card border border-ds-gray-border bg-ds-white p-8 text-center shadow-sm">
        <h1 className="ds-text-h2 mb-3 text-ds-black">{t("doneTitle")}</h1>
        <p className="ds-text-body text-ds-gray-text">{t("doneHint")}</p>
        <Link href="/login" className="ui-btn ui-btn--1 mt-6 inline-flex">
          {t("toLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-5 rounded-ds-card border border-ds-gray-border bg-ds-white p-8 shadow-sm"
    >
      <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
      <p className="ds-text-caption">{t("hint")}</p>
      <div>
        <label className="ds-text-small mb-1 block">{t("emailLabel")}</label>
        <input
          type="email"
          className="ds-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="ds-text-small text-ds-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="ui-btn ui-btn--1 w-full" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </button>
      <p className="text-center">
        <Link href="/login" className="ds-text-caption text-ds-primary">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
