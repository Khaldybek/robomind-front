"use client";

import { Suspense, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { clearTokens, getRefreshToken } from "@/lib/auth/tokens";
import { clearDeviceId } from "@/lib/device-id";
import { apiAuthLogout } from "@/lib/api/auth-api";

function LogoutInner() {
  const t = useTranslations("Common");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    void (async () => {
      await apiAuthLogout(getRefreshToken());
      clearTokens();
      if (searchParams.get("full") === "1") {
        clearDeviceId();
      }
      router.replace("/login");
    })();
  }, [router, searchParams]);

  return (
    <div className="ds-main flex min-h-screen items-center justify-center">
      <p className="ds-text-body text-ds-gray-text">{t("loggingOut")}</p>
    </div>
  );
}

function LogoutFallback() {
  const t = useTranslations("Common");
  return (
    <div className="ds-main flex min-h-screen items-center justify-center">
      <p className="ds-text-body text-ds-gray-text">{t("loggingOut")}</p>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense
      fallback={<LogoutFallback />}
    >
      <LogoutInner />
    </Suspense>
  );
}
