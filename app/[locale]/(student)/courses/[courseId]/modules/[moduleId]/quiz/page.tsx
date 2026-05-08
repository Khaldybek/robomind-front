"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

export default function LegacyStudentModuleQuizRedirect() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  useEffect(() => {
    router.replace(
      `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(moduleId)}/quiz`,
    );
  }, [courseId, moduleId, router]);

  return null;
}
