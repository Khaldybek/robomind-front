"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import {
  fetchSchoolAdminCourses,
  type AdminCourseRow,
} from "@/lib/api/school-admin/courses";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

const TILES = 3;

export function SchoolAdminDashboardCoursesStrip() {
  const t = useTranslations("SchoolAdminDashboard");
  const [items, setItems] = useState<AdminCourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    fetchSchoolAdminCourses({ limit: TILES, page: 1 })
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          {t("availableCoursesTitle")}
        </h2>
        <Link
          href="/school-admin/courses"
          className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 transition hover:text-sky-900"
        >
          {t("viewAllCourses")}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: TILES }).map((_, i) => (
            <div
              key={i}
              className="sa-course-tile h-[220px] animate-pulse bg-slate-100/80"
              aria-hidden
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-sky-200/60 bg-white/80 p-6 text-sm text-slate-600">
          {t("availableCoursesEmpty")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, idx) => {
            const id = String(c.id);
            const thumb = resolvePublicFileUrl(c.thumbnailUrl);
            const title =
              c.title || c.id || `#${idx + 1}`;
            return (
              <li key={id}>
                <Link
                  href={`/school-admin/courses/${encodeURIComponent(id)}`}
                  className="sa-course-tile sa-card-in group block"
                  style={{ animationDelay: `${Math.min(idx * 80, 320)}ms` }}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- динамический URL
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-200/70 text-sky-700">
                        <span className="text-3xl" aria-hidden>
                          🤖
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-4 sm:px-5">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">
                      {title}
                    </h3>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
