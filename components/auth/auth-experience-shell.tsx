"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { AuthBrandLogo } from "@/components/auth/auth-brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LandingThemeMotifs } from "@/components/landing/landing-theme-motifs";

type MotifTuple = [string, string, string, string, string];

export function AuthExperienceShell({
  children,
  motifLabels,
  trustChips,
}: {
  children: ReactNode;
  motifLabels: MotifTuple;
  trustChips: string[];
}) {
  const pathname = usePathname() ?? "";
  const tp = useTranslations("AuthPages");

  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";
  const showStudentAuthChrome = isLogin || isRegister;

  return (
    <div className="relative z-[1] px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10">
      <div className="mx-auto w-full max-w-5xl">
        {showStudentAuthChrome ? (
          <>
            <header className="mb-6 sm:mb-8">
              <div className="mb-4 flex justify-end sm:mb-5">
                <LocaleSwitcher />
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <AuthBrandLogo />
                <Link
                  href="/"
                  className="ds-text-caption text-slate-700/90 transition hover:text-ds-primary"
                >
                  {tp("backHome")}
                </Link>
              </div>
            </header>

            <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-x-10 lg:gap-y-0">
              <div
                key={pathname}
                className={`auth-panel-enter w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-stretch ${
                  isLogin ? "order-2" : "order-1"
                }`}
              >
                {children}
              </div>

              <aside
                className={`w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-stretch ${
                  isLogin ? "order-1" : "order-2"
                }`}
              >
                <div className="rounded-2xl border border-white/75 bg-white/80 p-5 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-6">
                  <p className="mb-4 text-sm font-semibold tracking-tight text-slate-900">
                    {tp("asideEyebrow")}
                  </p>
                  <ul className="mb-6 flex flex-wrap gap-2">
                    {trustChips.map((line) => (
                      <li
                        key={line}
                        className="rounded-full border border-sky-200/80 bg-sky-50/90 px-3 py-1.5 text-xs font-medium text-slate-800 sm:text-[13px]"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-200/70 pt-5">
                    <LandingThemeMotifs
                      labels={motifLabels}
                      sectionClassName="landing-motifs mt-0"
                    />
                  </div>
                </div>
              </aside>
            </div>

            <nav
              className="mx-auto mt-0 flex w-full max-w-md rounded-2xl border border-white/60 bg-white/45 p-1 shadow-sm backdrop-blur-md"
              aria-label={tp("navAria")}
            >
              <Link
                href="/login"
                className={`min-h-[2.75rem] flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                  isLogin
                    ? "bg-ds-primary text-white shadow-md shadow-ds-primary/20"
                    : "text-slate-800/90 hover:bg-white/70"
                }`}
              >
                {tp("navLogin")}
              </Link>
              <Link
                href="/register"
                className={`min-h-[2.75rem] flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                  isRegister
                    ? "bg-ds-primary text-white shadow-md shadow-ds-primary/20"
                    : "text-slate-800/90 hover:bg-white/70"
                }`}
              >
                {tp("navRegister")}
              </Link>
            </nav>
          </>
        ) : (
          <div key={pathname} className="auth-panel-enter mx-auto max-w-lg">
            <div className="mb-6 flex justify-end">
              <LocaleSwitcher />
            </div>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
