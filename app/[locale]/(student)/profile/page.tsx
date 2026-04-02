"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchUserMe, patchUserMe } from "@/lib/api/student/user";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

function getInitials(first: string, last: string): string {
  return [first[0], last[0]].filter(Boolean).join("").toUpperCase() || "?";
}

export default function ProfilePage() {
  const t = useTranslations("StudentProfile");
  const tc = useTranslations("Common");
  const { refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    fetchUserMe()
      .then((u) => {
        if (!u) return;
        setFirstName(String(u.firstName ?? u.first_name ?? ""));
        setLastName(String(u.lastName ?? u.last_name ?? ""));
        setEmail(String(u.email ?? ""));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await patchUserMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      setSaved(true);
      await refreshProfile();
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError(t("errorSave"));
    }
  }

  const initials = getInitials(firstName, lastName);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Ученик";

  return (
    <div className="ds-container max-w-2xl py-10 lg:py-14">
      {/* Header */}
      <header className="mb-8">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ds-primary">Robomind</p>
        <h1 className="text-3xl font-black text-balance text-ds-black sm:text-4xl">{t("title")}</h1>
      </header>

      {/* Avatar + name hero card */}
      <div
        className="mb-8 flex items-center gap-5 rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, #fff5f4 0%, #f0f6ff 100%)",
          border: "2px solid rgba(255,46,31,0.12)",
          boxShadow: "0 4px 20px rgba(38,38,38,0.07)",
        }}
      >
        {/* Avatar circle */}
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md"
          style={{ background: "linear-gradient(135deg, #ff2e1f 0%, #ff7a30 100%)" }}
          aria-hidden
        >
          {loading ? "…" : initials}
        </div>
        <div>
          <p className="text-xl font-black text-ds-black">{loading ? tc("loading") : displayName}</p>
          <p className="mt-0.5 text-sm text-ds-gray-text">{email || "—"}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-xs font-bold text-[#065f46]">
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden>
              <path fillRule="evenodd" d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L7 8.586 5.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Активный ученик
          </span>
        </div>
      </div>

      {/* Edit form */}
      {loading && (
        <div className="h-64 animate-pulse rounded-2xl bg-ds-gray-light" />
      )}

      {!loading && (
        <div
          className="rounded-2xl bg-white p-6"
          style={{ boxShadow: "0 4px 20px rgba(38,38,38,0.08)" }}
        >
          <h2 className="mb-5 text-lg font-black text-ds-black">{t("lead")}</h2>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ds-gray-text">
                  {t("lastName")}
                </label>
                <input
                  className="ds-input rounded-xl border-2 border-ds-gray-border bg-ds-gray-light/50 px-4 py-2.5 text-sm font-medium text-ds-black transition-colors focus:border-ds-primary focus:bg-white focus:outline-none"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ds-gray-text">
                  {t("firstName")}
                </label>
                <input
                  className="ds-input rounded-xl border-2 border-ds-gray-border bg-ds-gray-light/50 px-4 py-2.5 text-sm font-medium text-ds-black transition-colors focus:border-ds-primary focus:bg-white focus:outline-none"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ds-gray-text">
                {t("email")}
              </label>
              <input
                type="email"
                className="ds-input w-full rounded-xl border-2 border-ds-gray-border bg-ds-gray-light/50 px-4 py-2.5 text-sm font-medium text-ds-black transition-colors focus:border-ds-primary focus:bg-white focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-ds-error/30 bg-ds-error/5 px-4 py-3 text-sm text-ds-error" role="alert">
                {error}
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 rounded-xl border border-[#10b981]/30 bg-[#ecfdf5] px-4 py-3 text-sm font-semibold text-[#065f46]" role="status">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t("saved")}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-md shadow-ds-primary/25 transition-all hover:scale-[1.02] hover:shadow-lg sm:w-auto sm:px-8"
              style={{ background: "linear-gradient(90deg, #ff2e1f 0%, #ff7a30 100%)" }}
            >
              {t("save")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
