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

function progressPercent(entry: ProgressEntry): number {
  if (typeof entry.percent === "number") return Math.min(100, entry.percent);
  const t = entry.totalModules;
  const c = entry.completedModules;
  if (typeof t === "number" && t > 0 && typeof c === "number") {
    return Math.round((c / t) * 100);
  }
  return 0;
}

/** Человекочитаемый вывод ответа ИИ-рекомендаций (без сырого JSON в основном виде). */
function AiRecommendationsContent({ data }: { data: unknown }) {
  const t = useTranslations("StudentDashboard");
  if (data == null) return null;
  if (typeof data === "string") {
    return (
      <p className="ds-text-body whitespace-pre-wrap text-ds-black">{data}</p>
    );
  }
  if (typeof data !== "object" || data === null) {
    return (
      <p className="ds-text-caption text-ds-gray-text">{t("aiNoFormat")}</p>
    );
  }
  const o = data as Record<string, unknown>;
  const summary = o.summary;
  const weak = o.weakTopics;
  const materials = o.suggestedMaterials;
  const repeat = o.repeatModuleIds;
  const hasStructured =
    (typeof summary === "string" && summary.trim()) ||
    (Array.isArray(weak) && weak.length > 0) ||
    (Array.isArray(materials) && materials.length > 0) ||
    (Array.isArray(repeat) && repeat.length > 0);

  if (!hasStructured) {
    return (
      <details className="rounded-lg border border-ds-gray-border bg-ds-gray-light/40 p-3">
        <summary className="cursor-pointer ds-text-caption text-ds-gray-text">
          {t("aiTechSummary")}
        </summary>
        <pre className="mt-2 max-h-40 overflow-auto ds-text-caption text-ds-black">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    );
  }

  return (
    <div className="space-y-4">
      {typeof summary === "string" && summary.trim() ? (
        <p className="ds-text-body leading-relaxed text-ds-black">{summary}</p>
      ) : null}
      {Array.isArray(weak) && weak.length > 0 ? (
        <div>
          <p className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
            {t("aiTopicsTitle")}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 ds-text-body text-ds-black">
            {weak.map((t, i) => (
              <li key={i}>{String(t)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {Array.isArray(materials) && materials.length > 0 ? (
        <div>
          <p className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
            {t("aiMaterialsTitle")}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 ds-text-body text-ds-black">
            {materials.map((t, i) => (
              <li key={i}>{String(t)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {Array.isArray(repeat) && repeat.length > 0 ? (
        <p className="ds-text-caption text-ds-gray-text">
          {t("aiRepeatPrefix")}{" "}
          {repeat.map((id) => String(id)).join(", ")}
        </p>
      ) : null}
    </div>
  );
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
      {/* Приветствие */}
      <header className="mb-8 lg:mb-10">
        <p className="ds-text-caption font-medium uppercase tracking-wider text-ds-primary">
          {t("mainEyebrow")}
        </p>
        <h1 className="ds-text-h1 mt-2 text-balance text-ds-black">
          {profileLoading
            ? t("greetingLoading")
            : name
              ? t("greetingNamed", { name })
              : t("greetingWelcome")}
        </h1>
        <p className="mt-3 max-w-2xl ds-text-body text-ds-gray-text">
          {t("lead")}
        </p>
      </header>

      {/* Метрики */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label={t("metricCourses")}
          value={loading ? t("metricEllipsis") : String(courses.length)}
        />
        <MetricCard
          label={t("metricAvgProgress")}
          value={loading ? t("metricEllipsis") : `${avgProgress}%`}
        />
        <MetricCard
          label={t("metricAi")}
          value={aiBlock != null ? t("metricYes") : t("metricDash")}
          accent={aiBlock != null}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-8 lg:col-span-2">
          {/* Курсы */}
          <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ds-gray-border pb-4">
              <h2 className="ds-text-h3 text-ds-black">{t("coursesTitle")}</h2>
              <Link
                href="/courses"
                className="ds-text-caption font-medium text-ds-primary hover:underline"
              >
                {t("allCoursesLink")}
              </Link>
            </div>
            {loadErr && (
              <p className="ds-text-small mt-4 text-ds-error" role="alert">
                {loadErr}
              </p>
            )}
            {loading && (
              <p className="ds-text-body mt-6 text-ds-gray-text">
                {tc("loading")}
              </p>
            )}
            {!loading && !loadErr && courses.length === 0 && (
              <p className="ds-text-body mt-6 text-ds-gray-text">
                {t("coursesEmpty")}
              </p>
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
                      className="block rounded-ds-card border border-ds-gray-border bg-ds-gray-light/80 p-4 transition-colors hover:border-ds-primary/40 hover:bg-ds-white"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="ds-text-subtitle text-ds-black">
                          {c.title ??
                            c.name ??
                            t("courseFallback", { id: `${id.slice(0, 8)}…` })}
                        </span>
                        <span className="ds-text-caption font-medium tabular-nums text-ds-primary">
                          {pct}%
                        </span>
                      </div>
                      <div
                        className="mt-3 h-2 overflow-hidden rounded-full bg-ds-gray-mid"
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full bg-ds-primary transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ИИ */}
          <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 shadow-sm sm:p-6">
            <h2 className="ds-text-h3 border-b border-ds-gray-border pb-4 text-ds-black">
              {t("recommendationsTitle")}
            </h2>
            <div className="mt-4">
              {aiError && (
                <p className="ds-text-body text-ds-gray-text">{aiError}</p>
              )}
              {!aiError && !loading && aiBlock == null && (
                <p className="ds-text-body text-ds-gray-text">{t("noData")}</p>
              )}
              {!aiError && aiBlock != null && (
                <AiRecommendationsContent data={aiBlock} />
              )}
            </div>
          </section>
        </div>

        {/* Боковая колонка */}
        <aside className="space-y-8">
          {showGamification && gamification && (
            <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 shadow-sm">
              <h2 className="ds-text-small font-semibold uppercase tracking-wide text-ds-gray-text">
                {t("gamificationTitle")}
              </h2>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-ds-gray-border pb-3">
                  <dt className="ds-text-caption text-ds-gray-text">{t("xp")}</dt>
                  <dd className="ds-text-body font-semibold tabular-nums text-ds-black">
                    {String(gamification.xp)}
                  </dd>
                </div>
                <div className="border-b border-ds-gray-border pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="ds-text-caption text-ds-gray-text">
                      {t("level")}
                    </dt>
                    <dd className="ds-text-body font-semibold tabular-nums text-ds-black">
                      {String(gamification.level)}
                    </dd>
                  </div>
                  {typeof levelBarPct === "number" && (
                    <div className="mt-2">
                      <div
                        className="h-2 overflow-hidden rounded-full bg-ds-gray-mid"
                        role="progressbar"
                        aria-valuenow={levelBarPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-ds-primary transition-[width]"
                          style={{ width: `${levelBarPct}%` }}
                        />
                      </div>
                      <p className="mt-1 ds-text-caption tabular-nums text-ds-gray-text">
                        {t("nextLevelPct", { pct: levelBarPct })}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-b border-ds-gray-border pb-3">
                  <dt className="ds-text-caption text-ds-gray-text">{t("streak")}</dt>
                  <dd className="ds-text-body font-semibold tabular-nums text-ds-black">
                    {String(gamification.streakDays)}
                  </dd>
                </div>
                {(rankGlobal || rankSchool) && (
                  <div className="space-y-2 border-b border-ds-gray-border pb-3">
                    <dt className="ds-text-caption text-ds-gray-text">
                      {t("rankTitle")}
                    </dt>
                    <dd className="space-y-1 ds-text-small text-ds-black">
                      {rankSchool && user?.schoolId ? (
                        <p>
                          {t("rankInSchool")}{" "}
                          <span className="font-semibold tabular-nums">
                            {rankSchool.rank} / {rankSchool.total}
                          </span>
                        </p>
                      ) : null}
                      {rankGlobal ? (
                        <p>
                          {user?.schoolId ? t("rankOnPlatform") : t("rankInRating")}
                          :{" "}
                          <span className="font-semibold tabular-nums">
                            {rankGlobal.rank} / {rankGlobal.total}
                          </span>
                        </p>
                      ) : null}
                    </dd>
                  </div>
                )}
              </dl>
              {gamification.badges && gamification.badges.length > 0 && (
                <div className="mt-4 border-t border-ds-gray-border pt-4">
                  <p className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
                    {t("badgesTitle")}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {gamification.badges.map((b) => (
                      <li
                        key={b.key}
                        title={b.description ?? b.title}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ds-gray-border bg-ds-gray-light/60 px-2.5 py-1.5 ds-text-small text-ds-black"
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
                  <div className="mt-4 border-t border-ds-gray-border pt-4">
                    <p className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
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
                                <p className="ds-text-small font-medium text-ds-black">
                                  {h.title ?? h.key}
                                </p>
                                {typeof h.current === "number" &&
                                typeof h.target === "number" ? (
                                  <p className="ds-text-caption tabular-nums text-ds-gray-text">
                                    {h.current} / {h.target}
                                  </p>
                                ) : null}
                                {typeof pct === "number" && (
                                  <div
                                    className="mt-1 h-1.5 overflow-hidden rounded-full bg-ds-gray-mid"
                                    role="presentation"
                                  >
                                    <div
                                      className="h-full rounded-full bg-ds-primary/80"
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

          <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 shadow-sm">
            <h2 className="ds-text-h3 border-b border-ds-gray-border pb-4 text-ds-black">
              {t("leaderboardTitle")}
            </h2>
            <p className="ds-text-caption mt-2 text-ds-gray-text">
              {user?.schoolId ? t("leaderboardSchool") : t("leaderboardGlobal")}
            </p>
            {leaderboard.length === 0 && (
              <p className="ds-text-caption mt-4 text-ds-gray-text">
                {t("leaderboardEmpty")}
              </p>
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
                      ? "bg-amber-100 text-amber-900"
                      : rank === 2
                        ? "bg-slate-200 text-slate-800"
                      : rank === 3
                        ? "bg-orange-100 text-orange-900"
                        : "bg-ds-gray-light text-ds-gray-text";
                  return (
                    <li
                      key={String(
                        row.userId ?? (row as { id?: string }).id ?? idx,
                      )}
                      className="flex items-center gap-3 rounded-lg border border-ds-gray-border px-3 py-2.5"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${rankStyle}`}
                      >
                        {rank}
                      </span>
                      <span className="min-w-0 flex-1 truncate ds-text-small text-ds-black">
                        {leaderboardName(row)}
                      </span>
                      <span className="shrink-0 ds-text-caption tabular-nums text-ds-gray-text">
                        {String(row.xp ?? (row as { points?: number }).points ?? 0)}
                        {t("xpUnit")}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <nav className="rounded-ds-card border border-ds-gray-border bg-ds-gray-light/50 p-4">
            <p className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
              {t("quickLinksTitle")}
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/courses"
                  className="ds-text-body text-ds-primary hover:underline"
                >
                  {t("linkCourses")}
                </Link>
              </li>
              <li>
                <Link
                  href="/progress"
                  className="ds-text-body text-ds-primary hover:underline"
                >
                  {t("linkProgress")}
                </Link>
              </li>
              <li>
                <Link
                  href="/certificates"
                  className="ds-text-body text-ds-primary hover:underline"
                >
                  {t("linkCertificates")}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="ds-text-body text-ds-primary hover:underline"
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

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-ds-card border px-4 py-4 sm:px-5 sm:py-5 ${
        accent
          ? "border-ds-primary/35 bg-ds-primary/5"
          : "border-ds-gray-border bg-ds-white"
      }`}
    >
      <p className="ds-text-caption uppercase tracking-wide text-ds-gray-text">
        {label}
      </p>
      <p className="mt-1 ds-text-h3 tabular-nums text-ds-black">{value}</p>
    </div>
  );
}
