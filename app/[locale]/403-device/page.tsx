import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function DeviceLimitPage() {
  const t = await getTranslations("Device403");

  return (
    <div className="ds-main flex min-h-screen items-center justify-center px-4 py-12">
      <div className="mx-auto max-w-lg rounded-ds-section border border-ds-error/40 bg-ds-white p-10 text-center shadow-sm">
        <h1 className="ds-text-h2 mb-4 text-ds-black">{t("title")}</h1>
        <p className="ds-text-body mb-4 text-ds-gray-text">{t("p1")}</p>
        <p className="ds-text-caption mb-8">{t("p2")}</p>
        <Link href="/login" className="ui-btn ui-btn--1">
          {t("toLogin")}
        </Link>
      </div>
    </div>
  );
}
