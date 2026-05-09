import {
  apiSchoolAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/school-admin/client";
import { SCHOOL_ADMIN_ROUTES } from "@/lib/api/school-admin/routes";
import {
  parseAdminContentBlock,
  type AdminContentBlock,
  type AdminCourse,
  type AdminCourseList,
  type AdminLessonRow,
  type AdminModule,
  type AdminModuleList,
  type CourseLevel,
  type CourseSort,
  type ModuleSort,
} from "@/lib/api/super-admin/courses-modules";
import type { AdminQuiz } from "@/lib/api/super-admin/quizzes";
import { parseAdminQuizPayload } from "@/lib/api/super-admin/quizzes";

function num(raw: unknown, d = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : d;
}

function mapCourse(raw: Record<string, unknown>): AdminCourse {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    description:
      raw.description === null || raw.description === undefined
        ? null
        : String(raw.description),
    level: (String(raw.level ?? "beginner") as CourseLevel) || "beginner",
    isPublished: Boolean(raw.isPublished ?? raw.is_published),
    order: num(raw.order, 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
    thumbnailUrl:
      raw.thumbnailUrl != null
        ? String(raw.thumbnailUrl)
        : raw.thumbnail_url != null
          ? String(raw.thumbnail_url)
          : null,
    ageGroup:
      raw.ageGroup != null
        ? String(raw.ageGroup)
        : raw.age_group != null
          ? String(raw.age_group)
          : null,
    moduleCount: num(raw.moduleCount ?? raw.module_count, 0),
    studentsCount: num(raw.studentsCount ?? raw.students_count, 0),
    defaultMaxQuizAttempts: (() => {
      const d = raw.defaultMaxQuizAttempts ?? raw.default_max_quiz_attempts;
      if (d === null || d === undefined || d === "") return null;
      const v = num(d, 0);
      return v >= 1 && v <= 99 ? v : null;
    })(),
  };
}

function mapModule(raw: Record<string, unknown>): AdminModule {
  const unlockCourse =
    raw.unlockAfterCourseModuleId != null
      ? String(raw.unlockAfterCourseModuleId)
      : raw.unlock_after_course_module_id != null
        ? String(raw.unlock_after_course_module_id)
        : null;
  const unlockLegacy =
    raw.unlockAfterModuleId != null
      ? String(raw.unlockAfterModuleId)
      : raw.unlock_after_module_id != null
        ? String(raw.unlock_after_module_id)
        : null;
  return {
    id: String(raw.id ?? ""),
    courseId: String(raw.courseId ?? raw.course_id ?? ""),
    title: String(raw.title ?? ""),
    description:
      raw.description === null || raw.description === undefined
        ? null
        : String(raw.description),
    order: num(raw.order, 0),
    isPublished: Boolean(raw.isPublished ?? raw.is_published),
    unlockAfterCourseModuleId: unlockCourse ?? unlockLegacy,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
    contentCount: num(raw.contentCount ?? raw.content_count, 0),
    progressCount: num(raw.progressCount ?? raw.progress_count, 0),
    hasQuiz: Boolean(raw.hasQuiz ?? raw.has_quiz),
    quizId:
      raw.quizId != null
        ? String(raw.quizId)
        : raw.quiz_id != null
          ? String(raw.quiz_id)
          : null,
  };
}

function mapLessonRow(raw: Record<string, unknown>): AdminLessonRow {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    description:
      raw.description === null || raw.description === undefined
        ? null
        : String(raw.description),
    order: num(raw.order, 0),
    unlockAfterLessonId:
      raw.unlockAfterLessonId != null
        ? String(raw.unlockAfterLessonId)
        : raw.unlock_after_lesson_id != null
          ? String(raw.unlock_after_lesson_id)
          : null,
    isPublished: Boolean(raw.isPublished ?? raw.is_published),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

/** `GET /admin/lessons?courseModuleId=` — уроки раздела курса */
export async function listSchoolAdminLessons(params: {
  courseModuleId: string;
  page?: number;
  limit?: number;
}): Promise<{ items: AdminLessonRow[]; total: number }> {
  const u = new URLSearchParams({
    courseModuleId: params.courseModuleId,
  });
  if (params.page != null) u.set("page", String(params.page));
  if (params.limit != null) u.set("limit", String(params.limit));
  const res = await apiSchoolAdminFetch(`${SCHOOL_ADMIN_ROUTES.LESSONS}?${u}`);
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  const itemsRaw = (data.items as unknown[]) ?? [];
  return {
    items: itemsRaw.map((x) =>
      mapLessonRow(
        typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
      ),
    ),
    total: num(data.total, itemsRaw.length),
  };
}

function buildCoursesQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  level?: CourseLevel;
  sort?: CourseSort;
}): string {
  const u = new URLSearchParams();
  if (params.page != null) u.set("page", String(params.page));
  if (params.limit != null) u.set("limit", String(params.limit));
  if (params.search?.trim()) u.set("search", params.search.trim());
  if (params.level) u.set("level", params.level);
  if (params.sort) u.set("sort", params.sort);
  const s = u.toString();
  return s ? `?${s}` : "";
}

function buildModulesListQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: ModuleSort;
}): string {
  const u = new URLSearchParams();
  if (params.page != null) u.set("page", String(params.page));
  if (params.limit != null) u.set("limit", String(params.limit));
  if (params.search?.trim()) u.set("search", params.search.trim());
  if (params.sort) u.set("sort", params.sort);
  const s = u.toString();
  return s ? `?${s}` : "";
}

/** Элемент списка курсов (как в супер-админке); `studentsCount` — только ученики школы. */
export type AdminCourseRow = AdminCourse;

export type AdminCoursesListResult = AdminCourseList;

/**
 * `GET /admin/courses` — только опубликованные курсы.
 * Query как у супер-админа (`page`, `limit`, `search`, `level`, `sort`); `isPublished` с клиента не нужен.
 */
export async function fetchSchoolAdminCourses(params?: {
  page?: number;
  limit?: number;
  search?: string;
  level?: CourseLevel;
  sort?: CourseSort;
}): Promise<AdminCourseList> {
  const q = buildCoursesQuery({
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    search: params?.search,
    level: params?.level,
    sort: params?.sort ?? "order_asc",
  });
  const res = await apiSchoolAdminFetch(
    `${SCHOOL_ADMIN_ROUTES.COURSES}${q}`,
  );
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  const itemsRaw = (data.items as unknown[]) ?? [];
  return {
    items: itemsRaw.map((x) =>
      mapCourse(
        typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
      ),
    ),
    total: num(data.total, 0),
    page: num(data.page, 1),
    limit: num(data.limit, 20),
    totalPages: Math.max(1, num(data.totalPages ?? data.total_pages, 1)),
  };
}

/** `GET /admin/courses/:courseId` — один курс; неопубликованный → **404**. */
export async function fetchSchoolAdminCourse(
  courseId: string,
): Promise<AdminCourse> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.COURSE(courseId));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapCourse(data ?? {});
}

/**
 * `GET /admin/courses/:courseId/modules` — опубликованные модули опубликованного курса.
 * Query: `page`, `limit`, `search`, `sort` (как в админке модулей).
 */
export async function listSchoolAdminCourseModules(params: {
  courseId: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: ModuleSort;
}): Promise<AdminModuleList> {
  const q = buildModulesListQuery({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search,
    sort: params.sort ?? "order_asc",
  });
  const res = await apiSchoolAdminFetch(
    `${SCHOOL_ADMIN_ROUTES.COURSE_MODULES(params.courseId)}${q}`,
  );
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  const itemsRaw = (data.items as unknown[]) ?? [];
  return {
    items: itemsRaw.map((x) =>
      mapModule(
        typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
      ),
    ),
    total: num(data.total, 0),
    page: num(data.page, 1),
    limit: num(data.limit, 20),
    totalPages: Math.max(1, num(data.totalPages ?? data.total_pages, 1)),
  };
}

/** @deprecated используйте `fetchSchoolAdminCourses` */
export async function fetchAdminCourses(): Promise<AdminCoursesListResult> {
  return fetchSchoolAdminCourses();
}

export type CourseSchoolStudentRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  isActive: boolean;
};

function mapCourseStudent(raw: Record<string, unknown>): CourseSchoolStudentRow {
  return {
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    firstName: String(raw.firstName ?? raw.first_name ?? ""),
    lastName: String(raw.lastName ?? raw.last_name ?? ""),
    schoolId: String(raw.schoolId ?? raw.school_id ?? ""),
    isActive: Boolean(raw.isActive ?? raw.is_active),
  };
}

