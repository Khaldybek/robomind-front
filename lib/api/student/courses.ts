import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";
import { fetchCourseModules, normalizeModuleList } from "@/lib/api/student/modules";
import type { CourseModuleSummary, CourseSummary, StudentProfile } from "@/lib/api/types";
import { normalizeCourseSummary } from "@/lib/course-display";

/** Один курс из тела ответа: плоский объект или `{ data: { id, ... } }` и т.п. */
function unwrapCourseDetailPayload(raw: unknown): CourseSummary | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id === "string") return o as CourseSummary;
  const nested = (key: string) => {
    const v = o[key];
    if (v && typeof v === "object" && v !== null) {
      const n = v as Record<string, unknown>;
      if (typeof n.id === "string") return n as CourseSummary;
    }
    return null;
  };
  return nested("data") ?? nested("course") ?? nested("item");
}

/** `modules` в том же JSON, что и `course` (см. `GET /app/courses/:id` или `GET .../modules`). */
function extractModulesFromDetailEnvelope(
  raw: unknown,
): CourseModuleSummary[] | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if ("modules" in o && Array.isArray(o.modules)) {
    return normalizeModuleList(o.modules);
  }
  const data = o.data;
  if (
    data &&
    typeof data === "object" &&
    "modules" in (data as Record<string, unknown>) &&
    Array.isArray((data as { modules: unknown }).modules)
  ) {
    return normalizeModuleList((data as { modules: unknown[] }).modules);
  }
  return undefined;
}

async function fetchCourseSummaryFromByIdEndpoint(
  courseId: string,
): Promise<CourseSummary | null> {
  const res = await apiFetch(STUDENT_ROUTES.COURSE_BY_ID(courseId));
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const raw = await parseJsonSafe<unknown>(res);
  const unwrapped = unwrapCourseDetailPayload(raw);
  return unwrapped ? normalizeCourseSummary(unwrapped) : null;
}

async function fetchProfileFromPath(
  path: string,
): Promise<StudentProfile | null> {
  const res = await apiFetch(path);
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  return parseJsonSafe<StudentProfile>(res);
}

/** По очереди: profile → me → users/me */
export async function fetchStudentProfile(): Promise<StudentProfile | null> {
  for (const path of [
    STUDENT_ROUTES.PROFILE,
    STUDENT_ROUTES.PROFILE_ME,
    STUDENT_ROUTES.USER_ME,
  ]) {
    const p = await fetchProfileFromPath(path);
    if (p !== null) return p;
  }
  return null;
}

/**
 * Курс + модули: часто один ответ `{ course, modules }` на `GET .../courses/:id/modules`;
 * иначе — `GET /app/courses/:id` и при необходимости отдельный запрос модулей.
 */
export async function fetchCourseDetail(
  courseId: string,
): Promise<{ course: CourseSummary | null; modules: CourseModuleSummary[] }> {
  const modulesRes = await apiFetch(STUDENT_ROUTES.COURSE_MODULES(courseId));
  if (modulesRes.ok) {
    const raw = await parseJsonSafe<unknown>(modulesRes);
    const unwrapped = unwrapCourseDetailPayload(raw);
    const embedded = extractModulesFromDetailEnvelope(raw);
    if (embedded !== undefined) {
      const course = unwrapped
        ? normalizeCourseSummary(unwrapped)
        : await fetchCourseSummaryFromByIdEndpoint(courseId);
      return { course, modules: embedded };
    }
    if (Array.isArray(raw)) {
      const modules = normalizeModuleList(raw);
      const course = await fetchCourseSummaryFromByIdEndpoint(courseId);
      return { course, modules };
    }
  }

  const res = await apiFetch(STUDENT_ROUTES.COURSE_BY_ID(courseId));
  if (res.status === 404) {
    return { course: null, modules: [] };
  }
  await throwIfNotOk(res);
  const raw = await parseJsonSafe<unknown>(res);
  const unwrapped = unwrapCourseDetailPayload(raw);
  const course = unwrapped ? normalizeCourseSummary(unwrapped) : null;

  const embedded = extractModulesFromDetailEnvelope(raw);
  if (embedded !== undefined) {
    return { course, modules: embedded };
  }

  const modules = await fetchCourseModules(courseId).catch(() => []);
  return { course, modules };
}

export async function fetchCourseById(
  courseId: string,
): Promise<CourseSummary | null> {
  const { course } = await fetchCourseDetail(courseId);
  return course;
}

export async function fetchCourses(): Promise<CourseSummary[]> {
  const res = await apiFetch(STUDENT_ROUTES.COURSES);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  let list: CourseSummary[] = [];
  if (Array.isArray(data)) list = data as CourseSummary[];
  else if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    list = (data as { data: CourseSummary[] }).data;
  } else if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    list = (data as { items: CourseSummary[] }).items;
  }
  return list.map(normalizeCourseSummary);
}
