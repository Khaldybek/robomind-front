import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";
import type {
  CourseLessonSummary,
  CourseModuleSummary,
} from "@/lib/api/types";

export function normalizeModuleList(raw: unknown): CourseModuleSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    if (x && typeof x === "object" && "id" in x) {
      const o = x as Record<string, unknown>;
      return {
        ...o,
        id: String(o.id),
        unlockAfterCourseModuleId:
          o.unlockAfterCourseModuleId != null
            ? String(o.unlockAfterCourseModuleId)
            : o.unlock_after_course_module_id != null
              ? String(o.unlock_after_course_module_id)
              : (o as CourseModuleSummary).unlockAfterCourseModuleId ?? null,
      } as CourseModuleSummary;
    }
    return { id: String(x) } as CourseModuleSummary;
  });
}

function normalizeLessonList(raw: unknown): CourseLessonSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    if (x && typeof x === "object" && "id" in x) {
      const o = x as Record<string, unknown>;
      return {
        ...o,
        id: String(o.id),
        unlockAfterLessonId:
          o.unlockAfterLessonId != null
            ? String(o.unlockAfterLessonId)
            : o.unlock_after_lesson_id != null
              ? String(o.unlock_after_lesson_id)
              : null,
      } as CourseLessonSummary;
    }
    return { id: String(x) } as CourseLessonSummary;
  });
}

export type ModuleContentItem = {
  id: string;
  lessonId?: string;
  /** @deprecated ответ бэка мог содержать moduleId — трактуем как lessonId */
  moduleId?: string;
  type?: "video" | "file" | "text" | "livestream" | "link" | string;
  title?: string;
  content?: string;
  fileUrl?: string;
  duration?: number;
  order?: number;
  livestreamUrl?: string;
  livestreamStartsAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

function normalizeContentItems(items: ModuleContentItem[]): ModuleContentItem[] {
  return items.map((item) => {
    const o = item as Record<string, unknown>;
    const lid =
      item.lessonId ??
      item.moduleId ??
      (o.lesson_id != null ? String(o.lesson_id) : undefined) ??
      (o.module_id != null ? String(o.module_id) : undefined);
    return { ...item, lessonId: lid, moduleId: lid };
  });
}

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
  lessonId?: string;
  /** @deprecated */
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

/** GET /app/courses/:courseId/modules — секции */
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
  if (
    data &&
    typeof data === "object" &&
    "modules" in data &&
    Array.isArray((data as { modules: unknown }).modules)
  ) {
    return normalizeModuleList((data as { modules: unknown }).modules);
  }
  return [];
}

/** GET /app/course-modules/:courseModuleId/lessons */
export async function fetchCourseModuleLessons(
  courseModuleId: string,
): Promise<CourseLessonSummary[]> {
  const res = await apiFetch(
    STUDENT_ROUTES.COURSE_MODULE_LESSONS(courseModuleId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (
    data &&
    typeof data === "object" &&
    "lessons" in data &&
    Array.isArray((data as { lessons: unknown }).lessons)
  ) {
    return normalizeLessonList((data as { lessons: unknown }).lessons);
  }
  if (Array.isArray(data)) return normalizeLessonList(data);
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return normalizeLessonList((data as { data: unknown }).data);
  }
  return [];
}

/** GET /app/lessons/:lessonId/content */
export async function fetchLessonContent(
  lessonId: string,
): Promise<ModuleContentItem[]> {
  const res = await apiFetch(STUDENT_ROUTES.LESSON_CONTENT(lessonId));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  let arr: ModuleContentItem[] = [];
  if (Array.isArray(data)) arr = data as ModuleContentItem[];
  else if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    arr = (data as { items: ModuleContentItem[] }).items;
  } else if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    arr = (data as { data: ModuleContentItem[] }).data;
  }
  return normalizeContentItems(arr);
}

/** @deprecated используйте fetchLessonContent */
export const fetchModuleContent = fetchLessonContent;

/** GET /app/lessons/:lessonId/quiz */
export async function fetchLessonQuiz(
  lessonId: string,
): Promise<ModuleQuizResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.LESSON_QUIZ(lessonId));
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  let q: ModuleQuizResponse | null = null;
  if (data && typeof data === "object") {
    if ("id" in data) q = data as ModuleQuizResponse;
    else if (
      "data" in data &&
      (data as { data?: unknown }).data &&
      typeof (data as { data?: unknown }).data === "object"
    ) {
      q = (data as { data: ModuleQuizResponse }).data;
    }
  }
  if (!q) return null;
  const lid =
    q.lessonId ??
    q.moduleId ??
    (q as Record<string, unknown>).lesson_id ??
    (q as Record<string, unknown>).module_id;
  const lesson = lid != null ? String(lid) : lessonId;
  return { ...q, lessonId: lesson };
}

/** @deprecated используйте fetchLessonQuiz */
export const fetchModuleQuiz = fetchLessonQuiz;

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

/** POST /app/quizzes/:quizId/attempt */
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

export type PatchLessonProgressBody = {
  watchedSeconds?: number;
  status?: string;
  completed?: boolean;
} & Record<string, unknown>;

/** @deprecated */
export type PatchModuleProgressBody = PatchLessonProgressBody;

/** PATCH /app/lessons/:lessonId/progress */
export async function patchLessonProgress(
  lessonId: string,
  body: PatchLessonProgressBody,
): Promise<unknown> {
  const res = await apiFetch(STUDENT_ROUTES.LESSON_PROGRESS(lessonId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

/** @deprecated используйте patchLessonProgress */
export const patchModuleProgress = patchLessonProgress;
