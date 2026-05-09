"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  fetchSchoolAdminCourseModule,
  listSchoolAdminLessons,
} from "@/lib/api/school-admin/courses";
import type { AdminLessonRow, AdminModule } from "@/lib/api/super-admin/courses-modules";
import { isApiConfigured } from "@/lib/env";

export default function SchoolAdminCourseSectionLessonsPage() {
  const t = useTranslations("SchoolAdminSectionLessons");
  const tc = useTranslations("Common");
  const { courseId, courseModuleId } = useParams() as {
    courseId: string;
    courseModuleId: string;
  };
  const [section, setSection] = useState<AdminModule | null>(null);
  const [lessons, setLessons] = useState<AdminLessonRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured() || !courseId || !courseModuleId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    Promise.all([
      fetchSchoolAdminCourseModule(courseModuleId).then((m) => {
        if (!cancelled) setSection(m);
      }),
      listSchoolAdminLessons({ courseModuleId, limit: 100 }).then((r) => {
        if (!cancelled) {
          setLessons([...r.items].sort((a, b) => a.order - b.order));
        }
      }),
    ])
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, courseModuleId]);

  const lessonHref = (lessonId: string) =>
    `/school-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}?courseModuleId=${encodeURIComponent(courseModuleId)}`;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <Link
        href={`/school-admin/courses/${encodeURIComponent(courseId)}/modules`}
        className="ds-text-caption text-ds-primary hover:underline"
      >
        {t("backToModules")}
      </Link>
      <header>
        <h1 className="ds-text-h2 text-ds-black">
          {section?.title ?? "—"}
        </h1>
        <p className="mt-2 max-w-2xl ds-text-caption leading-relaxed text-ds-gray-text">
          {t("lead")}
        </p>
      </header>
      {loading ? (
        <p className="ds-text-caption text-ds-gray-text">{tc("loading")}</p>
      ) : null}
      {err ? (
        <p className="rounded-lg border border-ds-error/25 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error" role="alert">
          {err}
        </p>
      ) : null}
      <ul className="space-y-2">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <div className="flex flex-col gap-2 rounded-ds-card border border-ds-gray-border bg-ds-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium text-ds-black">
                {lesson.order}. {lesson.title || lesson.id}
              </span>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={lessonHref(lesson.id)}
                  className="rounded-md border border-ds-gray-border bg-ds-gray-light/40 px-3 py-1.5 text-center text-sm font-medium text-ds-primary transition-colors hover:border-ds-primary/40 hover:bg-ds-primary/5"
                >
                  {t("lessonCta")}
                </Link>
                <Link
                  href={`/school-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.id)}/homework`}
                  className="rounded-md border border-ds-gray-border px-3 py-1.5 text-center text-sm font-medium text-ds-black transition-colors hover:bg-ds-gray-light/60"
                >
                  {t("homeworkCta")}
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!loading && lessons.length === 0 && !err ? (
        <p className="ds-text-caption text-ds-gray-text">{t("emptyLessons")}</p>
      ) : null}
    </div>
  );
}
