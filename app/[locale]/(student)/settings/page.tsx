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
      <h1 className="ds-text-h1 mb-8 text-ds-black">{t("title")}</h1>
      <div className="ds-block-section space-y-6">
        <section>
          <h2 className="ds-text-h3 mb-2">{t("passwordTitle")}</h2>
          <p className="ds-text-body text-ds-gray-text">{t("passwordLead")}</p>
          <Link href="/forgot-password" className="ui-btn ui-btn--4 mt-4 inline-flex">
            {t("forgotPassword")}
          </Link>
        </section>
        <section>
          <h2 className="ds-text-h3 mb-2">{t("notificationsTitle")}</h2>
          <p className="ds-text-body text-ds-gray-text">
            {t("notificationsLead")}
          </p>
        </section>
        <section>
          <h2 className="ds-text-h3 mb-2">{t("sessionTitle")}</h2>
          <p className="ds-text-caption mb-3 text-ds-gray-text">
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
          <p className="ds-text-caption mt-4 text-ds-gray-text">
            {t("deviceReset")}{" "}
            <Link href="/logout?full=1" className="text-ds-primary">
              {t("deviceResetLink")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
