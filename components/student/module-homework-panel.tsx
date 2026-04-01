"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  fetchModuleHomework,
  postModuleHomework,
  type ModuleHomeworkSubmission,
} from "@/lib/api/student/homework";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

function formatSize(
  n: number | undefined,
  unitB: string,
  unitKB: string,
  unitMB: string,
): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} ${unitB}`;
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} ${unitKB}`;
  }
  return `${(n / (1024 * 1024)).toFixed(1)} ${unitMB}`;
}

export function ModuleHomeworkPanel({ moduleId }: { moduleId: string }) {
  const t = useTranslations("StudentHomework");
  const locale = useLocale();
  const [submission, setSubmission] = useState<ModuleHomeworkSubmission | null>(
    null,
  );
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    if (!isApiConfigured() || !moduleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchModuleHomework(moduleId)
      .then((r) => {
        setSubmission(r.submission);
        setAvailable(r.homeworkAvailable);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(t("errPickFile"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const r = await postModuleHomework(moduleId, file, comment);
      setSubmission(r.submission);
      setAvailable(true);
      setFile(null);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errUpload"));
    } finally {
      setSending(false);
    }
  }

  if (loading || available === false) {
    if (loading) {
      return (
        <section className="rounded-[var(--ds-radius-mobile-block)] border-2 border-ds-primary/20 bg-white/90 px-5 py-6 shadow-sm">
          <p className="text-lg text-ds-gray-text">{t("loading")}</p>
        </section>
      );
    }
    return null;
  }

  const fileHref = submission?.fileUrl
    ? resolvePublicFileUrl(submission.fileUrl) ?? submission.fileUrl
    : null;
  const displayName =
    submission?.originalFileName ??
    submission?.fileName ??
    (submission?.fileUrl ? submission.fileUrl.split("/").pop() : null);

  const gradedAtFmt = submission?.gradedAt
    ? (() => {
        try {
          const d = new Date(submission.gradedAt);
          if (Number.isNaN(d.getTime())) return submission.gradedAt;
          return new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(d);
        } catch {
          return submission.gradedAt;
        }
      })()
    : null;

  return (
    <section className="rounded-[var(--ds-radius-mobile-block)] border-2 border-ds-primary/25 bg-gradient-to-br from-white to-ds-gray-light/50 px-5 py-6 shadow-md sm:px-7 sm:py-8">
      <div className="flex items-start gap-3">
        <span className="text-3xl" aria-hidden>
          📝
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-ds-black sm:text-2xl">
            {t("title")}
          </h2>
          <p className="student-module-kid-prose mt-2 text-ds-gray-dark-2">
            {t("hint")}
          </p>
        </div>
      </div>

      {error && (
        <p
          className="mt-4 rounded-2xl border-2 border-ds-error/25 bg-red-50 px-4 py-3 text-base text-ds-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {submission && (
        <div className="mt-6 rounded-2xl border-2 border-ds-gray-border bg-white px-4 py-5 sm:px-5">
          <p className="text-base font-bold text-ds-black">{t("currentTitle")}</p>
          {fileHref ? (
            <a
              href={fileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-lg font-semibold text-ds-primary underline"
            >
              {displayName ?? t("download")}
            </a>
          ) : (
            <span className="mt-2 block text-lg text-ds-gray-text">
              {displayName ?? "—"}
            </span>
          )}
          <p className="mt-1 text-base text-ds-gray-text">
            {submission.mimeType ?? ""}
            {submission.sizeBytes !== undefined
              ? ` · ${formatSize(
                  submission.sizeBytes,
                  t("sizeB"),
                  t("sizeKB"),
                  t("sizeMB"),
                )}`
              : ""}
          </p>
          {submission.studentComment ? (
            <p className="student-module-kid-prose mt-4 text-ds-black">
              <span className="font-semibold text-ds-gray-text">
                {t("commentFromYou")}:{" "}
              </span>
              {submission.studentComment}
            </p>
          ) : null}
          {submission.points != null ? (
            <div className="mt-5 rounded-2xl bg-ds-gray-light/90 px-4 py-4">
              <p className="text-lg font-bold text-ds-black">
                {t("gradeTitle")}: {submission.points} /{" "}
                {submission.maxPoints ?? 100}
              </p>
              {submission.feedback ? (
                <p className="student-module-kid-prose mt-2 text-ds-gray-dark-2">
                  {submission.feedback}
                </p>
              ) : null}
              {gradedAtFmt ? (
                <p className="mt-2 text-sm text-ds-gray-text">{gradedAtFmt}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-lg text-ds-gray-text">{t("notGraded")}</p>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block text-base font-bold text-ds-black">
            {t("fileLabel")}
          </label>
          <input
            type="file"
            className="ds-input mt-2 block w-full py-3 text-base file:mr-4 file:rounded-xl file:border-0 file:bg-ds-primary file:px-4 file:py-3 file:text-sm file:font-bold file:text-white"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="block text-base font-bold text-ds-black">
            {t("commentLabel")}
          </label>
          <textarea
            className="ds-input mt-2 min-h-[100px] w-full text-lg"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
          />
        </div>
        <button
          type="submit"
          className="ui-btn ui-btn--1 student-module-kid-cta w-full sm:w-auto"
          disabled={sending || !file}
        >
          {sending ? t("submitting") : submission ? t("replace") : t("submit")}
        </button>
      </form>
    </section>
  );
}
