"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  fetchModuleQuiz,
  postQuizAttempt,
  submitQuizAttempt,
  type ModuleQuizQuestion,
  type ModuleQuizResponse,
} from "@/lib/api/student/modules";
import { saveQuizReview } from "@/lib/quiz-session";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type AnswerState = Record<string, string | string[]>;

function normalizeQuestionType(q: ModuleQuizQuestion): string {
  const t = String(q.type ?? "single");
  if (t === "single" || t === "multiple" || t === "text") return t;
  return "single";
}

function initAnswersForQuestions(questions: ModuleQuizQuestion[]): AnswerState {
  const s: AnswerState = {};
  for (const q of questions) {
    const t = normalizeQuestionType(q);
    if (t === "multiple") s[q.id] = [];
    else s[q.id] = "";
  }
  return s;
}

function validateAnswers(
  questions: ModuleQuizQuestion[],
  answers: AnswerState,
): string | null {
  for (const q of questions) {
    const t = normalizeQuestionType(q);
    const v = answers[q.id];
    if (t === "multiple") {
      const arr = Array.isArray(v) ? v : [];
      if (arr.length === 0) {
        return `Выберите хотя бы один вариант в вопросе «${(q.text ?? "").slice(0, 40)}…»`;
      }
    } else if (t === "text") {
      const str = typeof v === "string" ? v.trim() : "";
      if (!str) {
        return `Введите ответ в текстовом вопросе «${(q.text ?? "").slice(0, 40)}…»`;
      }
    } else {
      const str = typeof v === "string" ? v.trim() : "";
      if (!str) {
        return `Выберите ответ в вопросе «${(q.text ?? "").slice(0, 40)}…»`;
      }
    }
  }
  return null;
}

function buildSubmitPayload(
  questions: ModuleQuizQuestion[],
  answers: AnswerState,
): { answers: Record<string, string | string[]> } {
  const out: Record<string, string | string[]> = {};
  for (const q of questions) {
    const t = normalizeQuestionType(q);
    const v = answers[q.id];
    if (t === "multiple" && Array.isArray(v)) {
      out[q.id] = v;
    } else if (typeof v === "string") {
      out[q.id] = v;
    }
  }
  return { answers: out };
}

