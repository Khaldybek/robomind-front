"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CourseAiChat } from "@/components/student/course-ai-chat";
import { useTranslations } from "next-intl";

function ChatInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const lessonId =
    searchParams.get("lessonId")?.trim() ||
    searchParams.get("moduleId")?.trim() ||
    undefined;

  return (
    <CourseAiChat
      courseId={courseId}
      lessonId={lessonId}
      variant="page"
    />
  );
}

export default function CourseChatPage() {
  const tc = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <div className="ds-container py-16 ds-text-body text-ds-gray-text">
          {tc("loading")}
        </div>
      }
    >
      <ChatInner />
    </Suspense>
  );
}
