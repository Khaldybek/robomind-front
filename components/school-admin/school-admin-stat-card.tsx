"use client";

import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

type StatCardProps = {
  href: string;
  label: string;
  value: ReactNode;
  sub?: string | null;
  icon: ReactNode;
  /** задержка появления для каскада (мс) */
  delayMs?: number;
};

export function SchoolAdminStatCardLink({
  href,
  label,
  value,
  sub,
  icon,
  delayMs = 0,
}: StatCardProps) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${delayMs}ms` }}
      className="sa-stat-card sa-card-in group relative block overflow-hidden p-5 outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900 sm:text-[2rem]">
            {value}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 ring-1 ring-sky-200/80 transition-transform duration-300 group-hover:scale-105">
          {icon}
        </span>
      </div>
      {sub ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{sub}</p>
      ) : null}
      <span
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-200/30 blur-2xl transition-opacity duration-300 group-hover:bg-sky-300/40"
        aria-hidden
      />
    </Link>
  );
}
