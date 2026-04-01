"use client";

import { useState, type ReactNode } from "react";
import {
  aiGenerateQuiz,
  aiSummarize,
  aiTranscribe,
} from "@/lib/api/super-admin/ai";
import { isApiConfigured } from "@/lib/env";

export default function Page() {
  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="ds-text-h2 text-ds-black">ИИ-инструменты</h1>
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          Генерация квиза, саммари и транскрипция для учебного контента.
        </p>
      </header>
      <QuizSection />
      <SummarizeSection />
      <TranscribeSection />
    </div>
  );
}

function Block({
  title,
  endpoint,
  children,
}: {
  title: string;
  endpoint: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
      <h2 className="ds-text-h3 text-ds-black">{title}</h2>
      <p className="mb-4 mt-1 ds-text-caption text-ds-gray-text">{endpoint}</p>
      {children}
    </section>
  );
}

function QuizSection() {
  const [moduleId, setModuleId] = useState("");
  const [moduleText, setModuleText] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  return (
    <Block title="Генерация квиза" endpoint="POST /admin/ai/quiz/generate">
      <input
        className="ds-input"
        placeholder="moduleId (uuid)"
        value={moduleId}
        onChange={(e) => setModuleId(e.target.value)}
      />
      <textarea
        className="ds-input min-h-[100px]"
        placeholder="или moduleText (≥80 симв.)"
        value={moduleText}
        onChange={(e) => setModuleText(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="ds-text-caption text-ds-black">
          Вопросов
          <input
            type="number"
            min={1}
            max={25}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="ml-2 w-20 ds-input"
          />
        </label>
        <select
          className="ds-input w-36"
          value={difficulty}
          onChange={(e) =>
            setDifficulty(e.target.value as "easy" | "medium" | "hard")
          }
        >
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
      </div>
      <button
        type="button"
        className="mt-4 ui-btn ui-btn--1"
        onClick={() => {
          if (!isApiConfigured()) return;
          setErr("");
          aiGenerateQuiz({
            moduleId: moduleId || undefined,
            moduleText: moduleText || undefined,
            questionCount: count,
            difficulty,
          })
            .then((r) => setOut(JSON.stringify(r, null, 2)))
            .catch((e) => setErr(String(e)));
        }}
      >
        Сгенерировать
      </button>
      {err && (
        <p className="mt-3 rounded border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}
      {out && (
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light p-4 ds-text-caption whitespace-pre-wrap">
          {out}
        </pre>
      )}
    </Block>
  );
}

function SummarizeSection() {
  const [moduleId, setModuleId] = useState("");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  return (
    <Block title="Саммари" endpoint="POST /admin/ai/summarize">
      <input
        className="ds-input"
        placeholder="moduleId"
        value={moduleId}
        onChange={(e) => setModuleId(e.target.value)}
      />
      <textarea
        className="ds-input min-h-[100px]"
        placeholder="или text (≥40)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        className="mt-1 ui-btn ui-btn--1"
        onClick={() => {
          if (!isApiConfigured()) return;
          setErr("");
          aiSummarize({ moduleId: moduleId || undefined, text: text || undefined })
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
        Суммаризовать
      </button>
      {err && (
        <p className="mt-3 rounded border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}
      {out && (
        <pre className="mt-3 max-h-60 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light p-4 ds-text-caption whitespace-pre-wrap text-ds-black">
          {out}
        </pre>
      )}
    </Block>
  );
}

function TranscribeSection() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<"ru" | "kk" | "auto">("auto");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  return (
    <Block
      title="Транскрипция"
      endpoint="POST /admin/ai/transcribe (multipart/form-data)"
    >
      <input
        type="file"
        accept="audio/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full ds-text-caption"
      />
      <select
        className="ds-input mt-3 w-40"
        value={lang}
        onChange={(e) => setLang(e.target.value as "ru" | "kk" | "auto")}
      >
        <option value="auto">auto</option>
        <option value="ru">ru</option>
        <option value="kk">kk</option>
      </select>
      <button
        type="button"
        className="mt-1 ui-btn ui-btn--1"
        disabled={!file}
        onClick={() => {
          if (!file || !isApiConfigured()) return;
          setErr("");
          aiTranscribe(file, lang)
            .then((r) => setOut(JSON.stringify(r, null, 2)))
            .catch((e) => setErr(String(e)));
        }}
      >
        Транскрибировать
      </button>
      {err && (
        <p className="mt-3 rounded border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}
      {out && (
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light p-4 ds-text-caption">
          {out}
        </pre>
      )}
    </Block>
  );
}
