"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, Upload, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  fetchModuleHomework,
  postModuleHomework,
  type ModuleHomeworkGetResponse,
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

type ModuleHomeworkPanelProps = {
  moduleId: string;
  /** Внутри модалки: без своего заголовка и без внешней «карточки» */
  embeddedInModal?: boolean;
};

export function ModuleHomeworkPanel({
  moduleId,
  embeddedInModal = false,
}: ModuleHomeworkPanelProps) {
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

  const shellClass = embeddedInModal
    ? "border-0 bg-transparent p-0 shadow-none ring-0"
    : "rounded-2xl border border-teal-200/55 bg-gradient-to-br from-teal-50/40 via-white to-sky-50/40 px-4 py-4 shadow-sm ring-1 ring-teal-100/50 sm:px-5 sm:py-5";

  if (loading || available === false) {
    if (loading) {
      return (
        <section className={shellClass}>
          <p className="text-sm text-slate-600">{t("loading")}</p>
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
    <section className={shellClass}>
      {!embeddedInModal && (
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 shadow-sm ring-1 ring-teal-200/60 sm:h-11 sm:w-11"
            aria-hidden
          >
            <ClipboardList
              className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]"
              strokeWidth={2}
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-tight tracking-tight text-slate-900 sm:text-lg">
              {t("title")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              {t("hint")}
            </p>
          </div>
        </div>
      )}

      {error && (
        <p
          className={`rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2 text-sm text-red-800 ${
            embeddedInModal ? "mt-0" : "mt-3"
          }`}
          role="alert"
        >
          {error}
        </p>
      )}

      {submission && (
        <div
          className={`rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3 shadow-sm sm:px-4 sm:py-3.5 ${
            embeddedInModal ? "mt-0" : "mt-3"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("currentTitle")}
          </p>
          {fileHref ? (
            <a
              href={fileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex text-sm font-semibold text-teal-700 underline decoration-teal-300 underline-offset-2 hover:text-teal-900"
            >
              {displayName ?? t("download")}
            </a>
          ) : (
            <span className="mt-1.5 block text-sm text-slate-600">
              {displayName ?? "—"}
            </span>
          )}
          <p className="mt-0.5 text-xs text-slate-500">
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
            <p className="student-module-kid-prose mt-2 text-sm text-slate-800">
              <span className="font-medium text-slate-500">
                {t("commentFromYou")}:{" "}
              </span>
              {submission.studentComment}
            </p>
          ) : null}
          {submission.points != null ? (
            <div className="mt-3 rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-3 py-2.5">
              <p className="text-sm font-bold text-emerald-950">
                {t("gradeTitle")}: {submission.points} /{" "}
                {submission.maxPoints ?? 100}
              </p>
              {submission.feedback ? (
                <p className="student-module-kid-prose mt-1.5 text-sm text-emerald-900/90">
                  {submission.feedback}
                </p>
              ) : null}
              {gradedAtFmt ? (
                <p className="mt-1.5 text-xs text-emerald-800/80">
                  {gradedAtFmt}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{t("notGraded")}</p>
          )}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-4 space-y-3"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
            {t("fileLabel")}
          </label>
          <input
            type="file"
            className="ds-input mt-1.5 block w-full rounded-xl border-slate-200/90 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-700"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 sm:text-sm">
            {t("commentLabel")}
          </label>
          <textarea
            className="ds-input mt-1.5 min-h-[4.5rem] w-full rounded-xl border-slate-200/90 py-2 text-sm leading-relaxed"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50 sm:w-auto"
          disabled={sending || !file}
        >
          <Upload className="h-4 w-4" strokeWidth={2} aria-hidden />
          {sending ? t("submitting") : submission ? t("replace") : t("submit")}
        </button>
      </form>
    </section>
  );
}

/** Карточка на странице урока + модальное окно с полной формой домашки */
export function ModuleHomeworkLessonBlock({ moduleId }: { moduleId: string }) {
  const t = useTranslations("StudentHomework");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<ModuleHomeworkGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const prevOpen = useRef(open);

  useEffect(() => {
    if (!isApiConfigured() || !moduleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchModuleHomework(moduleId)
      .then(setMeta)
      .catch(() =>
        setMeta({ submission: null, homeworkAvailable: false }),
      )
      .finally(() => setLoading(false));
  }, [moduleId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (prevOpen.current && !open && moduleId && isApiConfigured()) {
      fetchModuleHomework(moduleId).then(setMeta).catch(() => {});
    }
    prevOpen.current = open;
  }, [open, moduleId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-teal-200/50 bg-gradient-to-br from-teal-50/50 to-sky-50/30 px-4 py-4 shadow-sm ring-1 ring-teal-100/40 sm:px-5 sm:py-5">
        <p className="text-sm text-slate-600">{t("loading")}</p>
      </div>
    );
  }

  if (!meta?.homeworkAvailable) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/50 via-white to-sky-50/40 px-4 py-4 text-left shadow-sm ring-1 ring-teal-100/50 transition hover:border-teal-300/80 hover:shadow-md sm:px-5 sm:py-4"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 ring-1 ring-teal-200/60"
            aria-hidden
          >
            <ClipboardList className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 sm:text-base">
              {t("title")}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 sm:text-sm">
              {t("hint")}
            </p>
            {meta.submission ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                {t("statusSubmitted")}
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-amber-700">
                {t("statusPending")}
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white sm:text-sm">
            {t("openModal")}
          </span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-200 items-end justify-center p-4 pb-28 sm:items-center sm:pb-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[3px]"
            aria-label={tc("close")}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-homework-modal-title"
            className="relative z-[101] flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-br from-teal-50/60 via-white to-sky-50/30 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 ring-1 ring-teal-200/60"
                  aria-hidden
                >
                  <ClipboardList className="h-6 w-6" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2
                    id="student-homework-modal-title"
                    className="text-lg font-bold leading-tight text-slate-900 sm:text-xl"
                  >
                    {t("title")}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 sm:text-sm">
                    {t("hint")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setOpen(false)}
                aria-label={tc("close")}
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
              <ModuleHomeworkPanel moduleId={moduleId} embeddedInModal />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
