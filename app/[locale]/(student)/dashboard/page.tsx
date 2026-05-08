"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchCourses } from "@/lib/api/student/courses";
import { fetchAiRecommendations } from "@/lib/api/student/ai";
import {
  fetchUserDashboard,
  fetchUserProgress,
  type ProgressEntry,
} from "@/lib/api/student/user";
import {
  fetchGamificationLeaderboard,
  fetchGamificationMe,
  fetchGamificationMyRank,
  type GamificationMe,
  type GamificationMyRank,
  type LeaderboardEntry,
} from "@/lib/api/student/gamification";
import type { CourseSummary } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";
import { AiRecommendationsContent } from "@/components/student/ai-recommendations-content";

function progressPercent(entry: ProgressEntry): number {
  if (typeof entry.percent === "number") return Math.min(100, entry.percent);
  const t = entry.totalModules;
  const c = entry.completedModules;
  if (typeof t === "number" && t > 0 && typeof c === "number") {
    return Math.round((c / t) * 100);
  }
  return 0;
}

export default function DashboardPage() {
  const t = useTranslations("StudentDashboard");
  const tc = useTranslations("Common");
  const { user, profileLoading } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [aiBlock, setAiBlock] = useState<unknown>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [gamification, setGamification] = useState<GamificationMe | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rankGlobal, setRankGlobal] = useState<GamificationMyRank | null>(null);
  const [rankSchool, setRankSchool] = useState<GamificationMyRank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoadErr(tc("apiEnvMissing"));
      setLoading(false);
      return;
    }
    Promise.all([
      fetchUserDashboard().catch(() => null),
      fetchCourses().catch(() => [] as CourseSummary[]),
      fetchUserProgress().catch(() => [] as ProgressEntry[]),
      fetchGamificationMe().catch(() => null),
    ])
      .then(([dashboard, fallbackCourses, fallbackProgress, g]) => {
        const dash = dashboard as Record<string, unknown> | null;

        const dashboardCourses = Array.isArray(dash?.courses)
          ? (dash.courses as CourseSummary[])
          : null;
        const dashboardProgress = Array.isArray(dash?.progress)
          ? (dash.progress as ProgressEntry[])
          : null;

        setCourses(dashboardCourses ?? fallbackCourses);
        setProgress(dashboardProgress ?? fallbackProgress);
        setGamification(g);
      })
      .catch((e: Error) => setLoadErr(e.message))
      .finally(() => setLoading(false));

    fetchAiRecommendations()
      .then(setAiBlock)
      .catch(() => setAiError(t("aiUnavailable")));
  }, []);

  useEffect(() => {
    if (!isApiConfigured()) return;
    const schoolId = user?.schoolId ? String(user.schoolId) : undefined;
    Promise.all([
      fetchGamificationMyRank().catch(() => null),
      schoolId
        ? fetchGamificationMyRank(schoolId).catch(() => null)
        : Promise.resolve(null),
      fetchGamificationLeaderboard({ limit: 5, schoolId }).catch(
        () => [] as LeaderboardEntry[],
      ),
    ]).then(([rg, rs, lb]) => {
      setRankGlobal(rg);
      setRankSchool(rs);
      setLeaderboard(lb);
    });
  }, [user?.schoolId]);

  const name =
    user &&
    (user.firstName || user.lastName
      ? [user.firstName, user.lastName].filter(Boolean).join(" ")
      : null);

  const progressByCourse = new Map(
    progress.map((p) => [String(p.courseId ?? ""), p]),
  );
  const avgProgress =
    progress.length > 0
      ? Math.round(
          progress.reduce((sum, p) => sum + progressPercent(p), 0) /
            progress.length,
        )
      : 0;

  const levelBarPct = (() => {
    const p = gamification?.levelProgressPercent;
    if (typeof p === "number" && p >= 0 && p <= 100) return p;
    const need = gamification?.xpNeededForNextLevel;
    const cur = gamification?.xpInCurrentLevel;
    if (
      typeof need === "number" &&
      need > 0 &&
      typeof cur === "number" &&
      cur >= 0
    ) {
      return Math.min(100, Math.round((cur / need) * 100));
    }
    return undefined;
  })();

  const showGamification = gamification != null;

  function leaderboardName(row: LeaderboardEntry): string {
    const fn = row.firstName ?? (row as { first_name?: string }).first_name;
    const ln = row.lastName ?? (row as { last_name?: string }).last_name;
    const combined = [fn, ln].filter(Boolean).join(" ").trim();
    if (combined) return combined;
    const full =
      row.fullName ??
      (row as { full_name?: string }).full_name ??
      row.name ??
      row.email;
    if (typeof full === "string" && full.trim()) return full;
    return t("studentFallback");
  }

  return (
    <div className="ds-container py-8 lg:py-12">
      <header className="mb-8 rounded-3xl border border-sky-200/60 bg-gradient-to-br from-white/95 via-sky-50/40 to-amber-50/35 px-5 py-6 shadow-[0_16px_48px_-28px_rgba(14,116,144,0.18)] sm:px-8 sm:py-8 lg:mb-10">
        <p className="text-xs font-bold uppercase tracking-wider text-sky-600">
          {t("mainEyebrow")}
        </p>
        <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          {profileLoading
            ? t("greetingLoading")
            : name
              ? t("greetingNamed", { name })
              : t("greetingWelcome")}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-slate-600">
          {t("lead")}
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          tone="sky"
          label={t("metricCourses")}
          value={loading ? t("metricEllipsis") : String(courses.length)}
        />
        <MetricCard
          tone="amber"
          label={t("metricAvgProgress")}
          value={loading ? t("metricEllipsis") : `${avgProgress}%`}
        />
        <MetricCard
          tone="violet"
          label={t("metricAi")}
          value={aiBlock != null ? t("metricYes") : t("metricDash")}
          accent={aiBlock != null}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-8 lg:col-span-2">
          <section className="student-surface-panel rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-sky-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                {t("coursesTitle")}
              </h2>
              <Link
                href="/courses"
                className="text-sm font-semibold text-sky-700 transition hover:text-sky-900 hover:underline"
              >
                {t("allCoursesLink")}
              </Link>
            </div>
            {loadErr && (
              <p className="mt-4 text-sm text-rose-600" role="alert">
                {loadErr}
              </p>
            )}
            {loading && (
              <p className="mt-6 text-base text-slate-600">{tc("loading")}</p>
            )}
            {!loading && !loadErr && courses.length === 0 && (
              <p className="mt-6 text-base text-slate-600">{t("coursesEmpty")}</p>
            )}
            <ul className="mt-4 space-y-3">
              {courses.map((c) => {
                const id = String(c.id);
                const pr = progressByCourse.get(id);
                const pct = pr ? progressPercent(pr) : 0;
                return (
                  <li key={id}>
                    <Link
                      href={`/courses/${encodeURIComponent(id)}`}
                      className="block rounded-2xl border border-sky-100/90 bg-gradient-to-r from-sky-50/80 to-white p-4 shadow-sm transition hover:border-amber-200 hover:from-amber-50/50 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="text-base font-semibold text-slate-900">
                          {c.title ??
                            c.name ??
                            t("courseFallback", { id: `${id.slice(0, 8)}…` })}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-sky-700">
                          {pct}%
                        </span>
                      </div>
                      <div
                        className="mt-3 h-2.5 overflow-hidden rounded-full bg-sky-100"
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="student-surface-panel rounded-3xl p-5 sm:p-6">
            <h2 className="border-b border-sky-100 pb-4 text-lg font-bold text-slate-900 sm:text-xl">
              {t("recommendationsTitle")}
            </h2>
            <div className="mt-4">
              {aiError && (
                <p className="text-base text-slate-600">{aiError}</p>
              )}
              {!aiError && !loading && aiBlock == null && (
                <p className="text-base text-slate-600">{t("noData")}</p>
              )}
              {!aiError && aiBlock != null && (
                <AiRecommendationsContent data={aiBlock} />
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          {showGamification && gamification && (
            <section className="student-surface-panel rounded-3xl p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-sky-700">
                {t("gamificationTitle")}
              </h2>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-3">
                  <dt className="text-xs font-medium text-slate-500">{t("xp")}</dt>
                  <dd className="text-base font-semibold tabular-nums text-slate-900">
                    {String(gamification.xp)}
                  </dd>
                </div>
                <div className="border-b border-sky-100 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-xs font-medium text-slate-500">
                      {t("level")}
                    </dt>
                    <dd className="text-base font-semibold tabular-nums text-slate-900">
                      {String(gamification.level)}
                    </dd>
                  </div>
                  {typeof levelBarPct === "number" && (
                    <div className="mt-2">
                      <div
                        className="h-2.5 overflow-hidden rounded-full bg-amber-100"
                        role="progressbar"
                        aria-valuenow={levelBarPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-[width]"
                          style={{ width: `${levelBarPct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs tabular-nums text-slate-500">
                        {t("nextLevelPct", { pct: levelBarPct })}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-3">
                  <dt className="text-xs font-medium text-slate-500">{t("streak")}</dt>
                  <dd className="text-base font-semibold tabular-nums text-slate-900">
                    {String(gamification.streakDays)}
                  </dd>
                </div>
                {(rankGlobal || rankSchool) && (
                  <div className="space-y-2 border-b border-sky-100 pb-3">
                    <dt className="text-xs font-medium text-slate-500">
                      {t("rankTitle")}
                    </dt>
                    <dd className="space-y-1 text-sm text-slate-800">
                      {rankSchool && user?.schoolId ? (
                        <p>
                          {t("rankInSchool")}{" "}
                          <span className="font-semibold tabular-nums text-sky-800">
                            {rankSchool.rank} / {rankSchool.total}
                          </span>
                        </p>
                      ) : null}
                      {rankGlobal ? (
                        <p>
                          {user?.schoolId ? t("rankOnPlatform") : t("rankInRating")}
                          :{" "}
                          <span className="font-semibold tabular-nums text-sky-800">
                            {rankGlobal.rank} / {rankGlobal.total}
                          </span>
                        </p>
                      ) : null}
                    </dd>
                  </div>
                )}
              </dl>
              {gamification.badges && gamification.badges.length > 0 && (
                <div className="mt-4 border-t border-sky-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                    {t("badgesTitle")}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {gamification.badges.map((b) => (
                      <li
                        key={b.key}
                        title={b.description ?? b.title}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-sm font-medium text-slate-800"
                      >
                        {b.icon ? (
                          <span className="text-lg leading-none" aria-hidden>
                            {b.icon}
                          </span>
                        ) : null}
                        <span className="max-w-[10rem] truncate">
                          {b.title ?? b.key}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {gamification.progressHints &&
                gamification.progressHints.length > 0 && (
                  <div className="mt-4 border-t border-sky-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                      {t("nextBadgesTitle")}
                    </p>
                    <ul className="mt-2 space-y-3">
                      {gamification.progressHints.slice(0, 3).map((h) => {
                        const pct =
                          typeof h.percent === "number"
                            ? Math.min(100, Math.max(0, h.percent))
                            : typeof h.current === "number" &&
                                typeof h.target === "number" &&
                                h.target > 0
                              ? Math.min(
                                  100,
                                  Math.round((h.current / h.target) * 100),
                                )
                              : undefined;
                        return (
                          <li key={h.key}>
                            <div className="flex items-start gap-2">
                              {h.icon ? (
                                <span className="text-lg leading-none" aria-hidden>
                                  {h.icon}
                                </span>
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {h.title ?? h.key}
                                </p>
                                {typeof h.current === "number" &&
                                typeof h.target === "number" ? (
                                  <p className="text-xs tabular-nums text-slate-500">
                                    {h.current} / {h.target}
                                  </p>
                                ) : null}
                                {typeof pct === "number" && (
                                  <div
                                    className="mt-1 h-1.5 overflow-hidden rounded-full bg-sky-100"
                                    role="presentation"
                                  >
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
            </section>
          )}

          <section className="student-surface-panel rounded-3xl p-5 sm:p-6">
            <h2 className="border-b border-sky-100 pb-4 text-lg font-bold text-slate-900 sm:text-xl">
              {t("leaderboardTitle")}
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              {user?.schoolId ? t("leaderboardSchool") : t("leaderboardGlobal")}
            </p>
            {leaderboard.length === 0 && (
              <p className="mt-4 text-xs text-slate-500">{t("leaderboardEmpty")}</p>
            )}
            {leaderboard.length > 0 && (
              <ol className="mt-4 space-y-2">
                {leaderboard.map((row, idx) => {
                  const rank =
                    typeof row.rank === "number" && row.rank > 0
                      ? row.rank
                      : idx + 1;
                  const rankStyle =
                    rank === 1
                      ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-sm"
                      : rank === 2
                        ? "bg-sky-200 text-sky-950"
                        : rank === 3
                          ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300/60"
                          : "bg-sky-50 text-slate-600 ring-1 ring-sky-100";
                  return (
                    <li
                      key={String(
                        row.userId ?? (row as { id?: string }).id ?? idx,
                      )}
                      className="flex items-center gap-3 rounded-2xl border border-sky-100/90 bg-white/80 px-3 py-2.5 shadow-sm"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rankStyle}`}
                      >
                        {rank}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                        {leaderboardName(row)}
                      </span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                        {String(row.xp ?? (row as { points?: number }).points ?? 0)}
                        {t("xpUnit")}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <nav className="student-surface-panel--soft rounded-3xl border border-amber-200/50 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800/90">
              {t("quickLinksTitle")}
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/courses"
                  className="text-base font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                >
                  {t("linkCourses")}
                </Link>
              </li>
              <li>
                <Link
                  href="/progress"
                  className="text-base font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                >
                  {t("linkProgress")}
                </Link>
              </li>
              <li>
                <Link
                  href="/certificates"
                  className="text-base font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                >
                  {t("linkCertificates")}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="text-base font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                >
                  {t("linkSettings")}
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}

type MetricTone = "sky" | "amber" | "violet";

function MetricCard({
  label,
  value,
  accent,
  tone = "sky",
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: MetricTone;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200/85 bg-gradient-to-br from-amber-50/95 to-white"
      : tone === "violet"
        ? "border-indigo-200/75 bg-gradient-to-br from-indigo-50/90 to-white"
        : "border-sky-200/85 bg-gradient-to-br from-sky-50/95 to-white";

  return (
    <div
      className={`rounded-2xl border px-4 py-4 shadow-sm sm:px-5 sm:py-5 ${toneClass} ${
        accent ? "ring-2 ring-amber-300/70 ring-offset-2 ring-offset-transparent" : ""
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
