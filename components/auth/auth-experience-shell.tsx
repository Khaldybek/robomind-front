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
      <header className="relative z-20 shrink-0 border-b border-white/35 bg-transparent px-4 py-3.5 shadow-none sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <AuthBrandLogo
              size="authNav"
              className="drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            <nav
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium sm:gap-x-6 sm:text-[15px] [text-shadow:0_1px_0_rgba(255,255,255,0.65)]"
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
            <div className="ml-1 border-l border-white/40 pl-2 sm:ml-2 sm:pl-3">
              <LocaleSwitcher tone="onGradient" />
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:min-h-0 lg:pb-10 lg:pl-6 lg:pr-2 lg:pt-0 xl:pr-4 2xl:pr-5">
        {/* Иллюстрация: только в области под шапкой; z ниже шапки; scale уменьшен чтобы не вылезать вверх */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-center max-lg:pb-[min(14vh,5rem)] lg:justify-start lg:pb-0 lg:pt-2">
            <div className="relative h-[min(70dvh,33rem)] w-[min(94vw,24rem)] -translate-x-[22%] sm:h-[min(74dvh,37rem)] sm:w-[min(94vw,28rem)] sm:-translate-x-[18%] lg:h-full lg:max-h-none lg:w-[min(74vw,54rem)] lg:max-w-[56rem] lg:-translate-x-[32%] xl:-translate-x-[38%] 2xl:-translate-x-[42%]">
              <div className="relative h-full w-full origin-bottom scale-[1.52] max-lg:translate-y-[5%] lg:origin-bottom-left lg:translate-y-0 lg:scale-[1.58]">
                <Image
                  src={STUDENT_AUTH_HERO}
                  alt=""
                  fill
                  priority
                  className="object-contain object-bottom opacity-[0.88] drop-shadow-[0_28px_56px_rgba(99,102,241,0.2)] select-none lg:opacity-[0.92]"
                  sizes="(max-width: 1024px) 100vw, 80vw"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          key={pathname}
          className="auth-panel-enter relative z-[1] mx-auto flex min-h-[240px] w-full max-w-[90rem] flex-1 flex-col items-center justify-center sm:min-h-[280px] lg:min-h-0 lg:items-end lg:pr-10 xl:pr-14 2xl:pr-20"
        >
          <div className="flex w-full flex-1 flex-col items-center justify-center lg:items-end">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
