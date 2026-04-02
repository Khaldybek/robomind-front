import { writeFileSync } from "fs";
import { join } from "path";

const root = process.cwd();

// ============================================================
// 1. student-shell.tsx
// ============================================================
writeFileSync(
  join(root, "components/student/student-shell.tsx"),
  `"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { StudentAiAssistantFab } from "@/components/student/student-ai-assistant-fab";

export function StudentShell({ children }: { children: ReactNode }) {
  const t = useTranslations("StudentShell");
  const pathname = usePathname();

  const nav = useMemo(
    () =>
      [
        { href: "/dashboard", label: t("navDashboard") },
        { href: "/courses", label: t("navCourses") },
        { href: "/progress", label: t("navProgress") },
        { href: "/certificates", label: t("navCertificates") },
        { href: "/profile", label: t("navProfile") },
        { href: "/settings", label: t("navSettings") },
      ] as const,
    [t],
  );

  return (
    <div className="student-kid-shell relative min-h-screen overflow-hidden">
      {/* Decorative bg orbs */}
      <div
        className="pointer-events-none absolute right-[-8%] top-[-5%] h-[min(50vw,380px)] w-[min(50vw,380px)] rounded-full bg-[radial-gradient(circle,rgba(255,46,31,0.10)_0%,transparent_70%)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[5%] left-[-6%] h-[min(40vw,300px)] w-[min(40vw,300px)] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10)_0%,transparent_70%)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[35%] h-[min(30vw,200px)] w-[min(30vw,200px)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.07)_0%,transparent_70%)] blur-3xl"
        aria-hidden
      />

      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl lg:px-6">
        <div className="ds-container flex max-w-none flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-ds-black transition-opacity hover:opacity-80"
          >
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ds-primary shadow-md shadow-ds-primary/30">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <circle cx="12" cy="8" r="3.5" fill="white" opacity="0.95" />
                <rect x="8" y="13" width="8" height="7" rx="2" fill="white" opacity="0.9" />
                <rect x="5" y="15" width="3" height="4" rx="1" fill="white" opacity="0.7" />
                <rect x="16" y="15" width="3" height="4" rx="1" fill="white" opacity="0.7" />
              </svg>
            </span>
            <span className="text-sm font-bold tracking-tight sm:text-base">
              Robomind
              <span className="ml-1 text-ds-primary">·</span>
              <span className="ml-1 text-xs font-medium text-ds-gray-text">{t("brandSuffix")}</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 lg:gap-1.5" aria-label="Student navigation">
            <LocaleSwitcher className="mr-1 hidden sm:flex" />
            {nav.map(({ href, label }) => {
              const isActive = pathname === href || pathname?.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={\`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 \${
                    isActive
                      ? "bg-ds-primary text-white shadow-md shadow-ds-primary/25"
                      : "text-ds-black hover:bg-white hover:text-ds-primary hover:shadow-sm"
                  }\`}
                >
                  {label}
                </Link>
              );
            })}
            <LocaleSwitcher className="w-full flex-none sm:hidden" />
            <Link
              href="/logout"
              className="ml-1 flex items-center gap-1.5 rounded-xl border border-ds-gray-border bg-white px-3 py-2 text-sm font-medium text-ds-gray-text transition-all hover:border-ds-primary/40 hover:text-ds-primary hover:shadow-sm"
            >
              {t("logout")}
            </Link>
          </nav>
        </div>
      </header>
      <main className="relative z-[1] min-h-[calc(100dvh-64px)]">{children}</main>
      <StudentAiAssistantFab />
    </div>
  );
}
`
);

console.log("student-shell.tsx patched");

