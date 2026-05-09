"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  getAdminModule,
  listModuleContents,
  createModuleContent,
  createModuleContentFromFile,
  deleteModuleContent,
  isAllowedImageBlockFileUrl,
  BACKEND_IMAGE_FILE_URL_PREFIX,
  type AdminContentBlock,
  type AdminModule,
  type ContentBlockType,
  type ContentFromFileKind,
} from "@/lib/api/super-admin/courses-modules";
import {
  createAdminModuleQuiz,
  createQuizQuestion,
  deleteAdminQuiz,
  getAdminModuleQuiz,
  type AdminQuiz,
  type QuizQuestionType,
} from "@/lib/api/super-admin/quizzes";
import { isApiConfigured } from "@/lib/env";

function superAdminQuizTypeLabel(
  t: (k: "qTypeSingle" | "qTypeMultiple" | "qTypeText") => string,
  type: QuizQuestionType,
): string {
  if (type === "multiple") return t("qTypeMultiple");
  if (type === "text") return t("qTypeText");
  return t("qTypeSingle");
}

const TYPES: ContentBlockType[] = [
  "text",
  "image",
  "video",
  "file",
  "livestream",
  "link",
];

const FROM_FILE_KINDS: ContentFromFileKind[] = ["image", "video", "file"];

export default function Page() {
  const t = useTranslations("SuperAdminLessonEditor");
  const { courseId, lessonId } = useParams() as {
    courseId: string;
    lessonId: string;
  };
  const [mod, setMod] = useState<AdminModule | null>(null);
  const [blocks, setBlocks] = useState<AdminContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ContentBlockType>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState("0");
  const [liveAt, setLiveAt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [upKind, setUpKind] = useState<ContentFromFileKind>("image");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [upTitle, setUpTitle] = useState("");
  const [upOrder, setUpOrder] = useState("0");
  const [upContent, setUpContent] = useState("");
  const [upBusy, setUpBusy] = useState(false);

  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizPassing, setQuizPassing] = useState("60");
  const [quizBusy, setQuizBusy] = useState(false);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<QuizQuestionType>("single");
  const [qAnswers, setQAnswers] = useState<
    { text: string; isCorrect: boolean }[]
  >([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const load = useCallback(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getAdminModule(lessonId).then(setMod).catch(() => setMod(null)),
      listModuleContents(lessonId)
        .then((list) =>
          setBlocks([...list].sort((a, b) => a.order - b.order)),
        )
        .catch(() => setBlocks([])),
      getAdminModuleQuiz(lessonId)
        .then(setQuiz)
        .catch(() => setQuiz(null)),
    ]).finally(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  const statsChips =
    mod != null ? (
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-md border border-ds-gray-border bg-ds-gray-light/50 px-2.5 py-1 text-xs font-medium text-ds-black">
          {t("chipBlocks", { count: mod.contentCount })}
        </span>
        <span className="rounded-md border border-ds-gray-border bg-ds-gray-light/50 px-2.5 py-1 text-xs font-medium text-ds-black">
          {t("chipProgress", { count: mod.progressCount })}
        </span>
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            mod.hasQuiz
              ? "border-ds-primary/40 bg-ds-primary/10 text-ds-black"
              : "border-ds-gray-border bg-ds-white text-ds-gray-text"
          }`}
        >
          {mod.hasQuiz ? t("chipQuizOn") : t("chipQuizOff")}
        </span>
      </div>
    ) : null;

  const jumpClass =
    "rounded-md border border-ds-gray-border bg-ds-white px-3 py-1.5 text-xs font-medium text-ds-black transition-colors hover:border-ds-primary/40 hover:bg-ds-primary/5";

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <header className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4 shadow-sm sm:p-5">
        <Link
          href={`/super-admin/courses/${encodeURIComponent(courseId)}`}
          className="ds-text-caption text-ds-primary hover:underline"
        >
          {t("backCourse")}
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="ds-text-h2 text-ds-black">
              {mod?.title ?? t("fallbackTitle")}
            </h1>
            {statsChips}
            <details className="group mt-3">
              <summary className="cursor-pointer list-none text-xs text-ds-gray-text [&::-webkit-details-marker]:hidden">
                <span className="underline decoration-dotted underline-offset-2 group-open:text-ds-black">
                  {t("lessonIdDetails")}
                </span>
              </summary>
              <code className="mt-2 block break-all rounded border border-ds-gray-border bg-ds-gray-light/50 p-2 font-mono text-[11px] leading-relaxed text-ds-gray-dark-2">
                {lessonId}
              </code>
            </details>
          </div>
          <Link
            href={`/super-admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/homework`}
            className="shrink-0 self-start rounded-lg border border-ds-gray-border bg-ds-gray-light/30 px-3 py-2 text-center text-sm font-medium text-ds-primary transition-colors hover:border-ds-primary/40 hover:bg-ds-primary/5 sm:text-left"
          >
            {t("homeworkLink")}
          </Link>
        </div>
        <nav
          className="mt-4 flex flex-wrap gap-2 border-t border-ds-gray-border pt-4"
          aria-label={t("jumpNavAria")}
        >
          <a href="#lesson-blocks" className={jumpClass}>
            {t("jumpBlocks")}
          </a>
          <a href="#lesson-quiz" className={jumpClass}>
            {t("jumpQuiz")}
          </a>
          <a href="#lesson-add" className={jumpClass}>
            {t("jumpAdd")}
          </a>
        </nav>
      </header>

      {err ? (
        <p className="mt-4 rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      ) : null}

      <div className="mt-5 space-y-5 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:gap-6 lg:space-y-0">
        <section
          id="lesson-blocks"
          className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4 shadow-sm sm:p-5 lg:col-start-1 lg:row-start-1"
        >
          <h2 className="ds-text-h3 text-ds-black">{t("blocksTitle")}</h2>
        {loading ? (
          <p className="mt-3 ds-text-caption text-ds-gray-text">{t("loading")}</p>
        ) : blocks.length === 0 ? (
          <p className="mt-3 ds-text-caption text-ds-gray-text">{t("noBlocks")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-ds-gray-border bg-ds-gray-light/20 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="ds-text-caption font-medium text-ds-primary">
                    {b.type}
                  </span>
                  {b.title ? (
                    <span className="ml-2 ds-text-small text-ds-black">
                      {b.title}
                    </span>
                  ) : null}
                  <span className="ml-2 ds-text-caption text-ds-gray-text">
                    {t("orderLabel", { order: b.order })}
                  </span>
                  {(b.content ?? b.fileUrl ?? b.livestreamUrl) && (
                    <p className="mt-1 truncate ds-text-caption text-ds-gray-text">
                      {b.content ?? b.fileUrl ?? b.livestreamUrl}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded border border-ds-error/40 px-2 py-1 ds-text-caption text-ds-error hover:bg-[#FFF5F5]"
                  onClick={() => {
                    if (!confirm(t("deleteBlockConfirm"))) return;
                    deleteModuleContent(lessonId, b.id)
                      .then(() => load())
                      .catch((er) =>
                        setErr(er instanceof Error ? er.message : String(er)),
                      );
                  }}
                >
                  {t("delete")}
                </button>
              </li>
            ))}
          </ul>
        )}
        </section>

        <aside
          id="lesson-quiz"
          className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4 shadow-sm sm:p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto lg:sticky lg:top-4"
        >
          <h2 className="ds-text-h3 text-ds-black">{t("quizTitle")}</h2>
          <p className="mt-2 ds-text-caption leading-relaxed text-ds-gray-text">
            {t("quizLead")}{" "}
            <Link href="/super-admin/ai" className="font-medium text-ds-primary hover:underline">
              {t("quizAiLink")}
            </Link>
            .
          </p>
          <div className="mt-4 space-y-3">
        {loading ? (
          <p className="ds-text-caption text-ds-gray-text">{t("loadingQuiz")}</p>
        ) : quiz == null ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isApiConfigured()) return;
              setErr(null);
              setQuizBusy(true);
              const qTit =
                quizTitle.trim() ||
                (mod?.title
                  ? t("quizDefaultTitleWithModule", { title: mod.title })
                  : t("quizDefaultTitle"));
              const passing = Number(quizPassing);
              createAdminModuleQuiz(lessonId, {
                title: qTit,
                passingScore: Number.isFinite(passing) ? passing : 60,
              })
                .then((q) => {
                  setQuiz(q);
                  load();
                })
                .catch((er) =>
                  setErr(er instanceof Error ? er.message : String(er)),
                )
                .finally(() => setQuizBusy(false));
            }}
          >
            <p className="ds-text-small text-ds-black">{t("createQuizHint")}</p>
            <div className="flex flex-wrap gap-2">
              <input
                className="ds-input min-w-[200px] flex-1"
                placeholder={t("placeholderQuizTitle", {
                  title: mod?.title ?? "…",
                })}
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
              />
              <input
                className="ds-input w-24"
                type="number"
                min={0}
                max={100}
                placeholder={t("placeholderPercent")}
                value={quizPassing}
                onChange={(e) => setQuizPassing(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={quizBusy}
              className="ui-btn ui-btn--1 disabled:opacity-50"
            >
              {quizBusy ? t("busy") : t("createQuiz")}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-ds-gray-border bg-ds-gray-light/50 px-3 py-2">
              <p className="ds-text-small font-medium text-ds-black">
                {quiz.title}
              </p>
              <p className="ds-text-caption mt-1 text-ds-gray-text">
                {t("quizMeta", {
                  id: quiz.id,
                  passing: quiz.passingScore,
                  count: quiz.questions.length,
                })}
              </p>
              <button
                type="button"
                className="mt-2 rounded border border-ds-error/40 px-2 py-1 ds-text-caption text-ds-error hover:bg-[#FFF5F5]"
                onClick={() => {
                  if (!confirm(t("deleteQuizConfirm"))) {
                    return;
                  }
                  setQuizBusy(true);
                  deleteAdminQuiz(quiz.id)
                    .then(() => {
                      setQuiz(null);
                      load();
                    })
                    .catch((er) =>
                      setErr(er instanceof Error ? er.message : String(er)),
                    )
                    .finally(() => setQuizBusy(false));
                }}
                disabled={quizBusy}
              >
                {t("deleteQuiz")}
              </button>
            </div>

            {quiz.questions.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-ds-black">
                  {t("quizQuestionsOverview")}
                </h3>
                <ul className="max-h-[min(55vh,560px)] space-y-3 overflow-y-auto pr-1">
                  {quiz.questions
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((q, qi) => (
                      <li key={q.id}>
                        <details className="group rounded-lg border border-ds-gray-border bg-ds-white">
                          <summary
                            className="cursor-pointer list-none px-3 py-3 transition-colors hover:bg-ds-gray-light/30 [&::-webkit-details-marker]:hidden"
                            aria-label={t("quizQuestionSummaryAria", {
                              n: qi + 1,
                              type: superAdminQuizTypeLabel(t, q.type),
                            })}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-ds-gray-text">
                                    {t("questionHeading", { n: qi + 1 })}
                                  </span>
                                  <span className="text-xs text-ds-primary">
                                    {superAdminQuizTypeLabel(t, q.type)}
                                  </span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ds-black">
                                  {q.text.trim() ? q.text : "—"}
                                </p>
                              </div>
                              <span className="shrink-0 pt-0.5 text-right text-xs leading-tight">
                                <span className="text-ds-primary group-open:hidden">
                                  {t("quizQuestionShowAnswers")}
                                </span>
                                <span className="hidden text-ds-gray-text group-open:inline">
                                  {t("quizQuestionHideAnswers")}
                                </span>
                              </span>
                            </div>
                          </summary>
                          <div className="space-y-3 border-t border-ds-gray-border bg-ds-gray-light/15 px-3 py-3">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ds-black">
                              {q.text.trim() ? q.text : "—"}
                            </p>
                            {q.type === "text" ? (
                              <p className="ds-text-caption text-ds-gray-text">
                                {t("quizTextQuestionHint")}
                              </p>
                            ) : q.answers.length > 0 ? (
                              <div>
                                <p className="text-xs font-semibold text-ds-gray-text">
                                  {t("quizAnswersHeading")}
                                </p>
                                <ul className="mt-2 space-y-1.5">
                                  {q.answers.map((a) => (
                                    <li
                                      key={a.id}
                                      className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 text-sm ${
                                        a.isCorrect
                                          ? "border border-ds-primary/30 bg-ds-primary/5 text-ds-black"
                                          : "bg-ds-gray-light/40 text-ds-black"
                                      }`}
                                    >
                                      <span className="min-w-0 flex-1 leading-snug">
                                        {a.text || "—"}
                                      </span>
                                      {a.isCorrect ? (
                                        <span className="shrink-0 text-xs font-medium text-ds-primary">
                                          {t("answerCorrectMark")}
                                        </span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="ds-text-caption text-ds-error/90">
                                {t("quizAnswersMissingHint")}
                              </p>
                            )}
                          </div>
                        </details>
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-ds-gray-border bg-ds-gray-light/30 px-3 py-4">
                <p className="text-sm text-ds-black">{t("quizQuestionsEmpty")}</p>
              </div>
            )}

            <details className="rounded-md border border-ds-gray-border bg-ds-gray-light/20 px-2 py-1">
              <summary className="cursor-pointer list-none text-xs text-ds-gray-text [&::-webkit-details-marker]:hidden">
                <span className="underline decoration-dotted underline-offset-2">
                  {t("quizBackendHintSummary")}
                </span>
              </summary>
              <p className="mt-2 border-t border-ds-gray-border pt-2 text-xs leading-relaxed text-ds-gray-dark-2">
                {t("quizBackendHintBody")}
              </p>
            </details>

            <form
              className="space-y-3 border-t border-ds-gray-border pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!isApiConfigured() || !quiz) return;
                const trimmed = qAnswers
                  .map((a) => ({
                    text: a.text.trim(),
                    isCorrect: a.isCorrect,
                  }))
                  .filter((a) => a.text.length > 0);
                if (!qText.trim()) {
                  setErr(t("errQuestionText"));
                  return;
                }
                if (qType !== "text" && trimmed.length < 2) {
                  setErr(t("errMinAnswers"));
                  return;
                }
                if (qType === "single" && !trimmed.some((a) => a.isCorrect)) {
                  setErr(t("errSingleCorrect"));
                  return;
                }
                if (qType === "multiple" && !trimmed.some((a) => a.isCorrect)) {
                  setErr(t("errMultiCorrect"));
                  return;
                }
                setErr(null);
                setQuizBusy(true);
                const qOrder = quiz.questions.length;
                createQuizQuestion(quiz.id, {
                  text: qText.trim(),
                  type: qType,
                  order: qOrder,
                  answers:
                    qType === "text"
                      ? []
                      : trimmed.map((a) => ({
                          text: a.text,
                          isCorrect: a.isCorrect,
                        })),
                })
                  .then(() =>
                    getAdminModuleQuiz(lessonId).then((next) => {
                      if (next) setQuiz(next);
                      setQText("");
                      setQType("single");
                      setQAnswers([
                        { text: "", isCorrect: true },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                      ]);
                      load();
                    }),
                  )
                  .catch((er) =>
                    setErr(er instanceof Error ? er.message : String(er)),
                  )
                  .finally(() => setQuizBusy(false));
              }}
            >
              <h3 className="ds-text-small font-semibold text-ds-black">
                {t("addQuestionTitle")}
              </h3>
              <textarea
                className="ds-input min-h-[80px] w-full"
                placeholder={t("placeholderQuestion")}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <select
                  className="ds-input"
                  value={qType}
                  onChange={(e) =>
                    setQType(e.target.value as QuizQuestionType)
                  }
                >
                  <option value="single">{t("qTypeSingle")}</option>
                  <option value="multiple">{t("qTypeMultiple")}</option>
                  <option value="text">{t("qTypeText")}</option>
                </select>
              </div>
              {qType !== "text" && (
                <div className="space-y-2">
                  <p className="ds-text-caption text-ds-gray-text">
                    {t("variantsHint")}
                  </p>
                  {qAnswers.map((a, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <input
                        className="ds-input min-w-0 flex-1"
                        placeholder={t("optionN", { n: i + 1 })}
                        value={a.text}
                        onChange={(e) => {
                          const next = [...qAnswers];
                          next[i] = { ...next[i], text: e.target.value };
                          setQAnswers(next);
                        }}
                      />
                      <label className="flex items-center gap-1 ds-text-caption whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={a.isCorrect}
                          onChange={(e) => {
                            const next = [...qAnswers];
                            next[i] = {
                              ...next[i],
                              isCorrect: e.target.checked,
                            };
                            setQAnswers(next);
                          }}
                        />
                        {t("correctShort")}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="submit"
                disabled={quizBusy}
                className="ui-btn ui-btn--1 disabled:opacity-50"
              >
                {quizBusy ? t("busy") : t("addQuestionBtn")}
              </button>
            </form>
          </div>
        )}
          </div>
        </aside>

        <details
          id="lesson-add"
          className="group rounded-ds-card border border-ds-gray-border bg-ds-white shadow-sm lg:col-start-1 lg:row-start-2"
        >
          <summary className="cursor-pointer list-none px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              <span className="ds-text-h3 text-ds-black">{t("addMaterialsTitle")}</span>
              <span className="shrink-0 rounded border border-ds-gray-border bg-ds-gray-light/50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ds-gray-text group-open:hidden">
                {t("jumpAdd")}
              </span>
            </span>
          </summary>
          <div className="space-y-5 border-t border-ds-gray-border px-4 py-4 sm:px-5 sm:py-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-ds-black">{t("uploadTitle")}</h3>
              <p className="ds-text-caption leading-relaxed text-ds-gray-text">
                {t("uploadLeadShort")}
              </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isApiConfigured() || !upFile) {
              setErr(t("pickFileErr"));
              return;
            }
            setErr(null);
            setUpBusy(true);
            createModuleContentFromFile(lessonId, {
              file: upFile,
              type: upKind,
              title: upTitle.trim() || undefined,
              order: Number(upOrder) || 0,
              content: upContent.trim() || undefined,
            })
              .then(() => {
                setUpFile(null);
                setUpTitle("");
                setUpOrder("0");
                setUpContent("");
                load();
              })
              .catch((er) =>
                setErr(er instanceof Error ? er.message : String(er)),
              )
              .finally(() => setUpBusy(false));
          }}
        >
          <div className="flex flex-wrap gap-2">
            <select
              className="ds-input"
              value={upKind}
              onChange={(e) =>
                setUpKind(e.target.value as ContentFromFileKind)
              }
            >
              {FROM_FILE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <input
              type="file"
              className="ds-input max-w-xs"
              onChange={(e) => setUpFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <input
            className="ds-input w-full max-w-md"
            placeholder={t("placeholderUploadTitle")}
            value={upTitle}
            onChange={(e) => setUpTitle(e.target.value)}
          />
          <input
            className="ds-input w-24"
            type="number"
            placeholder={t("placeholderOrder")}
            value={upOrder}
            onChange={(e) => setUpOrder(e.target.value)}
          />
          <textarea
            className="ds-input min-h-[60px] w-full"
            placeholder={t("placeholderContentOpt")}
            value={upContent}
            onChange={(e) => setUpContent(e.target.value)}
          />
          <button
            type="submit"
            disabled={upBusy || !upFile}
            className="ui-btn ui-btn--1 disabled:opacity-50"
          >
            {upBusy ? t("busy") : t("uploadSubmit")}
          </button>
        </form>
            </section>

            <section className="space-y-3 border-t border-ds-gray-border pt-5">
              <h3 className="text-sm font-semibold text-ds-black">
                {t("jsonBlockTitle")}
              </h3>
              {type === "image" ? (
                <p className="ds-text-caption leading-relaxed text-ds-gray-text">
                  {t("jsonImageHint", { prefix: BACKEND_IMAGE_FILE_URL_PREFIX })}
                </p>
              ) : null}
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isApiConfigured()) return;
                  setErr(null);
                  setBusy(true);
                  const body: Parameters<typeof createModuleContent>[1] = {
                    type,
                    title: title.trim() || undefined,
                    order: Number(order) || 0,
                  };
                  const raw = content.trim();

                  if (type === "image") {
                    if (!raw) {
                      setErr(
                        t("errImageUrl", { prefix: BACKEND_IMAGE_FILE_URL_PREFIX }),
                      );
                      setBusy(false);
                      return;
                    }
                    if (raw.startsWith("http://") || raw.startsWith("https://")) {
                      setErr(t("errImageExternal"));
                      setBusy(false);
                      return;
                    }
                    if (!isAllowedImageBlockFileUrl(raw)) {
                      setErr(
                        t("errImagePrefix", {
                          prefix: BACKEND_IMAGE_FILE_URL_PREFIX,
                        }),
                      );
                      setBusy(false);
                      return;
                    }
                    body.fileUrl = raw;
                  } else if (type === "text" || type === "link" || type === "video") {
                    body.content = raw || undefined;
                  } else if (type === "file") {
                    body.fileUrl = raw || undefined;
                  } else if (type === "livestream") {
                    body.livestreamUrl = raw || undefined;
                    body.livestreamStartsAt =
                      liveAt.trim() || new Date().toISOString();
                  }

                  createModuleContent(lessonId, body)
                    .then(() => {
                      setTitle("");
                      setContent("");
                      setOrder("0");
                      load();
                    })
                    .catch((er) =>
                      setErr(er instanceof Error ? er.message : String(er)),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                <div className="flex flex-wrap gap-2">
                  <select
                    className="ds-input"
                    value={type}
                    onChange={(e) => setType(e.target.value as ContentBlockType)}
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>
                        {ty}
                      </option>
                    ))}
                  </select>
                  <input
                    className="ds-input min-w-[200px] flex-1"
                    placeholder={t("placeholderBlockTitle")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <input
                    className="ds-input w-24"
                    type="number"
                    placeholder={t("placeholderOrder")}
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  />
                </div>
                <textarea
                  className="ds-input min-h-[120px] w-full"
                  placeholder={
                    type === "image"
                      ? t("placeholderFileUrlImage", {
                          prefix: BACKEND_IMAGE_FILE_URL_PREFIX,
                        })
                      : t("placeholderContentMixed")
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                {type === "livestream" && (
                  <input
                    className="ds-input w-full"
                    type="datetime-local"
                    value={liveAt}
                    onChange={(e) => setLiveAt(e.target.value)}
                    placeholder={t("placeholderStream")}
                  />
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="ui-btn ui-btn--1 disabled:opacity-50"
                >
                  {busy ? t("busy") : t("addBlock")}
                </button>
              </form>
            </section>
          </div>
        </details>
      </div>
    </div>
  );
}
