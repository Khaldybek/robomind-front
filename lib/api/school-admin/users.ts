import {
  apiSchoolAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/school-admin/client";
import { SCHOOL_ADMIN_ROUTES } from "@/lib/api/school-admin/routes";

function num(raw: unknown, d = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : d;
}

export type SchoolStudentRow = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string | null;
  iin?: string;
  role?: string;
  isActive?: boolean;
  schoolId?: string;
  school?: { id: string; name: string; number?: number | null };
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

/**
 * Заголовок карточки: не дублирует email в ФИО; отбрасывает подозрительные «имена» с @.
 */
export function schoolStudentDisplayHeading(
  u: Pick<SchoolStudentRow, "email" | "firstName" | "lastName" | "patronymic">,
): string {
  const email = (u.email ?? "").trim();
  const emailLc = email.toLowerCase();
  const pieces = [u.lastName, u.firstName, u.patronymic]
    .map((x) => (x != null ? String(x).trim() : ""))
    .filter(Boolean);

  const nameParts: string[] = [];
  const seen = new Set<string>();
  for (const p of pieces) {
    const pl = p.toLowerCase();
    if (seen.has(pl)) continue;
    if (emailLc && pl === emailLc) continue;
    if (p.includes("@")) continue;
    seen.add(pl);
    nameParts.push(p);
  }

  if (nameParts.length > 0) return nameParts.join(" ");
  if (email) return email;
  return "";
}

export type UsersListResponse = {
  items: SchoolStudentRow[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

/** Частичное обновление `PUT /admin/users/:userId` — только эти поля (остальное → 403). */
export type UpdateSchoolUserBody = {
  firstName?: string;
  lastName?: string;
  patronymic?: string | null;
  isActive?: boolean;
  avatarUrl?: string | null;
  /** мин. 8 символов — смена пароля ученика */
  password?: string;
};

export type UserProgressRowAdmin = {
  id: string;
  courseId: string;
  courseTitle?: string | null;
  moduleId: string;
  moduleTitle?: string | null;
  status: string;
  completedAt?: string | null;
  watchedSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export type UserCertificateRowAdmin = {
  id: string;
  courseId: string;
  courseTitle?: string | null;
  issuedAt: string;
  pdfUrl?: string | null;
  uniqueCode: string;
  createdAt: string;
};

/** Метаданные попыток квиза; тексты ответов API не отдаёт. */
export type UserQuizAttemptRowAdmin = {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  isPassed: boolean;
  startedAt: string | null;
  completedAt: string | null;
  hasStoredAnswers: boolean;
  courseId: string;
  courseTitle: string | null;
  moduleId: string;
  moduleTitle: string | null;
  quizTitle: string | null;
  createdAt: string;
};

function normalizeProgressRow(raw: Record<string, unknown>): UserProgressRowAdmin {
  return {
    id: String(raw.id ?? ""),
    courseId: String(raw.courseId ?? raw.course_id ?? ""),
    courseTitle:
      (raw.courseTitle ?? raw.course_title) as string | null | undefined,
    moduleId: String(raw.moduleId ?? raw.module_id ?? ""),
    moduleTitle:
      (raw.moduleTitle ?? raw.module_title) as string | null | undefined,
    status: String(raw.status ?? ""),
    completedAt:
      (raw.completedAt ?? raw.completed_at) as string | null | undefined,
    watchedSeconds: num(raw.watchedSeconds ?? raw.watched_seconds, 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

function normalizeCertificateRow(
  raw: Record<string, unknown>,
): UserCertificateRowAdmin {
  return {
    id: String(raw.id ?? ""),
    courseId: String(raw.courseId ?? raw.course_id ?? ""),
    courseTitle:
      (raw.courseTitle ?? raw.course_title) as string | null | undefined,
    issuedAt: String(raw.issuedAt ?? raw.issued_at ?? ""),
    pdfUrl: (raw.pdfUrl ?? raw.pdf_url) as string | null | undefined,
    uniqueCode: String(raw.uniqueCode ?? raw.unique_code ?? ""),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}

function normalizeQuizAttemptRow(
  raw: Record<string, unknown>,
): UserQuizAttemptRowAdmin {
  return {
    id: String(raw.id ?? ""),
    quizId: String(raw.quizId ?? raw.quiz_id ?? ""),
    userId: String(raw.userId ?? raw.user_id ?? ""),
    score: num(raw.score, 0),
    maxScore: num(raw.maxScore ?? raw.max_score, 0),
    isPassed: Boolean(raw.isPassed ?? raw.is_passed),
    startedAt:
      raw.startedAt != null
        ? String(raw.startedAt)
        : raw.started_at != null
          ? String(raw.started_at)
          : null,
    completedAt:
      raw.completedAt != null
        ? String(raw.completedAt)
        : raw.completed_at != null
          ? String(raw.completed_at)
          : null,
    hasStoredAnswers: Boolean(
      raw.hasStoredAnswers ?? raw.has_stored_answers,
    ),
    courseId: String(raw.courseId ?? raw.course_id ?? ""),
    courseTitle: (() => {
      const v = raw.courseTitle ?? raw.course_title;
      if (v === undefined || v === null) return null;
      return String(v);
    })(),
    moduleId: String(raw.moduleId ?? raw.module_id ?? ""),
    moduleTitle: (() => {
      const v = raw.moduleTitle ?? raw.module_title;
      if (v === undefined || v === null) return null;
      return String(v);
    })(),
    quizTitle: (() => {
      const v = raw.quizTitle ?? raw.quiz_title;
      if (v === undefined || v === null) return null;
      return String(v);
    })(),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}

export type FetchSchoolUsersQuery = {
  page?: string;
  limit?: string;
  search?: string;
  isActive?: string;
};

function unwrapUsersListPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const top = data as Record<string, unknown>;
  if (Array.isArray(top.items)) return data;
  const inner = top.data;
  if (
    inner &&
    typeof inner === "object" &&
    Array.isArray((inner as { items?: unknown }).items)
  ) {
    return inner;
  }
  return data;
}

/** Лимит размера файла импорта на фронте (совпадает с бэкендом). */
export const SCHOOL_USERS_IMPORT_MAX_BYTES = 5 * 1024 * 1024;

export type SchoolUsersImportSummary = {
  totalRows: number;
  created: number;
  failed: number;
};

export type SchoolUsersImportCreatedRow = {
  sheetRow: number;
  id: string;
  email: string;
  iin: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string | null;
  temporaryPassword: string;
};

export type SchoolUsersImportErrorRow = {
  sheetRow: number;
  email?: string;
  iin?: string;
  message: string;
};

export type SchoolUsersImportResponse = {
  summary: SchoolUsersImportSummary;
  created: SchoolUsersImportCreatedRow[];
  errors: SchoolUsersImportErrorRow[];
};

function unwrapImportPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const top = raw as Record<string, unknown>;
  const inner = top.data;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return top;
}

function normalizeImportSummary(
  raw: Record<string, unknown>,
): SchoolUsersImportSummary {
  const s =
    raw.summary && typeof raw.summary === "object"
      ? (raw.summary as Record<string, unknown>)
      : raw;
  return {
    totalRows: num(s.totalRows ?? s.total_rows, 0),
    created: num(s.created, 0),
    failed: num(s.failed, 0),
  };
}

function normalizeCreatedImportRow(
  raw: Record<string, unknown>,
): SchoolUsersImportCreatedRow {
  return {
    sheetRow: num(raw.sheetRow ?? raw.sheet_row, 0),
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    iin: String(raw.iin ?? ""),
    firstName:
      raw.firstName != null
        ? String(raw.firstName)
        : raw.first_name != null
          ? String(raw.first_name)
          : undefined,
    lastName:
      raw.lastName != null
        ? String(raw.lastName)
        : raw.last_name != null
          ? String(raw.last_name)
          : undefined,
    patronymic:
      raw.patronymic === null
        ? null
        : raw.patronymic !== undefined
          ? String(raw.patronymic)
          : undefined,
    temporaryPassword: String(
      raw.temporaryPassword ?? raw.temporary_password ?? "",
    ),
  };
}

function normalizeImportErrorRow(
  raw: Record<string, unknown>,
): SchoolUsersImportErrorRow {
  return {
    sheetRow: num(raw.sheetRow ?? raw.sheet_row, 0),
    email: raw.email != null ? String(raw.email) : undefined,
    iin: raw.iin != null ? String(raw.iin) : undefined,
    message: String(raw.message ?? raw.error ?? ""),
  };
}

function parseSchoolUsersImportResponse(
  raw: unknown,
): SchoolUsersImportResponse {
  const root = unwrapImportPayload(raw);
  const summary = normalizeImportSummary(root);
  const createdRaw = root.created;
  const errorsRaw = root.errors;
  const created = Array.isArray(createdRaw)
    ? createdRaw
        .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
        .map((x) => normalizeCreatedImportRow(x))
    : [];
  const errors = Array.isArray(errorsRaw)
    ? errorsRaw
        .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
        .map((x) => normalizeImportErrorRow(x))
    : [];
  return { summary, created, errors };
}

/**
 * `POST /admin/users/import` — multipart/form-data, поле `file`, только `.xlsx`, до 5 МБ.
 * Школа из JWT; `Content-Type` для boundary выставляет браузер.
 */
export async function importSchoolUsersFromXlsx(
  file: File,
): Promise<SchoolUsersImportResponse> {
  const name = file.name.trim().toLowerCase();
  if (!name.endsWith(".xlsx")) {
    throw new Error("Нужен файл Excel с расширением .xlsx");
  }
  if (file.size > SCHOOL_USERS_IMPORT_MAX_BYTES) {
    throw new Error("Размер файла не больше 5 МБ");
  }
  const body = new FormData();
  body.append("file", file, file.name);
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.USERS_IMPORT, {
    method: "POST",
    body,
  });
  await throwIfNotOk(res);
  const json = await parseJsonSafe<unknown>(res);
  return parseSchoolUsersImportResponse(json);
}

export async function fetchSchoolUsers(
  query?: FetchSchoolUsersQuery | Record<string, string | undefined>,
): Promise<UsersListResponse> {
  const q = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== "") q.set(k, v);
    });
  }
  const qs = q.toString();
  const path = `${SCHOOL_ADMIN_ROUTES.USERS}${qs ? `?${qs}` : ""}`;
  const res = await apiSchoolAdminFetch(path);
  await throwIfNotOk(res);
  const raw = await parseJsonSafe<unknown>(res);
  const data = unwrapUsersListPayload(raw);
  if (data && typeof data === "object" && "items" in data) {
    const o = data as Record<string, unknown>;
    const rawItems = o.items;
    const items = Array.isArray(rawItems)
      ? rawItems
          .filter(
            (x): x is Record<string, unknown> =>
              x != null && typeof x === "object",
          )
          .map(normalizeSchoolStudentRow)
      : [];
    const total = num(o.total, items.length);
    const limit = num(o.limit, 20);
    let totalPages = num(o.totalPages ?? o.total_pages, 0);
    if (totalPages < 1 && limit > 0)
      totalPages = Math.max(1, Math.ceil(total / limit));
    if (totalPages < 1) totalPages = 1;
    return {
      items,
      total,
      page: o.page != null ? num(o.page, 1) : undefined,
      limit: o.limit != null ? limit : undefined,
      totalPages,
    };
  }
  if (Array.isArray(data)) {
    const items = data
      .filter(
        (x): x is Record<string, unknown> =>
          x != null && typeof x === "object",
      )
      .map(normalizeSchoolStudentRow);
    return {
      items,
      total: items.length,
      page: 1,
      totalPages: 1,
    };
  }
  return { items: [], total: 0, page: 1, totalPages: 1 };
}

/** Макс. `limit` на бэке (ValidationPipe) — не больше 100. */
export const SCHOOL_USERS_PAGE_MAX = 100;

/**
 * Подгружает всех учеников школы пачками по {@link SCHOOL_USERS_PAGE_MAX} (несколько запросов `page=1,2,…`).
 * Используйте для выпадающих списков, если в школе больше 100 учеников.
 */
export async function fetchSchoolUsersAllPages(
  query?: Omit<FetchSchoolUsersQuery, "page" | "limit">,
): Promise<SchoolStudentRow[]> {
  const all: SchoolStudentRow[] = [];
  const limit = String(SCHOOL_USERS_PAGE_MAX);
  let page = 1;
  const maxPages = 50;

  for (;;) {
    const r = await fetchSchoolUsers({
      ...query,
      page: String(page),
      limit,
    });
    all.push(...r.items);
    if (r.items.length === 0) break;
    if (all.length >= r.total) break;
    if (r.items.length < SCHOOL_USERS_PAGE_MAX) break;
    page += 1;
    if (page > maxPages) break;
  }
  return all;
}

/**
 * `GET /admin/users/export` — CSV `text/csv; charset=utf-8`, BOM, `Content-Disposition: attachment; filename="students.csv"`.
 * Только `school_admin`, иначе **403**.
 */
export async function fetchSchoolUsersExportCsv(): Promise<Response> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.USERS_EXPORT);
  await throwIfNotOk(res);
  return res;
}

