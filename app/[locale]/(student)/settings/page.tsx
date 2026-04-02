"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";

type SettingsSection = {
  icon: React.ReactNode;
  color: string;
  title: string;
  body: React.ReactNode;
};

export default function SettingsPage() {
  const t = useTranslations("StudentSettings");
  const { logoutAllSessions } = useAuth();
  const [busy, setBusy] = useState(false);

  const sections: SettingsSection[] = [
    {
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      ),
      color: "#3b82f6",
      title: t("passwordTitle"),
      body: (
        <div>
          <p className="mb-4 text-sm leading-relaxed text-ds-gray-text">{t("passwordLead")}</p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#3b82f6]/30 bg-[#eff6ff] px-4 py-2.5 text-sm font-bold text-[#1d4ed8] transition-all hover:border-[#3b82f6] hover:shadow-md"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            {t("forgotPassword")}
          </Link>
        </div>
      ),
    },
    {
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      ),
      color: "#10b981",
      title: t("notificationsTitle"),
      body: (
        <p className="text-sm leading-relaxed text-ds-gray-text">{t("notificationsLead")}</p>
      ),
    },
    {
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
      ),
      color: "#ff2e1f",
      title: t("sessionTitle"),
      body: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ds-gray-text">{t("sessionBody")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/logout"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-ds-gray-border bg-white px-4 py-2.5 text-sm font-bold text-ds-black transition-all hover:border-ds-primary/40 hover:text-ds-primary hover:shadow-md"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              {t("logout")}
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#ff2e1f]/30 bg-[#fff0ee] px-4 py-2.5 text-sm font-bold text-[#cc1a0d] transition-all hover:border-[#ff2e1f] hover:shadow-md disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void logoutAllSessions().finally(() => setBusy(false));
              }}
            >
              {busy ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {busy ? t("logoutAllBusy") : t("logoutAll")}
            </button>
          </div>
          <p className="text-xs text-ds-gray-text">
            {t("deviceReset")}{" "}
            <Link href="/logout?full=1" className="font-semibold text-ds-primary hover:underline">
              {t("deviceResetLink")}
            </Link>
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="ds-container max-w-2xl py-10 lg:py-14">
      {/* Header */}
      <header className="mb-8">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ds-primary">Robomind</p>
        <h1 className="text-3xl font-black text-balance text-ds-black sm:text-4xl">{t("title")}</h1>
      </header>

      {/* Settings sections */}
      <div className="space-y-5">
        {sections.map(({ icon, color, title, body }) => (
          <div
            key={title}
            className="rounded-2xl bg-white p-6"
            style={{
              boxShadow: "0 4px 20px rgba(38,38,38,0.08)",
              border: `2px solid ${color}18`,
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: color }}
              >
                {icon}
              </span>
              <h2 className="text-base font-black text-ds-black">{title}</h2>
            </div>
            {body}
          </div>
        ))}
      </div>
    </div>
  );
}
