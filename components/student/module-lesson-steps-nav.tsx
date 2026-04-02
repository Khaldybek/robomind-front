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
      className="sticky top-14 z-[15] -mx-3 mb-8 border-b border-slate-200/70 bg-white/85 px-3 py-3 shadow-sm backdrop-blur-md sm:-mx-0 sm:mb-10 sm:rounded-2xl sm:border sm:py-3.5 sm:shadow-md"
      aria-label={t("stepsNavLabel")}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
        <List className="h-4 w-4 shrink-0 text-teal-600" strokeWidth={2} aria-hidden />
        <span>{t("stepsNavHint")}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ id, step, title }) => {
          const active = activeId === id;
          const short =
            title.length > 42 ? `${title.slice(0, 40).trim()}…` : title;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToStep(id)}
              className={`flex min-w-0 max-w-[min(100%,18rem)] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition sm:max-w-xs ${
                active
                  ? "border-teal-500 bg-teal-50 text-teal-950 shadow-sm ring-1 ring-teal-400/40"
                  : "border-slate-200/90 bg-slate-50/90 text-slate-700 hover:border-teal-300/60 hover:bg-white"
              }`}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200"
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