/** Скачивает CSV в браузере (имя из `Content-Disposition` или `students.csv`). */
export async function downloadSchoolUsersCsv(): Promise<void> {
  const res = await fetchSchoolUsersExportCsv();
  const blob = await res.blob();
  let filename = "students.csv";
  const cd = res.headers.get("Content-Disposition");
  if (cd) {
    const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(cd);
    if (m?.[1]) filename = decodeURIComponent(m[1].replace(/^"|"$/g, ""));
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Приводит ответ `GET /admin/users/:id` к единому виду (camelCase + строки). */
export function normalizeSchoolStudentRow(
  raw: Record<string, unknown>,
): SchoolStudentRow {
  const email =
    raw.email != null && String(raw.email).trim() !== ""
      ? String(raw.email).trim()
      : undefined;
  const firstName = raw.firstName ?? raw.first_name;
  const lastName = raw.lastName ?? raw.last_name;
  const patronymic = raw.patronymic ?? raw.middle_name ?? raw.patronymic_name;

  return {
    ...raw,
    id: String(raw.id ?? ""),
    email,
    firstName: firstName != null ? String(firstName) : undefined,
    lastName: lastName != null ? String(lastName) : undefined,
    patronymic:
      patronymic != null && String(patronymic).trim() !== ""
        ? String(patronymic)
        : null,
    iin: raw.iin != null ? String(raw.iin) : undefined,
    isActive: Boolean(raw.isActive ?? raw.is_active),
    role: raw.role != null ? String(raw.role) : undefined,
    schoolId:
      raw.schoolId != null
        ? String(raw.schoolId)
        : raw.school_id != null
          ? String(raw.school_id)
          : undefined,
  };
}

export async function fetchSchoolUser(
  userId: string,
): Promise<SchoolStudentRow | null> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.USER(userId));
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (data == null || typeof data !== "object") return null;
  return normalizeSchoolStudentRow(data as Record<string, unknown>);
}

