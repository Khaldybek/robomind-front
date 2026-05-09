import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { VerifyEmailClient } from "@/components/auth/verify-email-client";

export default async function VerifyEmailPage() {
  const t = await getTranslations("StudentVerifyEmail");
  const tc = await getTranslations("Common");

  return (
    <>
      <div className="mx-auto mb-8 max-w-md text-center">
        <Link
          href="/"
          className="ds-text-caption text-ds-black/70 transition hover:text-ds-primary"
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
    </>
  );
}
