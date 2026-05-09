"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  aiGenerateQuiz,
  aiSummarize,
  aiTranscribe,
} from "@/lib/api/super-admin/ai";
import { FormOptionLessonPicker } from "@/components/super-admin/form-option-lesson-picker";
import { isApiConfigured } from "@/lib/env";

export default function Page() {
  const t = useTranslations("SuperAdminAi");
  const tc = useTranslations("Common");
  const [lessonId, setLessonId] = useState("");
  const [lessonLabel, setLessonLabel] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <header className="border-b border-ds-gray-border pb-6">
        <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
        <p className="mt-2 max-w-2xl ds-text-caption leading-relaxed text-ds-gray-text">
          {t("lead")}
        </p>
      </header>

      {!isApiConfigured() ? (
        <p
          className="rounded-lg border border-ds-error/25 bg-[#FFF5F5] px-4 py-3 ds-text-small text-ds-error"
          role="status"
        >
          {tc("apiEnvMissing")}
        </p>
      ) : null}

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 shadow-sm sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">{t("lessonContextTitle")}</h2>
        <p className="mt-1.5 max-w-2xl ds-text-caption leading-relaxed text-ds-gray-text">
          {t("lessonContextLead")}
        </p>
        <div className="mt-4">
          <FormOptionLessonPicker
            value={lessonId}
            selectedLabel={lessonLabel}
            onSelect={(id, label) => {
              setLessonId(id);
              setLessonLabel(label);
            }}
            onClear={() => {
              setLessonId("");
              setLessonLabel(null);
            }}
          />
        </div>
      </section>

      <QuizSection lessonId={lessonId} />
      <SummarizeSection lessonId={lessonId} />
      <TranscribeSection />
    </div>
  );
}

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 shadow-sm sm:p-6">
      <h2 className="ds-text-h3 text-ds-black">{title}</h2>
      {hint ? (
        <p className="mt-1.5 max-w-2xl ds-text-caption leading-relaxed text-ds-gray-text">
          {hint}
        </p>
      ) : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function QuizSection({ lessonId }: { lessonId: string }) {
  const t = useTranslations("SuperAdminAi");
  const tc = useTranslations("Common");
  const [moduleText, setModuleText] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  return (
    <Block title={t("quizTitle")} hint={t("quizHint")}>
      <textarea
        className="ds-input min-h-[120px] w-full resize-y text-sm leading-relaxed"
        placeholder={t("placeholderModuleText")}
        value={moduleText}
        onChange={(e) => setModuleText(e.target.value)}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1.5 ds-text-caption text-ds-black">
          <span>{t("questionCount")}</span>
          <input
            type="number"
            min={1}
            max={25}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="ds-input w-full sm:w-24"
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 ds-text-caption text-ds-black sm:max-w-xs">
          <span>{t("difficultyLabel")}</span>
          <select
            className="ds-input w-full"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as "easy" | "medium" | "hard")
            }
          >
            <option value="easy">{t("difficultyEasy")}</option>
            <option value="medium">{t("difficultyMedium")}</option>
            <option value="hard">{t("difficultyHard")}</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        className="ui-btn ui-btn--1 w-full sm:w-auto"
        onClick={() => {
          if (!isApiConfigured()) {
            setErr(tc("apiEnvMissing"));
            return;
          }
          const mid = lessonId.trim();
          const mt = moduleText.trim();
          if (!mid && (!mt || mt.length < 80)) {
            setErr(t("errNeedLessonOrModuleText"));
            return;
          }
          setErr("");
          aiGenerateQuiz({
            moduleId: mid || undefined,
            moduleText: mt || undefined,
            questionCount: count,
            difficulty,
          })
            .then((r) => setOut(JSON.stringify(r, null, 2)))
            .catch((e) => setErr(String(e)));
        }}
      >
        {t("generate")}
      </button>
      {err ? (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      ) : null}
      {out ? (
        <pre className="max-h-80 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light/80 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-ds-black">
          {out}
        </pre>
      ) : null}
    </Block>
  );
}

function SummarizeSection({ lessonId }: { lessonId: string }) {
  const t = useTranslations("SuperAdminAi");
  const tc = useTranslations("Common");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  return (
    <Block title={t("summarizeTitle")} hint={t("summarizeHint")}>
      <textarea
        className="ds-input min-h-[120px] w-full resize-y text-sm leading-relaxed"
        placeholder={t("placeholderText")}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        className="ui-btn ui-btn--1 w-full sm:w-auto"
        onClick={() => {
          if (!isApiConfigured()) {
            setErr(tc("apiEnvMissing"));
            return;
          }
          const mid = lessonId.trim();
          const tx = text.trim();
          if (!mid && (!tx || tx.length < 40)) {
            setErr(t("errNeedLessonOrText"));
            return;
          }
          setErr("");
          aiSummarize({ moduleId: mid || undefined, text: tx || undefined })
            .then((r) =>
              setOut(
                typeof r === "object" && r && "summary" in r
                  ? String((r as { summary: string }).summary)
                  : JSON.stringify(r, null, 2),
              ),
            )
            .catch((e) => setErr(String(e)));
        }}
      >
        {t("summarizeBtn")}
      </button>
      {err ? (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      ) : null}
      {out ? (
        <pre className="max-h-72 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light/80 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-ds-black">
          {out}
        </pre>
      ) : null}
    </Block>
  );
}

function TranscribeSection() {
  const t = useTranslations("SuperAdminAi");
  const tc = useTranslations("Common");
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<"ru" | "kk" | "auto">("auto");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  return (
    <Block title={t("transcribeTitle")} hint={t("transcribeHint")}>
      <div className="rounded-lg border border-dashed border-ds-gray-border bg-ds-gray-light/30 p-4">
        <label className="block ds-text-caption text-ds-gray-text">
          <span className="mb-2 block text-ds-black">{t("transcribeFileLabel")}</span>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer text-sm file:mr-3 file:rounded file:border-0 file:bg-ds-primary file:px-3 file:py-1.5 file:ds-text-caption file:text-ds-white"
          />
        </label>
      </div>
      <label className="flex max-w-xs flex-col gap-1.5 ds-text-caption text-ds-black">
        <span>{t("transcribeLangLabel")}</span>
        <select
          className="ds-input w-full"
          value={lang}
          onChange={(e) => setLang(e.target.value as "ru" | "kk" | "auto")}
        >
          <option value="auto">{t("langAuto")}</option>
          <option value="ru">{t("langRu")}</option>
          <option value="kk">{t("langKk")}</option>
        </select>
      </label>
      <button
        type="button"
        className="ui-btn ui-btn--1 w-full sm:w-auto"
        disabled={!file}
        onClick={() => {
          if (!file || !isApiConfigured()) {
            if (!isApiConfigured()) setErr(tc("apiEnvMissing"));
            return;
          }
          setErr("");
          aiTranscribe(file, lang)
            .then((r) => setOut(JSON.stringify(r, null, 2)))
            .catch((e) => setErr(String(e)));
        }}
      >
        {t("transcribeBtn")}
      </button>
      {err ? (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      ) : null}
      {out ? (
        <pre className="max-h-64 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light/80 p-4 font-mono text-xs leading-relaxed text-ds-black">
          {out}
        </pre>
      ) : null}
    </Block>
  );
}
