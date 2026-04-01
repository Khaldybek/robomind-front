"use client";

import type { ReactNode } from "react";

/** Декоративный фон: мягкие градиентные «орбы» + лёгкая сетка (без картинок — быстро и легко заменить на фото). */
export function SchoolAdminAmbientBg() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="sa-orb sa-orb--a" />
      <div className="sa-orb sa-orb--b" />
      <div className="sa-orb sa-orb--c" />
      <div className="sa-grid-mask" />
    </div>
  );
}

/** Обёртка панели: фон + опциональный контент поверх. */
export function SchoolAdminMarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[linear-gradient(165deg,#f7f7f8_0%,#ececee_45%,#f4f4f6_100%)]">
      <SchoolAdminAmbientBg />
      {children}
    </div>
  );
}
