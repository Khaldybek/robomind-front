"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Clock, Loader2 } from "lucide-react";
import {
  fetchLessonQuiz,
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
  tr: (key: string, values: { snippet: string }) => string,
): string | null {
  for (const q of questions) {
    const t = normalizeQuestionType(q);
    const v = answers[q.id];
    const snippet = (q.text ?? "").slice(0, 40);
    if (t === "multiple") {
      const arr = Array.isArray(v) ? v : [];
      if (arr.length === 0) {
        return tr("validateMultiple", { snippet });
      }
    } else if (t === "text") {
      const str = typeof v === "string" ? v.trim() : "";
      if (!str) {
        return tr("validateText", { snippet });
      }
    } else {
      const str = typeof v === "string" ? v.trim() : "";
      if (!str) {
        return tr("validateSingle", { snippet });
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

function looksLikeAttemptLimitError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    /лимит|попыток|исчерпан/i.test(message) ||
    /limit|attempts?|exceeded|exhausted/i.test(m)
  );
}

const optionBaseClass =
  "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 motion-safe:transition-transform motion-safe:hover:-translate-y-px";

function optionClass(selected: boolean): string {
  return [
    optionBaseClass,
    selected
      ? "border-ds-primary/50 bg-gradient-to-br from-ds-primary/[0.08] to-ds-primary/[0.02] shadow-[0_0_0_1px_rgba(255,46,31,0.12),0_8px_24px_-12px_rgba(255,46,31,0.18)]"
      : "border-ds-gray-border/70 bg-white/70 shadow-sm hover:border-ds-primary/28 hover:bg-white hover:shadow-md",
  ].join(" ");
}

function QuizInner() {
  const ft = useTranslations("StudentLessonQuiz");
  const locale = useLocale();
  const quizApiLang = locale === "kk" ? "kk" : "ru";
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

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
    if (!isApiConfigured() || !lessonId) {
      setLoadQuiz(false);
      return;
    }
    let cancelled = false;
    setQuizError(null);
    fetchLessonQuiz(lessonId, { lang: quizApiLang })
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
  }, [lessonId, quizApiLang]);

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
            err instanceof Error ? err.message : ft("startAttemptFailed"),
          );
      })
      .finally(() => {
        if (!cancelled) setStartingAttempt(false);
      });
    return () => {
      cancelled = true;
    };
  }, [quiz?.id, quiz?.questions?.length, ft]);

  const fmt = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isApiConfigured()) {
      setSubmitError(ft("noApiBase"));
      return;
    }
    if (!quiz || !questions.length) return;
    if (!attemptId) {
      setSubmitError(ft("attemptNotReady"));
      return;
    }
    const vErr = validateAnswers(questions, answers, ft);
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
        lessonId,
        courseId,
        result,
        submittedAt: new Date().toISOString(),
      });
      router.push(
        `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/quiz/review`,
      );
    } catch (err) {
      if (err instanceof ApiRequestError) setSubmitError(err.message);
      else setSubmitError(ft("submitErrorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  const timeOutBlocked =
    timeLimitSeconds != null && secondsLeft !== null && secondsLeft <= 0;

  function maxAttemptsSourceLabel(src: string): string {
    switch (src) {
      case "user_quiz_max_attempt_override":
      case "user_quiz_max_attempt_overrides":
        return ft("sourceUserOverride");
      case "course_access":
      case "course_accesses":
        return ft("sourceCourseAccess");
      case "course_default":
      case "courses.default_max_quiz_attempts":
        return ft("sourceCourseDefault");
      case "quiz":
      case "quizzes.max_attempts":
        return ft("sourceQuiz");
      default:
        return ft("sourceOther", { raw: src });
    }
  }

  const attemptLimitBlocked =
    attemptError != null && looksLikeAttemptLimitError(attemptError);
  const combinedError = attemptError ?? submitError;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#eef2f9] via-ds-white to-[#fff5f3]">
      <div
        className="pointer-events-none absolute -left-24 top-0 h-[min(28rem,50vw)] w-[min(28rem,50vw)] rounded-full bg-ds-primary/20 blur-3xl motion-reduce:opacity-30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl motion-reduce:opacity-25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-96 rounded-full bg-amber-100/40 blur-3xl motion-reduce:opacity-20"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-10 lg:py-14">
        <Link
          href={`/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`}
          className="group mb-6 inline-flex items-center gap-2 rounded-full border border-ds-gray-border/80 bg-white/80 px-4 py-2 text-sm font-medium text-ds-primary shadow-sm backdrop-blur-sm transition-all hover:border-ds-primary/35 hover:bg-white hover:shadow-md"
        >
          <ArrowLeft
            className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
            aria-hidden
          />
          {ft("backToLesson")}
        </Link>

        {loadQuiz && (
          <div className="space-y-6" aria-busy="true" aria-live="polite">
            <div className="h-48 animate-pulse rounded-[28px] bg-white/50 shadow-inner ring-1 ring-ds-gray-border/40" />
            <div className="h-36 animate-pulse rounded-2xl bg-white/40 ring-1 ring-ds-gray-border/30 motion-reduce:animate-none" />
            <div className="h-36 animate-pulse rounded-2xl bg-white/40 ring-1 ring-ds-gray-border/30 motion-reduce:animate-none" />
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-ds-gray-text">
              <Loader2 className="size-4 animate-spin text-ds-primary motion-reduce:animate-none" />
              {ft("loadingQuiz")}
            </p>
          </div>
        )}

        {!loadQuiz && quizError && (
          <div
            className="flex gap-3 rounded-2xl border border-ds-error/25 bg-[#fff5f5] p-5 shadow-sm"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-ds-error" aria-hidden />
            <p className="text-sm leading-relaxed text-ds-error">{quizError}</p>
          </div>
        )}

        {!loadQuiz && !quizError && quiz == null && (
          <div className="rounded-[28px] border border-ds-gray-border/60 bg-white/90 p-8 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)] backdrop-blur-md sm:p-10">
            <h1 className="ds-text-h2 text-ds-black">{ft("noQuizTitle")}</h1>
            <p className="mt-4 text-base leading-relaxed text-ds-gray-text">
              {ft("noQuizBody")}
            </p>
          </div>
        )}

        {!loadQuiz && quiz && !quiz.questions?.length && (
          <div className="rounded-[28px] border border-ds-gray-border/60 bg-white/90 p-8 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.12)] backdrop-blur-md sm:p-10">
            <h1 className="ds-text-h2 text-ds-black">{ft("noQuestionsTitle")}</h1>
            <p className="mt-4 text-base leading-relaxed text-ds-gray-text">
              {ft("noQuestionsBody")}
            </p>
          </div>
        )}

        {!loadQuiz && quiz && questions.length > 0 && (
          <>
            <header className="mb-8 overflow-hidden rounded-[28px] border border-white/90 bg-white/85 p-6 shadow-[0_24px_70px_-32px_rgba(0,0,0,0.14)] backdrop-blur-md sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ds-primary/90">
                {ft("quizEyebrow")}
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-ds-black sm:text-3xl">
                    {quiz.title?.trim() ? quiz.title : ft("untitledQuiz")}
                  </h1>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-ds-gray-border/70 bg-ds-gray-light/60 px-3 py-1 text-xs font-medium text-ds-black">
                      {ft("metaPassing", {
                        passing: String(quiz.passingScore ?? "—"),
                      })}
                    </span>
                    {quiz.maxAttempts != null ? (
                      <span className="inline-flex items-center rounded-full border border-ds-primary/25 bg-ds-primary/8 px-3 py-1 text-xs font-medium text-ds-black">
                        {ft("metaAttempts", { n: String(quiz.maxAttempts) })}
                      </span>
                    ) : null}
                    {quiz.maxAttempts != null && quiz.maxAttemptsSource ? (
                      <span
                        className="inline-flex max-w-full items-center rounded-full border border-ds-gray-border/60 bg-white/80 px-3 py-1 text-xs text-ds-gray-text"
                        title={quiz.maxAttemptsSource}
                      >
                        {ft("metaAttemptsSource", {
                          label: maxAttemptsSourceLabel(quiz.maxAttemptsSource),
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 sm:pt-1">
                  {secondsLeft !== null ? (
                    <div
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold tabular-nums shadow-sm ${
                        secondsLeft > 0 && secondsLeft < 120
                          ? "border-ds-error/35 bg-[#fff5f5] text-ds-error motion-safe:animate-pulse"
                          : secondsLeft <= 0
                            ? "border-ds-gray-border bg-ds-gray-light/80 text-ds-gray-text"
                            : "border-ds-gray-border/80 bg-white text-ds-black"
                      }`}
                    >
                      <Clock className="size-4 shrink-0 opacity-80" aria-hidden />
                      {secondsLeft > 0
                        ? ft("timerRunning", { time: fmt(secondsLeft) })
                        : ft("timerExpired")}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-ds-gray-border/70 bg-ds-gray-light/50 px-4 py-2.5 text-xs font-medium text-ds-gray-text">
                      <Clock className="size-3.5 shrink-0 opacity-70" aria-hidden />
                      {ft("noTimeLimit")}
                    </div>
                  )}
                </div>
              </div>
            </header>

            {combinedError ? (
              <div
                className={`mb-8 flex gap-4 rounded-2xl border p-5 shadow-md ${
                  attemptLimitBlocked
                    ? "border-ds-error/30 bg-gradient-to-br from-[#fff8f8] to-white"
                    : "border-ds-error/25 bg-[#fff5f5]"
                }`}
                role="alert"
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                    attemptLimitBlocked ? "bg-ds-error/12" : "bg-ds-error/10"
                  }`}
                >
                  <AlertCircle className="size-6 text-ds-error" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ds-black">
                    {attemptLimitBlocked
                      ? ft("attemptLimitTitle")
                      : ft("errorGenericTitle")}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ds-gray-dark-2">
                    {combinedError}
                  </p>
                  {attemptLimitBlocked ? (
                    <p className="mt-3 text-xs leading-relaxed text-ds-gray-text">
                      {ft("attemptLimitHint")}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-6 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:space-y-7 sm:pb-[calc(8rem+env(safe-area-inset-bottom,0px)))]">
              {questions.map((q, idx) => {
                const qKind = normalizeQuestionType(q);
                const opts = q.answers ?? [];
                return (
                  <div
                    key={q.id}
                    className="student-quiz-card-enter relative overflow-hidden rounded-[22px] border border-white/90 bg-white/90 p-5 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:p-6"
                    style={{ animationDelay: `${idx * 0.055}s` }}
                  >
                    <div
                      className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-ds-primary via-ds-primary/70 to-ds-primary/20"
                      aria-hidden
                    />
                    <div className="flex gap-4 pl-2 sm:gap-5 sm:pl-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-primary/15 to-ds-primary/5 text-sm font-bold text-ds-primary shadow-sm ring-1 ring-ds-primary/10 sm:h-11 sm:w-11">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-4">
                        <p className="text-base font-medium leading-snug text-ds-black sm:text-lg">
                          {q.text?.trim() ? q.text : ft("questionFallback")}
                        </p>
                        {q.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- динамический URL с API
                          <img
                            src={
                              resolvePublicFileUrl(q.imageUrl) ?? q.imageUrl
                            }
                            alt=""
                            className="max-h-52 max-w-full rounded-xl border border-ds-gray-border/60 object-contain shadow-sm"
                          />
                        ) : null}

                        {qKind === "single" &&
                          opts.map((a) => {
                            const selected = answers[q.id] === a.id;
                            return (
                              <label
                                key={a.id}
                                className={optionClass(selected)}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  className="mt-1 size-[1.125rem] shrink-0 accent-ds-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary/35 focus-visible:ring-offset-2"
                                  checked={selected}
                                  onChange={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: a.id,
                                    }))
                                  }
                                />
                                <span className="min-w-0 flex-1 leading-relaxed text-ds-black">
                                  {a.text ?? ""}
                                </span>
                              </label>
                            );
                          })}

                        {qKind === "multiple" &&
                          opts.map((a) => {
                            const arr = Array.isArray(answers[q.id])
                              ? (answers[q.id] as string[])
                              : [];
                            const checked = arr.includes(a.id);
                            return (
                              <label
                                key={a.id}
                                className={optionClass(checked)}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 size-[1.125rem] shrink-0 rounded border-ds-gray-border accent-ds-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-primary/35 focus-visible:ring-offset-2"
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
                                <span className="min-w-0 flex-1 leading-relaxed text-ds-black">
                                  {a.text ?? ""}
                                </span>
                              </label>
                            );
                          })}

                        {qKind === "text" && (
                          <textarea
                            className="ds-input min-h-[120px] w-full rounded-xl border-ds-gray-border/80 bg-white/90 text-base shadow-inner transition-shadow focus:border-ds-primary/40 focus:shadow-md"
                            value={
                              typeof answers[q.id] === "string"
                                ? answers[q.id]
                                : ""
                            }
                            onChange={(e) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            placeholder={ft("textAnswerPlaceholder")}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-20 mt-10 flex flex-col gap-3 rounded-2xl border border-white/95 bg-white/90 p-4 shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.12),0_8px_32px_-12px_rgba(0,0,0,0.08)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-center text-xs text-ds-gray-text sm:text-left">
                  {startingAttempt
                    ? ft("startingAttempt")
                    : timeOutBlocked
                      ? ft("timerExpired")
                      : ft("submitStickyHint")}
                </p>
                <button
                  type="submit"
                  className="ui-btn ui-btn--1 w-full min-h-[3rem] text-base font-semibold shadow-md transition-shadow hover:shadow-lg disabled:pointer-events-none disabled:opacity-45 sm:w-auto sm:min-w-[200px]"
                  disabled={
                    submitting ||
                    startingAttempt ||
                    !attemptId ||
                    timeOutBlocked ||
                    !!attemptError
                  }
                >
                  {startingAttempt ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="size-5 animate-spin motion-reduce:animate-none" />
                      {ft("startingAttempt")}
                    </span>
                  ) : submitting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="size-5 animate-spin motion-reduce:animate-none" />
                      {ft("submitting")}
                    </span>
                  ) : (
                    ft("submitBtn")
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function QuizSuspenseFallback() {
  const ft = useTranslations("StudentLessonQuiz");
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#eef2f9] via-ds-white to-[#fff5f3]">
      <div className="relative z-[1] flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <Loader2
          className="size-10 animate-spin text-ds-primary motion-reduce:animate-none"
          aria-hidden
        />
        <p className="text-sm font-medium text-ds-gray-text">
          {ft("suspenseLoading")}
        </p>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<QuizSuspenseFallback />}>
      <QuizInner />
    </Suspense>
  );
}
