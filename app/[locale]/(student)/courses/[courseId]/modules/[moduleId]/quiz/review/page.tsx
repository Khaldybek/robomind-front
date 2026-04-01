"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  loadQuizReview,
  type QuizReviewPayload,
} from "@/lib/quiz-session";

function formatWhen(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export default function QuizReviewPage() {
  const t = useTranslations("StudentQuizReview");
  const locale = useLocale();
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const [data, setData] = useState<QuizReviewPayload | null>(null);

  useEffect(() => {
    setData(loadQuizReview());
  }, []);

  const result = data?.result;
  const score = result?.score;
  const maxScore = result?.maxScore;
  const percent =
    typeof result?.percent === "number"
      ? result.percent
      : score != null && maxScore != null && maxScore > 0
        ? Math.round((score / maxScore) * 100)
        : null;
  const passed = Boolean(result?.isPassed);
  const passing = result?.passingScore;

  const lessonHref = `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`;
  const courseHref = `/courses/${encodeURIComponent(courseId)}`;

  const passingDisplay =
    passing != null ? `${passing}%` : "—";

  return (
    <div className="ds-container py-10 lg:py-14">
      <Link
        href={lessonHref}
        className="ds-text-caption mb-6 inline-block text-ds-primary hover:underline"
      >
        ← {t("backToLesson")}
      </Link>

      <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>

      {!data && (
        <p className="ds-text-body mt-6 text-ds-gray-text">
          {t("noSession")}
        </p>
      )}

      {data && !result && (
        <p className="ds-text-body mt-6 text-ds-gray-text">
          {t("noResult")}
        </p>
      )}

      {data && result && (
        <div className="mt-8 space-y-6">
          <div
            className={`rounded-ds-card border p-6 sm:p-8 ${
              passed
                ? "border-emerald-500/40 bg-emerald-50/50"
                : "border-ds-gray-border bg-ds-white"
            }`}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className={`ds-text-subtitle font-semibold ${
                    passed ? "text-emerald-800" : "text-ds-black"
                  }`}
                >
                  {passed ? t("passed") : t("failed")}
                </p>
                <p className="ds-text-caption mt-2 text-ds-gray-text">
                  {t("passingScore", { value: passingDisplay })}
                </p>
              </div>
              {percent != null && (
                <div
                  className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-4 border-ds-gray-border bg-ds-white sm:h-32 sm:w-32"
                  style={{
                    borderColor:
                      passed
                        ? "rgb(16 185 129 / 0.6)"
                        : "var(--ds-gray-border, #c2c2c2)",
                  }}
                >
                  <span className="ds-text-h2 text-ds-black">{percent}%</span>
                  <span className="ds-text-caption text-ds-gray-text">
                    {t("percentCaption")}
                  </span>
                </div>
              )}
            </div>

            {percent != null && (
              <div
                className="mt-6 h-3 w-full overflow-hidden rounded-full bg-ds-gray-mid"
                role="progressbar"
                aria-valuenow={clamp(percent, 0, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-[width] ${
                    passed ? "bg-emerald-500" : "bg-ds-primary"
                  }`}
                  style={{ width: `${clamp(percent, 0, 100)}%` }}
                />
              </div>
            )}

            <dl className="mt-6 grid gap-3 border-t border-ds-gray-border pt-6 sm:grid-cols-2">
              <div>
                <dt className="ds-text-caption text-ds-gray-text">
                  {t("points")}
                </dt>
                <dd className="ds-text-body font-medium text-ds-black">
                  {score != null && maxScore != null
                    ? t("pointsValue", {
                        score: String(score),
                        max: String(maxScore),
                      })
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="ds-text-caption text-ds-gray-text">
                  {t("completed")}
                </dt>
                <dd className="ds-text-body text-ds-black">
                  {formatWhen(result.completedAt, locale)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={lessonHref} className="ui-btn ui-btn--1">
              {t("ctaLesson")}
            </Link>
            <Link href={courseHref} className="ui-btn ui-btn--6">
              {t("ctaCourse")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
