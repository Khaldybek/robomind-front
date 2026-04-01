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
      <h1 className="ds-text-h1 mb-8 text-ds-black">{t("title")}</h1>
      {loading && (
        <p className="ds-text-body text-ds-gray-text">{tc("loading")}</p>
      )}
      {error && (
        <p className="ds-text-small text-ds-error mb-6" role="alert">
          {error}
          {t("endpointHint")}
        </p>
      )}
      <ul className="space-y-8">
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
            <li key={id} className="ds-block-section">
              <div className="mb-2 flex justify-between">
                <Link
                  href={`/courses/${encodeURIComponent(id)}`}
                  className="ds-text-subtitle text-ds-primary hover:underline"
                >
                  {p.courseName ?? t("courseFallback", { id })}
                </Link>
                <span className="ds-text-body font-medium">{pct}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-ds-gray-mid">
                <div
                  className="h-full rounded-full bg-ds-primary"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <pre className="ds-text-caption mt-4 max-h-32 overflow-auto text-ds-gray-text">
                {JSON.stringify(p, null, 2)}
              </pre>
            </li>
          );
        })}
      </ul>
      {!loading && !error && items.length === 0 && (
        <p className="ds-text-body text-ds-gray-text">{t("empty")}</p>
      )}
    </div>
  );
}