// ============================================================
// 2. Dashboard page
// ============================================================
const dashboardPage = `"use client";

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

function AiRecommendationsContent({ data }: { data: unknown }) {
  const t = useTranslations("StudentDashboard");
  if (data == null) return null;
  if (typeof data === "string") {
    return <p className="text-sm leading-relaxed text-ds-black whitespace-pre-wrap">{data}</p>;
  }
  if (typeof data !== "object" || data === null) {
    return <p className="text-sm text-ds-gray-text">{t("aiNoFormat")}</p>;
  }
  const o = data as Record<string, unknown>;
  const summary = o.summary;
  const weak = o.weakTopics;
  const materials = o.suggestedMaterials;
  return (
    <div className="space-y-3">
      {typeof summary === "string" && summary.trim() ? (
        <p className="text-sm leading-relaxed text-ds-black">{summary}</p>
      ) : null}
      {Array.isArray(weak) && weak.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ds-gray-text mb-1">{t("aiTopicsTitle")}</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-ds-black">
            {weak.map((item, i) => <li key={i}>{String(item)}</li>)}
          </ul>
        </div>
      ) : null}
      {Array.isArray(materials) && materials.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ds-gray-text mb-1">{t("aiMaterialsTitle")}</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-ds-black">
            {materials.map((item, i) => <li key={i}>{String(item)}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="kid-stat-card flex items-center gap-4">
      <div className={\`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl \${color}\`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ds-gray-text">{label}</p>
        <p className="text-2xl font-bold text-ds-black tabular-nums">{value}</p>
      </div>
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
        const dashboardCourses = Array.isArray(dash?.courses) ? (dash.courses as CourseSummary[]) : null;
        const dashboardProgress = Array.isArray(dash?.progress) ? (dash.progress as ProgressEntry[]) : null;
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
      schoolId ? fetchGamificationMyRank(schoolId).catch(() => null) : Promise.resolve(null),
      fetchGamificationLeaderboard({ limit: 5, schoolId }).catch(() => [] as LeaderboardEntry[]),
    ]).then(([rg, rs, lb]) => {
      setRankGlobal(rg);
      setRankSchool(rs);
      setLeaderboard(lb);
    });
  }, [user?.schoolId]);

  const name =
    user && (user.firstName || user.lastName
      ? [user.firstName, user.lastName].filter(Boolean).join(" ")
      : null);

  const progressByCourse = new Map(progress.map((p) => [String(p.courseId ?? ""), p]));
  const avgProgress =
    progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + progressPercent(p), 0) / progress.length)
      : 0;

  const levelBarPct = (() => {
    const p = gamification?.levelProgressPercent;
    if (typeof p === "number" && p >= 0 && p <= 100) return p;
    const need = gamification?.xpNeededForNextLevel;
    const cur = gamification?.xpInCurrentLevel;
    if (typeof need === "number" && need > 0 && typeof cur === "number" && cur >= 0) {
      return Math.min(100, Math.round((cur / need) * 100));
    }
    return undefined;
  })();

  function leaderboardName(row: LeaderboardEntry): string {
    const fn = row.firstName ?? (row as { first_name?: string }).first_name;
    const ln = row.lastName ?? (row as { last_name?: string }).last_name;
    const combined = [fn, ln].filter(Boolean).join(" ").trim();
    if (combined) return combined;
    const full = row.fullName ?? (row as { full_name?: string }).full_name ?? row.name ?? row.email;
    if (typeof full === "string" && full.trim()) return full;
    return t("studentFallback");
  }

  const greeting = profileLoading
    ? t("greetingLoading")
    : name
      ? t("greetingNamed", { name })
      : t("greetingWelcome");

  return (
    <div className="ds-container py-8 lg:py-12">
      {/* Hero greeting */}
      <div className="mb-8 overflow-hidden rounded-3xl bg-ds-primary p-6 text-white shadow-lg shadow-ds-primary/25 sm:p-8 lg:mb-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/70">
              {t("mainEyebrow")}
            </p>
            <h1 className="text-balance text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              {greeting}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80">
              {t("lead")}
            </p>
          </div>
          {/* Robot decoration */}
          <div className="hidden shrink-0 sm:block" aria-hidden>
            <svg viewBox="0 0 80 90" fill="none" className="h-20 w-20 opacity-90">
              <rect x="18" y="28" width="44" height="36" rx="8" fill="white" opacity="0.25"/>
              <circle cx="32" cy="44" r="5" fill="white" opacity="0.85"/>
              <circle cx="48" cy="44" r="5" fill="white" opacity="0.85"/>
              <circle cx="32" cy="44" r="2.5" fill="#ff2e1f"/>
              <circle cx="48" cy="44" r="2.5" fill="#ff2e1f"/>
              <rect x="34" y="52" width="12" height="4" rx="2" fill="white" opacity="0.6"/>
              <rect x="20" y="20" width="40" height="10" rx="5" fill="white" opacity="0.2"/>
              <circle cx="40" cy="15" r="4" fill="white" opacity="0.4"/>
              <rect x="12" y="35" width="6" height="18" rx="3" fill="white" opacity="0.3"/>
              <rect x="62" y="35" width="6" height="18" rx="3" fill="white" opacity="0.3"/>
              <rect x="26" y="64" width="10" height="18" rx="4" fill="white" opacity="0.25"/>
              <rect x="44" y="64" width="10" height="18" rx="4" fill="white" opacity="0.25"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3" aria-label={t("metricCourses")}>
        <StatCard
          label={t("metricCourses")}
          value={loading ? "…" : String(courses.length)}
          color="bg-st-blue-light text-st-blue"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          }
        />
        <StatCard
          label={t("metricAvgProgress")}
          value={loading ? "…" : \`\${avgProgress}%\`}
          color="bg-st-green-light text-st-green"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          }
        />
        <StatCard
          label={t("metricAi")}
          value={aiBlock != null ? t("metricYes") : t("metricDash")}
          color="bg-st-yellow-light text-st-yellow"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          }
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-8 lg:col-span-2">
          {/* Courses */}
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6" style={{boxShadow: "0 4px 20px rgba(38,38,38,0.07)"}}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ds-gray-mid pb-4">
              <h2 className="text-lg font-bold text-ds-black">{t("coursesTitle")}</h2>
              <Link href="/courses" className="rounded-full bg-ds-primary px-4 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90">
                {t("allCoursesLink")}
              </Link>
            </div>
            {loadErr && <p className="mt-4 text-sm text-ds-error" role="alert">{loadErr}</p>}
            {loading && <p className="mt-6 text-sm text-ds-gray-text">{tc("loading")}</p>}
            {!loading && !loadErr && courses.length === 0 && (
              <p className="mt-6 text-sm text-ds-gray-text">{t("coursesEmpty")}</p>
            )}
            <ul className="mt-4 space-y-3">
              {courses.map((c) => {
                const id = String(c.id);
                const pr = progressByCourse.get(id);
                const pct = pr ? progressPercent(pr) : 0;
                const title = c.title ?? c.name ?? t("courseFallback", { id: id.slice(0, 8) + "…" });
                return (
                  <li key={id}>
                    <Link
                      href={\`/courses/\${encodeURIComponent(id)}\`}
                      className="block rounded-2xl border border-ds-gray-mid bg-ds-gray-light/60 p-4 transition-all hover:border-ds-primary/30 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="font-semibold text-ds-black">{title}</span>
                        <span className="rounded-full bg-ds-primary px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">
                          {pct}%
                        </span>
                      </div>
                      <div className="kid-progress-track mt-3">
                        <div className="kid-progress-fill" style={{ width: \`\${pct}%\` }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* AI recommendations */}
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6" style={{boxShadow: "0 4px 20px rgba(38,38,38,0.07)"}}>
            <div className="flex items-center gap-2 border-b border-ds-gray-mid pb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-st-yellow-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-st-yellow" aria-hidden>
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </span>
              <h2 className="text-lg font-bold text-ds-black">{t("recommendationsTitle")}</h2>
            </div>
            <div className="mt-4">
              {aiError && <p className="text-sm text-ds-gray-text">{aiError}</p>}
              {!aiError && !loading && aiBlock == null && <p className="text-sm text-ds-gray-text">{t("noData")}</p>}
              {!aiError && aiBlock != null && <AiRecommendationsContent data={aiBlock} />}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Gamification card */}
          {gamification != null && (
            <section className="rounded-3xl bg-white p-5 shadow-sm" style={{boxShadow: "0 4px 20px rgba(38,38,38,0.07)"}}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ds-gray-text">
                {t("gamificationTitle")}
              </h2>
              {/* XP + Level */}
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-ds-primary text-white shadow-md shadow-ds-primary/30">
                  <span className="text-xl font-black leading-none">{String(gamification.level)}</span>
                  <span className="text-[10px] font-semibold uppercase opacity-80">{t("level")}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-ds-gray-text">{t("xp")}</p>
                  <p className="text-2xl font-black tabular-nums text-ds-black">{String(gamification.xp)}</p>
                  {typeof levelBarPct === "number" && (
                    <>
                      <div className="kid-progress-track mt-2">
                        <div className="kid-progress-fill" style={{ width: \`\${levelBarPct}%\` }} role="progressbar" aria-valuenow={levelBarPct} aria-valuemin={0} aria-valuemax={100} />
                      </div>
                      <p className="mt-1 text-[11px] text-ds-gray-text tabular-nums">{t("nextLevelPct", { pct: levelBarPct })}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Streak */}
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-st-orange-light px-4 py-3">
                <span className="text-sm font-semibold text-ds-black">{t("streak")}</span>
                <span className="text-lg font-black tabular-nums text-st-orange">{String(gamification.streakDays)} d</span>
              </div>

              {/* Rank */}
              {(rankGlobal || rankSchool) && (
                <div className="mb-4 space-y-1.5 rounded-2xl bg-st-blue-light px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ds-gray-text">{t("rankTitle")}</p>
                  {rankSchool && user?.schoolId ? (
                    <p className="text-sm text-ds-black">
                      {t("rankInSchool")}{" "}
                      <span className="font-bold tabular-nums text-st-blue">{rankSchool.rank} / {rankSchool.total}</span>
                    </p>
                  ) : null}
                  {rankGlobal ? (
                    <p className="text-sm text-ds-black">
                      {user?.schoolId ? t("rankOnPlatform") : t("rankInRating")}:{" "}
                      <span className="font-bold tabular-nums text-st-blue">{rankGlobal.rank} / {rankGlobal.total}</span>
                    </p>
                  ) : null}
                </div>
              )}

              {/* Badges */}
              {gamification.badges && gamification.badges.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ds-gray-text">{t("badgesTitle")}</p>
                  <div className="flex flex-wrap gap-2">
                    {gamification.badges.map((b) => (
                      <span
                        key={b.key}
                        title={b.description ?? b.title}
                        className="inline-flex items-center gap-1 rounded-xl border border-ds-gray-mid bg-ds-gray-light/80 px-2.5 py-1.5 text-xs font-medium text-ds-black"
                      >
                        {b.icon ? <span className="text-base leading-none" aria-hidden>{b.icon}</span> : null}
                        {b.title ?? b.key}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <section className="rounded-3xl bg-white p-5 shadow-sm" style={{boxShadow: "0 4px 20px rgba(38,38,38,0.07)"}}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ds-gray-text">{t("leaderboardTitle")}</h2>
              <ol className="space-y-2">
                {leaderboard.map((row, idx) => (
                  <li key={String(row.userId ?? idx)} className="flex items-center gap-3">
                    <span className={\`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black \${
                      idx === 0 ? "bg-st-yellow text-white" :
                      idx === 1 ? "bg-ds-gray-mid text-ds-black" :
                      idx === 2 ? "bg-st-orange text-white" :
                      "bg-ds-gray-light text-ds-gray-text"
                    }\`}>{idx + 1}</span>
                    <span className="flex-1 truncate text-sm font-medium text-ds-black">{leaderboardName(row)}</span>
                    <span className="tabular-nums text-sm font-bold text-ds-primary">{String(row.xp ?? row.score ?? "")}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
`;

