"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { AuthBrandLogo } from "@/components/auth/auth-brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";

const STUDENT_AUTH_HERO = "/8ff7b306e610ff35ec2dd24b0b6e48fb6b206f6d.png";

const navMuted =
  "text-slate-700 transition hover:text-slate-900 hover:underline underline-offset-4";
const navAccent =
  "font-bold text-[color:var(--ds-error)] underline-offset-4 hover:underline";

export function AuthExperienceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const tp = useTranslations("AuthPages");

  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";
  const showStudentAuthChrome = isLogin || isRegister;

  if (!showStudentAuthChrome) {
    return (
      <div className="relative z-[1] flex min-h-[100dvh] flex-col px-4 py-10 sm:px-6 sm:py-14">
        <div className="auth-student-glass-panel mx-auto w-full max-w-lg rounded-2xl p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center">
              <AuthBrandLogo size="header" className="drop-shadow-sm" />
            </div>
            <LocaleSwitcher />
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-[1] flex min-h-[100dvh] flex-col">
      <header className="shrink-0 border-b border-slate-200/90 bg-white/60 px-4 py-3.5 backdrop-blur-lg sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <AuthBrandLogo
              size="authNav"
              className="drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            <nav
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium sm:gap-x-6 sm:text-[15px]"
              aria-label={tp("navAria")}
            >
              <Link href="/" prefetch={false} className={navMuted}>
                {tp("navHome")}
              </Link>
              <Link href="/courses" prefetch={false} className={navMuted}>
                {tp("navCourses")}
              </Link>
              <Link href="/#landing-faq" prefetch={false} className={navMuted}>
                {tp("navInfo")}
              </Link>
              {isRegister ? (
                <Link href="/login" prefetch={false} className={navAccent}>
                  {tp("navLogin")}
                </Link>
              ) : (
                <Link href="/register" prefetch={false} className={navAccent}>
                  {tp("navRegister")}
                </Link>
              )}
            </nav>
            <div className="ml-1 border-l border-slate-300/90 pl-2 sm:ml-2 sm:pl-3">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:pb-10 lg:pt-6">
        <div className="mx-auto grid min-h-0 w-full max-w-[90rem] flex-1 content-start gap-8 lg:grid-cols-[1.45fr_0.92fr] lg:items-stretch lg:gap-10 lg:min-h-0 xl:gap-12">
          {/* Иллюстрация: на lg — высота окна минус шапка и отступы */}
          <div className="order-2 flex w-full justify-center lg:order-1 lg:min-h-0">
            <div className="relative w-full max-w-full min-h-[min(52vh,22rem)] h-[min(68vh,calc(100dvh-11rem))] sm:min-h-[min(56vh,24rem)] sm:h-[min(74vh,calc(100dvh-10rem))] lg:h-[calc(100dvh-9rem)] lg:max-h-[calc(100dvh-9rem)] lg:min-h-[calc(100dvh-9rem)]">
              <Image
                src={STUDENT_AUTH_HERO}
                alt=""
                fill
                priority
                className="object-contain object-bottom drop-shadow-[0_20px_44px_rgba(99,102,241,0.18)] select-none"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div
            key={pathname}
            className="auth-panel-enter order-1 flex min-h-[240px] w-full sm:min-h-[280px] lg:order-2 lg:min-h-[calc(100dvh-9rem)] lg:items-center"
          >
            <div className="flex w-full flex-1 flex-col items-stretch justify-center">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
