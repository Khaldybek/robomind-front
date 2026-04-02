"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { List } from "lucide-react";

export type ModuleLessonStepNavItem = {
  id: string;
  step: number;
  title: string;
};

type ModuleLessonStepsNavProps = {
  items: ModuleLessonStepNavItem[];
};

/**
 * Горизонтальная полоса шагов: клик — плавный скролл к блоку;
 * при прокрутке страницы подсвечивается активный шаг (scroll-spy).
 */
export function ModuleLessonStepsNav({ items }: ModuleLessonStepsNavProps) {
  const t = useTranslations("StudentModule");
  const [activeId, setActiveId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  useEffect(() => {
    if (items.length === 0) return;
    const els = items
      .map((i) => document.getElementById(`content-${i.id}`))
      .filter((n): n is HTMLElement => n != null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const center = window.innerHeight * 0.42;
        let best = visible[0];
        let bestDist = Infinity;
        for (const e of visible) {
          const r = e.target.getBoundingClientRect();
          const mid = r.top + r.height / 2;
          const d = Math.abs(mid - center);
          if (d < bestDist) {
            bestDist = d;
            best = e;
          }
        }
        const raw = best.target.id.replace(/^content-/, "");
        setActiveId(raw);
      },
      {
        threshold: [0, 0.08, 0.15, 0.25, 0.4],
        rootMargin: "-12% 0px -35% 0px",
      },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  function scrollToStep(id: string) {
    const el = document.getElementById(`content-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (items.length === 0) return null;

  return (
    <nav
      className="sticky top-14 z-[15] mb-8 rounded-xl border border-slate-200/70 bg-white/90 py-2.5 pl-3 pr-2 shadow-sm backdrop-blur-md sm:mb-10 sm:rounded-2xl sm:py-3"
      aria-label={t("stepsNavLabel")}
    >
      <div className="mb-2 flex items-center gap-1.5 px-1 text-xs text-slate-500">
        <List className="h-3.5 w-3.5 shrink-0 text-teal-600" strokeWidth={2} aria-hidden />
        <span>{t("stepsNavHint")}</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ id, step, title }) => {
          const active = activeId === id;
          const short =
            title.length > 36 ? `${title.slice(0, 34).trim()}…` : title;
          return (
            <button
              key={id}
              type="button"
              title={title}
              onClick={() => scrollToStep(id)}
              className={`flex min-w-0 max-w-[min(100%,16rem)] shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[0.8125rem] transition sm:max-w-xs ${
                active
                  ? "border-teal-500/80 bg-teal-50/90 text-teal-950"
                  : "border-transparent bg-slate-100/80 text-slate-700 hover:bg-slate-100"
              }`}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[0.6875rem] font-bold tabular-nums ${
                  active
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200/90"
                }`}
              >
                {step}
              </span>
              <span className="line-clamp-2 font-medium leading-snug">{short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