writeFileSync(join(root, "app/[locale]/(student)/dashboard/page.tsx"), dashboardPage);
console.log("dashboard/page.tsx patched");

// ============================================================
// 3. Courses page
// ============================================================
const coursesPage = `"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchCourses } from "@/lib/api/student/courses";
import type { CourseSummary } from "@/lib/api/types";
import { CourseCard } from "@/components/student/course-card";
import { isApiConfigured } from "@/lib/env";

export default function CoursesPage() {
  const t = useTranslations("StudentCourses");
  const tc = useTranslations("Common");
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      setLoading(false);
      return;
    }
    fetchCourses()
      .then(setCourses)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ds-container py-10 lg:py-14">
      {/* Page header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ds-primary">{t("title")}</p>
        <h1 className="ds-text-h1 text-balance text-ds-black">{t("title")}</h1>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-ds-gray-text">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm">{tc("loading")}</span>
        </div>
      )}
      {error && (
        <p className="mb-6 rounded-2xl border border-ds-error/20 bg-ds-error/5 px-4 py-3 text-sm text-ds-error" role="alert">
          {error}
        </p>
      )}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseCard key={String(c.id)} course={c} />
        ))}
      </ul>
      {!loading && !error && courses.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-ds-gray-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-ds-gray-text" aria-hidden>
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-ds-gray-text">{t("empty")}</p>
        </div>
      )}
    </div>
  );
}
`;

