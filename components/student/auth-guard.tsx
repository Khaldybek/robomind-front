"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getAccessToken } from "@/lib/auth/tokens";

export function AuthGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("Common");
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      setAllowed(false);
      return;
    }
    setAllowed(true);
  }, [router]);

  if (allowed !== true) {
    return (
      <div className="ds-container flex min-h-[40vh] items-center justify-center py-16">
        <p className="ds-text-body text-ds-gray-text">{t("checkingAuth")}</p>
      </div>
    );
  }

  return <>{children}</>;
}
