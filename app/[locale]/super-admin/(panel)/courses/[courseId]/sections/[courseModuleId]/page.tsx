"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  getAdminCourseModule,
  listAdminLessons,
  createAdminLesson,
  type AdminLessonRow,
  type AdminModule,
} from "@/lib/api/super-admin/courses-modules";
import { isApiConfigured } from "@/lib/env";
import { AdminModal } from "@/components/super-admin/admin-modal";

export default function SuperAdminCourseSectionLessonsPage() {
  const { courseId, courseModuleId } = useParams() as {
    courseId: string;
    courseModuleId: string;
  };
  const [section, setSection] = useState<AdminModule | null>(null);
  const [lessons, setLessons] = useState<AdminLessonRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("1");
  const [isPublishedNew, setIsPublishedNew] = useState(false);
  const [unlockAfterLessonId, setUnlockAfterLessonId] = useState("");

  function load() {
    if (!isApiConfigured()) return;
    setErr(null);
    getAdminCourseModule(courseModuleId)
      .then(setSection)
      .catch(() => setSection(null));
    listAdminLessons({ courseModuleId, limit: 100 })
      .then((r) =>
        setLessons([...r.items].sort((a, b) => a.order - b.order)),
      )
      .catch(() => setLessons([]));
  }

  useEffect(() => {
    load();
  }, [courseId, courseModuleId]);

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href={`/super-admin/courses/${encodeURIComponent(courseId)}`}
        className="ds-text-caption text-ds-primary"
      >
        ← К курсу
      </Link>
      <h1 className="ds-text-h2 text-ds-black">
        {section?.title ?? "Раздел курса"}
      </h1>
      <p className="ds-text-caption text-ds-gray-text/80 break-all">
        {courseModuleId}
      </p>
      {err && (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}
      {ok && (
        <p className="rounded-lg border border-ds-success/30 bg-[#F0FFF4] px-3 py-2 ds-text-small text-ds-success">
          {ok}
        </p>
      )}

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="ds-text-h3 text-ds-black">Уроки</h2>
          <button
            type="button"
            className="ui-btn ui-btn--1"
            onClick={() => {
              setErr(null);
              setModal(true);
            }}
          >
            + Урок
          </button>
        </div>
        <ol className="space-y-2">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-3"
            >
              <Link
                href={`/super-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.id)}`}
                className="min-w-0 flex-1 transition-colors hover:text-ds-primary"
              >
                <span className="ds-text-small font-medium text-ds-black">
                  {lesson.order}. {lesson.title}
                </span>
                <span className="ml-2 ds-text-caption text-ds-gray-text">
                  {lesson.isPublished ? "опубл." : "черновик"}
                </span>
              </Link>
              <Link
                href={`/super-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.id)}/homework`}
                className="ds-text-caption text-ds-primary hover:underline"
              >
                ДЗ →
              </Link>
            </li>
          ))}
        </ol>
        {lessons.length === 0 && (
          <p className="ds-text-caption text-ds-gray-text">Уроков пока нет.</p>
        )}
      </section>

      <AdminModal
        open={modal}
        wide
        title="Новый урок"
        onClose={() => setModal(false)}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            createAdminLesson({
              courseModuleId,
              title: title.trim(),
              description: description.trim() || null,
              order: Number(order) || 0,
              isPublished: isPublishedNew,
              unlockAfterLessonId: unlockAfterLessonId || undefined,
            })
              .then(() => {
                setModal(false);
                setTitle("");
                setDescription("");
                setOrder("1");
                setIsPublishedNew(false);
                setUnlockAfterLessonId("");
                setOk("Урок создан");
                load();
              })
              .catch((er) => {
                setErr(er instanceof Error ? er.message : String(er));
              });
          }}
        >
          <div>
            <label className="ds-text-caption text-ds-gray-text">Название *</label>
            <input
              className="mt-1 ds-input w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="ds-text-caption text-ds-gray-text">Описание</label>
            <textarea
              className="mt-1 ds-input min-h-[80px] w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="ds-text-caption text-ds-gray-text">Порядок</label>
            <input
              className="mt-1 ds-input w-24"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>
          <div>
            <label className="ds-text-caption text-ds-gray-text">
              Открыть после урока
            </label>
            <select
              className="mt-1 ds-input w-full"
              value={unlockAfterLessonId}
              onChange={(e) => setUnlockAfterLessonId(e.target.value)}
            >
              <option value="">— нет —</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.order}. {l.title}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 ds-text-small">
            <input
              type="checkbox"
              checked={isPublishedNew}
              onChange={(e) => setIsPublishedNew(e.target.checked)}
            />
            Опубликован
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="ui-btn ui-btn--1">
              Создать
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--4"
              onClick={() => setModal(false)}
            >
              Отмена
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
