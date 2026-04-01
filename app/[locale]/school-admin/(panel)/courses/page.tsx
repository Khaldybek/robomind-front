"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  fetchSchoolAdminCourses,
  type AdminCourseRow,
} from "@/lib/api/school-admin/courses";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

export default function SchoolAdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setError("API");
      return;
    }
    fetchSchoolAdminCourses({ limit: 100 })
      .then((r) => {
        setCourses(r.items);
        setTotal(r.total);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <header className="mb-8 rounded-[var(--radius-ds-section)] border border-white/70 bg-gradient-to-br from-white/95 to-ds-gray-light/60 p-6 shadow-[0_16px_50px_-24px_rgba(0,0,0,0.1)] backdrop-blur-sm lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ds-primary">
          Каталог
        </p>
        <h1 className="ds-text-h1 mt-2 text-balance text-ds-black">
          Курсы для вашей школы
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-ds-gray-text">
          Здесь только опубликованные курсы. Выдавайте доступ ученикам и
          отслеживайте, сколько детей из школы уже подключено.
        </p>
        <p className="ds-text-caption mt-4 font-medium text-ds-black">
          В каталоге:{" "}
          <span className="tabular-nums text-ds-primary">{total}</span> курсов
        </p>
      </header>
      {error && <p className="ds-text-small text-ds-error mb-4">{error}</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
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
              className="group block overflow-hidden rounded-[var(--radius-ds-card)] border border-white/90 bg-white/85 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.12)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ds-primary/35 hover:shadow-[0_18px_48px_-16px_rgba(255,46,31,0.15)]"
            >
              <div className="relative h-40 w-full overflow-hidden">
                {thumbSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbSrc}
                    alt={c.title || "Обложка курса"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(255,96,84,0.35),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(128,157,255,0.35),transparent_45%),linear-gradient(135deg,#f5f7fb,#eef2f9)]">
                    <span className="ds-text-caption text-ds-gray-text">
                      Нет обложки
                    </span>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-85" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="line-clamp-2 ds-text-subtitle text-white drop-shadow-sm">
                    {c.title || c.id}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <span className="block ds-text-caption text-ds-gray-text">
                  Учеников школы:{" "}
                  <span className="font-medium text-ds-black tabular-nums">
                    {c.studentsCount ?? 0}
                  </span>{" "}
                  · модулей:{" "}
                  <span className="font-medium text-ds-black tabular-nums">
                    {c.moduleCount ?? 0}
                  </span>
                </span>
              </div>
            </Link>
          </li>
        );
        })}
      </ul>
      {courses.length === 0 && !error && (
        <p className="ds-text-caption text-ds-gray-text">Список пуст или TODO на бэке</p>
      )}
    </div>
  );
}
