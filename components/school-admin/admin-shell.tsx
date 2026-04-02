"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useEffect, useState } from "react";
import { fetchMySchool } from "@/lib/api/school-admin/my-school";
import { isApiConfigured } from "@/lib/env";
import { SchoolAdminMarketingLayout } from "@/components/school-admin/school-admin-ambient";

function schoolSubtitle(
  schoolName: string,
  cityName: string | null,
): string {
  if (cityName) return `${schoolName} · ${cityName}`;
  return schoolName;
}

export function SchoolAdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("SchoolAdminShell");
  const pathname = usePathname();
  const [schoolLine, setSchoolLine] = useState<string | null>(null);

  const nav = useMemo(
    () =>
      [
        { href: "/school-admin/dashboard", label: t("navOverview") },
        { href: "/school-admin/users", label: t("navStudents") },
        { href: "/school-admin/courses", label: t("navCourses") },
        { href: "/school-admin/notifications", label: t("navNotifications") },
        { href: "/school-admin/device-violations", label: t("navDevices") },
      ] as const,
    [t],
  );

  useEffect(() => {
    if (!isApiConfigured()) return;
    fetchMySchool()
      .then(({ school, city }) => {
        const num =
          school.number != null ? ` №${school.number}` : "";
        setSchoolLine(
          schoolSubtitle(`${school.name}${num}`, city?.name ?? null),
        );
      })
      .catch(() => setSchoolLine(null));
  }, []);

  return (
    <SchoolAdminMarketingLayout>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-white/50 bg-white/75 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="ds-container flex max-w-none flex-wrap items-center justify-between gap-4 py-3 lg:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-primary to-[#e62a1c] text-lg font-bold text-white shadow-lg shadow-ds-primary/25">
                R
              </div>
              <div className="min-w-0">
                <span className="ds-text-subtitle block truncate text-ds-black">
                  {t("brandName")}
                </span>
                <span className="ds-text-caption block text-ds-gray-text">
                  {t("subtitle")}
                </span>
                {schoolLine && (
                  <p className="ds-text-caption mt-0.5 truncate text-ds-primary">
                    {schoolLine}
                  </p>
                )}
              </div>
            </div>
            <nav className="flex max-w-full flex-wrap items-center gap-1.5 sm:gap-2">
              <LocaleSwitcher className="mr-1" />
              {nav.map(({ href, label }) => {
                const active =
                  pathname === href || pathname?.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      active
                        ? "bg-ds-black text-white shadow-md"
                        : "text-ds-black/80 hover:bg-white/90 hover:text-ds-primary"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/school-admin/login?logout=1"
                className="ml-1 rounded-full border border-ds-gray-border bg-white/80 px-3 py-2 text-sm font-medium text-ds-gray-text transition-colors hover:border-ds-primary hover:text-ds-primary"
              >
                {t("logout")}
              </Link>
            </nav>
          </div>
        </header>
        <main className="ds-container flex-1 py-8 lg:py-10">{children}</main>
      </div>
    </SchoolAdminMarketingLayout>
  );
}
