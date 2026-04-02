"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, ExternalLink, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { AiChatScrollArea } from "@/components/student/course-ai-chat";
import { useStudentAiChat } from "@/components/student/use-student-ai-chat";

function parseCourseId(pathname: string | null): string | null {
  if (!pathname) return null;
  const m = pathname.match(/\/courses\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function parseModuleId(pathname: string | null): string | null {
  if (!pathname) return null;
  const m = pathname.match(/\/courses\/[^/]+\/modules\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function StudentAiAssistantFab() {
  const pathname = usePathname();
  const t = useTranslations("StudentAiChat");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);

  const courseId = useMemo(() => parseCourseId(pathname), [pathname]);
  const moduleId = useMemo(() => parseModuleId(pathname), [pathname]);

  const isFullChatPage = useMemo(
    () => Boolean(pathname && /\/courses\/[^/]+\/chat$/.test(pathname)),
    [pathname],
  );

  const chat = useStudentAiChat({ moduleId: moduleId ?? undefined, courseId });

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const fullChatHref =
    courseId != null
      ? `/courses/${encodeURIComponent(courseId)}/chat` +
        (moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : "")
      : null;

  if (isFullChatPage) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-200 items-end justify-center p-4 pb-28 sm:items-center sm:pb-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[3px] transition-opacity"
            aria-label={tc("close")}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-ai-assistant-title"
            className="relative z-[101] flex max-h-[min(88vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35),0_0_0_1px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 sm:max-h-[min(82vh,720px)]"
          >
            <div className="relative shrink-0 overflow-hidden border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-violet-50/50 px-4 py-4 sm:px-5 sm:py-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-ds-primary/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-6 left-1/4 h-24 w-24 rounded-full bg-violet-300/20 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-primary to-red-600 text-white shadow-lg shadow-ds-primary/30">
                  <Bot className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ds-primary/90">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    <span>{t("modalBadge")}</span>
                  </div>
                  <h2
                    id="student-ai-assistant-title"
                    className="mt-1 text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl"
                  >
                    {t("title")}
                  </h2>
                  <p className="mt-1.5 text-sm leading-snug text-slate-600">
                    {t("lead")}
                  </p>
                  {moduleId ? (
                    <p className="mt-2 inline-flex items-center rounded-full bg-ds-primary/10 px-2.5 py-1 text-xs font-medium text-ds-primary">
                      {t("moduleContext")}
                    </p>
                  ) : null}
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
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-slate-50/50 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
              <AiChatScrollArea appearance="modal" {...chat} />
            </div>
            {fullChatHref ? (
              <div className="shrink-0 border-t border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm">
                <Link
                  href={fullChatHref}
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-ds-primary/40 hover:bg-white hover:text-ds-primary sm:justify-start"
                  onClick={() => setOpen(false)}
                >
                  <span>{t("openFull")}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-[102] flex h-14 w-14 items-center justify-center rounded-full bg-ds-primary text-white shadow-lg shadow-ds-primary/35 transition-transform hover:scale-105 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary active:scale-95 ${
          open ? "ring-2 ring-white/80" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("fabLabel")}
      >
        <Bot className="h-7 w-7" strokeWidth={1.75} aria-hidden />
      </button>
    </>
  );
}
