"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { AdminModuleHomeworkGrading } from "@/components/admin/module-homework-grading";

function HomeworkInner() {
  const t = useTranslations("AdminModuleHomework");
  const { courseId, moduleId } = useParams() as {
    courseId: string;
    moduleId: string;
  };

  return (
    <div>
      <Link
        href={`/super-admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`}
        className="ds-text-caption mb-6 inline-block text-ds-primary hover:underline"
      >
        {t("backToModule")}
      </Link>
      <h1 className="ds-text-h2 text-ds-black">{t("titleSuper")}</h1>
      <p className="mt-2 text-sm text-ds-gray-text">{t("superLead")}</p>
      <AdminModuleHomeworkGrading
        variant="super"
        courseId={courseId}
        moduleId={moduleId}
      />
    </div>
  );
}

export default function SuperAdminModuleHomeworkPage() {
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
