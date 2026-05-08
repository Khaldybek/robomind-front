"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { fetchCourseDetail } from "@/lib/api/student/courses";
import { fetchCourseModuleLessons } from "@/lib/api/student/modules";
import type { CourseSummary } from "@/lib/api/types";
import type { CourseLessonSummary, CourseModuleSummary } from "@/lib/api/types";
import {
  formatCourseLevel,
  pickCourseAgeGroup,
  resolveCourseThumbnailUrl,
} from "@/lib/course-display";
import { isApiConfigured } from "@/lib/env";
import {
  classifyModuleLessonLoadError,
  type ModuleLessonLoadError,
} from "@/lib/course-module-lesson-error";
import { ChevronRight, LockKeyhole } from "lucide-react";

export default function CourseDetailPage() {
  const t = useTranslations("StudentCourseDetail");
  const tc = useTranslations("Common");
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [modules, setModules] = useState<CourseModuleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonsBySection, setLessonsBySection] = useState<
    Record<string, CourseLessonSummary[]>
  >({});
  const [lessonsLoaded, setLessonsLoaded] = useState<Record<string, boolean>>(
    {},
  );
  const [lessonsLoadingId, setLessonsLoadingId] = useState<string | null>(null);
  const [lessonsError, setLessonsError] = useState<
    Record<string, ModuleLessonLoadError | null>
  >({});

  useEffect(() => {
    if (!isApiConfigured() || !courseId) {
      setLoading(false);
      return;
    }
    fetchCourseDetail(courseId)
      .then(({ course: c, modules: m }) => {
        setCourse(c);
        setModules(m);
        if (!c || Object.keys(c).length === 0) {
          setCourse({
            id: courseId,
            title: t("courseFallback", { id: courseId }),
          } as CourseSummary);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId, t]);

  useEffect(() => {
    setLessonsBySection({});
    setLessonsLoaded({});
    setLessonsError({});
  }, [courseId]);

  async function loadSectionLessons(sectionId: string) {
    if (!isApiConfigured() || lessonsLoaded[sectionId]) return;
    setLessonsLoadingId(sectionId);
    setLessonsError((prev) => ({ ...prev, [sectionId]: null }));
    try {
      const items = await fetchCourseModuleLessons(sectionId);
      setLessonsBySection((prev) => ({ ...prev, [sectionId]: items }));
      setLessonsLoaded((prev) => ({ ...prev, [sectionId]: true }));
    } catch (e) {
      setLessonsError((prev) => ({
        ...prev,
        [sectionId]: classifyModuleLessonLoadError(e),
      }));
    } finally {
      setLessonsLoadingId(null);
    }
  }

  const summary =
    course &&
    (typeof course.description === "string"
      ? course.description
      : (course.summary as string) || (course.whatYouLearn as string));

  const thumbUrl = course ? resolveCourseThumbnailUrl(course) : null;
  const levelLabel = course ? formatCourseLevel(course) : undefined;
  const ageLabel = course ? pickCourseAgeGroup(course) : undefined;
  const metaLine = [levelLabel, ageLabel].filter(Boolean).join(" · ");

  const displayTitle =
    course?.title ?? course?.name ?? t("courseFallback", { id: courseId });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(180deg,#dbeafe_0%,#e8f2fc_42%,#f0f7fc_100%)] pb-12 sm:pb-16">
      <div className="ds-container pt-4 sm:pt-5 lg:pt-6">
        <Link
          href="/courses"
          className="ds-text-caption mb-3 inline-block text-ds-primary hover:underline"
        >
          {t("backToCourses")}
        </Link>
        {loading && (
          <p className="ds-text-body text-ds-gray-text">{tc("loading")}</p>
        )}
        {error && (
          <p className="ds-text-small text-ds-error mb-4" role="alert">
            {error}
          </p>
        )}
      </div>
      {course && !loading && (
        <div className="relative mt-2 aspect-[21/9] min-h-[200px] w-full max-h-[min(50vh,520px)] overflow-hidden bg-ds-gray-light sm:aspect-[2/1] sm:min-h-[240px]">
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- обложка с API
            <img
              src={thumbUrl}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <Image
              src="/student/hero-robot.svg"
              alt=""
              fill
              className="object-cover object-center opacity-90"
              sizes="100vw"
              priority
            />
          )}
        </div>
      )}
      <div className="ds-container pb-10 pt-6 lg:pb-14 lg:pt-8">
        <h1 className="ds-text-h1 text-ds-black">{displayTitle}</h1>
        {metaLine ? (
          <p className="ds-text-caption mt-2 text-ds-gray-text">{metaLine}</p>
        ) : null}
        {summary && (
          <div className="ds-block-section mt-6">
            <h2 className="ds-text-h3 mb-3">{t("aboutTitle")}</h2>
            <p className="ds-text-body whitespace-pre-wrap text-ds-gray-text">
              {summary}
            </p>
          </div>
        )}
        <section className="mt-10">
          <h2 className="ds-text-h3 mb-4">{t("modulesTitle")}</h2>
          {modules.length === 0 && !loading && (
            <p className="ds-text-body text-ds-gray-text">{t("modulesEmpty")}</p>
          )}
          <ol className="space-y-3">
            {modules.map((mod, i) => {
              const sectionId = String(mod.id);
              const rawLessons = lessonsBySection[sectionId];
              const sortedLessons = rawLessons
                ? [...rawLessons].sort(
                    (a, b) =>
                      Number(a.order ?? 0) - Number(b.order ?? 0),
                  )
                : [];
              const firstLesson = sortedLessons[0];
              const firstLessonHref = firstLesson
                ? `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(firstLesson.id)}`
                : null;
              return (
                <li key={sectionId}>
                  <details
                    className="group rounded-ds-card border border-ds-gray-border bg-ds-white"
                    onToggle={(e) => {
                      const el = e.currentTarget;
                      if (el.open) void loadSectionLessons(sectionId);
                    }}
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ds-gray-mid ds-text-small font-medium">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 ds-text-body font-medium text-ds-black">
                        {mod.title ?? mod.name ?? t("moduleFallback", { id: sectionId })}
                      </span>
                      <span
                        className="shrink-0 text-ds-gray-text transition-transform duration-200 group-open:rotate-180"
                        aria-hidden
                      >
                        ▼
                      </span>
                    </summary>
                    <div className="border-t border-ds-gray-border bg-gradient-to-b from-ds-gray-light/50 to-ds-gray-light/30 px-3 py-4 sm:px-4">
                      {lessonsLoadingId === sectionId && (
                        <p className="ds-text-small text-ds-gray-text">
                          {t("lessonsLoading")}
                        </p>
                      )}
                      {lessonsError[sectionId] && lessonsLoadingId !== sectionId && (
                        <>
                          {lessonsError[sectionId]!.kind === "locked" ? (
                            <div
                              className="flex gap-3 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-100/80 px-3 py-3 text-amber-950 shadow-sm"
                              role="status"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl bg-amber-200/80 text-amber-900">
                                <LockKeyhole
                                  className="h-5 w-5"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </span>
                              <div className="min-w-0 pt-0.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/85">
                                  {t("lessonsLockedLabel")}
                                </p>
                                <p className="mt-1.5 text-sm leading-relaxed text-amber-950">
                                  {lessonsError[sectionId]!.message}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p
                              className="ds-text-small text-ds-error"
                              role="alert"
                            >
                              {t("lessonsError")}: {lessonsError[sectionId]!.message}
                            </p>
                          )}
                        </>
                      )}
                      {lessonsLoaded[sectionId] &&
                        lessonsLoadingId !== sectionId &&
                        !lessonsError[sectionId] &&
                        sortedLessons.length === 0 && (
                          <p className="ds-text-small text-ds-gray-text">
                            {t("lessonsEmpty")}
                          </p>
                        )}
                      {sortedLessons.length > 0 && (
                        <ul className="space-y-2">
                          {sortedLessons.map((lesson, li) => (
                            <li key={lesson.id}>
                              <Link
                                href={`/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.id)}`}
                                className="flex items-center gap-3 rounded-xl border border-ds-gray-border/80 bg-white/95 px-3 py-2.5 shadow-sm transition-all hover:border-ds-primary/45 hover:bg-white hover:shadow-md"
                              >
                                <span className="shrink-0 text-xs font-semibold tabular-nums text-ds-gray-text">
                                  {li + 1}
                                </span>
                                <span className="min-w-0 flex-1 ds-text-body font-medium leading-snug text-ds-black">
                                  {lesson.title ?? t("moduleFallback", { id: lesson.id })}
                                </span>
                                <ChevronRight
                                  className="h-4 w-4 shrink-0 text-ds-primary opacity-80"
                                  aria-hidden
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                      {firstLessonHref ? (
                        <Link
                          href={firstLessonHref}
                          className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-ds-gray-border/90 bg-white/90 px-3 py-2.5 text-sm font-semibold text-ds-primary shadow-sm transition-colors hover:border-ds-primary/50 hover:bg-white sm:justify-start"
                        >
                          <span>{t("openModule")}</span>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 opacity-80"
                            aria-hidden
                          />
                        </Link>
                      ) : null}
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