/** `GET /admin/courses/:courseId/accesses` — выданные доступы */
export async function fetchCourseAccesses(
  courseId: string,
): Promise<unknown> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.COURSE_ACCESSES(courseId),
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

/** `POST /admin/courses/:courseId/access` — **201**, запись доступа (`grantedBy` = текущий админ) */
export async function grantCourseAccess(
  courseId: string,
  body: {
    userId: string;
    accessType: "permanent" | "temporary";
    expiresAt?: string;
    maxQuizAttempts?: number;
  },
): Promise<unknown> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.COURSE_ACCESS(courseId),
    { method: "POST", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export type BulkAccessError = {
  userId: string;
  code: string;
};

export type GrantCourseAccessBulkResult = {
  grantedCount: number;
  granted: unknown[];
  errors: BulkAccessError[];
};

/** `POST /admin/courses/:courseId/access/bulk` — **201** */
export async function grantCourseAccessBulk(
  courseId: string,
  body: {
    userIds: string[];
    accessType: "permanent" | "temporary";
    expiresAt?: string;
    maxQuizAttempts?: number;
  },
): Promise<GrantCourseAccessBulkResult> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.COURSE_ACCESS_BULK(courseId),
    { method: "POST", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  const data =
    (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  const grantedRaw = (data.granted as unknown[]) ?? [];
  const errorsRaw = (data.errors as unknown[]) ?? [];
  return {
    grantedCount: Number(data.grantedCount ?? data.granted_count ?? 0),
    granted: grantedRaw,
    errors: errorsRaw.map((e) => {
      if (e && typeof e === "object") {
        const o = e as Record<string, unknown>;
        return {
          userId: String(o.userId ?? o.user_id ?? ""),
          code: String(o.code ?? ""),
        };
      }
      return { userId: "", code: "unknown" };
    }),
  };
}

export async function revokeCourseAccess(
  courseId: string,
  userId: string,
): Promise<void> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.COURSE_ACCESS_REVOKE(courseId, userId),
    { method: "DELETE" },
  );
  await throwIfNotOk(res);
}

/** `PATCH /admin/courses/:courseId/access/:userId` — в т.ч. `maxQuizAttempts` (1–99 или null). */
export async function patchCourseAccess(
  courseId: string,
  userId: string,
  body: { maxQuizAttempts?: number | null },
): Promise<unknown> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.COURSE_ACCESS_REVOKE(courseId, userId),
    { method: "PATCH", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

/** Ученики школы с доступом к курсу или прогрессом по курсу. */
export async function fetchCourseStudents(
  courseId: string,
): Promise<CourseSchoolStudentRow[]> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.COURSE_STUDENTS(courseId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) {
    return data.map((row) =>
      row && typeof row === "object"
        ? mapCourseStudent(row as Record<string, unknown>)
        : mapCourseStudent({}),
    );
  }
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: unknown[] }).items.map((row) =>
      row && typeof row === "object"
        ? mapCourseStudent(row as Record<string, unknown>)
        : mapCourseStudent({}),
    );
  }
  return [];
}

/** `GET /admin/course-modules/:courseModuleId` — секция курса (school_admin: 404 при неопубликованном). */
export async function fetchSchoolAdminCourseModule(
  courseModuleId: string,
): Promise<AdminModule> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.COURSE_MODULE(courseModuleId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapModule(data ?? {});
}

/** `GET /admin/lessons/:lessonId` — метаданные урока (school_admin: только опубликованная цепочка). */
export async function getSchoolAdminLesson(
  lessonId: string,
): Promise<AdminModule> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.LESSON(lessonId));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapModule(data ?? {});
}

/** `GET /admin/lessons/:lessonId/contents` */
export async function listSchoolAdminLessonContents(
  lessonId: string,
): Promise<AdminContentBlock[]> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.LESSON_CONTENTS(lessonId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  const arr = Array.isArray(data) ? data : [];
  return arr.map((x) =>
    parseAdminContentBlock(
      typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
    ),
  );
}

/** `GET /admin/lessons/:lessonId/quiz` */
export async function getSchoolAdminLessonQuiz(
  lessonId: string,
): Promise<AdminQuiz | null> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.LESSON_QUIZ(lessonId),
  );
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return parseAdminQuizPayload(data);
}

export type { CourseLevel, CourseSort, ModuleSort };
