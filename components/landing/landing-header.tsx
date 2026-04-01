"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";

const NAV = [
  { href: "#landing-courses", key: "navCourses" as const },
  { href: "#landing-visual", key: "navVisual" as const },
  { href: "#landing-faq", key: "navFaq" as const },
  { href: "#landing-start", key: "navStart" as const },
];

export function LandingHeader() {
  const t = useTranslations("HomePage");

  return (
    <header
      className="relative overflow-visible rounded-2xl border border-white/45 bg-white/[0.2] px-3 py-2 shadow-lg backdrop-blur-xl sm:px-4"
      role="banner"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:min-h-[2.75rem]">
        <div className="flex min-h-10 min-w-0 items-center justify-between gap-3 sm:min-h-0 sm:justify-start">
          <Link
            href="/"
            className="relative z-[1] inline-flex h-10 shrink-0 items-center overflow-visible [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.35))]"
          >
            <Image
              src="/logo.png"
              alt={t("navBrand")}
              width={390}
              height={75}
              className="h-10 w-auto max-w-[min(20rem,82vw)] origin-left scale-[1.68] object-contain object-left sm:scale-[1.88]"
              priority
            />
          </Link>
          <div className="sm:hidden">
            <LocaleSwitcher labelMode="icon" />
          </div>
        </div>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-base font-semibold sm:flex-1 sm:justify-center sm:text-lg"
          aria-label={t("navAria")}
        >
          {NAV.map(({ href, key }) => (
            <a
              key={key}
              href={href}
              className="text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] underline-offset-4 transition-colors hover:text-ds-primary hover:underline"
            >
              {t(key)}
            </a>
          ))}
        </nav>
        <div className="hidden justify-end sm:flex sm:min-w-[10rem]">
          <LocaleSwitcher labelMode="icon" />
        </div>
      </div>
    </header>
  );
}