writeFileSync(join(root, "app/[locale]/(student)/courses/page.tsx"), coursesPage);
console.log("courses/page.tsx patched");

// ============================================================
// 4. Progress page
// ============================================================
const progressPage = `"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fetchUserProgress, type ProgressEntry } from "@/lib/api/student/user";
import { isApiConfigured } from "@/lib/env";

function progressPercent(p: ProgressEntry): number {
  if (typeof p.percent === "number") return Math.min(100, p.percent);
  if (p.totalModules && p.completedModules != null) {
    return Math.round((Number(p.completedModules) / Number(p.totalModules)) * 100);
  }
  return 0;
}

function CircleProgress({ pct }: { pct: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0 -rotate-90" aria-hidden>
      <circle cx="40" cy="40" r={r} stroke="#e5e5e5" strokeWidth="8" fill="none"/>
      <circle
        cx="40" cy="40" r={r}
        stroke="#ff2e1f" strokeWidth="8" fill="none"
        strokeDasharray={\`\${dash} \${circ}\`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.34,1.56,.64,1)" }}
      />
      <text x="40" y="40" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-[40px_40px]" fontSize="16" fontWeight="800" fill="#262626">
        {pct}%
      </text>
    </svg>
  );
}

export default function ProgressPage() {
  const t = useTranslations("StudentProgress");
  const tc = useTranslations("Common");
  const [items, setItems] = useState<ProgressEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) { setError(tc("apiEnvMissing")); setLoading(false); return; }
    fetchUserProgress()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tc]);

  return (
    <div className="ds-container py-10 lg:py-14">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ds-primary">{t("title")}</p>
        <h1 className="ds-text-h1 text-balance text-ds-black">{t("title")}</h1>
      </div>

      {loading && <p className="text-sm text-ds-gray-text">{tc("loading")}</p>}
      {error && (
        <p className="mb-6 rounded-2xl border border-ds-error/20 bg-ds-error/5 px-4 py-3 text-sm text-ds-error" role="alert">
          {error}{t("endpointHint")}
        </p>
      )}

      <ul className="space-y-5">
        {items.map((p, i) => {
          const id = String(p.courseId ?? i);
          const pct = progressPercent(p);
          return (
            <li key={id} className="overflow-hidden rounded-3xl bg-white p-5 shadow-sm sm:p-6" style={{boxShadow:"0 4px 20px rgba(38,38,38,0.07)"}}>
              <div className="flex items-center gap-5">
                <div className="relative flex rotate-90">
                  <CircleProgress pct={Math.min(100, pct)} />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-black text-ds-black -rotate-90">{pct}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={\`/courses/\${encodeURIComponent(id)}\`}
                    className="block text-lg font-bold text-ds-primary hover:underline truncate"
                  >
                    {p.courseName ?? t("courseFallback", { id })}
                  </Link>
                  {typeof p.completedModules === "number" && typeof p.totalModules === "number" && (
                    <p className="mt-1 text-sm text-ds-gray-text">{p.completedModules} / {p.totalModules} модулей</p>
                  )}
                  <div className="kid-progress-track mt-3">
                    <div className="kid-progress-fill" style={{ width: \`\${Math.min(100, pct)}%\` }} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-ds-gray-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-ds-gray-text" aria-hidden>
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-ds-gray-text">{t("empty")}</p>
        </div>
      )}
    </div>
  );
}
`;

