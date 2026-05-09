"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { apiAuthLogoutAll } from "@/lib/api/auth-api";
import {
  clearSuperAdminTokens,
  getSuperAdminAccessToken,
} from "@/lib/auth/super-admin-tokens";
import { listAdminCourses } from "@/lib/api/super-admin/courses-modules";
import { fetchSuperUsers } from "@/lib/api/super-admin/users";
import {
  fetchSuperDeviceViolations,
  fetchSuperNotifications,
} from "@/lib/api/super-admin/notifications";
import { isApiConfigured } from "@/lib/env";

type CardDef = {
  href: string;
  labelKey: "cardUsers" | "cardCourses" | "cardViolations" | "cardUnread";
  v: number;
};

export default function Page() {
  const router = useRouter();
  const t = useTranslations("SuperAdminDashboard");
  const tc = useTranslations("Common");
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    violations: 0,
    unread: 0,
  });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setErr(tc("apiEnvMissing"));
      return;
    }
    Promise.all([
      fetchSuperUsers({ limit: "1" }).then((r) => r.total),
      listAdminCourses({ page: 1, limit: 1 }).then((r) => r.total),
      fetchSuperDeviceViolations().then((v) => v.length),
      fetchSuperNotifications(true).then((n) => n.length),
    ])
      .then(([u, c, v, n]) =>
        setStats({ users: u, courses: c, violations: v, unread: n }),
      )
      .catch((e: Error) => setErr(e.message));
  }, []);

  const cards: CardDef[] = useMemo(
    () => [
      { href: "/super-admin/users", labelKey: "cardUsers", v: stats.users },
      { href: "/super-admin/courses", labelKey: "cardCourses", v: stats.courses },
      {
        href: "/super-admin/device-violations",
        labelKey: "cardViolations",
        v: stats.violations,
      },
      {
        href: "/super-admin/notifications",
        labelKey: "cardUnread",
        v: stats.unread,
      },
    ],
    [stats],
  );

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
        <p className="mt-2 ds-text-caption text-ds-gray-text">{t("lead")}</p>
      </header>
      {err && (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-4 shadow-sm transition-all hover:border-ds-primary/40 hover:shadow-md"
          >
            <p className="ds-text-caption text-ds-gray-text">{t(c.labelKey)}</p>
            <p className="mt-1 text-[28px] font-medium leading-none text-ds-black">
              {c.v ?? "—"}
            </p>
          </Link>
        ))}
      </div>
      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">{t("sessionTitle")}</h2>
        <p className="mb-4 mt-1 ds-text-caption text-ds-gray-text">
          {t("sessionLead")}
        </p>
        <button
          type="button"
          className="ui-btn ui-btn--4"
          onClick={() => {
            void (async () => {
              const at = getSuperAdminAccessToken();
              if (at) {
                try {
                  await apiAuthLogoutAll(at);
                } catch {
                  /* ignore */
                }
              }
              clearSuperAdminTokens();
              router.push("/super-admin/login");
            })();
          }}
        >
          {t("logoutAllDevices")}
        </button>
      </section>
    </div>
  );
}
