"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function SettingsPage() {
  const t = useTranslations("StudentSettings");
  const { logoutAllSessions } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <div className="ds-container max-w-xl py-10 lg:py-14">
      <header className="mb-8 rounded-3xl border border-sky-200/55 bg-white/90 px-5 py-5 shadow-sm sm:px-7">
        <h1 className="text-balance text-2xl font-bold text-slate-900 sm:text-3xl">
          {t("title")}
        </h1>
      </header>
      <div className="student-surface-panel space-y-8 rounded-3xl p-6 sm:p-8">
        <section>
          <h2 className="text-lg font-bold text-slate-900">{t("passwordTitle")}</h2>
          <p className="mt-2 text-base text-slate-600">{t("passwordLead")}</p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-flex rounded-2xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/80"
          >
            {t("forgotPassword")}
          </Link>
        </section>
        <section className="border-t border-sky-100 pt-8">
          <h2 className="text-lg font-bold text-slate-900">{t("notificationsTitle")}</h2>
          <p className="mt-2 text-base text-slate-600">
            {t("notificationsLead")}
          </p>
        </section>
        <section className="border-t border-sky-100 pt-8">
          <h2 className="text-lg font-bold text-slate-900">{t("sessionTitle")}</h2>
          <p className="mt-2 text-xs text-slate-600">
            {t("sessionBody")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/logout" className="ui-btn ui-btn--6">
              {t("logout")}
            </Link>
            <button
              type="button"
              className="ui-btn ui-btn--4"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void logoutAllSessions().finally(() => setBusy(false));
              }}
            >
              {busy ? t("logoutAllBusy") : t("logoutAll")}
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-600">
            {t("deviceReset")}{" "}
            <Link href="/logout?full=1" className="font-semibold text-sky-700 hover:underline">
              {t("deviceResetLink")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
