"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { AdminModuleHomeworkGrading } from "@/components/admin/module-homework-grading";
import { SchoolAdminPageHero } from "@/components/school-admin/admin-page-hero";

function HomeworkInner() {
  const t = useTranslations("AdminModuleHomework");
  const { courseId, lessonId } = useParams() as {
    courseId: string;
    lessonId: string;
  };

  const lessonHref = `/school-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`;
  const modulesHref = `/school-admin/courses/${encodeURIComponent(courseId)}/modules`;

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <SchoolAdminPageHero
        title={t("titleSchool")}
        description={t("pageLead")}
      >
        <nav
          className="relative z-[1] mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium"
          aria-label="Breadcrumb"
        >
          <Link
            href={lessonHref}
            className="text-white/90 underline-offset-4 transition hover:text-white hover:underline"
          >
            {t("lessonMaterialsNav")}
          </Link>
          <Link
            href={modulesHref}
            className="text-white/90 underline-offset-4 transition hover:text-white hover:underline"
          >
            {t("backToCourseModules")}
          </Link>
        </nav>
      </SchoolAdminPageHero>

      <div className="mt-2">
        <AdminModuleHomeworkGrading
          variant="school"
          courseId={courseId}
          lessonId={lessonId}
        />
      </div>
    </div>
  );
}

export default function SchoolAdminModuleHomeworkPage() {
  const tc = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <p className="ds-text-body text-ds-gray-text">{tc("loading")}</p>
      }
    >
      <HomeworkInner />
    </Suspense>
  );
}
