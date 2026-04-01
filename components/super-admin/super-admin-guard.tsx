"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { isSuperAdminAuthenticated } from "@/lib/auth/super-admin-tokens";

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("AdminGuard");
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (isSuperAdminAuthenticated()) {
      setOk(true);
      return;
    }
    router.replace("/super-admin/login");
    setOk(false);
  }, [router]);

  if (ok !== true) {
    return (
      <div className="ds-container flex min-h-[40vh] items-center justify-center py-16">
        <p className="ds-text-body text-ds-gray-text">{t("checkingAccess")}</p>
      </div>
    );
  }
  return <>{children}</>;
}
