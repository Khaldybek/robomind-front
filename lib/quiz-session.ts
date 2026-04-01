const KEY = "robomind_last_quiz_review";

/** Ответ API сдачи теста — что кладём в `result` при сохранении разбора. */
export type QuizSubmitResultStored = {
  attemptId?: string;
  quizId?: string;
  score?: number;
  maxScore?: number;
  percent?: number;
  isPassed?: boolean;
  passingScore?: number;
  completedAt?: string;
};

/** То, что пишем в sessionStorage на странице теста после успешной сдачи. */
export type QuizReviewPayload = {
  quizId?: string;
  moduleId?: string;
  courseId?: string;
  result?: QuizSubmitResultStored | null;
  submittedAt?: string;
};

export function saveQuizReview(payload: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadQuizReview(): QuizReviewPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    return data as QuizReviewPayload;
  } catch {
    return null;
  }
}
