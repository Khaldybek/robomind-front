import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";
import type { CourseSummary, StudentProfile } from "@/lib/api/types";

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

export async function fetchCourseById(
  courseId: string,
): Promise<CourseSummary | null> {
  const res = await apiFetch(STUDENT_ROUTES.COURSE_BY_ID(courseId));
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<CourseSummary>(res);
  if (data && typeof data === "object" && "id" in data) {
    return data as CourseSummary;
  }
  return null;
}

export async function fetchCourses(): Promise<CourseSummary[]> {
  const res = await apiFetch(STUDENT_ROUTES.COURSES);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data as CourseSummary[];
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: CourseSummary[] }).data;
  }
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: CourseSummary[] }).items;
  }
  return [];
}
