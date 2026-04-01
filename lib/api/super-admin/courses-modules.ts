import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type CourseSort =
  | "order_asc"
  | "order_desc"
  | "title_asc"
  | "title_desc"
  | "createdAt_asc"
  | "createdAt_desc";

/** Курс в админке (список, GET :id, POST, PATCH) */
export type AdminCourse = {
  id: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string | null;
  ageGroup: string | null;
  moduleCount: number;
  studentsCount: number;
};

export type AdminCourseList = {
  items: AdminCourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

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
  };
}

function buildCoursesQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
  level?: CourseLevel;
  sort?: CourseSort;
}): string {
  const u = new URLSearchParams();
  if (params.page != null) u.set("page", String(params.page));
  if (params.limit != null) u.set("limit", String(params.limit));
  if (params.search?.trim()) u.set("search", params.search.trim());
  if (params.isPublished !== undefined)
    u.set("isPublished", String(params.isPublished));
  if (params.level) u.set("level", params.level);
  if (params.sort) u.set("sort", params.sort);
  const s = u.toString();
  return s ? `?${s}` : "";
}

export async function listAdminCourses(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
  level?: CourseLevel;
  sort?: CourseSort;
}): Promise<AdminCourseList> {
  const q = buildCoursesQuery({
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    search: params?.search,
    isPublished: params?.isPublished,
    level: params?.level,
    sort: params?.sort ?? "order_asc",
  });
  const res = await apiSuperAdminFetch(`${SUPER_ADMIN_ROUTES.COURSES}${q}`);
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

export async function getAdminCourse(courseId: string): Promise<AdminCourse> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.COURSE(courseId));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapCourse(data ?? {});
}

export type CreateCourseBody = {
  title: string;
  level: CourseLevel;
  description?: string;
  isPublished?: boolean;
  order?: number;
  thumbnailUrl?: string;
  ageGroup?: string;
};

export type PatchCourseBody = Partial<{
  title: string;
  description: string | null;
  level: CourseLevel;
  isPublished: boolean;
  order: number;
  thumbnailUrl: string | null;
  ageGroup: string | null;
}>;

/** Поля курса в `multipart/form-data` (те же имена, что в JSON). Файл — поле `thumbnail`. */
function appendCourseFormFields(
  fd: FormData,
  body: CreateCourseBody | PatchCourseBody,
  options?: { skipThumbnailUrl?: boolean },
): void {
  const skipUrl = options?.skipThumbnailUrl === true;
  if ("title" in body && body.title !== undefined) {
    fd.append("title", body.title);
  }
  if ("level" in body && body.level !== undefined) {
    fd.append("level", body.level);
  }
  if ("description" in body && body.description !== undefined) {
    fd.append("description", body.description ?? "");
  }
  if ("isPublished" in body && body.isPublished !== undefined) {
    fd.append("isPublished", String(body.isPublished));
  }
  if ("order" in body && body.order !== undefined) {
    fd.append("order", String(body.order));
  }
  if (
    !skipUrl &&
    "thumbnailUrl" in body &&
    body.thumbnailUrl !== undefined
  ) {
    fd.append("thumbnailUrl", body.thumbnailUrl ?? "");
  }
  if ("ageGroup" in body && body.ageGroup !== undefined) {
    fd.append("ageGroup", body.ageGroup ?? "");
  }
}

export type SaveCourseOptions = {
  /** Файл обложки: те же MIME, что у `POST /admin/upload/image` (jpeg, png, gif, webp, svg). */
  thumbnail?: File | null;
};

export async function createSuperCourse(
  body: CreateCourseBody,
  options?: SaveCourseOptions,
): Promise<AdminCourse> {
  const file = options?.thumbnail ?? null;
  const res =
    file && file.size > 0
      ? await (() => {
          const fd = new FormData();
          appendCourseFormFields(fd, body, { skipThumbnailUrl: true });
          fd.append("thumbnail", file);
          return apiSuperAdminFetch(SUPER_ADMIN_ROUTES.COURSES, {
            method: "POST",
            body: fd,
          });
        })()
      : await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.COURSES, {
          method: "POST",
          body: JSON.stringify(body),
        });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapCourse(data ?? {});
}

