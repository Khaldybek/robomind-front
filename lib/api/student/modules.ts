import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";
import type { CourseModuleSummary } from "@/lib/api/types";

function normalizeModuleList(raw: unknown): CourseModuleSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    if (x && typeof x === "object" && "id" in x) {
      return x as CourseModuleSummary;
    }
    return { id: String(x) } as CourseModuleSummary;
  });
}

export type ModuleContentItem = {
  id: string;
  moduleId?: string;
  type?: "video" | "file" | "text" | "livestream" | "link" | string;
  title?: string;
  content?: string;
  fileUrl?: string;
  duration?: number;
  order?: number;
  livestreamUrl?: string;
  livestreamStartsAt?: string;
  [key: string]: unknown;
};

export type ModuleQuizQuestionAnswer = {
  id: string;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ModuleQuizQuestion = {
  id: string;
  text?: string;
  type?: "single" | "multiple" | "text" | string;
  order?: number;
  imageUrl?: string;
  answers?: ModuleQuizQuestionAnswer[];
  [key: string]: unknown;
};

export type ModuleQuizResponse = {
  id: string;
  moduleId?: string;
  title?: string;
  passingScore?: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
  createdAt?: string;
  updatedAt?: string;
  questions?: ModuleQuizQuestion[];
  [key: string]: unknown;
};

export type QuizAttemptResponse = {
  attemptId: string;
  quizId?: string;
  startedAt?: string;
  maxScore?: number;
  resumed?: boolean;
  raw?: unknown;
};

export type QuizSubmitResponse = {
  attemptId?: string;
  quizId?: string;
  score?: number;
  maxScore?: number;
  percent?: number;
  isPassed?: boolean;
  passingScore?: number;
  completedAt?: string;
  [key: string]: unknown;
};

/** GET /app/courses/:courseId/modules */
export async function fetchCourseModules(
  courseId: string,
): Promise<CourseModuleSummary[]> {
  const res = await apiFetch(STUDENT_ROUTES.COURSE_MODULES(courseId));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return normalizeModuleList(data);
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return normalizeModuleList((data as { data: unknown }).data);
  }
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return normalizeModuleList((data as { items: unknown }).items);
  }
  return [];
}

/** GET /app/modules/:moduleId/content */
export async function fetchModuleContent(
  moduleId: string,
): Promise<ModuleContentItem[]> {
  const res = await apiFetch(STUDENT_ROUTES.MODULE_CONTENT(moduleId));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data as ModuleContentItem[];
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: ModuleContentItem[] }).items;
  }
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: ModuleContentItem[] }).data;
  }
  return [];
}

/** GET /app/modules/:moduleId/quiz — `null`, если теста нет (**404**). */
export async function fetchModuleQuiz(
  moduleId: string,
): Promise<ModuleQuizResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.MODULE_QUIZ(moduleId));
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (data && typeof data === "object") {
    if ("id" in data) return data as ModuleQuizResponse;
    if (
      "data" in data &&
      (data as { data?: unknown }).data &&
      typeof (data as { data?: unknown }).data === "object"
    ) {
      return (data as { data: ModuleQuizResponse }).data;
    }
  }
  return null;
}

function parseAttemptId(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    throw new Error("Пустой ответ при создании попытки теста");
  }
  const o = raw as Record<string, unknown>;
  const direct = o.id ?? o.attemptId ?? o.attempt_id;
  if (direct != null && String(direct)) return String(direct);
  const data = o.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const nested = d.id ?? d.attemptId ?? d.attempt_id;
    if (nested != null && String(nested)) return String(nested);
  }
  throw new Error("В ответе нет id попытки (attempt)");
}

/** POST /app/quizzes/:quizId/attempt — начать / возобновить попытку */
export async function postQuizAttempt(
  quizId: string,
): Promise<QuizAttemptResponse> {
  const res = await apiFetch(STUDENT_ROUTES.QUIZ_ATTEMPT(quizId), {
    method: "POST",
  });
  await throwIfNotOk(res);
  const raw = await parseJsonSafe<unknown>(res);
  const o =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  return {
    attemptId: parseAttemptId(raw),
    quizId: String(o.quizId ?? o.quiz_id ?? quizId),
    startedAt: String(o.startedAt ?? o.started_at ?? ""),
    maxScore: Number(o.maxScore ?? o.max_score ?? 0),
    resumed: Boolean(o.resumed),
    raw,
  };
}

/** Тело сдачи: только `answers` — map `questionId` → uuid | uuid[] | string (как на бэке). */
export type SubmitQuizAttemptBody = {
  answers: Record<string, string | string[] | unknown>;
};

/** POST /app/attempts/:attemptId/submit */
export async function submitQuizAttempt(
  attemptId: string,
  body: SubmitQuizAttemptBody,
): Promise<QuizSubmitResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.ATTEMPT_SUBMIT(attemptId), {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe<QuizSubmitResponse>(res);
}

export type PatchModuleProgressBody = {
  watchedSeconds?: number;
  status?: string;
  completed?: boolean;
} & Record<string, unknown>;

/** PATCH /app/modules/:moduleId/progress */
export async function patchModuleProgress(
  moduleId: string,
  body: PatchModuleProgressBody,
): Promise<unknown> {
  const res = await apiFetch(STUDENT_ROUTES.MODULE_PROGRESS(moduleId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}
