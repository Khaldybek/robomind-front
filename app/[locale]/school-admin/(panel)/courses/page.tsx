"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  fetchSchoolAdminCourses,
  type AdminCourseRow,
} from "@/lib/api/school-admin/courses";
import { SchoolAdminPageHero } from "@/components/school-admin/admin-page-hero";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

export default function SchoolAdminCoursesPage() {
  const t = useTranslations("SchoolAdminCourses");
  const tc = useTranslations("Common");
  const [courses, setCourses] = useState<AdminCourseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      return;
    }
    fetchSchoolAdminCourses({ limit: 100 })
      .then((r) => {
        setCourses(r.items);
        setTotal(r.total);
      })
      .catch((e: Error) => setError(e.message));
  }, [tc]);

  return (
    <div>
      <SchoolAdminPageHero title={t("pageTitle")} description={t("pageLead")}>
        <p className="mt-4 text-sm font-semibold text-white">
          {t("catalogCount", { count: total })}
        </p>
      </SchoolAdminPageHero>

      {error && (
        <p className="mb-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, idx) => {
          const thumbSrc = resolvePublicFileUrl(c.thumbnailUrl);
          return (
            <li
              key={String(c.id)}
              className="sa-card-in"
              style={{ animationDelay: `${Math.min(idx * 60, 420)}ms` }}
            >
              <Link
                href={`/school-admin/courses/${encodeURIComponent(String(c.id))}`}
                className="sa-course-tile group block"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  {thumbSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbSrc}
                      alt={c.title || t("coverAlt")}
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
                <div className="p-5">
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">
                    {c.title || c.id || t("courseFallback")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500">
                    {t("studentsSchool")}{" "}
                    <span className="font-semibold text-slate-700 tabular-nums">
                      {c.studentsCount ?? 0}
                    </span>{" "}
                    · {t("modules")}{" "}
                    <span className="font-semibold text-slate-700 tabular-nums">
                      {c.moduleCount ?? 0}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {courses.length === 0 && !error && (
        <p className="text-sm text-slate-500">{t("emptyOrBackend")}</p>
      )}
    </div>
  );
}