writeFileSync(join(root, "app/[locale]/(student)/progress/page.tsx"), progressPage);
console.log("progress/page.tsx patched");

// ============================================================
// 5. Certificates page
// ============================================================
const certificatesPage = `"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchCertificates, type CertificateItem } from "@/lib/api/student/user";
import { isApiConfigured } from "@/lib/env";

export default function CertificatesPage() {
  const t = useTranslations("StudentCertificates");
  const tc = useTranslations("Common");
  const [list, setList] = useState<CertificateItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) { setError(tc("apiEnvMissing")); setLoading(false); return; }
    fetchCertificates()
      .then(setList)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tc]);

  return (
    <div className="ds-container py-10 lg:py-14">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ds-primary">{t("title")}</p>
        <h1 className="ds-text-h1 text-balance text-ds-black">{t("title")}</h1>
      </div>

      {loading && <p className="text-sm text-ds-gray-text">{tc("loading")}</p>}
      {error && (
        <p className="mb-6 rounded-2xl border border-ds-error/20 bg-ds-error/5 px-4 py-3 text-sm text-ds-error" role="alert">
          {error}{t("endpointHint")}
        </p>
      )}

      <ul className="grid gap-5 sm:grid-cols-2">
        {list.map((c) => {
          const href = c.downloadUrl ?? c.pdfUrl ?? (c.url as string) ?? "";
          return (
            <li key={String(c.id)} className="overflow-hidden rounded-3xl bg-white shadow-sm" style={{boxShadow:"0 4px 20px rgba(38,38,38,0.07)"}}>
              {/* Certificate top bar */}
              <div className="flex items-center gap-3 bg-ds-primary px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                </div>
                <p className="flex-1 truncate font-bold text-white">
                  {c.title ?? t("certFallback", { id: String(c.id) })}
                </p>
              </div>
              {/* Certificate body */}
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                {c.issuedAt && (
                  <p className="text-sm text-ds-gray-text">{String(c.issuedAt)}</p>
                )}
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-ds-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-ds-primary/25 transition-all hover:opacity-90"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    {t("downloadPdf")}
                  </a>
                ) : (
                  <span className="text-xs text-ds-gray-text">{t("noUrlHint")}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {!loading && !error && list.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-st-yellow-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-st-yellow" aria-hidden>
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-ds-gray-text">{t("empty")}</p>
        </div>
      )}
    </div>
  );
}
`;

writeFileSync(join(root, "app/[locale]/(student)/certificates/page.tsx"), certificatesPage);
console.log("certificates/page.tsx patched");

// ============================================================
// 6. Profile page
// ============================================================
const profilePage = `"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchUserMe, patchUserMe } from "@/lib/api/student/user";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

export default function ProfilePage() {
  const t = useTranslations("StudentProfile");
  const tc = useTranslations("Common");
  const { refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) { setLoading(false); return; }
    fetchUserMe()
      .then((u) => {
        if (!u) return;
        setFirstName(String(u.firstName ?? u.first_name ?? ""));
        setLastName(String(u.lastName ?? u.last_name ?? ""));
        setEmail(String(u.email ?? ""));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await patchUserMe({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
      setSaved(true);
      await refreshProfile();
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError(t("errorSave"));
    }
  }

  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <div className="ds-container max-w-xl py-10 lg:py-14">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ds-primary">{t("title")}</p>
        <h1 className="ds-text-h1 text-balance text-ds-black">{t("title")}</h1>
        <p className="mt-2 text-sm text-ds-gray-text">{t("lead")}</p>
      </div>

      {loading && <p className="text-sm text-ds-gray-text">{tc("loading")}</p>}
      {!loading && (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm" style={{boxShadow:"0 4px 20px rgba(38,38,38,0.07)"}}>
          {/* Avatar header */}
          <div className="flex flex-col items-center gap-3 bg-ds-primary px-6 py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-black text-white shadow-lg">
              {initials}
            </div>
            <p className="text-lg font-bold text-white">{[firstName, lastName].filter(Boolean).join(" ") || "—"}</p>
            <p className="text-sm text-white/70">{email || "—"}</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ds-black">{t("lastName")}</label>
              <input
                className="w-full rounded-2xl border border-ds-gray-border bg-ds-gray-light/60 px-4 py-3 text-sm font-medium text-ds-black outline-none transition focus:border-ds-primary focus:bg-white focus:ring-2 focus:ring-ds-primary/10"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ds-black">{t("firstName")}</label>
              <input
                className="w-full rounded-2xl border border-ds-gray-border bg-ds-gray-light/60 px-4 py-3 text-sm font-medium text-ds-black outline-none transition focus:border-ds-primary focus:bg-white focus:ring-2 focus:ring-ds-primary/10"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ds-black">{t("email")}</label>
              <input
                type="email"
                className="w-full rounded-2xl border border-ds-gray-border bg-ds-gray-light/60 px-4 py-3 text-sm font-medium text-ds-black outline-none transition focus:border-ds-primary focus:bg-white focus:ring-2 focus:ring-ds-primary/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="rounded-xl border border-ds-error/20 bg-ds-error/5 px-3 py-2 text-sm text-ds-error" role="alert">{error}</p>}
            {saved && (
              <div className="flex items-center gap-2 rounded-xl border border-st-green/20 bg-st-green-light px-3 py-2 text-sm font-semibold text-st-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                {t("saved")}
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-2xl bg-ds-primary px-6 py-3 text-sm font-bold text-white shadow-md shadow-ds-primary/25 transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {t("save")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
`;

