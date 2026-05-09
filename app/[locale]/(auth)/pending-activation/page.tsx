import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function PendingActivationPage() {
  const t = await getTranslations("PendingActivation");

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-2">
      <div className="w-full rounded-ds-section border border-white/60 bg-white/90 p-8 text-center shadow-lg backdrop-blur-md sm:p-10">
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
