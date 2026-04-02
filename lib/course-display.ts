import type { CourseSummary } from "@/lib/api/types";
import { resolvePublicFileUrl } from "@/lib/env";

/** Путь/URL обложки с бэка (`thumbnailUrl`, `thumbnail_url`, иногда `thumbnail`). */
export function pickCourseThumbnailRaw(c: CourseSummary): string | undefined {
  const r = c as Record<string, unknown>;
  const raw =
    c.thumbnailUrl ??
    (typeof r.thumbnail_url === "string" ? r.thumbnail_url : undefined) ??
    (typeof r.thumbnail === "string" ? r.thumbnail : undefined);
  const s = typeof raw === "string" ? raw.trim() : "";
  return s || undefined;
}

/**
 * Приводит ответ бэка к полям, которые ждёт UI (`title`, `thumbnailUrl`).
 */
export function normalizeCourseSummary(c: CourseSummary): CourseSummary {
  const r = c as Record<string, unknown>;
  const titleCandidates = [
    c.title,
    c.name,
    r.courseTitle,
    r.course_title,
    r.name,
  ];
  let title: string | undefined;
  for (const v of titleCandidates) {
    if (typeof v === "string" && v.trim()) {
      title = v.trim();
      break;
    }
  }
  const thumb = pickCourseThumbnailRaw(c);
  return {
    ...c,
    ...(title ? { title } : {}),
    ...(thumb ? { thumbnailUrl: thumb } : {}),
  };
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