writeFileSync(join(root, "app/[locale]/(student)/profile/page.tsx"), profilePage);
console.log("profile/page.tsx patched");

// ============================================================
// 7. Settings page
// ============================================================
const settingsPage = `"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";

function SettingSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm" style={{boxShadow:"0 4px 20px rgba(38,38,38,0.07)"}}>
      <div className="flex items-center gap-3 border-b border-ds-gray-mid px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ds-gray-light">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-ds-black">{title}</h2>
          {description && <p className="text-xs text-ds-gray-text">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const t = useTranslations("StudentSettings");
  const { logoutAllSessions } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <div className="ds-container max-w-xl py-10 lg:py-14">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ds-primary">{t("title")}</p>
        <h1 className="ds-text-h1 text-balance text-ds-black">{t("title")}</h1>
      </div>

      <div className="space-y-5">
        <SettingSection
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-ds-primary" aria-hidden>
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          }
          title={t("passwordTitle")}
          description={t("passwordLead")}
        >
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 rounded-2xl border border-ds-gray-border bg-ds-gray-light px-4 py-2.5 text-sm font-semibold text-ds-black transition-all hover:border-ds-primary/40 hover:text-ds-primary"
          >
            {t("forgotPassword")}
          </Link>
        </SettingSection>

        <SettingSection
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-st-blue" aria-hidden>
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          }
          title={t("notificationsTitle")}
          description={t("notificationsLead")}
        >
          <p className="text-sm text-ds-gray-text">{t("notificationsLead")}</p>
        </SettingSection>

        <SettingSection
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-ds-error" aria-hidden>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          }
          title={t("sessionTitle")}
        >
          <p className="mb-4 text-sm text-ds-gray-text">{t("sessionBody")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/logout"
              className="inline-flex items-center gap-2 rounded-2xl border border-ds-error/30 bg-ds-error/5 px-4 py-2.5 text-sm font-semibold text-ds-error transition-all hover:bg-ds-error hover:text-white"
            >
              {t("logout")}
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-ds-gray-border bg-ds-gray-light px-4 py-2.5 text-sm font-semibold text-ds-black transition-all hover:border-ds-error/30 hover:text-ds-error disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void logoutAllSessions().finally(() => setBusy(false));
              }}
            >
              {busy ? t("logoutAllBusy") : t("logoutAll")}
            </button>
          </div>
          <p className="mt-4 text-xs text-ds-gray-text">
            {t("deviceReset")}{" "}
            <Link href="/logout?full=1" className="text-ds-primary hover:underline">
              {t("deviceResetLink")}
            </Link>
          </p>
        </SettingSection>
      </div>
    </div>
  );
}
`;

writeFileSync(join(root, "app/[locale]/(student)/settings/page.tsx"), settingsPage);
console.log("settings/page.tsx patched");

// ============================================================
// 8. CourseCard component
// ============================================================
const courseCard = `"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CourseSummary } from "@/lib/api/types";
import {
  formatCourseLevel,
  pickCourseAgeGroup,
  resolveCourseThumbnailUrl,
} from "@/lib/course-display";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-st-green-light text-st-green",
  intermediate: "bg-st-blue-light text-st-blue",
  advanced: "bg-st-orange-light text-st-orange",
};

export function CourseCard({ course }: { course: CourseSummary }) {
  const t = useTranslations("StudentCourseDetail");
  const id = String(course.id);
  const title = course.title ?? course.name ?? t("courseFallback", { id });
  const resolved = resolveCourseThumbnailUrl(course);
  const level = formatCourseLevel(course);
  const age = pickCourseAgeGroup(course);
  const desc = course.description ? String(course.description) : null;

  const levelKey = (level ?? "").toLowerCase();
  const levelColorClass = LEVEL_COLORS[levelKey] ?? "bg-ds-gray-light text-ds-gray-text";

  return (
    <li>
      <Link
        href={\`/courses/\${encodeURIComponent(id)}\`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
        style={{ boxShadow: "0 4px 20px rgba(38,38,38,0.07)" }}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-ds-gray-light">
          {resolved ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL с API
            <img
              src={resolved}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <Image
              src="/student/hero-robot.svg"
              alt=""
              fill
              className="object-cover object-center opacity-80"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {/* Level badge on image */}
          {level && (
            <span className={\`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold \${levelColorClass}\`}>
              {level}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <span className="font-bold text-ds-black leading-snug group-hover:text-ds-primary transition-colors">
            {title}
          </span>
          {age && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-ds-gray-text">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
              {age}
            </span>
          )}
          {desc && (
            <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-ds-gray-text">
              {desc}
            </span>
          )}
          {/* Arrow CTA */}
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-ds-primary">
            <span>Начать</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </Link>
    </li>
  );
}
`;

writeFileSync(join(root, "components/student/course-card.tsx"), courseCard);
console.log("course-card.tsx patched");

