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
      className="sa-card-in group relative block overflow-hidden rounded-[var(--radius-ds-card)] border border-white/90 bg-white/85 p-5 shadow-[0_10px_44px_-14px_rgba(0,0,0,0.14)] backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-ds-primary/35 hover:shadow-[0_20px_56px_-16px_rgba(255,46,31,0.22)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
          {label}
        </span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ds-gray-light to-ds-gray-mid text-ds-black shadow-inner transition-transform duration-300 group-hover:scale-105 group-hover:from-red-50 group-hover:to-orange-50">
          {icon}
        </span>
      </div>
      <p className="ds-text-h2 text-ds-black tabular-nums">{value}</p>
      {sub && (
        <p className="ds-text-caption mt-2 text-ds-gray-text">{sub}</p>
      )}
      <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-ds-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  );
}
