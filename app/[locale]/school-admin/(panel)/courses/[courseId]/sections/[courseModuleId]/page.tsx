"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  listSchoolAdminCourseModules,
  listSchoolAdminLessons,
} from "@/lib/api/school-admin/courses";
import type { AdminLessonRow, AdminModule } from "@/lib/api/super-admin/courses-modules";
import { isApiConfigured } from "@/lib/env";

export default function SchoolAdminCourseSectionLessonsPage() {
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
      listSchoolAdminCourseModules({ courseId, limit: 100 }).then((r) => {
        if (!cancelled) {
          setSection(r.items.find((m) => m.id === courseModuleId) ?? null);
        }
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

  return (
    <div>
      <Link
        href={`/school-admin/courses/${encodeURIComponent(courseId)}/modules`}
        className="ds-text-caption mb-6 inline-block text-ds-primary hover:underline"
      >
        ← К разделам курса
      </Link>
      <h1 className="ds-text-h2 text-ds-black">
        {section?.title ?? "Раздел"}
      </h1>
      <p className="mt-2 text-sm text-ds-gray-text">
        Проверка домашних заданий по урокам.
      </p>
      {loading && (
        <p className="mt-4 ds-text-caption text-ds-gray-text">Загрузка…</p>
      )}
      {err && (
        <p className="mt-4 ds-text-small text-ds-error" role="alert">
          {err}
        </p>
      )}
      <ul className="mt-6 space-y-2">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <Link
              href={`/school-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.id)}/homework`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-3 hover:border-ds-primary"
            >
              <span className="font-medium text-ds-black">
                {lesson.order}. {lesson.title || lesson.id}
              </span>
              <span className="ds-text-caption text-ds-primary">ДЗ →</span>
            </Link>
          </li>
        ))}
      </ul>
      {!loading && lessons.length === 0 && (
        <p className="mt-6 text-sm text-ds-gray-text">В этом разделе нет уроков.</p>
      )}
    </div>
  );
}
