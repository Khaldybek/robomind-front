"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

/** Старый URL: UUID в пути — это id урока; перенаправляем на /lessons/:id */
export default function LegacyStudentModuleRedirect() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  useEffect(() => {
    router.replace(
      `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(moduleId)}`,
    );
  }, [courseId, moduleId, router]);

  return null;
}
