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
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sky-200/70 bg-white shadow-[0_12px_36px_-22px_rgba(14,116,144,0.15)] transition-shadow hover:border-amber-300/80 hover:shadow-[0_18px_44px_-20px_rgba(14,165,233,0.22)]"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gradient-to-br from-sky-100 to-amber-50">
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sky-900/25 via-transparent to-transparent" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="text-base font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
            {title}
          </span>
          {meta.length > 0 && (
            <p className="mt-2 text-xs font-medium text-slate-500">
              {meta.join(" · ")}
            </p>
          )}
          {desc && (
            <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
              {desc}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
