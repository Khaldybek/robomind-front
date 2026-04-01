import type { CourseSummary } from "@/lib/api/types";
import { resolvePublicFileUrl } from "@/lib/env";

/** Путь/URL обложки с бэка (`thumbnailUrl` или `thumbnail_url`). */
export function pickCourseThumbnailRaw(c: CourseSummary): string | undefined {
  const raw =
    c.thumbnailUrl ??
    (typeof (c as Record<string, unknown>).thumbnail_url === "string"
      ? ((c as Record<string, unknown>).thumbnail_url as string)
      : undefined);
  const s = raw?.trim();
  return s || undefined;
}

/** Абсолютный URL для `<img src>` или `null`, если обложки нет. */
export function resolveCourseThumbnailUrl(c: CourseSummary): string | null {
  const raw = pickCourseThumbnailRaw(c);
  if (!raw) return null;
  return resolvePublicFileUrl(raw) ?? raw;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Начальный уровень",
  intermediate: "Средний уровень",
  advanced: "Продвинутый",
};

export function formatCourseLevel(c: CourseSummary): string | undefined {
  const v = c.level ?? (c as Record<string, unknown>).level;
  if (typeof v !== "string" || !v.trim()) return undefined;
  return LEVEL_LABELS[v] ?? v;
}

export function pickCourseAgeGroup(c: CourseSummary): string | undefined {
  const v =
    c.ageGroup ??
    (typeof (c as Record<string, unknown>).age_group === "string"
      ? ((c as Record<string, unknown>).age_group as string)
      : typeof (c as Record<string, unknown>).ageGroup === "string"
        ? ((c as Record<string, unknown>).ageGroup as string)
        : undefined);
  if (typeof v !== "string" || !v.trim()) return undefined;
  return v;
}
