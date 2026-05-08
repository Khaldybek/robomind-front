"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  fetchUserProgress,
  type ProgressEntry,
} from "@/lib/api/student/user";
import { isApiConfigured } from "@/lib/env";

export default function ProgressPage() {
  const t = useTranslations("StudentProgress");
  const tc = useTranslations("Common");
  const [items, setItems] = useState<ProgressEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      setLoading(false);
      return;
    }
    fetchUserProgress()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tc]);

  return (
    <div className="ds-container py-10 lg:py-14">
      <header className="mb-8 rounded-3xl border border-sky-200/55 bg-white/90 px-5 py-5 shadow-sm sm:px-7">
        <h1 className="text-balance text-2xl font-bold text-slate-900 sm:text-3xl">
          {t("title")}
        </h1>
      </header>
      {loading && (
        <p className="text-base text-slate-600">{tc("loading")}</p>
      )}
      {error && (
        <p className="mb-6 text-sm text-rose-600" role="alert">
          {error}
          {t("endpointHint")}
        </p>
      )}
      <ul className="space-y-6">
        {items.map((p, i) => {
          const id = String(p.courseId ?? i);
          const pct =
            typeof p.percent === "number"
              ? p.percent
              : p.totalModules && p.completedModules != null
                ? Math.round(
                    (Number(p.completedModules) / Number(p.totalModules)) * 100,
                  )
                : 0;
          return (
            <li
              key={id}
              className="student-surface-panel rounded-2xl p-5 sm:p-6"
            >
              <div className="mb-2 flex justify-between gap-3">
                <Link
                  href={`/courses/${encodeURIComponent(id)}`}
                  className="text-base font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                >
                  {p.courseName ?? t("courseFallback", { id })}
                </Link>
                <span className="text-base font-bold tabular-nums text-slate-800">
                  {pct}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <pre className="mt-4 max-h-32 overflow-auto rounded-xl border border-sky-100/80 bg-sky-50/50 p-3 text-xs text-slate-600">
                {JSON.stringify(p, null, 2)}
              </pre>
            </li>
          );
        })}
      </ul>
      {!loading && !error && items.length === 0 && (
        <p className="text-base text-slate-600">{t("empty")}</p>
      )}
    </div>
  );
}