/**
 * `PATCH /admin/courses/:courseId`
 *
 * - **`application/json`** — передайте только нужные поля, в т.ч. `thumbnailUrl` строкой.
 * - **`multipart/form-data`** — передайте `options.thumbnail` (файл). В FormData можно:
 *   - только поле **`thumbnail`** (тело `PatchCourseBody` = `{}`);
 *   - **`thumbnail`** + любые поля из `body` (title, description, …).
 *   Если есть файл `thumbnail`, поле `thumbnailUrl` в multipart не добавляется (бэкенд перезапишет URL после загрузки).
 */
export async function updateAdminCourse(
  courseId: string,
  body: PatchCourseBody,
  options?: SaveCourseOptions,
): Promise<AdminCourse> {
  const file = options?.thumbnail ?? null;
  const res =
    file && file.size > 0
      ? await (() => {
          const fd = new FormData();
          appendCourseFormFields(fd, body, { skipThumbnailUrl: true });
          fd.append("thumbnail", file);
          return apiSuperAdminFetch(SUPER_ADMIN_ROUTES.COURSE(courseId), {
            method: "PATCH",
            body: fd,
          });
        })()
      : await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.COURSE(courseId), {
          method: "PATCH",
          body: JSON.stringify(body),
        });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapCourse(data ?? {});
}

export async function deleteAdminCourse(courseId: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.COURSE(courseId), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

/** @deprecated для нового кода — используйте listAdminCourses */
export type CourseRow = AdminCourse;

export async function fetchSuperCourses(): Promise<CourseRow[]> {
  const { items } = await listAdminCourses({ page: 1, limit: 100 });
  return items;
}

/** Сортировка списка модулей (как у курсов) */
export type ModuleSort =
  | "order_asc"
  | "order_desc"
  | "title_asc"
  | "title_desc"
  | "createdAt_asc"
  | "createdAt_desc";

export type AdminModule = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  unlockAfterModuleId: string | null;
  createdAt: string;
  updatedAt: string;
  contentCount: number;
  progressCount: number;
  hasQuiz: boolean;
  quizId: string | null;
};

export type AdminModuleList = {
  items: AdminModule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function mapModule(raw: Record<string, unknown>): AdminModule {
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
    unlockAfterModuleId:
      raw.unlockAfterModuleId != null
        ? String(raw.unlockAfterModuleId)
        : raw.unlock_after_module_id != null
          ? String(raw.unlock_after_module_id)
          : null,
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

/** Query как у `GET /admin/modules`, но без courseId — он в пути `.../courses/:courseId/modules` */
function buildModulesListQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
  sort?: ModuleSort;
}): string {
  const u = new URLSearchParams();
  if (params.page != null) u.set("page", String(params.page));
  if (params.limit != null) u.set("limit", String(params.limit));
  if (params.search?.trim()) u.set("search", params.search.trim());
  if (params.isPublished !== undefined)
    u.set("isPublished", String(params.isPublished));
  if (params.sort) u.set("sort", params.sort);
  const s = u.toString();
  return s ? `?${s}` : "";
}

/**
 * Список модулей курса: `GET /admin/courses/:courseId/modules`
 * (те же query, что у `GET /admin/modules?courseId=…`, ответ тот же).
 */
export async function listAdminModules(params: {
  courseId: string;
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
  sort?: ModuleSort;
}): Promise<AdminModuleList> {
  const q = buildModulesListQuery({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search,
    isPublished: params.isPublished,
    sort: params.sort ?? "order_asc",
  });
  const res = await apiSuperAdminFetch(
    `${SUPER_ADMIN_ROUTES.COURSE_MODULES(params.courseId)}${q}`,
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

export async function getAdminModule(moduleId: string): Promise<AdminModule> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.MODULE(moduleId));
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapModule(d ?? {});
}

export type CreateModuleBody = {
  courseId: string;
  title: string;
  description?: string;
  order?: number;
  isPublished?: boolean;
  unlockAfterModuleId?: string | null;
};

export async function createSuperModule(
  body: CreateModuleBody,
): Promise<AdminModule> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.MODULES, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapModule(d ?? {});
}

export type PatchModuleBody = Partial<{
  title: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  unlockAfterModuleId: string | null;
}>;

