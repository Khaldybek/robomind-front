"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { fetchCourseDetail } from "@/lib/api/student/courses";
import {
  fetchModuleContent,
  type ModuleContentItem,
} from "@/lib/api/student/modules";
import type { CourseSummary } from "@/lib/api/types";
import type { CourseModuleSummary } from "@/lib/api/types";
import {
  formatCourseLevel,
  pickCourseAgeGroup,
  resolveCourseThumbnailUrl,
} from "@/lib/course-display";
import { isApiConfigured } from "@/lib/env";
import { ModuleLessonList } from "@/components/student/module-lesson-list";
import {
  classifyModuleLessonLoadError,
  type ModuleLessonLoadError,
} from "@/lib/course-module-lesson-error";
import { ChevronRight, LockKeyhole } from "lucide-react";

export default function CourseDetailPage() {
  const t = useTranslations("StudentCourseDetail");
  const tm = useTranslations("StudentModule");
  const tc = useTranslations("Common");
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [modules, setModules] = useState<CourseModuleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonsByModule, setLessonsByModule] = useState<
    Record<string, ModuleContentItem[]>
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
    setLessonsByModule({});
    setLessonsLoaded({});
    setLessonsError({});
  }, [courseId]);

  async function loadModuleLessons(moduleId: string) {
    if (!isApiConfigured() || lessonsLoaded[moduleId]) return;
    setLessonsLoadingId(moduleId);
    setLessonsError((prev) => ({ ...prev, [moduleId]: null }));
    try {
      const items = await fetchModuleContent(moduleId);
      setLessonsByModule((prev) => ({ ...prev, [moduleId]: items }));
      setLessonsLoaded((prev) => ({ ...prev, [moduleId]: true }));
    } catch (e) {
      setLessonsError((prev) => ({
        ...prev,
        [moduleId]: classifyModuleLessonLoadError(e),
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

  function formatLessonType(type: string | undefined): string | undefined {
    const k = (type ?? "").toLowerCase();
    if (!k) return undefined;
    const map: Record<string, string> = {
      video: t("lessonTypeVideo"),
      file: t("lessonTypeFile"),
      text: t("lessonTypeText"),
      livestream: t("lessonTypeLivestream"),
      link: t("lessonTypeLink"),
    };
    return map[k] ?? t("lessonTypeMaterial");
  }

  return (
    <div>
      <div className="ds-container pt-10 lg:pt-14">
        <Link
          href="/courses"
          className="ds-text-caption mb-6 inline-block text-ds-primary hover:underline"
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
              const mid = String(mod.id);
              const moduleHref = `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(mid)}`;
              const rawLessons = lessonsByModule[mid];
              const sortedLessons = rawLessons
                ? [...rawLessons].sort(
                    (a, b) =>
                      Number(a.order ?? 0) - Number(b.order ?? 0),
                  )
                : [];
              return (
                <li key={mid}>
                  <details
                    className="group rounded-ds-card border border-ds-gray-border bg-ds-white"
                    onToggle={(e) => {
                      const el = e.currentTarget;
                      if (el.open) void loadModuleLessons(mid);
                    }}
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ds-gray-mid ds-text-small font-medium">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 ds-text-body font-medium text-ds-black">
                        {mod.title ?? mod.name ?? t("moduleFallback", { id: mid })}
                      </span>
                      <span
                        className="shrink-0 text-ds-gray-text transition-transform duration-200 group-open:rotate-180"
                        aria-hidden
                      >
                        ▼
                      </span>
                    </summary>
                    <div className="border-t border-ds-gray-border bg-gradient-to-b from-ds-gray-light/50 to-ds-gray-light/30 px-3 py-4 sm:px-4">
                      {lessonsLoadingId === mid && (
                        <p className="ds-text-small text-ds-gray-text">
                          {t("lessonsLoading")}
                        </p>
                      )}
                      {lessonsError[mid] && lessonsLoadingId !== mid && (
                        <>
                          {lessonsError[mid]!.kind === "locked" ? (
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
                                  {lessonsError[mid]!.message}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p
                              className="ds-text-small text-ds-error"
                              role="alert"
                            >
                              {t("lessonsError")}: {lessonsError[mid]!.message}
                            </p>
                          )}
                        </>
                      )}
                      {lessonsLoaded[mid] &&
                        lessonsLoadingId !== mid &&
                        !lessonsError[mid] &&
                        sortedLessons.length === 0 && (
                          <p className="ds-text-small text-ds-gray-text">
                            {t("lessonsEmpty")}
                          </p>
                        )}
                      {sortedLessons.length > 0 && (
                        <ModuleLessonList
                          items={sortedLessons}
                          moduleHref={moduleHref}
                          labelFallback={tm("contentFallback")}
                          formatLessonType={formatLessonType}
                        />
                      )}
                      <Link
                        href={moduleHref}
                        className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-ds-gray-border/90 bg-white/90 px-3 py-2.5 text-sm font-semibold text-ds-primary shadow-sm transition-colors hover:border-ds-primary/50 hover:bg-white sm:justify-start"
                      >
                        <span>{t("openModule")}</span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 opacity-80"
                          aria-hidden
                        />
                      </Link>
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