// ============================================================
// 9. Auth pages — login/register with new kid-friendly background
// ============================================================
const loginPage = `"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { AuthBrandLogo } from "@/components/auth/auth-brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { getAccessToken } from "@/lib/auth/tokens";

export default function LoginPage() {
  const tp = useTranslations("AuthPages");
  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="auth-kid-page flex min-h-screen flex-col">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed right-[-10%] top-[-8%] h-[min(60vw,440px)] w-[min(60vw,440px)] rounded-full bg-[radial-gradient(circle,rgba(255,46,31,0.12)_0%,transparent_70%)] blur-3xl" aria-hidden />
      <div className="pointer-events-none fixed bottom-[-5%] left-[-8%] h-[min(50vw,360px)] w-[min(50vw,360px)] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10)_0%,transparent_70%)] blur-3xl" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-3">
          <AuthBrandLogo />
          <Link href="/" className="text-xs font-medium text-ds-gray-text hover:text-ds-primary transition-colors">
            {tp("backHome")}
          </Link>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/register" className="font-semibold text-ds-primary hover:underline">
            {tp("registerCta")}
          </Link>
        </p>
      </div>
    </div>
  );
}
`;

writeFileSync(join(root, "app/[locale]/(auth)/login/page.tsx"), loginPage);
console.log("login/page.tsx patched");

const registerPage = `import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthBrandLogo } from "@/components/auth/auth-brand-logo";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const tp = await getTranslations("AuthPages");

  return (
    <div className="auth-kid-page flex min-h-screen flex-col">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed right-[-10%] top-[-8%] h-[min(60vw,440px)] w-[min(60vw,440px)] rounded-full bg-[radial-gradient(circle,rgba(255,46,31,0.12)_0%,transparent_70%)] blur-3xl" aria-hidden />
      <div className="pointer-events-none fixed bottom-[-5%] left-[-8%] h-[min(50vw,360px)] w-[min(50vw,360px)] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10)_0%,transparent_70%)] blur-3xl" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-3">
          <AuthBrandLogo />
          <Link href="/" className="text-xs font-medium text-ds-gray-text hover:text-ds-primary transition-colors">
            {tp("backHome")}
          </Link>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
`;

writeFileSync(join(root, "app/[locale]/(auth)/register/page.tsx"), registerPage);
console.log("register/page.tsx patched");

// ============================================================
// 10. Login form — kid-friendly card style
// ============================================================
const loginForm = `"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { loginStudent, persistSession } from "@/lib/api/student/auth";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

export function LoginForm() {
  const t = useTranslations("Auth.login");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { refreshProfile, applyUserFromLogin } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isApiConfigured()) { setError(tc("apiEnvMissing")); return; }
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) { setError(t("errorDeviceId")); return; }
    setPending(true);
    try {
      const tokens = await loginStudent({ email: login.trim(), password, deviceId });
      persistSession(tokens.access, tokens.refresh, tokens.expiresIn);
      if (tokens.user) applyUserFromLogin(tokens.user);
      await refreshProfile();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 403) { router.replace("/403-device"); return; }
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("errorGeneric"));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-3xl bg-white shadow-lg"
        style={{ boxShadow: "0 8px 40px rgba(38,38,38,0.12)" }}
      >
        {/* Header stripe */}
        <div className="bg-ds-primary px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10 shrink-0" aria-hidden>
              <rect x="8" y="14" width="24" height="20" rx="5" fill="white" opacity="0.2"/>
              <circle cx="15" cy="22" r="3" fill="white" opacity="0.9"/>
              <circle cx="25" cy="22" r="3" fill="white" opacity="0.9"/>
              <circle cx="15" cy="22" r="1.3" fill="#ff2e1f"/>
              <circle cx="25" cy="22" r="1.3" fill="#ff2e1f"/>
              <rect x="16" y="27" width="8" height="3" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="10" y="8" width="20" height="8" rx="4" fill="white" opacity="0.15"/>
              <circle cx="20" cy="7" r="3" fill="white" opacity="0.35"/>
            </svg>
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-xs text-white/70">{t("hint")}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-8">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ds-black">{t("emailLabel")}</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              placeholder={t("emailPlaceholder")}
              required
              className="w-full rounded-2xl border border-ds-gray-border bg-ds-gray-light/60 px-4 py-3 text-sm font-medium text-ds-black outline-none transition focus:border-ds-primary focus:bg-white focus:ring-2 focus:ring-ds-primary/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ds-black">{t("passwordLabel")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-2xl border border-ds-gray-border bg-ds-gray-light/60 px-4 py-3 text-sm font-medium text-ds-black outline-none transition focus:border-ds-primary focus:bg-white focus:ring-2 focus:ring-ds-primary/10"
            />
          </div>

          {error && (
            <p className="rounded-2xl border border-ds-error/20 bg-ds-error/5 px-4 py-2.5 text-sm font-medium text-ds-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-ds-primary px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-ds-primary/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? t("submitting") : t("submit")}
          </button>

          <p className="text-center">
            <Link href="/forgot-password" className="text-xs font-medium text-ds-primary hover:underline">
              {t("forgotPassword")}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
`;

