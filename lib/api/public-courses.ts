import type { CourseSummary } from "@/lib/api/types";

function parseCoursesPayload(data: unknown): CourseSummary[] {
  if (Array.isArray(data)) return data as CourseSummary[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as CourseSummary[];
    if (Array.isArray(o.items)) return o.items as CourseSummary[];
  }
  return [];
}

/**
 * Каталог курсов для лендинга (без JWT).
 * Работает, только если бэкенд отдаёт `GET /app/courses` без авторизации;
 * иначе вернётся пустой массив — на главной покажем демо-карточки.
 */
export async function fetchPublicCoursesCatalog(): Promise<CourseSummary[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");
  if (!base) return [];
  try {
    const res = await fetch(`${base}/app/courses`, {
      next: { revalidate: 120 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    return parseCoursesPayload(json);
  } catch {
    return [];
  }
}
