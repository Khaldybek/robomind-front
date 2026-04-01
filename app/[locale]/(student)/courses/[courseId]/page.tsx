"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { fetchCourseById } from "@/lib/api/student/courses";
import { fetchCourseModules } from "@/lib/api/student/modules";
import type { CourseSummary } from "@/lib/api/types";
import type { CourseModuleSummary } from "@/lib/api/types";
import {
  formatCourseLevel,
  pickCourseAgeGroup,
  resolveCourseThumbnailUrl,
} from "@/lib/course-display";
import { isApiConfigured } from "@/lib/env";

export default function CourseDetailPage() {
  const t = useTranslations("StudentCourseDetail");
  const tc = useTranslations("Common");
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [modules, setModules] = useState<CourseModuleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured() || !courseId) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetchCourseById(courseId).catch(() => null),
      fetchCourseModules(courseId).catch(() => []),
    ])
      .then(([c, m]) => {
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
    <div className="ds-container py-10 lg:py-14">
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
      <h1 className="ds-text-h1 text-ds-black">{displayTitle}</h1>
      {metaLine ? (
        <p className="ds-text-caption mt-2 text-ds-gray-text">{metaLine}</p>
      ) : null}
      {course && !loading && (
        <div className="relative mt-6 aspect-[2/1] w-full max-w-3xl overflow-hidden rounded-ds-card border border-ds-gray-border bg-ds-gray-light">
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- обложка с API
            <img
              src={thumbUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src="/student/hero-robot.svg"
              alt=""
              fill
              className="object-cover object-center opacity-90"
              sizes="(max-width: 768px) 100vw, 42rem"
              priority
            />
          )}
        </div>
      )}
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
            return (
              <li key={mid}>
                <Link
                  href={`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(mid)}`}
                  className="flex items-center gap-3 rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-3 transition-colors hover:border-ds-primary"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ds-gray-mid ds-text-small font-medium">
                    {i + 1}
                  </span>
                  <span className="ds-text-body font-medium text-ds-black">
                    {mod.title ?? mod.name ?? t("moduleFallback", { id: mid })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
      <Link
        href={`/courses/${encodeURIComponent(courseId)}/chat`}
        className="ui-btn ui-btn--6 mt-8 inline-flex"
      >
        {t("aiAssistant")}
      </Link>
    </div>
  );
}
