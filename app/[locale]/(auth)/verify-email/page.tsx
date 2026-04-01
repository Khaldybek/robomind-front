import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { VerifyEmailClient } from "@/components/auth/verify-email-client";

export default async function VerifyEmailPage() {
  const t = await getTranslations("StudentVerifyEmail");
  const tc = await getTranslations("Common");

  return (
    <div className="ds-main min-h-screen py-12">
      <div className="ds-container mb-8 text-center">
        <Link
          href="/"
          className="ds-text-caption text-ds-gray-text hover:text-ds-primary"
        >
          {t("backHome")}
        </Link>
      </div>
      <Suspense
        fallback={
          <p className="text-center ds-text-body text-ds-gray-text">
            {tc("loading")}
          </p>
        }
      >
        <VerifyEmailClient />
      </Suspense>
    </div>
  );
}
