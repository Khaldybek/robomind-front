"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  postAiChat,
  type AiChatResponse,
} from "@/lib/api/student/ai";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

function extractReply(res: AiChatResponse | null): string {
  if (res == null) return "";
  if (typeof res === "object" && "reply" in res && typeof res.reply === "string") {
    return res.reply;
  }
  if (
    typeof res === "object" &&
    "message" in res &&
    typeof (res as { message: unknown }).message === "string"
  ) {
    return (res as { message: string }).message;
  }
  if (typeof res === "string") return res;
  return JSON.stringify(res);
}

export function CourseAiChat({
  courseId,
  moduleId,
  variant = "page",
}: {
  courseId: string;
  moduleId?: string;
  variant?: "page" | "embedded";
}) {
  const t = useTranslations("StudentAiChat");
  const tc = useTranslations("Common");
  const tm = useTranslations("StudentModule");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    [],
  );
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || !isApiConfigured()) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setPending(true);
    setError(null);
    try {
      const transcript = [...messages, { role: "user", text }]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.text,
        }));
      const res = await postAiChat({
        messages: transcript,
        moduleId,
      });
      const reply = extractReply(res);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      if (e instanceof ApiRequestError) setError(e.message);
      else setError(t("error"));
    } finally {
      setPending(false);
    }
  }

  const chatShell =
    variant === "embedded"
      ? "flex min-h-[min(28rem,55vh)] max-h-[min(32rem,60vh)] flex-col overflow-hidden rounded-[var(--ds-radius-mobile-block)] border-2 border-ds-primary/20 bg-white shadow-md"
      : "mt-6 flex min-h-[min(60vh,720px)] flex-1 flex-col overflow-hidden rounded-ds-section border border-ds-gray-border bg-ds-white";

  const inner = (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {!isApiConfigured() ? (
          <p className="student-module-kid-prose text-ds-gray-text">
            {tc("apiEnvMissing")}
          </p>
        ) : messages.length === 0 ? (
          <p
            className={
              variant === "embedded"
                ? "student-module-kid-prose text-ds-gray-dark-2"
                : "ds-text-body text-ds-gray-text"
            }
          >
            {t("empty")}
          </p>
        ) : null}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-2xl px-4 py-3 ${
              variant === "embedded"
                ? "text-base leading-relaxed"
                : "ds-text-body"
            } ${
              msg.role === "user"
                ? "ml-6 bg-ds-primary/10 text-ds-black"
                : "mr-6 bg-ds-gray-light text-ds-black"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      {error && (
        <p
          className={`px-4 text-ds-error ${
            variant === "embedded" ? "text-sm" : "ds-text-small"
          }`}
        >
          {error}
        </p>
      )}
      <div className="flex shrink-0 gap-2 border-t border-ds-gray-border p-3 sm:p-4">
        <input
          className={
            variant === "embedded"
              ? "ds-input min-h-[48px] flex-1 text-base"
              : "ds-input flex-1"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !e.shiftKey &&
            (e.preventDefault(), void send())
          }
          placeholder={t("placeholder")}
          disabled={pending || !isApiConfigured()}
        />
        <button
          type="button"
          onClick={() => void send()}
          className={
            variant === "embedded"
              ? "ui-btn ui-btn--1 student-module-kid-cta shrink-0"
              : "ui-btn ui-btn--1 shrink-0"
          }
          disabled={pending || !isApiConfigured()}
        >
          {pending ? t("sendWait") : t("send")}
        </button>
      </div>
    </>
  );

  if (variant === "embedded") {
    const fullHref =
      `/courses/${encodeURIComponent(courseId)}/chat` +
      (moduleId
        ? `?moduleId=${encodeURIComponent(moduleId)}`
        : "");
    return (
      <section className="flex min-h-0 flex-col">
        <div className="mb-4 flex items-start gap-3">
          <span className="text-3xl" aria-hidden>
            💬
          </span>
          <div>
            <h3 className="text-xl font-extrabold text-ds-black sm:text-2xl">
              {t("title")}
            </h3>
            <p className="student-module-kid-prose mt-2 text-ds-gray-dark-2">
              {t("lead")}
            </p>
            {moduleId ? (
              <p className="mt-2 text-sm font-medium text-ds-primary">
                {t("moduleContext")}
              </p>
            ) : null}
          </div>
        </div>
        <div className={chatShell}>{inner}</div>
        <Link
          href={fullHref}
          className="mt-4 inline-block text-center text-base font-semibold text-ds-primary underline sm:text-left"
        >
          {t("openFull")}
        </Link>
      </section>
    );
  }

  return (
    <div className="ds-container flex min-h-[70vh] flex-col py-10 lg:py-14">
      <Link
        href={`/courses/${encodeURIComponent(courseId)}`}
        className="ds-text-caption mb-4 text-ds-primary hover:underline"
      >
        ← {tm("backToCourse")}
      </Link>
      <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
      <p className="mt-2 ds-text-body text-ds-gray-text">{t("lead")}</p>
      {moduleId ? (
        <p className="mt-1 text-sm font-medium text-ds-primary">
          {t("moduleContext")}
        </p>
      ) : null}
      <div className={chatShell}>{inner}</div>
    </div>
  );
}
