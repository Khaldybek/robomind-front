"use client";

import type { ReactNode } from "react";
import { useSchoolAdminMe } from "@/components/school-admin/admin-me-context";

function schoolLine(
  school:
    | {
        school: { name: string; number: number | null };
        city: { name: string } | null;
      }
    | null,
): string {
  if (!school) return "";
  const num =
    school.school.number != null ? ` №${school.school.number}` : "";
  const head = `${school.school.name}${num}`.trim();
  if (school.city?.name) return `${head} · ${school.city.name}`;
  return head;
}

export function SchoolAdminPageHero({
  title,
  description,
  showSchoolLine = true,
  children,
}: {
  title: string;
  description?: string;
  showSchoolLine?: boolean;
  children?: ReactNode;
}) {
  const { school } = useSchoolAdminMe();
  const subline = showSchoolLine ? schoolLine(school) : "";

  return (
    <section className="sa-page-hero mb-8">
      <div className="relative z-[1] max-w-3xl">
        <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-[1.75rem]">
          {title}
        </h1>
        {subline ? (
          <p className="mt-3 text-sm font-medium text-white/85 sm:text-base">
            {subline}
          </p>
        ) : null}
        {description ? (
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-white/85 sm:text-[15px]">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
