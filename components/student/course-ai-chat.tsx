"use client";

import { Bot, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isApiConfigured } from "@/lib/env";
import {
  useStudentAiChat,
  type StudentAiChatMessage,
} from "@/components/student/use-student-ai-chat";

export type AiChatAppearance = "embedded" | "page" | "modal";

export function AiChatScrollArea({
  appearance,
  messages,
  input,
  setInput,
  send,
  pending,
  error,
}: {
  appearance: AiChatAppearance;
  messages: StudentAiChatMessage[];
  input: string;
  setInput: (v: string) => void;
  send: () => void | Promise<void>;
  pending: boolean;
  error: string | null;
}) {
  const t = useTranslations("StudentAiChat");
  const tc = useTranslations("Common");

  const chatShell =
    appearance === "embedded"
      ? "flex min-h-[min(18rem,38vh)] max-h-[min(26rem,48vh)] flex-col overflow-hidden rounded-2xl border border-sky-200/60 bg-white/95 shadow-sm ring-1 ring-sky-100/50"
      : appearance === "modal"
        ? "flex min-h-[min(18rem,36vh)] max-h-[min(30rem,54vh)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/95 via-white to-slate-50/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]"
        : "mt-6 flex min-h-[min(60vh,720px)] flex-1 flex-col overflow-hidden rounded-ds-section border border-ds-gray-border bg-ds-white";

  const textStyle =
    appearance === "embedded"
      ? "student-module-kid-prose text-ds-gray-dark-2"
      : appearance === "modal"
        ? "text-sm leading-relaxed text-slate-600"
        : "ds-text-body text-ds-gray-text";

  const bubbleStyle =
    appearance === "embedded"
      ? "text-base leading-relaxed"
      : appearance === "modal"
        ? "text-[15px] leading-relaxed"
        : "ds-text-body";

  const errStyle =
    appearance === "embedded" ? "text-sm" : "ds-text-small";

  const inputClass =
    appearance === "embedded"
      ? "ds-input min-h-[48px] flex-1 text-base"
      : appearance === "modal"
        ? "min-h-[48px] flex-1 rounded-2xl border-0 bg-white/95 px-4 text-[15px] text-slate-900 shadow-inner ring-1 ring-slate-200/80 transition-shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ds-primary/35"
        : "ds-input flex-1";

  const btnClass =
    appearance === "embedded" || appearance === "page"
      ? appearance === "embedded"
        ? "ui-btn ui-btn--1 student-module-kid-cta shrink-0"
        : "ui-btn ui-btn--1 shrink-0"
      : "";

  if (appearance === "modal") {
    return (
      <div className={chatShell}>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.35) 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
            aria-hidden
          />
          <div className="relative space-y-4">
            {!isApiConfigured() ? (
              <p className="text-center text-sm text-slate-600">
                {tc("apiEnvMissing")}
              </p>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-2 py-6 text-center sm:py-8">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-primary/15 to-violet-200/40 text-ds-primary shadow-sm ring-1 ring-white/80">
                  <Sparkles className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                </span>
                <p className="max-w-[28ch] text-sm leading-relaxed text-slate-600">
                  {t("empty")}
                </p>
              </div>
            ) : null}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-1 ${
                  msg.role === "user" ? "items-end pl-8" : "items-start pr-8"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {msg.role === "user" ? t("bubbleYou") : t("bubbleAssistant")}
                </span>
                <div
                  className={`max-w-[95%] rounded-2xl px-4 py-2.5 shadow-sm ${bubbleStyle} ${
                    msg.role === "user"
                      ? "rounded-br-md bg-ds-primary text-white shadow-md shadow-ds-primary/25"
                      : "rounded-bl-md border border-slate-200/90 bg-white/95 text-slate-900 ring-1 ring-slate-100"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <span className="inline-flex items-start gap-2">
                      <Bot
                        className="mt-0.5 h-4 w-4 shrink-0 text-ds-primary/90"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <span>{msg.text}</span>
                    </span>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {error && (
          <p className="px-4 pb-2 text-center text-sm text-red-600">{error}</p>
        )}
        <div className="flex shrink-0 gap-2 border-t border-slate-200/80 bg-white/70 p-3 backdrop-blur-sm sm:p-4">
          <input
            className={inputClass}
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
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ds-primary text-white shadow-md shadow-ds-primary/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            disabled={pending || !isApiConfigured()}
            aria-label={pending ? t("sendWait") : t("send")}
          >
            {pending ? (
              <Loader2
                className="h-5 w-5 animate-spin"
                strokeWidth={2}
                aria-hidden
              />
            ) : (
              <Send className="h-5 w-5" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={chatShell}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {!isApiConfigured() ? (
          <p className="student-module-kid-prose text-ds-gray-text">
            {tc("apiEnvMissing")}
          </p>
        ) : messages.length === 0 ? (
          <p className={textStyle}>{t("empty")}</p>
        ) : null}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-2xl px-4 py-3 ${bubbleStyle} ${
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
        <p className={`px-4 text-ds-error ${errStyle}`}>{error}</p>
      )}
      <div className="flex shrink-0 gap-2 border-t border-ds-gray-border p-3 sm:p-4">
        <input
          className={inputClass}
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
          className={btnClass}
          disabled={pending || !isApiConfigured()}
        >
          {pending ? t("sendWait") : t("send")}
        </button>
      </div>
    </div>
  );
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
  const tm = useTranslations("StudentModule");
  const chat = useStudentAiChat({ moduleId, courseId });

  const appearance: AiChatAppearance = variant;

  if (variant === "embedded") {
    const fullHref =
      `/courses/${encodeURIComponent(courseId)}/chat` +
      (moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : "");
    return (
      <section className="flex min-h-0 flex-col">
        <div className="mb-3 flex items-start gap-2.5 sm:gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 ring-1 ring-sky-200/60 sm:h-11 sm:w-11"
            aria-hidden
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
              {t("title")}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              {t("lead")}
            </p>
            {moduleId ? (
              <p className="mt-1.5 inline-flex rounded-full bg-sky-100/90 px-2 py-0.5 text-[11px] font-medium text-sky-900">
                {t("moduleContext")}
              </p>
            ) : null}
          </div>
        </div>
        <AiChatScrollArea appearance="embedded" {...chat} />
        <Link
          href={fullHref}
          className="mt-3 inline-block text-center text-sm font-semibold text-teal-700 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 sm:text-left"
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
      <AiChatScrollArea appearance="page" {...chat} />
    </div>
  );
}
