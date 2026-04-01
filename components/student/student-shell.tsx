"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function StudentShell({ children }: { children: ReactNode }) {
  const t = useTranslations("StudentShell");
  const pathname = usePathname();

  const nav = useMemo(
    () =>
      [
        { href: "/dashboard", label: t("navDashboard") },
        { href: "/courses", label: t("navCourses") },
        { href: "/progress", label: t("navProgress") },
        { href: "/certificates", label: t("navCertificates") },
        { href: "/profile", label: t("navProfile") },
        { href: "/settings", label: t("navSettings") },
      ] as const,
    [t],
  );

  return (
    <div className="ds-main relative min-h-screen overflow-hidden bg-[linear-gradient(170deg,#f7f7f8_0%,#ececef_45%,#f7f7f8_100%)]">
      <div className="st-orb st-orb--a" aria-hidden />
      <div className="st-orb st-orb--b" aria-hidden />
      <div className="st-grid-mask" aria-hidden />
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/72 px-4 py-3 backdrop-blur-xl lg:px-6 lg:py-4">
        <div className="ds-container flex max-w-none flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="ds-text-subtitle flex items-center gap-2 text-ds-black"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ds-primary font-semibold text-white shadow-lg shadow-ds-primary/20">
              R
            </span>
            Robomind · {t("brandSuffix")}
          </Link>
          <nav className="flex flex-wrap items-center gap-1.5 lg:gap-2">
            <LocaleSwitcher className="mr-1 hidden sm:flex" />
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  pathname === href || pathname?.startsWith(href + "/")
                    ? "bg-ds-black text-white"
                    : "text-ds-black hover:bg-white hover:text-ds-primary"
                }`}
              >
                {label}
              </Link>
            ))}
            <LocaleSwitcher className="w-full flex-none sm:hidden" />
            <Link
              href="/logout"
              className="rounded-full border border-ds-gray-border bg-white px-3 py-1.5 text-sm text-ds-gray-text transition-colors hover:border-ds-primary hover:text-ds-primary"
            >
              {t("logout")}
            </Link>
          </nav>
        </div>
      </header>
      <main className="ds-main__router relative z-[1]">{children}</main>
    </div>
  );
}
