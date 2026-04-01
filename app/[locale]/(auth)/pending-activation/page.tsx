import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function PendingActivationPage() {
  const t = await getTranslations("PendingActivation");

  return (
    <div className="ds-main flex min-h-screen items-center justify-center px-4 py-12">
      <div className="mx-auto max-w-lg rounded-ds-section border border-ds-gray-border bg-ds-white p-10 text-center shadow-sm">
        <h1 className="ds-text-h2 mb-4 text-ds-black">{t("title")}</h1>
        <p className="ds-text-body mb-2 text-ds-gray-text">{t("p1")}</p>
        <p className="ds-text-caption mb-8">{t("p2")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login" className="ui-btn ui-btn--1">
            {t("login")}
          </Link>
          <Link href="/register" className="ui-btn ui-btn--6">
            {t("register")}
          </Link>
        </div>
      </div>
    </div>
  );
}
