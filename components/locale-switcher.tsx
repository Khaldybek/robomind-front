"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 0 0 4 10 15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0-4-10 15.3 15.3 0 0 0 4-10Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

type LocaleSwitcherProps = {
  className?: string;
  /** Тёмный фон (например сайдбар super-admin) */
  tone?: "default" | "onDark";
  /** Текст «Тіл / Язык» или иконка глобуса + aria-label */
  labelMode?: "text" | "icon";
};

/**
 * Переключение kk ↔ ru с сохранением текущего пути.
 */
export function LocaleSwitcher({
  className,
  tone = "default",
  labelMode = "text",
}: LocaleSwitcherProps) {
  const id = useId();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("LocaleSwitcher");

  const isDark = tone === "onDark";
  const iconOnly = labelMode === "icon";

  function onChange(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next as (typeof routing.locales)[number] });
  }

  const selectClass =
    isDark
      ? "min-h-9 min-w-[9.5rem] w-full max-w-full cursor-pointer rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white shadow-sm outline-none transition-colors hover:bg-white/[0.14] focus-visible:ring-2 focus-visible:ring-ds-primary/60 sm:w-auto"
      : "min-h-9 min-w-[9rem] max-w-full flex-1 cursor-pointer rounded-lg border border-slate-400/55 bg-white px-2.5 py-1.5 text-sm text-ds-black shadow-sm outline-none transition-colors hover:border-slate-500/70 focus-visible:border-ds-primary focus-visible:ring-2 focus-visible:ring-ds-primary/30 sm:min-w-[9.5rem] sm:flex-none";

  const iconWrapClass = isDark
    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white"
    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-400/55 bg-white text-ds-black";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ds-text-caption ${className ?? ""}`}
    >
      {iconOnly ? (
        <div className="flex min-w-0 max-w-full items-center gap-1.5 sm:max-w-none">
          <span className={iconWrapClass} title={t("label")}>
            <GlobeIcon className="h-[1.15rem] w-[1.15rem]" />
          </span>
          <select
            id={id}
            value={locale}
            onChange={(e) => onChange(e.target.value)}
            className={selectClass}
            aria-label={t("label")}
          >
            {routing.locales.map((loc) => (
              <option key={loc} value={loc}>
                {t(loc)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <label
            htmlFor={id}
            className={
              isDark
                ? "shrink-0 font-medium text-white/92"
                : "shrink-0 font-medium text-ds-black"
            }
          >
            {t("label")}
          </label>
          <select
            id={id}
            value={locale}
            onChange={(e) => onChange(e.target.value)}
            className={selectClass}
          >
            {routing.locales.map((loc) => (
              <option key={loc} value={loc}>
                {t(loc)}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
