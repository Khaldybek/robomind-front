import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

function num(raw: unknown, d = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : d;
}

export type QuizQuestionType = "single" | "multiple" | "text";

function parseQuestionType(raw: unknown): QuizQuestionType {
  const t = String(raw ?? "single");
  if (t === "single" || t === "multiple" || t === "text") return t;
  return "single";
}

export type AdminQuizAnswer = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type AdminQuizQuestion = {
  id: string;
  text: string;
  type: QuizQuestionType;
  order: number;
  imageUrl: string | null;
  answers: AdminQuizAnswer[];
};

/** Полное дерево теста (GET …/quiz) */
export type AdminQuiz = {
  id: string;
  moduleId: string;
  title: string;
  passingScore: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  questions: AdminQuizQuestion[];
  createdAt: string;
  updatedAt: string;
};

function mapAnswer(raw: Record<string, unknown>): AdminQuizAnswer {
  return {
    id: String(raw.id ?? ""),
    text: String(raw.text ?? ""),
    isCorrect: Boolean(raw.isCorrect ?? raw.is_correct),
  };
}

function mapQuestion(raw: Record<string, unknown>): AdminQuizQuestion {
  const answersRaw = (raw.answers as unknown[]) ?? [];
  return {
    id: String(raw.id ?? ""),
    text: String(raw.text ?? ""),
    type: parseQuestionType(raw.type),
    order: num(raw.order, 0),
    imageUrl:
      raw.imageUrl != null
        ? String(raw.imageUrl)
        : raw.image_url != null
          ? String(raw.image_url)
          : null,
    answers: answersRaw.map((a) =>
      mapAnswer(
        typeof a === "object" && a !== null ? (a as Record<string, unknown>) : {},
      ),
    ),
  };
}

function mapQuiz(raw: Record<string, unknown>): AdminQuiz {
  const questionsRaw = (raw.questions as unknown[]) ?? [];
  return {
    id: String(raw.id ?? ""),
    moduleId: String(raw.moduleId ?? raw.module_id ?? ""),
    title: String(raw.title ?? ""),
    passingScore: num(raw.passingScore ?? raw.passing_score, 0),
    maxAttempts:
      raw.maxAttempts === null || raw.max_attempts === null
        ? null
        : num(raw.maxAttempts ?? raw.max_attempts, 0),
    timeLimitMinutes:
      raw.timeLimitMinutes === null || raw.time_limit_minutes === null
        ? null
        : num(raw.timeLimitMinutes ?? raw.time_limit_minutes, 0),
    shuffleQuestions: Boolean(
      raw.shuffleQuestions ?? raw.shuffle_questions ?? false,
    ),
    questions: questionsRaw.map((q) =>
      mapQuestion(
        typeof q === "object" && q !== null ? (q as Record<string, unknown>) : {},
      ),
    ),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

/** `GET /admin/modules/:moduleId/quiz` — полное дерево или `null` */
export async function getAdminModuleQuiz(
  moduleId: string,
): Promise<AdminQuiz | null> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.MODULE_QUIZ(moduleId));
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (data === null || data === undefined) return null;
  if (typeof data === "object" && data !== null && Object.keys(data).length === 0) {
    return null;
  }
  return mapQuiz(
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {},
  );
}

export type CreateAdminQuizBody = {
  title: string;
  passingScore: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
};

/** `POST /admin/modules/:moduleId/quiz` — один тест на модуль */
export async function createAdminModuleQuiz(
  moduleId: string,
  body: CreateAdminQuizBody,
): Promise<AdminQuiz> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.MODULE_QUIZ(moduleId), {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapQuiz(d ?? {});
}

/**
 * `POST /admin/modules/:moduleId/quiz/import-generated` — импорт вопросов из ИИ
 * (тело по контракту бэка, обычно payload от `POST /admin/ai/quiz/generate`).
 */
export async function importGeneratedModuleQuiz(
  moduleId: string,
  body: Record<string, unknown>,
): Promise<AdminQuiz> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.MODULE_QUIZ_IMPORT_GENERATED(moduleId),
    { method: "POST", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapQuiz(d ?? {});
}

export type PatchAdminQuizBody = Partial<{
  title: string;
  passingScore: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
}>;

/** `PATCH /admin/quizzes/:quizId` */
export async function updateAdminQuiz(
  quizId: string,
  body: PatchAdminQuizBody,
): Promise<AdminQuiz> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.QUIZ(quizId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapQuiz(d ?? {});
}

/** `DELETE /admin/quizzes/:quizId` — 204; 409 при quiz_attempts */
export async function deleteAdminQuiz(quizId: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.QUIZ(quizId), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

export type QuizAnswerInput = {
  text: string;
  isCorrect: boolean;
};

export type CreateQuizQuestionBody = {
  text: string;
  type: QuizQuestionType;
  order: number;
  imageUrl?: string | null;
  answers: QuizAnswerInput[];
};

/** `POST /admin/quizzes/:quizId/questions` */
export async function createQuizQuestion(
  quizId: string,
  body: CreateQuizQuestionBody,
): Promise<AdminQuizQuestion> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.QUIZ_QUESTIONS(quizId),
    { method: "POST", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapQuestion(d ?? {});
}

export type PatchQuizQuestionBody = Partial<{
  text: string;
  type: QuizQuestionType;
  order: number;
  imageUrl: string | null;
}>;

/** `PATCH /admin/questions/:questionId` */
export async function updateQuizQuestion(
  questionId: string,
  body: PatchQuizQuestionBody,
): Promise<AdminQuizQuestion> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.QUESTION(questionId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapQuestion(d ?? {});
}

/** `DELETE /admin/questions/:questionId` — 204 */
export async function deleteQuizQuestion(questionId: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.QUESTION(questionId), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

export type CreateQuizAnswerBody = {
  text: string;
  isCorrect: boolean;
};

/** `POST /admin/questions/:questionId/answers` */
export async function createQuizAnswer(
  questionId: string,
  body: CreateQuizAnswerBody,
): Promise<AdminQuizAnswer> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.QUESTION_ANSWERS(questionId),
    { method: "POST", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapAnswer(d ?? {});
}

export type PatchQuizAnswerBody = Partial<{
  text: string;
  isCorrect: boolean;
}>;

/** `PATCH /admin/answers/:answerId` */
export async function updateQuizAnswer(
  answerId: string,
  body: PatchQuizAnswerBody,
): Promise<AdminQuizAnswer> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.ANSWER(answerId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapAnswer(d ?? {});
}

/** `DELETE /admin/answers/:answerId` — 204 */
export async function deleteQuizAnswer(answerId: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.ANSWER(answerId), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}
