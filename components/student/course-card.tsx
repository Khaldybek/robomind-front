"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CourseSummary } from "@/lib/api/types";
import {
  formatCourseLevel,
  pickCourseAgeGroup,
  resolveCourseThumbnailUrl,
} from "@/lib/course-display";

export function CourseCard({ course }: { course: CourseSummary }) {
  const t = useTranslations("StudentCourseDetail");
  const id = String(course.id);
  const title = course.title ?? course.name ?? t("courseFallback", { id });
  const resolved = resolveCourseThumbnailUrl(course);
  const level = formatCourseLevel(course);
  const age = pickCourseAgeGroup(course);
  const desc = course.description ? String(course.description) : null;

  const meta = [level, age].filter(Boolean);

  return (
    <li>
      <Link
        href={`/courses/${encodeURIComponent(id)}`}
        className="group flex h-full flex-col overflow-hidden rounded-ds-card border border-ds-gray-border bg-ds-white transition-shadow hover:shadow-md"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-ds-gray-light">
          {resolved ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL с API (обложка)
            <img
              src={resolved}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <Image
              src="/student/hero-robot.svg"
              alt=""
              fill
              className="object-cover object-center opacity-90"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="ds-text-subtitle text-ds-black group-hover:text-ds-primary">
            {title}
          </span>
          {meta.length > 0 && (
            <p className="ds-text-caption mt-2 text-ds-gray-text">
              {meta.join(" · ")}
            </p>
          )}
          {desc && (
            <span className="ds-text-caption mt-2 line-clamp-3 text-ds-gray-text">
              {desc}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
