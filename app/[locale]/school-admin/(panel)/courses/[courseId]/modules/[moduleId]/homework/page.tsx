"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { AdminModuleHomeworkGrading } from "@/components/admin/module-homework-grading";

function HomeworkInner() {
  const t = useTranslations("AdminModuleHomework");
  const tc = useTranslations("Common");
  const { courseId, moduleId } = useParams() as {
    courseId: string;
    moduleId: string;
  };

  return (
    <div>
      <Link
        href={`/school-admin/courses/${encodeURIComponent(courseId)}/modules`}
        className="ds-text-caption mb-6 inline-block text-ds-primary hover:underline"
      >
        {t("backToCourseModules")}
      </Link>
      <h1 className="ds-text-h2 text-ds-black">{t("titleSchool")}</h1>
      <AdminModuleHomeworkGrading
        variant="school"
        courseId={courseId}
        moduleId={moduleId}
      />
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