function QuizInner() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  const [quiz, setQuiz] = useState<ModuleQuizResponse | null>(null);
  const [loadQuiz, setLoadQuiz] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<ModuleQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [attemptError, setAttemptError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured() || !moduleId) {
      setLoadQuiz(false);
      return;
    }
    let cancelled = false;
    setQuizError(null);
    fetchModuleQuiz(moduleId)
      .then((q) => {
        if (!cancelled) setQuiz(q);
      })
      .catch((e: Error) => {
        if (!cancelled) setQuizError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoadQuiz(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const timeLimitSeconds = useMemo(() => {
    if (!quiz) return null;
    const m = quiz.timeLimitMinutes;
    if (m == null || m <= 0) return null;
    return Math.round(m * 60);
  }, [quiz]);

  useEffect(() => {
    if (!quiz?.questions?.length) {
      setQuestions([]);
      setAnswers({});
      return;
    }
    const sorted = [...quiz.questions].sort(
      (a, b) => Number(a.order ?? 0) - Number(b.order ?? 0),
    );
    const list = quiz.shuffleQuestions ? shuffle(sorted) : sorted;
    setQuestions(list);
    setAnswers(initAnswersForQuestions(list));
  }, [quiz]);

  useEffect(() => {
    if (timeLimitSeconds == null) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(timeLimitSeconds);
  }, [timeLimitSeconds]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s == null ? s : s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  useEffect(() => {
    if (!isApiConfigured() || !quiz?.id) return;
    if (!quiz.questions?.length) return;
    let cancelled = false;
    setStartingAttempt(true);
    setAttemptError(null);
    postQuizAttempt(quiz.id)
      .then(({ attemptId: id }) => {
        if (!cancelled) setAttemptId(id);
      })
      .catch((err) => {
        if (!cancelled)
          setAttemptError(
            err instanceof Error ? err.message : "Не удалось начать попытку",
          );
      })
      .finally(() => {
        if (!cancelled) setStartingAttempt(false);
      });
    return () => {
      cancelled = true;
    };
  }, [quiz?.id, quiz?.questions?.length]);

  const fmt = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isApiConfigured()) {
      setSubmitError("Нет NEXT_PUBLIC_API_BASE_URL");
      return;
    }
    if (!quiz || !questions.length) return;
    if (!attemptId) {
      setSubmitError("Попытка ещё не создана (обновите страницу).");
      return;
    }
    const vErr = validateAnswers(questions, answers);
    if (vErr) {
      setSubmitError(vErr);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildSubmitPayload(questions, answers);
      const result = await submitQuizAttempt(attemptId, payload);
      saveQuizReview({
        quizId: quiz.id,
        moduleId,
        courseId,
        result,
        submittedAt: new Date().toISOString(),
      });
      router.push(
        `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/quiz/review`,
      );
    } catch (err) {
      if (err instanceof ApiRequestError) setSubmitError(err.message);
      else setSubmitError("Ошибка сдачи");
    } finally {
      setSubmitting(false);
    }
  }

  const timeOutBlocked =
    timeLimitSeconds != null && secondsLeft !== null && secondsLeft <= 0;

  return (
    <div className="ds-container py-10 lg:py-14">
      <Link
        href={`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`}
        className="ds-text-caption mb-6 inline-block text-ds-primary hover:underline"
      >
        ← К уроку
      </Link>

      {loadQuiz && (
        <p className="ds-text-body text-ds-gray-text">Загрузка теста…</p>
      )}

      {!loadQuiz && quizError && (
        <p className="ds-text-small text-ds-error" role="alert">
          {quizError}
        </p>
      )}

      {!loadQuiz && !quizError && quiz == null && (
        <div className="rounded-ds-card border border-ds-gray-border bg-ds-white p-6">
          <h1 className="ds-text-h2 text-ds-black">Тест</h1>
          <p className="ds-text-body mt-3 text-ds-gray-text">
            Для этого модуля тест не настроен или недоступен.
          </p>
        </div>
      )}

      {!loadQuiz && quiz && !quiz.questions?.length && (
        <div className="rounded-ds-card border border-ds-gray-border bg-ds-white p-6">
          <h1 className="ds-text-h2 text-ds-black">Тест</h1>
          <p className="ds-text-body mt-3 text-ds-gray-text">
            В тесте пока нет вопросов. Обратитесь к администратору.
          </p>
        </div>
      )}

      {!loadQuiz && quiz && questions.length > 0 && (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-3">
            <span className="ds-text-body text-ds-black">
              Тест: <strong>{quiz.title || "Без названия"}</strong>
            </span>
            {secondsLeft !== null ? (
              <span
                className={`ds-text-subtitle font-medium ${secondsLeft < 120 ? "text-ds-error" : "text-ds-black"}`}
              >
                {secondsLeft > 0 ? fmt(secondsLeft) : "Время вышло"}
              </span>
            ) : (
              <span className="ds-text-caption text-ds-gray-text">
                Без ограничения по времени
              </span>
            )}
          </div>

          <h1 className="ds-text-h2 text-ds-black">Тест</h1>
          <p className="ds-text-caption mt-2 text-ds-gray-text">
            Проходной балл: {quiz.passingScore ?? "—"}%
            {quiz.maxAttempts != null ? ` · Попыток: ${quiz.maxAttempts}` : ""}
          </p>

          {(attemptError || submitError) && (
            <p className="ds-text-small mt-4 text-ds-error" role="alert">
              {attemptError ?? submitError}
            </p>
          )}

          <form
            onSubmit={onSubmit}
            className="ds-block-section mt-8 max-w-2xl space-y-8"
          >
            {questions.map((q, idx) => {
              const t = normalizeQuestionType(q);
              const opts = q.answers ?? [];
              return (
                <div
                  key={q.id}
                  className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4"
                >
                  <p className="ds-text-body font-medium text-ds-black">
                    {idx + 1}. {q.text ?? "Вопрос"}
                  </p>
                  {q.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- динамический URL с API
                    <img
                      src={
                        resolvePublicFileUrl(q.imageUrl) ?? q.imageUrl
                      }
                      alt=""
                      className="mt-2 max-h-48 max-w-full rounded border border-ds-gray-border object-contain"
                    />
                  ) : null}

                  {t === "single" &&
                    opts.map((a) => (
                      <label
                        key={a.id}
                        className="mt-3 flex cursor-pointer items-start gap-2 ds-text-body"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="mt-1"
                          checked={answers[q.id] === a.id}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: a.id,
                            }))
                          }
                        />
                        <span>{a.text ?? ""}</span>
                      </label>
                    ))}

                  {t === "multiple" &&
                    opts.map((a) => {
                      const arr = Array.isArray(answers[q.id])
                        ? (answers[q.id] as string[])
                        : [];
                      const checked = arr.includes(a.id);
                      return (
                        <label
                          key={a.id}
                          className="mt-3 flex cursor-pointer items-start gap-2 ds-text-body"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={() => {
                              setAnswers((prev) => {
                                const cur = Array.isArray(prev[q.id])
                                  ? [...(prev[q.id] as string[])]
                                  : [];
                                const next = checked
                                  ? cur.filter((x) => x !== a.id)
                                  : [...cur, a.id];
                                return { ...prev, [q.id]: next };
                              });
                            }}
                          />
                          <span>{a.text ?? ""}</span>
                        </label>
                      );
                    })}

                  {t === "text" && (
                    <textarea
                      className="ds-input mt-3 min-h-[100px] w-full"
                      value={typeof answers[q.id] === "string" ? answers[q.id] : ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder="Ваш ответ"
                    />
                  )}
                </div>
              );
            })}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="ui-btn ui-btn--1"
                disabled={
                  submitting ||
                  startingAttempt ||
                  !attemptId ||
                  timeOutBlocked ||
                  !!attemptError
                }
              >
                {startingAttempt
                  ? "Создание попытки…"
                  : submitting
                    ? "Отправка…"
                    : "Сдать тест"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="ds-container py-16 ds-text-body text-ds-gray-text">
          Загрузка…
        </div>
      }
    >
      <QuizInner />
    </Suspense>
  );
}
