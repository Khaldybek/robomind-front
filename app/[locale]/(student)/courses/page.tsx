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
      <h1 className="ds-text-h1 mb-8 text-ds-black">{t("title")}</h1>
      {loading && (
        <p className="ds-text-body text-ds-gray-text">{tc("loading")}</p>
      )}
      {error && (
        <p className="ds-text-small text-ds-error mb-6" role="alert">
          {error}
        </p>
      )}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseCard key={String(c.id)} course={c} />
        ))}
      </ul>
      {!loading && !error && courses.length === 0 && (
        <p className="ds-text-body text-ds-gray-text">{t("empty")}</p>
      )}
    </div>
  );
}
