"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { StudentAiAssistantFab } from "@/components/student/student-ai-assistant-fab";

export function StudentShell({ children }: { children: ReactNode }) {
  const t = useTranslations("StudentShell");
  const tHome = useTranslations("HomePage");
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
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/72 px-4 py-3 sm:py-3.5 backdrop-blur-xl md:py-3 lg:px-6 lg:py-3.5">
        <div className="ds-container flex max-w-none flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex min-w-0 shrink-0 items-center"
          >
            <Image
              src="/logo.png"
              alt={`${tHome("navBrand")} · ${t("brandSuffix")}`}
              width={390}
              height={75}
              className="h-12 w-auto max-w-[min(19rem,76vw)] object-contain object-left sm:h-14 sm:max-w-[min(24rem,62vw)] md:h-16 md:max-w-[min(28rem,50vw)] lg:max-w-[min(30rem,44vw)]"
              priority
            />
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
      <StudentAiAssistantFab />
    </div>
  );
}
