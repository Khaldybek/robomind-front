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
    <div className="ds-main student-app-root relative min-h-screen overflow-x-clip overflow-y-visible">
      <div className="st-orb st-orb--a" aria-hidden />
      <div className="st-orb st-orb--b" aria-hidden />
      <div className="st-grid-mask" aria-hidden />
      <header className="sticky top-0 z-20 border-b border-sky-200/55 bg-white/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] shadow-[0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:pb-3.5 sm:pt-[calc(0.875rem+env(safe-area-inset-top,0px))] md:pb-3 md:pt-[calc(0.75rem+env(safe-area-inset-top,0px))] lg:px-6 lg:pb-3.5 lg:pt-[calc(0.875rem+env(safe-area-inset-top,0px))]">
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
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === href || pathname?.startsWith(href + "/")
                    ? "bg-sky-600 text-white shadow-sm shadow-sky-600/25 ring-1 ring-sky-500/40"
                    : "text-slate-700 hover:bg-amber-100/90 hover:text-sky-900"
                }`}
              >
                {label}
              </Link>
            ))}
            <LocaleSwitcher className="w-full flex-none sm:hidden" />
            <Link
              href="/logout"
              className="rounded-full border border-sky-200/90 bg-white/95 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-amber-300 hover:bg-amber-50/90 hover:text-sky-800"
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
