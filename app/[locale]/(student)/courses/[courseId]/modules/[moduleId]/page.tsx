"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import {
  fetchModuleContent,
  type ModuleContentItem,
} from "@/lib/api/student/modules";
import { CourseAiChat } from "@/components/student/course-ai-chat";
import { ModuleLessonStepsNav } from "@/components/student/module-lesson-steps-nav";
import { ModuleHomeworkLessonBlock } from "@/components/student/module-homework-panel";
import { ModuleFileAttachment } from "@/components/student/module-file-attachment";
import { ModuleVideoPlayer } from "@/components/student/module-video-player";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

function looksLikeVideoUrl(s: string): boolean {
  const x = s.trim().toLowerCase();
  if (!x) return false;
  if (/youtube\.com|youtu\.be/.test(x)) return true;
  return /\.(mp4|webm|ogg|m3u8)(\?|#|$)/i.test(s) || /\.m3u8/i.test(s);
}

function videoSourceRaw(item: ModuleContentItem): string | null {
  const c = (item.content ?? "").trim();
  const f = (item.fileUrl ?? "").trim();

  if (item.type === "video" && f) {
    return f;
  }
  if (f && (looksLikeVideoUrl(f) || f.startsWith("/api/v1/files/"))) {
    return f;
  }
  if (c && looksLikeVideoUrl(c)) {
    return c;
  }
  return f || c || null;
}

function shouldShowVideoPlayer(item: ModuleContentItem): boolean {
  const raw = videoSourceRaw(item);
  if (!raw) return false;
  if (item.type === "video") return true;
  return looksLikeVideoUrl(raw);
}

const kidProseHtml =
  "lesson-step-prose max-w-3xl [&_a]:font-semibold [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6";

export default function ModuleLessonPage() {
  const t = useTranslations("StudentModule");
  const tc = useTranslations("Common");
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const [content, setContent] = useState<ModuleContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured() || !moduleId) {
      setLoading(false);
      return;
    }
    fetchModuleContent(moduleId)
      .then(setContent)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [moduleId]);

  const sorted = useMemo(
    () =>
      [...content].sort(
        (a, b) => Number(a.order ?? 0) - Number(b.order ?? 0),
      ),
    [content],
  );
  const lessonTitle =
    sorted[0]?.title ?? t("lessonFallback", { id: moduleId });

  const stepNavItems = useMemo(
    () =>
      sorted.map((item, index) => ({
        id: String(item.id),
        step: index + 1,
        title: item.title ?? item.type ?? t("contentFallback"),
      })),
    [sorted, t],
  );

  useEffect(() => {
    if (loading || sorted.length === 0 || typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [loading, moduleId, content]);

  function renderItemBody(item: ModuleContentItem, rawVideo: string | null) {
    const showVideo = shouldShowVideoPlayer(item) && rawVideo;

    return (
      <>
        {showVideo ? (
          <div className="mt-5">
            <div className="student-module-kid-video-wrap bg-ds-black">
              <ModuleVideoPlayer src={rawVideo} />
            </div>
            {item.type === "video" &&
              typeof item.content === "string" &&
              item.content.trim() &&
              (!looksLikeVideoUrl(item.content.trim()) ||
                item.content.trim().startsWith("<")) && (
                <div className="mt-5">
                  {item.content.trim().startsWith("<") ? (
                    <div
                      className={`${kidProseHtml} text-slate-800`}
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  ) : (
                    <p className="lesson-step-prose max-w-3xl whitespace-pre-wrap text-slate-800">
                      {item.content}
                    </p>
                  )}
                </div>
              )}
            <details className="mt-4 rounded-2xl border border-ds-gray-border bg-ds-gray-light/40 px-4 py-3">
              <summary className="cursor-pointer text-base font-semibold text-ds-black">
                {t("videoTrouble")}
              </summary>
              <p className="mt-2 text-base leading-relaxed text-ds-gray-dark-2">
                {t("videoHelp")}{" "}
                <a
                  href={resolvePublicFileUrl(rawVideo) ?? rawVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ds-primary underline"
                >
                  {t("videoLink")}
                </a>
              </p>
            </details>
          </div>
        ) : null}

        {!showVideo && item.type === "file" && (
          <>
            {typeof item.content === "string" &&
              item.content.trim() &&
              (item.content.trim().startsWith("<") ? (
                <div
                  className={`${kidProseHtml} mt-5 text-slate-800`}
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              ) : (
                <p className="lesson-step-prose mt-5 max-w-3xl whitespace-pre-wrap text-slate-800">
                  {item.content}
                </p>
              ))}
            {item.fileUrl ? (
              <div className="mt-5">
                <ModuleFileAttachment fileUrl={item.fileUrl} />
              </div>
            ) : (
              <p className="mt-5 text-lg text-ds-gray-text">{t("fileMissing")}</p>
            )}
          </>
        )}

        {!showVideo &&
          (item.type === "text" || item.type == null) &&
          typeof item.content === "string" &&
          (item.content.trim().startsWith("<") ? (
            <div
              className={`${kidProseHtml} mt-5 text-slate-800`}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : (
            <p className="lesson-step-prose mt-5 max-w-3xl whitespace-pre-wrap text-slate-800">
              {item.content}
            </p>
          ))}

        {!showVideo &&
          item.type !== "file" &&
          Boolean(item.fileUrl) && (
            <a
              href={
                resolvePublicFileUrl(
                  String(item.fileUrl ?? item.content ?? ""),
                ) ?? String(item.fileUrl ?? item.content ?? "")
              }
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn ui-btn--1 student-module-kid-cta mt-5"
            >
              {t("downloadFile")}
            </a>
          )}

        {(item.type === "livestream" || item.livestreamUrl) && (
          <p className="lesson-step-prose mt-5 max-w-3xl text-slate-600">
            <span className="font-semibold text-ds-black">{t("livestream")}</span>{" "}
            {String(item.livestreamStartsAt ?? "—")}
            {item.livestreamUrl ? (
              <>
                {" · "}
                <span className="break-all text-ds-primary">
                  {String(item.livestreamUrl)}
                </span>
              </>
            ) : null}
          </p>
        )}

        {!showVideo &&
          (item.type === "link" ||
            (typeof item.content === "string" &&
              item.content.startsWith("http"))) && (
            <a
              href={String(item.content ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn ui-btn--6 student-module-kid-cta mt-5"
            >
              {t("openLink")}
            </a>
          )}
      </>
    );
  }

  const nextBlock = !loading && !error && (
    <div className="student-module-kid-next mt-12 space-y-5 px-4 py-6 sm:mt-14 sm:space-y-6 sm:px-6 sm:py-7">
      <h2 className="text-center text-base font-semibold tracking-tight text-slate-800 sm:text-lg">
        {t("nextTitle")}
      </h2>
      <div className="mx-auto mt-4 grid max-w-5xl gap-5 sm:gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <ModuleHomeworkLessonBlock moduleId={moduleId} />
        </div>
        <div className="min-w-0">
          <CourseAiChat
            courseId={courseId}
            moduleId={moduleId}
            variant="embedded"
          />
        </div>
      </div>
      <div className="flex justify-center pt-1">
        <Link
          href={`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/quiz`}
          className="ui-btn ui-btn--1 student-module-kid-cta w-full max-w-md sm:w-auto"
        >
          {t("quiz")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="student-module-kid-page min-h-screen pb-16 pt-5 sm:pb-20 sm:pt-8">
      <div className="ds-container max-w-6xl">
        <div className="mx-auto max-w-3xl">
        <Link
          href={`/courses/${encodeURIComponent(courseId)}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {t("backToCourse")}
        </Link>

        <header className="student-module-kid-hero px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex items-start gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 ring-1 ring-teal-600/15"
              aria-hidden
            >
              <BookOpen className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.65rem]">
                {lessonTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 sm:text-base">
                {t("lessonHint")}
              </p>
            </div>
          </div>
        </header>

        {!loading && !error && stepNavItems.length > 1 && (
          <ModuleLessonStepsNav items={stepNavItems} />
        )}

        {loading && (
          <p className="mt-8 text-lg text-ds-gray-text">{tc("loading")}</p>
        )}
        {error && (
          <p
            className="mt-6 rounded-2xl border-2 border-ds-error/30 bg-red-50 px-4 py-3 text-base text-ds-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {!loading && sorted.length > 0 && (
          <ol className="mt-6 list-none divide-y divide-slate-200/80 p-0 sm:mt-8">
            {sorted.map((item, index) => {
              const rawVideo = videoSourceRaw(item);
              const step = index + 1;
              const blockTitle =
                item.title ?? item.type ?? t("contentFallback");
              return (
                <li
                  key={item.id}
                  id={`content-${item.id}`}
                  className="scroll-mt-36 py-10 first:pt-8 sm:scroll-mt-40 sm:py-12 sm:first:pt-10"
                >
                  <article>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-teal-700/85">
                      {t("stepLabel", { n: step })}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold leading-snug text-slate-900 sm:text-[1.35rem]">
                      {blockTitle}
                    </h2>
                    <div className="mt-5">{renderItemBody(item, rawVideo)}</div>
                  </article>
                </li>
              );
            })}
          </ol>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm sm:p-8">
            <p className="text-lg font-semibold text-slate-900">
              {t("contentEmpty")}
            </p>
            <p className="lesson-step-prose mt-3 text-slate-600">
              {t("emptyHint")}
            </p>
          </div>
        )}
        </div>

        {nextBlock}
      </div>
    </div>
  );
}