writeFileSync(join(root, "components/auth/login-form.tsx"), loginForm);
console.log("login-form.tsx patched");

// ============================================================
// 11. Register form — kid-friendly
// ============================================================
const registerForm = `"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fetchCities, fetchDistricts, fetchSchools } from "@/lib/api/student/geo";
import { registerStudent } from "@/lib/api/student/auth";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";
import type { GeoItem } from "@/lib/api/types";

export function RegisterForm() {
  const t = useTranslations("Auth.register");
  const tc = useTranslations("Common");
  const [cities, setCities] = useState<GeoItem[]>([]);
  const [districts, setDistricts] = useState<GeoItem[]>([]);
  const [schools, setSchools] = useState<GeoItem[]>([]);
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [iin, setIin] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!isApiConfigured()) return;
    setGeoLoading(true);
    setGeoError(null);
    fetchCities().then(setCities).catch(() => setGeoError(t("geoLoadError"))).finally(() => setGeoLoading(false));
  }, []);

  useEffect(() => {
    if (!cityId || !isApiConfigured()) { setDistricts([]); setDistrictId(""); return; }
    fetchDistricts(cityId).then(setDistricts).catch(() => setDistricts([]));
  }, [cityId]);

  useEffect(() => {
    if (!districtId || !isApiConfigured()) { setSchools([]); setSchoolId(""); return; }
    fetchSchools(districtId).then(setSchools).catch(() => setSchools([]));
  }, [districtId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isApiConfigured()) { setError(tc("apiEnvMissing")); return; }
    setPending(true);
    try {
      const p = patronymic.trim();
      await registerStudent({ iin: iin.trim(), lastName: lastName.trim(), firstName: firstName.trim(), ...(p ? { patronymic: p } : {}), email: email.trim(), password, schoolId });
      window.location.href = "/pending-activation";
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError(t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  const inputClass = "w-full rounded-2xl border border-ds-gray-border bg-ds-gray-light/60 px-4 py-3 text-sm font-medium text-ds-black outline-none transition focus:border-ds-primary focus:bg-white focus:ring-2 focus:ring-ds-primary/10 disabled:opacity-50";
  const labelClass = "mb-1.5 block text-sm font-semibold text-ds-black";

  return (
    <div className="w-full max-w-lg">
      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-3xl bg-white shadow-lg"
        style={{ boxShadow: "0 8px 40px rgba(38,38,38,0.12)" }}
      >
        {/* Header */}
        <div className="bg-ds-primary px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10 shrink-0" aria-hidden>
              <rect x="8" y="14" width="24" height="20" rx="5" fill="white" opacity="0.2"/>
              <circle cx="15" cy="22" r="3" fill="white" opacity="0.9"/>
              <circle cx="25" cy="22" r="3" fill="white" opacity="0.9"/>
              <rect x="16" y="27" width="8" height="3" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="10" y="8" width="20" height="8" rx="4" fill="white" opacity="0.15"/>
              <circle cx="20" cy="7" r="3" fill="white" opacity="0.35"/>
            </svg>
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-xs text-white/70">Robomind</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 p-8">
          {geoError && <p className="rounded-2xl border border-ds-error/20 bg-ds-error/5 px-4 py-2.5 text-sm text-ds-error" role="alert">{geoError}</p>}

          {/* Geo selects */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{t("city")}</label>
              <select className={inputClass} value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={geoLoading || cities.length === 0} required>
                <option value="">{geoLoading ? t("selectCityLoading") : t("selectCity")}</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("district")}</label>
              <select className={inputClass} value={districtId} onChange={(e) => setDistrictId(e.target.value)} disabled={!cityId} required>
                <option value="">{t("selectDistrict")}</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("school")}</label>
              <select className={inputClass} value={schoolId} onChange={(e) => setSchoolId(e.target.value)} disabled={!districtId} required>
                <option value="">{t("selectSchool")}</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* IIN */}
          <div>
            <label className={labelClass}>{t("iin")}</label>
            <input className={inputClass} value={iin} onChange={(e) => setIin(e.target.value)} required />
          </div>

          {/* Name fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("lastName")}</label>
              <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>{t("firstName")}</label>
              <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{t("patronymic")}</label>
              <input className={inputClass} value={patronymic} onChange={(e) => setPatronymic(e.target.value)} />
            </div>
          </div>

          {/* Email + password */}
          <div>
            <label className={labelClass}>{t("email")}</label>
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <label className={labelClass}>{t("password")}</label>
            <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="rounded-2xl border border-ds-error/20 bg-ds-error/5 px-4 py-2.5 text-sm font-medium text-ds-error" role="alert">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-2xl bg-ds-primary px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-ds-primary/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? t("submitting") : t("submit")}
            </button>
            <Link href="/login" className="flex-shrink-0 rounded-2xl border border-ds-gray-border bg-ds-gray-light px-5 py-3.5 text-sm font-semibold text-ds-black transition-all hover:border-ds-primary/40 hover:text-ds-primary">
              {t("haveAccount")}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
`;

writeFileSync(join(root, "components/auth/register-form.tsx"), registerForm);
console.log("register-form.tsx patched");

console.log("\\nAll files patched successfully!");
