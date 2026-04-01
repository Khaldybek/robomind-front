"use client";

import { useCallback, useEffect, useState } from "react";
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
  const { courseId, moduleId } = useParams() as {
    courseId: string;
    moduleId: string;
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
      getAdminModule(moduleId).then(setMod).catch(() => setMod(null)),
      listModuleContents(moduleId)
        .then((list) =>
          setBlocks([...list].sort((a, b) => a.order - b.order)),
        )
        .catch(() => setBlocks([])),
      getAdminModuleQuiz(moduleId)
        .then(setQuiz)
        .catch(() => setQuiz(null)),
    ]).finally(() => setLoading(false));
  }, [moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href={`/super-admin/courses/${encodeURIComponent(courseId)}`}
        className="ds-text-caption text-ds-primary"
      >
        ← К курсу
      </Link>
      <h1 className="ds-text-h2 text-ds-black">
        {mod?.title ?? "Контент модуля"}
      </h1>
      <p className="ds-text-caption text-ds-gray-text">
        {mod != null
          ? `Блоков: ${mod.contentCount} · Прогресс: ${mod.progressCount}${mod.hasQuiz ? ` · Тест: ${mod.quizId?.slice(0, 8) ?? ""}…` : ""}`
          : null}
      </p>
      <p className="ds-text-caption break-all text-ds-gray-text/80">
        {moduleId}
      </p>
      <Link
        href={`/super-admin/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/homework`}
        className="inline-block ds-text-caption font-medium text-ds-primary hover:underline"
      >
        Домашние задания учеников →
      </Link>

      {err && (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">Блоки</h2>
        {loading ? (
          <p className="mt-3 ds-text-caption text-ds-gray-text">Загрузка…</p>
        ) : blocks.length === 0 ? (
          <p className="mt-3 ds-text-caption text-ds-gray-text">Пока нет блоков.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-ds-gray-border px-3 py-2"
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
                    order {b.order}
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
                    if (!confirm("Удалить блок?")) return;
                    deleteModuleContent(moduleId, b.id)
                      .then(() => load())
                      .catch((er) =>
                        setErr(er instanceof Error ? er.message : String(er)),
                      );
                  }}
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">Тест модуля</h2>
        <p className="ds-text-caption text-ds-gray-text">
          Один тест на модуль:{" "}
          <code className="text-xs">GET/POST …/modules/:moduleId/quiz</code>.
          Сгенерировать вопросы ИИ можно в{" "}
          <Link
            href="/super-admin/ai"
            className="text-ds-primary underline"
          >
            разделе «ИИ»
          </Link>{" "}
          и импортировать через API{" "}
          <code className="text-xs">…/quiz/import-generated</code>.
        </p>
        {loading ? (
          <p className="ds-text-caption text-ds-gray-text">Загрузка теста…</p>
        ) : quiz == null ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isApiConfigured()) return;
              setErr(null);
              setQuizBusy(true);
              const title =
                quizTitle.trim() ||
                (mod?.title ? `Тест: ${mod.title}` : "Тест модуля");
              const passing = Number(quizPassing);
              createAdminModuleQuiz(moduleId, {
                title,
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
            <p className="ds-text-small text-ds-black">
              Тест ещё не создан. Задайте название и порог прохода (%).
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                className="ds-input min-w-[200px] flex-1"
                placeholder={`Название (по умолчанию: Тест: ${mod?.title ?? "…"})`}
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
              />
              <input
                className="ds-input w-24"
                type="number"
                min={0}
                max={100}
                placeholder="%"
                value={quizPassing}
                onChange={(e) => setQuizPassing(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={quizBusy}
              className="ui-btn ui-btn--1 disabled:opacity-50"
            >
              {quizBusy ? "…" : "Создать тест"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-ds-gray-border bg-ds-gray-light/50 px-3 py-2">
              <p className="ds-text-small font-medium text-ds-black">
                {quiz.title}
              </p>
              <p className="ds-text-caption mt-1 text-ds-gray-text">
                ID: <code className="text-xs">{quiz.id}</code> · Проходной балл:{" "}
                {quiz.passingScore}% · Вопросов: {quiz.questions.length}
              </p>
              <button
                type="button"
                className="mt-2 rounded border border-ds-error/40 px-2 py-1 ds-text-caption text-ds-error hover:bg-[#FFF5F5]"
                onClick={() => {
                  if (
                    !confirm(
                      "Удалить тест? Если есть попытки учеников, бэкенд вернёт ошибку.",
                    )
                  ) {
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
                Удалить тест
              </button>
            </div>

            {quiz.questions.length > 0 && (
              <ul className="space-y-2">
                {quiz.questions
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((q) => (
                    <li
                      key={q.id}
                      className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-caption text-ds-black"
                    >
                      <span className="text-ds-primary">{q.type}</span> ·{" "}
                      {q.text.slice(0, 120)}
                      {q.text.length > 120 ? "…" : ""} · ответов:{" "}
                      {q.answers.length}
                    </li>
                  ))}
              </ul>
            )}

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
                  setErr("Введите текст вопроса");
                  return;
                }
                if (qType !== "text" && trimmed.length < 2) {
                  setErr("Нужно минимум 2 варианта ответа с текстом");
                  return;
                }
                if (qType === "single" && !trimmed.some((a) => a.isCorrect)) {
                  setErr("Отметьте один правильный ответ");
                  return;
                }
                if (qType === "multiple" && !trimmed.some((a) => a.isCorrect)) {
                  setErr("Отметьте хотя бы один правильный ответ");
                  return;
                }
                setErr(null);
                setQuizBusy(true);
                const order = quiz.questions.length;
                createQuizQuestion(quiz.id, {
                  text: qText.trim(),
                  type: qType,
                  order,
                  answers:
                    qType === "text"
                      ? []
                      : trimmed.map((a) => ({
                          text: a.text,
                          isCorrect: a.isCorrect,
                        })),
                })
                  .then(() =>
                    getAdminModuleQuiz(moduleId).then((next) => {
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
                Добавить вопрос
              </h3>
              <textarea
                className="ds-input min-h-[80px] w-full"
                placeholder="Текст вопроса"
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
                  <option value="single">Один верный (single)</option>
                  <option value="multiple">Несколько верных (multiple)</option>
                  <option value="text">Свободный ответ (text)</option>
                </select>
              </div>
              {qType !== "text" && (
                <div className="space-y-2">
                  <p className="ds-text-caption text-ds-gray-text">
                    Варианты (минимум 2 с текстом), отметьте верные:
                  </p>
                  {qAnswers.map((a, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <input
                        className="ds-input min-w-0 flex-1"
                        placeholder={`Вариант ${i + 1}`}
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
                        верный
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
                {quizBusy ? "…" : "Добавить вопрос"}
              </button>
            </form>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">Загрузить файл в блок</h2>
        <p className="ds-text-caption text-ds-gray-text">
          <code className="text-xs">POST .../contents/from-file</code> — multipart:
          файл попадает на сервер как при <code>/admin/upload/*</code>, в блок
          записывается <code>fileUrl</code> вида{" "}
          <code className="break-all">/api/v1/files/...</code>.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isApiConfigured() || !upFile) {
              setErr("Выберите файл");
              return;
            }
            setErr(null);
            setUpBusy(true);
            createModuleContentFromFile(moduleId, {
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
            placeholder="Заголовок (необязательно)"
            value={upTitle}
            onChange={(e) => setUpTitle(e.target.value)}
          />
          <input
            className="ds-input w-24"
            type="number"
            placeholder="order"
            value={upOrder}
            onChange={(e) => setUpOrder(e.target.value)}
          />
          <textarea
            className="ds-input min-h-[60px] w-full"
            placeholder="content (необязательно)"
            value={upContent}
            onChange={(e) => setUpContent(e.target.value)}
          />
          <button
            type="submit"
            disabled={upBusy || !upFile}
            className="ui-btn ui-btn--1 disabled:opacity-50"
          >
            {upBusy ? "…" : "Загрузить и создать блок"}
          </button>
        </form>
      </section>

      <form
        className="space-y-3 rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6"
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
                `Для image укажите fileUrl (${BACKEND_IMAGE_FILE_URL_PREFIX}...) или используйте форму загрузки файла выше.`,
              );
              setBusy(false);
              return;
            }
            if (raw.startsWith("http://") || raw.startsWith("https://")) {
              setErr(
                "Для image внешние URL запрещены. Используйте «Загрузить файл в блок» или путь на этот бэкенд.",
              );
              setBusy(false);
              return;
            }
            if (!isAllowedImageBlockFileUrl(raw)) {
              setErr(
                `fileUrl для image должен начинаться с ${BACKEND_IMAGE_FILE_URL_PREFIX}`,
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

          createModuleContent(moduleId, body)
            .then(() => {
              setTitle("");
              setContent("");
              setOrder("0");
              load();
            })
            .catch((er) => setErr(er instanceof Error ? er.message : String(er)))
            .finally(() => setBusy(false));
        }}
      >
        <h2 className="ds-text-h3 text-ds-black">Добавить блок (JSON)</h2>
        <p className="ds-text-caption text-ds-gray-text">
          Для <strong>image</strong> в поле ниже указывайте только путь на этот API (
          <code>{BACKEND_IMAGE_FILE_URL_PREFIX}…</code>), не ссылку с другого сайта.
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            className="ds-input"
            value={type}
            onChange={(e) => setType(e.target.value as ContentBlockType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="ds-input min-w-[200px] flex-1"
            placeholder="Заголовок блока"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="ds-input w-24"
            type="number"
            placeholder="order"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </div>
        <textarea
          className="ds-input min-h-[120px] w-full"
          placeholder={
            type === "image"
              ? `fileUrl: ${BACKEND_IMAGE_FILE_URL_PREFIX}...`
              : "Текст / URL видео / fileUrl / ссылка стрима"
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
            placeholder="Начало стрима"
          />
        )}
        <button
          type="submit"
          disabled={busy}
          className="ui-btn ui-btn--1 disabled:opacity-50"
        >
          {busy ? "…" : "Добавить блок"}
        </button>
      </form>
    </div>
  );
}
