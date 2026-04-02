"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type LocaleSwitcherProps = {
  className?: string;
  /** Тёмный фон (например шапка super-admin) */
  tone?: "default" | "onDark";
  /**
   * @deprecated Раньше «текст / иконка» — теперь везде единый вид: иконка + переключатель.
   * Оставлено для совместимости с существующими вызовами.
   */
  labelMode?: "text" | "icon";
};

/**
 * Переключение kk ↔ ru с сохранением текущего пути.
 * Иконка «Languages» + сегменты Қаз / RU.
 */
export function LocaleSwitcher({
  className,
  tone = "default",
  labelMode: _labelMode,
}: LocaleSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("LocaleSwitcher");

  const isDark = tone === "onDark";

  function onSelect(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next as (typeof routing.locales)[number] });
  }

  const iconWrap = isDark
    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] text-white shadow-sm"
    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 text-slate-700 shadow-sm ring-1 ring-slate-200/60";

  const track = isDark
    ? "inline-flex rounded-full border border-white/18 bg-black/25 p-0.5 shadow-inner"
    : "inline-flex rounded-full border border-slate-200/80 bg-slate-100/90 p-0.5 shadow-inner";

  const btnBase =
    "min-w-[3.25rem] rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 sm:min-w-[3.5rem] sm:px-3.5 sm:text-[13px]";

  const btnActive = isDark
    ? "bg-white text-slate-900 shadow-md"
    : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80";

  const btnIdle = isDark
    ? "text-white/65 hover:bg-white/10 hover:text-white"
    : "text-slate-500 hover:bg-white/60 hover:text-slate-900";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 sm:gap-2.5 ${className ?? ""}`}
      role="group"
      aria-label={t("label")}
    >
      <span className={iconWrap} title={t("label")}>
        <Languages className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} aria-hidden />
      </span>
      <div className={track}>
        {routing.locales.map((loc) => {
          const active = locale === loc;
          const short = loc === "kk" ? t("shortKk") : t("shortRu");
          return (
            <button
              key={loc}
              type="button"
              onClick={() => onSelect(loc)}
              className={`${btnBase} ${active ? btnActive : btnIdle}`}
              aria-pressed={active}
              aria-current={active ? "true" : undefined}
            >
              {short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
