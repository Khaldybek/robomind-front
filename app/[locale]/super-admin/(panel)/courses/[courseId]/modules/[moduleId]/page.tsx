"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

/** Старые закладки: путь вёл на редактор урока по id урока. */
export default function LegacySuperAdminModuleToLessonRedirect() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  useEffect(() => {
    router.replace(
      `/super-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(moduleId)}`,
    );
  }, [courseId, moduleId, router]);

  return null;
}