export async function updateAdminModule(
  moduleId: string,
  body: PatchModuleBody,
): Promise<AdminModule> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.MODULE(moduleId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapModule(d ?? {});
}

export async function deleteAdminModule(moduleId: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.MODULE(moduleId), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

/** @deprecated используйте listAdminModules */
export type ModuleRow = AdminModule;

/** Список модулей курса (до 100 шт., сортировка по порядку) */
export async function fetchCourseModulesAdmin(
  courseId: string,
): Promise<AdminModule[]> {
  const { items } = await listAdminModules({
    courseId,
    page: 1,
    limit: 100,
    sort: "order_asc",
  });
  return items;
}

export type ContentBlockType =
  | "image"
  | "video"
  | "file"
  | "text"
  | "livestream"
  | "link";

export type AdminContentBlock = {
  id: string;
  moduleId: string;
  type: ContentBlockType;
  title: string | null;
  content: string | null;
  fileUrl: string | null;
  duration: number | null;
  order: number;
  livestreamUrl: string | null;
  livestreamStartsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapContentBlock(raw: Record<string, unknown>): AdminContentBlock {
  const t = String(raw.type ?? "text") as ContentBlockType;
  return {
    id: String(raw.id ?? ""),
    moduleId: String(raw.moduleId ?? raw.module_id ?? ""),
    type: (
      [
        "image",
        "video",
        "file",
        "text",
        "livestream",
        "link",
      ].includes(t)
        ? t
        : "text"
    ) as ContentBlockType,
    title:
      raw.title === null || raw.title === undefined
        ? null
        : String(raw.title),
    content:
      raw.content === null || raw.content === undefined
        ? null
        : String(raw.content),
    fileUrl:
      raw.fileUrl != null
        ? String(raw.fileUrl)
        : raw.file_url != null
          ? String(raw.file_url)
          : null,
    duration:
      raw.duration === null || raw.duration === undefined
        ? null
        : num(raw.duration, 0),
    order: num(raw.order, 0),
    livestreamUrl:
      raw.livestreamUrl != null
        ? String(raw.livestreamUrl)
        : raw.livestream_url != null
          ? String(raw.livestream_url)
          : null,
    livestreamStartsAt:
      raw.livestreamStartsAt != null
        ? String(raw.livestreamStartsAt)
        : raw.livestream_starts_at != null
          ? String(raw.livestream_starts_at)
          : null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

export async function listModuleContents(
  moduleId: string,
): Promise<AdminContentBlock[]> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.MODULE_CONTENTS(moduleId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  const arr = Array.isArray(data) ? data : [];
  return arr.map((x) =>
    mapContentBlock(
      typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
    ),
  );
}

export type CreateContentBody = {
  type: ContentBlockType;
  title?: string;
  content?: string;
  fileUrl?: string;
  duration?: number;
  order?: number;
  livestreamUrl?: string;
  livestreamStartsAt?: string;
};

export async function createModuleContent(
  moduleId: string,
  body: CreateContentBody,
): Promise<AdminContentBlock> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.MODULE_CONTENT(moduleId),
    { method: "POST", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapContentBlock(d ?? {});
}

/** Алиас POST …/contents */
export async function createModuleContentAtContents(
  moduleId: string,
  body: CreateContentBody,
): Promise<AdminContentBlock> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.MODULE_CONTENTS(moduleId),
    { method: "POST", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapContentBlock(d ?? {});
}

/** Тип файла для `POST .../contents/from-file` (multipart) */
export type ContentFromFileKind = "image" | "video" | "file";

/**
 * `POST /admin/modules/:moduleId/contents/from-file` — multipart/form-data.
 * Обязательно: `file`, `type`. Опционально: `title`, `order`, `content`.
 * Файл обрабатывается как в `/admin/upload/*`, в блок пишется `fileUrl` вида `/api/v1/files/...`.
 */
export async function createModuleContentFromFile(
  moduleId: string,
  params: {
    file: File;
    type: ContentFromFileKind;
    title?: string;
    order?: number;
    content?: string;
  },
): Promise<AdminContentBlock> {
  const fd = new FormData();
  fd.append("file", params.file);
  fd.append("type", params.type);
  if (params.title != null && params.title !== "")
    fd.append("title", params.title);
  if (params.order != null) fd.append("order", String(params.order));
  if (params.content != null && params.content !== "")
    fd.append("content", params.content);
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.MODULE_CONTENT_FROM_FILE(moduleId),
    { method: "POST", body: fd },
  );
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapContentBlock(d ?? {});
}

/** Префикс допустимого `fileUrl` для блоков типа `image` на этом бэкенде. */
export const BACKEND_IMAGE_FILE_URL_PREFIX = "/api/v1/files/images/";

export function isAllowedImageBlockFileUrl(url: string | null | undefined): boolean {
  if (url == null || String(url).trim() === "") return false;
  const u = String(url).trim();
  if (!u.startsWith("/")) return false;
  if (u.startsWith("//")) return false;
  return u.startsWith(BACKEND_IMAGE_FILE_URL_PREFIX);
}

export type PatchContentBody = Partial<{
  title: string | null;
  content: string | null;
  fileUrl: string | null;
  duration: number | null;
  order: number;
  livestreamUrl: string | null;
  livestreamStartsAt: string | null;
}>;

/**
 * `PATCH .../contents/:contentId`.
 * Для блока **`image`**: `fileUrl` должен оставаться путём на этот бэкенд
 * (`/api/v1/files/images/...`), не внешний `http(s)://`.
 */
export async function updateModuleContent(
  moduleId: string,
  contentId: string,
  body: PatchContentBody,
): Promise<AdminContentBlock> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.MODULE_CONTENT_ITEM(moduleId, contentId),
    { method: "PATCH", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapContentBlock(d ?? {});
}

export async function deleteModuleContent(
  moduleId: string,
  contentId: string,
): Promise<void> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.MODULE_CONTENT_ITEM(moduleId, contentId),
    { method: "DELETE" },
  );
  await throwIfNotOk(res);
}

/** @deprecated используйте createModuleContent */
export async function addModuleContent(
  moduleId: string,
  body: Record<string, unknown>,
): Promise<AdminContentBlock> {
  return createModuleContent(moduleId, body as CreateContentBody);
}

/** `GET /admin/courses/:courseId/accesses` — список выданных доступов */
export async function fetchSuperCourseAccesses(
  courseId: string,
): Promise<unknown> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.COURSE_ACCESSES(courseId),
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

/** `POST /admin/courses/:courseId/access` — выдача доступа ученику (`role: student`). */
export type GrantCourseAccessBody = {
  userId: string;
  accessType: "permanent" | "temporary";
  /** ISO datetime, для `temporary` */
  expiresAt?: string;
};

export async function grantSuperCourseAccess(
  courseId: string,
  body: GrantCourseAccessBody,
): Promise<unknown> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.COURSE_ACCESS(courseId),
    { method: "POST", body: JSON.stringify(body) },
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export type GrantSuperCourseAccessBulkResult = {
  grantedCount: number;
  granted: unknown[];
  errors: { userId: string; code: string }[];
};

export async function grantSuperCourseAccessBulk(
  courseId: string,
  body: {
    userIds: string[];
    accessType: "permanent" | "temporary";
    expiresAt?: string;
  },
): Promise<GrantSuperCourseAccessBulkResult> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.COURSE_ACCESS_BULK(courseId),
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

export async function revokeSuperCourseAccess(
  courseId: string,
  userId: string,
): Promise<void> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.COURSE_ACCESS_REVOKE(courseId, userId),
    { method: "DELETE" },
  );
  await throwIfNotOk(res);
}

/** Студент курса из `GET /admin/courses/:courseId/students` (доступ или прогресс по курсу). */
export type CourseStudentRow = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string | null;
  iin?: string | null;
  role?: string;
  isActive?: boolean;
  schoolId?: string | null;
  [key: string]: unknown;
};

/**
 * `GET /admin/courses/:courseId/students` — студенты с доступом **или** с прогрессом по курсу.
 */
export async function fetchSuperCourseStudents(
  courseId: string,
): Promise<CourseStudentRow[]> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.COURSE_STUDENTS(courseId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data as CourseStudentRow[];
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: CourseStudentRow[] }).items;
  }
  return [];
}
