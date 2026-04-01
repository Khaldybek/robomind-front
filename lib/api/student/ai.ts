import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";

export type AiRecommendationsResponse = {
  weakTopics?: string[];
  repeatModuleIds?: string[];
  suggestedMaterials?: string[];
  summary?: string;
  [key: string]: unknown;
};

export async function fetchAiRecommendations(
  courseId?: string,
): Promise<AiRecommendationsResponse | null> {
  const q =
    courseId != null && courseId !== ""
      ? `?courseId=${encodeURIComponent(courseId)}`
      : "";
  const res = await apiFetch(`${STUDENT_ROUTES.AI_RECOMMENDATIONS}${q}`);
  await throwIfNotOk(res);
  return parseJsonSafe<AiRecommendationsResponse>(res);
}

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PostAiChatBody = {
  moduleId?: string;
  messages: AiChatMessage[];
  [key: string]: unknown;
};

type LegacyAiChatBody = {
  message: string;
  moduleId?: string;
  courseId?: string;
};

export type AiChatResponse = {
  reply?: string;
  [key: string]: unknown;
};

export async function postAiChat(
  payload: PostAiChatBody | LegacyAiChatBody,
): Promise<AiChatResponse | null> {
  const body: Record<string, unknown> =
    "messages" in payload
      ? payload
      : {
          moduleId: payload.moduleId,
          messages: [{ role: "user", content: payload.message }],
          courseId: payload.courseId,
        };
  const res = await apiFetch(STUDENT_ROUTES.AI_CHAT, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe<AiChatResponse>(res);
}

/** POST /app/ai/grade-text — оценка свободного ответа */
export type AiGradeTextBody = {
  questionText: string;
  studentAnswer: string;
  referenceAnswer: string;
  gradingRubric?: string;
};

export type AiGradeTextResponse = {
  score: number;
  feedback: string;
  [key: string]: unknown;
};

export async function postAiGradeText(
  body: AiGradeTextBody,
): Promise<AiGradeTextResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.AI_GRADE_TEXT, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe<AiGradeTextResponse>(res);
}
