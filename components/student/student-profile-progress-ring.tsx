"use client";

import { useEffect, useId, useState } from "react";

type StudentProfileProgressRingProps = {
  percent: number;
  label: string;
  className?: string;
};

/** Кольцо прогресса с градиентом (как на макете профиля). */
export function StudentProfileProgressRing({
  percent,
  label,
  className = "",
}: StudentProfileProgressRingProps) {
  const gid = useId().replace(/:/g, "");
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div
      className={`flex flex-col items-center justify-center py-4 ${className}`}
    >
      <div className="relative aspect-square w-[min(220px,70vw)] max-w-[13.5rem]">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-90"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`pr-grad-${gid}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="55%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={`url(#pr-grad-${gid})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[clamp(2rem,6vw,2.75rem)] font-semibold tabular-nums leading-none text-slate-900">
            {p}
          </span>
        </div>
      </div>
      <p className="mt-4 max-w-[12rem] text-center text-sm font-medium leading-snug text-slate-600">
        {label}
      </p>
    </div>
  );
}
