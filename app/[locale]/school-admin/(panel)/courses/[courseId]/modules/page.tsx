"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  fetchSchoolAdminCourse,
  listSchoolAdminCourseModules,
} from "@/lib/api/school-admin/courses";
import type { AdminCourse, AdminModule } from "@/lib/api/super-admin/courses-modules";
import { isApiConfigured } from "@/lib/env";

export default function SchoolAdminCourseModulesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured() || !courseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    Promise.all([
      fetchSchoolAdminCourse(courseId).then(setCourse).catch(() => setCourse(null)),
      listSchoolAdminCourseModules({ courseId, limit: 100 })
        .then((r) => setModules(r.items))
        .catch(() => setModules([])),
    ])
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <div>
      <Link
        href={`/school-admin/courses/${encodeURIComponent(courseId)}`}
        className="ds-text-caption mb-6 inline-block text-ds-primary hover:underline"
      >
        ← К курсу
      </Link>
      <h1 className="ds-text-h2 text-ds-black">
        Модули: {course?.title ?? "…"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ds-gray-text">
        Проверка домашних заданий и журнал по каждому модулю.
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
        {modules.map((m) => (
          <li key={m.id}>
            <Link
              href={`/school-admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(m.id)}/homework`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-3 hover:border-ds-primary"
            >
              <span className="font-medium text-ds-black">
                {m.title || m.id}
              </span>
              <span className="ds-text-caption text-ds-primary">
                ДЗ и журнал →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!loading && modules.length === 0 && (
        <p className="mt-6 text-sm text-ds-gray-text">Модули не найдены.</p>
      )}
    </div>
  );
}