export async function updateSchoolUser(
  userId: string,
  body: UpdateSchoolUserBody,
): Promise<SchoolStudentRow> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.USER(userId), {
    method: "PUT",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (data == null || typeof data !== "object") throw new Error("Пустой ответ");
  return normalizeSchoolStudentRow(data as Record<string, unknown>);
}

export async function activateSchoolUser(
  userId: string,
): Promise<SchoolStudentRow> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.USER_ACTIVATE(userId),
    { method: "PATCH" },
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (data == null || typeof data !== "object") throw new Error("Пустой ответ");
  return normalizeSchoolStudentRow(data as Record<string, unknown>);
}

/** `DELETE /admin/users/:userId` — для школьного админа обычно **403** (удаление только у супер-админа). */
export async function deleteSchoolUser(userId: string): Promise<void> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.USER(userId), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

export async function fetchUserProgressAdmin(
  userId: string,
): Promise<UserProgressRowAdmin[]> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.USER_PROGRESS(userId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (!Array.isArray(data)) return [];
  return data.map((row) =>
    row && typeof row === "object"
      ? normalizeProgressRow(row as Record<string, unknown>)
      : ({} as UserProgressRowAdmin),
  );
}

export async function fetchUserCertificatesAdmin(
  userId: string,
): Promise<UserCertificateRowAdmin[]> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.USER_CERTIFICATES(userId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (!Array.isArray(data)) return [];
  return data.map((row) =>
    row && typeof row === "object"
      ? normalizeCertificateRow(row as Record<string, unknown>)
      : ({} as UserCertificateRowAdmin),
  );
}

/** `GET /admin/users/:userId/quiz-attempts` — метаданные и баллы; ответы не отдаются. */
export async function fetchUserQuizAttemptsAdmin(
  userId: string,
): Promise<UserQuizAttemptRowAdmin[]> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.USER_QUIZ_ATTEMPTS(userId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (!Array.isArray(data)) return [];
  return data.map((row) =>
    row && typeof row === "object"
      ? normalizeQuizAttemptRow(row as Record<string, unknown>)
      : ({} as UserQuizAttemptRowAdmin),
  );
}

export type UserDeviceRow = {
  id: string;
  userId?: string;
  deviceId?: string;
  userAgent?: string;
  ip?: string;
  lastLoginAt?: string;
  createdAt?: string;
};

export async function fetchUserDevices(
  userId: string,
): Promise<UserDeviceRow[]> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.USER_DEVICES(userId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return Array.isArray(data) ? (data as UserDeviceRow[]) : [];
}

export async function deleteUserDevice(
  userId: string,
  deviceId: string,
): Promise<void> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.USER_DEVICE_DELETE(userId, deviceId),
    { method: "DELETE" },
  );
  await throwIfNotOk(res);
}
