import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";

function num(raw: unknown, d = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : d;
}

/** Элемент `badges[]` — GET /app/gamification/me */
export type GamificationBadge = {
  key: string;
  title?: string;
  description?: string;
  icon?: string;
  earnedAt?: string;
};

/** Элемент `progressHints[]` — неполученные бейджи с числовым прогрессом */
export type GamificationProgressHint = {
  key: string;
  title?: string;
  icon?: string;
  current?: number;
  target?: number;
  percent?: number;
};

/**
 * GET /api/v1/app/gamification/me — профиль геймификации (роль student).
 * Уровни 1…20; на максимальном уровне `nextLevelXp` и `xpNeededForNextLevel` — null.
 */
export type GamificationMe = {
  xp: number;
  level: number;
  nextLevelXp: number | null;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number | null;
  /** 0–100 — заполненность полосы уровня */
  levelProgressPercent: number;
  streakDays: number;
  lastActivityAt: string | null;
  badges: GamificationBadge[];
  progressHints: GamificationProgressHint[];
};

function nullableNum(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseBadge(raw: unknown): GamificationBadge | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const key = String(b.key ?? "");
  if (!key) return null;
  const earned = b.earnedAt ?? b.earned_at;
  return {
    key,
    title: b.title != null ? String(b.title) : undefined,
    description: b.description != null ? String(b.description) : undefined,
    icon: b.icon != null ? String(b.icon) : undefined,
    earnedAt:
      earned != null && earned !== ""
        ? String(earned)
        : undefined,
  };
}

function parseProgressHint(raw: unknown): GamificationProgressHint | null {
  if (!raw || typeof raw !== "object") return null;
  const h = raw as Record<string, unknown>;
  const key = String(h.key ?? "");
  if (!key) return null;
  return {
    key,
    title: h.title != null ? String(h.title) : undefined,
    icon: h.icon != null ? String(h.icon) : undefined,
    current:
      h.current != null ? num(h.current, 0) : undefined,
    target: h.target != null ? num(h.target, 0) : undefined,
    percent:
      h.percent != null
        ? Math.min(100, Math.max(0, num(h.percent, 0)))
        : undefined,
  };
}

export async function fetchGamificationMe(): Promise<GamificationMe | null> {
  const res = await apiFetch(STUDENT_ROUTES.GAMIFICATION_ME);
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const o =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const streakDays = num(o.streakDays ?? o.streak_days ?? o.streak ?? 0);
  const xpNeededForNextLevel = nullableNum(
    o.xpNeededForNextLevel ?? o.xp_needed_for_next_level,
  );
  const nextLevelXp = nullableNum(o.nextLevelXp ?? o.next_level_xp);

  const rawPct = o.levelProgressPercent ?? o.level_progress_percent;
  const levelProgressPercent = Math.min(
    100,
    Math.max(0, rawPct === undefined || rawPct === null ? 0 : num(rawPct, 0)),
  );

  const lastRaw = o.lastActivityAt ?? o.last_activity_at;
  const lastActivityAt =
    lastRaw == null || lastRaw === "" ? null : String(lastRaw);

  const badgesRaw = o.badges;
  const badges: GamificationBadge[] = Array.isArray(badgesRaw)
    ? badgesRaw.map(parseBadge).filter((x): x is GamificationBadge => x != null)
    : [];

  const hintsRaw = o.progressHints ?? o.progress_hints;
  const progressHints: GamificationProgressHint[] = Array.isArray(hintsRaw)
    ? hintsRaw
        .map(parseProgressHint)
        .filter((x): x is GamificationProgressHint => x != null)
    : [];

  return {
    xp: num(o.xp, 0),
    level: Math.min(20, Math.max(1, num(o.level, 1))),
    nextLevelXp,
    xpInCurrentLevel: num(o.xpInCurrentLevel ?? o.xp_in_current_level, 0),
    xpNeededForNextLevel,
    levelProgressPercent,
    streakDays,
    lastActivityAt,
    badges,
    progressHints,
  };
}

/** Место ученика в рейтинге (глобально или в школе) */
export type GamificationMyRank = {
  rank: number;
  total: number;
  xp?: number;
  level?: number;
  streakDays?: number;
  [key: string]: unknown;
};

function normalizeMyRank(raw: Record<string, unknown>): GamificationMyRank {
  return {
    ...raw,
    rank: num(raw.rank, 0),
    total: num(raw.total, 0),
    xp: raw.xp != null ? num(raw.xp, 0) : undefined,
    level: raw.level != null ? num(raw.level, 1) : undefined,
    streakDays:
      raw.streakDays != null
        ? num(raw.streakDays ?? raw.streak_days, 0)
        : undefined,
  };
}

/**
 * GET /app/gamification/my-rank?schoolId=
 * Без `schoolId` — глобальный топ; с UUID школы — ранг только среди этой школы.
 */
export async function fetchGamificationMyRank(
  schoolId?: string | null,
): Promise<GamificationMyRank | null> {
  const q = new URLSearchParams();
  if (schoolId?.trim()) q.set("schoolId", schoolId.trim());
  const qs = q.toString();
  const path = `${STUDENT_ROUTES.GAMIFICATION_MY_RANK}${qs ? `?${qs}` : ""}`;
  const res = await apiFetch(path);
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const inner =
    o.data && typeof o.data === "object"
      ? (o.data as Record<string, unknown>)
      : o;
  return normalizeMyRank(inner);
}

export type LeaderboardEntry = {
  rank?: number;
  userId?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  xp?: number;
  level?: number;
  streakDays?: number;
  [key: string]: unknown;
};

export async function fetchGamificationLeaderboard(query?: {
  schoolId?: string;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const q = new URLSearchParams();
  if (query?.schoolId?.trim()) q.set("schoolId", query.schoolId.trim());
  if (typeof query?.limit === "number" && query.limit > 0) {
    q.set("limit", String(query.limit));
  }
  const s = q.toString();
  const path = `${STUDENT_ROUTES.GAMIFICATION_LEADERBOARD}${s ? `?${s}` : ""}`;
  const res = await apiFetch(path);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data as LeaderboardEntry[];
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: LeaderboardEntry[] }).items;
  }
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: LeaderboardEntry[] }).data;
  }
  return [];
}
