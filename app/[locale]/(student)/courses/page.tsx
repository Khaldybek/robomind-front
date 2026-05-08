"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchCourses } from "@/lib/api/student/courses";
import type { CourseSummary } from "@/lib/api/types";
import { CourseCard } from "@/components/student/course-card";
import { isApiConfigured } from "@/lib/env";

export default function CoursesPage() {
  const t = useTranslations("StudentCourses");
  const tc = useTranslations("Common");
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      setLoading(false);
      return;
    }
    fetchCourses()
      .then(setCourses)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ds-container py-10 lg:py-14">
      <header className="mb-8 rounded-3xl border border-sky-200/55 bg-white/90 px-5 py-5 shadow-sm sm:px-7">
        <h1 className="text-balance text-2xl font-bold text-slate-900 sm:text-3xl">
          {t("title")}
        </h1>
      </header>
      {loading && (
        <p className="text-base text-slate-600">{tc("loading")}</p>
      )}
      {error && (
        <p className="mb-6 text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseCard key={String(c.id)} course={c} />
        ))}
      </ul>
      {!loading && !error && courses.length === 0 && (
        <p className="text-base text-slate-600">{t("empty")}</p>
      )}
    </div>
  );
}
