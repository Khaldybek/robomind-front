import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";

export type AiRecommendationsResponse = {
  weakTopics?: string[];
  repeatLessonIds?: string[];
  /** @deprecated */
  repeatModuleIds?: string[];
  suggestedMaterials?: string[];
  summary?: string;
  [key: string]: unknown;
};

export async function fetchAiRecommendations(
  courseId?: string,
  language?: "ru" | "kk",
): Promise<AiRecommendationsResponse | null> {
  const params = new URLSearchParams();
  if (courseId != null && courseId !== "") {
    params.set("courseId", courseId);
  }
  if (language) {
    params.set("language", language);
  }
  const q = params.toString() ? `?${params.toString()}` : "";
  const res = await apiFetch(`${STUDENT_ROUTES.AI_RECOMMENDATIONS}${q}`);
  await throwIfNotOk(res);
  const raw = await parseJsonSafe<AiRecommendationsResponse>(res);
  if (!raw) return null;
  const repeat =
    raw.repeatLessonIds ??
    raw.repeatModuleIds ??
    (raw as Record<string, unknown>).repeat_lesson_ids;
  if (Array.isArray(repeat)) {
    return { ...raw, repeatLessonIds: repeat.map(String) };
  }
  return raw;
}

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PostAiChatBody = {
  lessonId: string;
  messages: AiChatMessage[];
  language?: "ru" | "kk";
};

type LegacyAiChatBody = {
  message: string;
  lessonId?: string;
  /** @deprecated */
  moduleId?: string;
  language?: "ru" | "kk";
};

export type AiChatResponse = {
  reply?: string;
  [key: string]: unknown;
};

export type PostAiChatProfileBody = {
  language?: "ru" | "kk";
  messages: AiChatMessage[];
};

/** POST /app/ai/chat-profile — чат в профиле без привязки к модулю */
export async function postAiChatProfile(
  payload: PostAiChatProfileBody,
): Promise<AiChatResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.AI_CHAT_PROFILE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await throwIfNotOk(res);
  return parseJsonSafe<AiChatResponse>(res);
}

export type PostAiChatCourseBody = {
  courseId: string;
  messages: AiChatMessage[];
  language?: "ru" | "kk";
};

/** POST /app/ai/chat-course — чат с учётом всего курса (модули и контент) */
export async function postAiChatCourse(
  payload: PostAiChatCourseBody,
): Promise<AiChatResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.AI_CHAT_COURSE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await throwIfNotOk(res);
  return parseJsonSafe<AiChatResponse>(res);
}

/** POST /app/ai/chat — чат по контенту одного урока (только lessonId, без courseId) */
export async function postAiChat(
  payload: PostAiChatBody | LegacyAiChatBody,
): Promise<AiChatResponse | null> {
  let body: PostAiChatBody;
  if ("messages" in payload) {
    body = payload;
  } else {
    const p = payload as LegacyAiChatBody;
    const lessonId = p.lessonId ?? p.moduleId;
    if (!lessonId?.trim()) {
      throw new Error("lessonId is required for POST /app/ai/chat");
    }
    body = {
      lessonId: lessonId.trim(),
      messages: [{ role: "user", content: p.message }],
      ...(p.language ? { language: p.language } : {}),
    };
  }
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
