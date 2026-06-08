"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams, useSearchParams } from "next/navigation";
import {
  getSchoolAdminLesson,
  getSchoolAdminLessonQuiz,
  listSchoolAdminLessonContents,
} from "@/lib/api/school-admin/courses";
import type { AdminContentBlock, AdminModule } from "@/lib/api/super-admin/courses-modules";
import type { AdminQuiz, AdminQuizQuestion } from "@/lib/api/super-admin/quizzes";
import { LessonContentBlockBody } from "@/components/lesson-content/lesson-content-block-body";
import { isApiConfigured } from "@/lib/env";

function quizTypeLabel(
  t: (k: "typeSingle" | "typeMultiple" | "typeText") => string,
  type: AdminQuizQuestion["type"],
): string {
  if (type === "multiple") return t("typeMultiple");
  if (type === "text") return t("typeText");
  return t("typeSingle");
}

function LessonReadInner() {
  const t = useTranslations("SchoolAdminLessonRead");
  const tc = useTranslations("Common");
  const { courseId, lessonId } = useParams() as {
    courseId: string;
    lessonId: string;
  };
  const searchParams = useSearchParams();
  const courseModuleId = searchParams.get("courseModuleId");

  const [lesson, setLesson] = useState<AdminModule | null>(null);
  const [blocks, setBlocks] = useState<AdminContentBlock[]>([]);
  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured() || !lessonId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    Promise.all([
      getSchoolAdminLesson(lessonId).then((m) => {
        if (!cancelled) setLesson(m);
      }),
      listSchoolAdminLessonContents(lessonId).then((list) => {
        if (!cancelled) {
          setBlocks([...list].sort((a, b) => a.order - b.order));
        }
      }),
      getSchoolAdminLessonQuiz(lessonId).then((q) => {
        if (!cancelled) setQuiz(q);
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
  }, [lessonId]);

  const backSectionHref =
    courseModuleId != null && courseModuleId.length > 0
      ? `/school-admin/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(courseModuleId)}`
      : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        {backSectionHref ? (
          <Link
            href={backSectionHref}
            className="ds-text-caption text-ds-primary hover:underline"
          >
            {t("backSection")}
          </Link>
        ) : (
          <Link
            href={`/school-admin/courses/${encodeURIComponent(courseId)}/modules`}
            className="ds-text-caption text-ds-primary hover:underline"
          >
            {t("backModules")}
          </Link>
        )}
        <span className="text-ds-gray-text">·</span>
        <Link
          href={`/school-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/homework`}
          className="ds-text-caption font-medium text-ds-primary hover:underline"
        >
          {t("homeworkCta")}
        </Link>
      </div>

      <header className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="ds-text-h2 text-ds-black">
            {lesson?.title ?? t("titleFallback")}
          </h1>
          <span className="shrink-0 rounded-md border border-ds-gray-border bg-ds-gray-light/50 px-2 py-1 text-xs font-medium text-ds-gray-text">
            {t("readOnlyBadge")}
          </span>
        </div>
        <p className="mt-2 max-w-2xl ds-text-caption leading-relaxed text-ds-gray-text">
          {t("readOnlyNote")}
        </p>
      </header>

      {err ? (
        <p className="rounded-lg border border-ds-error/25 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error" role="alert">
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="ds-text-caption text-ds-gray-text">{tc("loading")}</p>
      ) : (
        <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:gap-6 lg:space-y-0">
          <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4 shadow-sm sm:p-5">
            <h2 className="ds-text-h3 text-ds-black">{t("blocksTitle")}</h2>
            {blocks.length === 0 ? (
              <p className="mt-3 ds-text-caption text-ds-gray-text">{t("noBlocks")}</p>
            ) : (
              <ol className="mt-4 list-none space-y-4 p-0">
                {blocks.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-ds-card border border-ds-gray-border bg-ds-gray-light/15 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ds-primary">
                        {b.type}
                      </span>
                      {b.title ? (
                        <span className="ds-text-body font-semibold text-ds-black">
                          {b.title}
                        </span>
                      ) : null}
                      <span className="text-xs text-ds-gray-text">
                        {t("orderLabel", { order: b.order })}
                      </span>
                    </div>
                    <div className="mt-4 min-w-0">
                      <LessonContentBlockBody
                        block={b}
                        labels={{
                          fileMissing: t("fileMissing"),
                          openLink: t("openLink"),
                          livestream: t("livestream"),
                          downloadFile: t("downloadFile"),
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <aside className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-4 lg:self-start">
            <h2 className="ds-text-h3 text-ds-black">{t("quizTitle")}</h2>
            {quiz == null ? (
              <p className="mt-3 ds-text-caption text-ds-gray-text">{t("noQuiz")}</p>
            ) : (
              <div className="mt-3 space-y-4">
                <p className="ds-text-caption text-ds-gray-text">
                  {t("quizMeta", {
                    passing: quiz.passingScore,
                    count: quiz.questions.length,
                  })}
                </p>
                <p className="text-sm font-medium text-ds-black">{quiz.title}</p>
                {quiz.questions.length > 0 ? (
                  <ul className="space-y-3 border-t border-ds-gray-border pt-3">
                    {quiz.questions
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((q, i) => (
                        <li
                          key={q.id}
                          className="rounded-md border border-ds-gray-border bg-ds-gray-light/15 px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-ds-gray-text">
                            {t("questionTitle", { n: i + 1 })} ·{" "}
                            {quizTypeLabel(t, q.type)}
                          </p>
                          <p className="mt-1 text-sm text-ds-black">{q.text}</p>
                          {q.type !== "text" && q.answers.length > 0 ? (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-ds-gray-text">
                                {t("answersLead")}
                              </p>
                              <ul className="mt-1 list-inside list-disc text-sm text-ds-gray-dark-2">
                                {q.answers.map((a) => (
                                  <li key={a.id}>{a.text}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default function SchoolAdminLessonReadPage() {
  const tc = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <p className="ds-text-caption text-ds-gray-text">{tc("loading")}</p>
      }
    >
      <LessonReadInner />
    </Suspense>
  );
}
