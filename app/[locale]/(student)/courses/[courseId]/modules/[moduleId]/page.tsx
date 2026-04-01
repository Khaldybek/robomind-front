"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  fetchModuleContent,
  type ModuleContentItem,
} from "@/lib/api/student/modules";
import { CourseAiChat } from "@/components/student/course-ai-chat";
import { ModuleHomeworkPanel } from "@/components/student/module-homework-panel";
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
  "student-module-kid-prose max-w-none [&_a]:font-semibold [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6";

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

  const sorted = [...content].sort(
    (a, b) => Number(a.order ?? 0) - Number(b.order ?? 0),
  );
  const lessonTitle =
    sorted[0]?.title ?? t("lessonFallback", { id: moduleId });

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
                      className={`${kidProseHtml} text-ds-black`}
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  ) : (
                    <p className="student-module-kid-prose whitespace-pre-wrap text-ds-black">
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
                  className={`${kidProseHtml} mt-5 text-ds-black`}
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              ) : (
                <p className="student-module-kid-prose mt-5 whitespace-pre-wrap text-ds-black">
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
              className={`${kidProseHtml} mt-5 text-ds-black`}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : (
            <p className="student-module-kid-prose mt-5 whitespace-pre-wrap text-ds-black">
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
          <p className="student-module-kid-prose mt-5 text-ds-gray-dark-2">
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
    <div className="student-module-kid-next mt-10 space-y-8 px-4 py-8 sm:px-8">
      <h2 className="text-center text-xl font-bold text-ds-black sm:text-2xl">
        {t("nextTitle")}
      </h2>
      <div className="mx-auto mt-6 grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <ModuleHomeworkPanel moduleId={moduleId} />
        </div>
        <div className="min-w-0">
          <CourseAiChat
            courseId={courseId}
            moduleId={moduleId}
            variant="embedded"
          />
        </div>
      </div>
      <div className="flex justify-center">
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
    <div className="student-module-kid-page min-h-screen pb-16 pt-6 sm:pb-20 sm:pt-10">
      <div className="ds-container max-w-6xl">
        <Link
          href={`/courses/${encodeURIComponent(courseId)}`}
          className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-ds-gray-border bg-white/90 px-4 py-2.5 text-base font-semibold text-ds-primary shadow-sm transition-colors hover:border-ds-primary/40 hover:bg-white"
        >
          <span aria-hidden>←</span>
          {t("backToCourse")}
        </Link>

        <header className="student-module-kid-hero px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-3xl sm:text-4xl" aria-hidden>
            🤖
          </p>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-ds-black sm:text-3xl">
            {lessonTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ds-gray-dark-2 sm:text-xl">
            {t("lessonHint")}
          </p>
        </header>

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
          <ol className="mt-10 list-none space-y-8 p-0">
            {sorted.map((item, index) => {
              const rawVideo = videoSourceRaw(item);
              const step = index + 1;
              const blockTitle =
                item.title ?? item.type ?? t("contentFallback");
              return (
                <li key={item.id}>
                  <div className="student-module-kid-step-card p-5 sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                      <div className="flex items-center gap-4 sm:block sm:text-center">
                        <div
                          className="student-module-kid-step-num"
                          aria-label={t("stepLabel", { n: step })}
                        >
                          {step}
                        </div>
                        <p className="text-sm font-bold uppercase tracking-wide text-ds-primary sm:hidden">
                          {t("stepLabel", { n: step })}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-2 hidden text-sm font-bold uppercase tracking-wide text-ds-primary sm:block">
                          {t("stepLabel", { n: step })}
                        </p>
                        <h2 className="text-xl font-bold leading-snug text-ds-black sm:text-2xl">
                          {blockTitle}
                        </h2>
                        {renderItemBody(item, rawVideo)}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="student-module-kid-step-card mt-10 p-6 sm:p-8">
            <p className="text-xl font-semibold text-ds-black">
              {t("contentEmpty")}
            </p>
            <p className="student-module-kid-prose mt-3 text-ds-gray-dark-2">
              {t("emptyHint")}
            </p>
          </div>
        )}

        {nextBlock}
      </div>
    </div>
  );
}
