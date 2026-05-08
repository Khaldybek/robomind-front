import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";

export type StudentMeResponse = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string | null;
  iin?: string;
  role?: string;
  schoolId?: string | null;
  school?: {
    id: string;
    name?: string;
    districtId?: string;
    [key: string]: unknown;
  } | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export async function fetchUserMe(): Promise<StudentMeResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.USER_ME);
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  return (await parseJsonSafe<StudentMeResponse>(res)) ?? null;
}

export type StudentDashboardResponse = {
  coursesCount?: number;
  modulesCompleted?: number;
  modulesInProgress?: number;
  certificatesCount?: number;
  courses?: Array<{
    id: string;
    title?: string;
    thumbnailUrl?: string | null;
    level?: string;
    order?: number;
    [key: string]: unknown;
  }>;
  progress?: ProgressEntry[];
  [key: string]: unknown;
};

/** GET /app/users/me/dashboard */
export async function fetchUserDashboard(): Promise<StudentDashboardResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.USER_ME_DASHBOARD);
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<unknown>(res)) ?? {};
  if (data && typeof data === "object" && "data" in data) {
    const nested = (data as { data?: unknown }).data;
    if (nested && typeof nested === "object") {
      return nested as StudentDashboardResponse;
    }
  }
  return data as StudentDashboardResponse;
}

export type ProfilePerformance = {
  coursesCount?: number;
  certificatesCount?: number;
  totalModules?: number;
  modulesCompleted?: number;
  modulesInProgress?: number;
  overallProgressPercent?: number;
  totalQuizAttempts?: number;
  averageQuizPercent?: number;
  [key: string]: unknown;
};

export type ProfileCourseItem = {
  id: string;
  title?: string;
  name?: string;
  thumbnailUrl?: string | null;
  level?: string;
  ageGroup?: string;
  progressPercent?: number;
  totalModules?: number;
  completedModules?: number;
  modulesInProgress?: number;
  description?: string;
  [key: string]: unknown;
};

/** Расширенный профиль: GET /app/users/me/profile */
export type StudentProfileFull = StudentMeResponse & {
  certificates?: CertificateItem[];
  courses?: ProfileCourseItem[];
  performance?: ProfilePerformance;
};

function unwrapEnvelope(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.data && typeof o.data === "object") {
    return o.data as Record<string, unknown>;
  }
  return o;
}

function num(raw: unknown, fallback = 0): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parsePerformance(o: Record<string, unknown>): ProfilePerformance {
  const p =
    o.performance && typeof o.performance === "object"
      ? (o.performance as Record<string, unknown>)
      : o;
  const out: ProfilePerformance = {};
  const setIf = (key: keyof ProfilePerformance, raw: unknown) => {
    if (raw == null || raw === "") return;
    const v = num(raw);
    if (Number.isFinite(v)) out[key] = v as never;
  };
  setIf("coursesCount", p.coursesCount ?? p.courses_count);
  setIf("certificatesCount", p.certificatesCount ?? p.certificates_count);
  setIf("totalModules", p.totalModules ?? p.total_modules);
  setIf("modulesCompleted", p.modulesCompleted ?? p.modules_completed);
  setIf("modulesInProgress", p.modulesInProgress ?? p.modules_in_progress);
  setIf("totalQuizAttempts", p.totalQuizAttempts ?? p.total_quiz_attempts);
  setIf("averageQuizPercent", p.averageQuizPercent ?? p.average_quiz_percent);
  const ovp = p.overallProgressPercent ?? p.overall_progress_percent;
  if (ovp != null && ovp !== "") {
    const v = num(ovp);
    if (Number.isFinite(v)) {
      out.overallProgressPercent = Math.min(100, Math.max(0, v));
    }
  }
  return out;
}

/**
 * GET /app/users/me/profile — профиль, курсы с прогрессом, сертификаты, performance.
 * При 404 возвращает null (вызывающий может подставить fetchUserMe).
 */
export async function fetchUserProfileMe(): Promise<StudentProfileFull | null> {
  const res = await apiFetch(STUDENT_ROUTES.USER_ME_PROFILE);
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const raw = await parseJsonSafe<unknown>(res);
  const root = unwrapEnvelope(raw);
  if (!root) return null;

  const certsRaw = root.certificates;
  const certificates = Array.isArray(certsRaw)
    ? certsRaw.map(normalizeCertificate).filter((c) => c.id)
    : [];

  const coursesRaw = root.courses;
  const courses = Array.isArray(coursesRaw)
    ? (coursesRaw as ProfileCourseItem[]).filter(
        (c) => c && typeof c === "object" && typeof c.id === "string",
      )
    : [];

  const performance = parsePerformance(root);

  const base: StudentMeResponse = {
    id: String(root.id ?? ""),
    email: (root.email as string | undefined) ?? undefined,
    firstName: (root.firstName ?? root.first_name) as string | undefined,
    lastName: (root.lastName ?? root.last_name) as string | undefined,
    patronymic: (root.patronymic ?? null) as string | null,
    iin: (root.iin as string | undefined) ?? undefined,
    role: (root.role as string | undefined) ?? undefined,
    schoolId: (root.schoolId ?? root.school_id ?? null) as string | null,
    school: (root.school as StudentMeResponse["school"]) ?? null,
    avatarUrl: (root.avatarUrl ?? root.avatar_url ?? null) as string | null,
    isActive: root.isActive as boolean | undefined,
    createdAt: root.createdAt as string | undefined,
    updatedAt: root.updatedAt as string | undefined,
  };

  return {
    ...root,
    ...base,
    certificates,
    courses,
    performance,
  } as StudentProfileFull;
}

export async function patchUserMe(
  body: Record<string, unknown>,
): Promise<StudentMeResponse | null> {
  const res = await apiFetch(STUDENT_ROUTES.USER_ME, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe<StudentMeResponse>(res);
}

function extractAvatarUrlFromResponse(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const data = o.data;
  const pick = (x: Record<string, unknown>) => {
    const u = x.avatarUrl ?? x.avatar_url;
    return typeof u === "string" && u.trim() ? u.trim() : null;
  };
  if (data && typeof data === "object") {
    const u = pick(data as Record<string, unknown>);
    if (u) return u;
  }
  return pick(o);
}

/**
 * POST /app/users/me/avatar — multipart, поле `file`.
 * Возвращает новый `avatarUrl` из тела ответа, если бэкенд его отдаёт; иначе `null` (тогда обновите профиль через GET).
 */
export async function postUserAvatar(file: File): Promise<string | null> {
  const body = new FormData();
  body.append("file", file, file.name);
  const res = await apiFetch(STUDENT_ROUTES.USER_ME_AVATAR, {
    method: "POST",
    body,
  });
  await throwIfNotOk(res);
  const json = await parseJsonSafe<unknown>(res);
  return extractAvatarUrlFromResponse(json);
}

export type ProgressEntry = {
  id?: string;
  courseId?: string;
  courseTitle?: string | null;
  lessonId?: string;
  lessonTitle?: string | null;
  /** @deprecated */
  moduleId?: string;
  /** @deprecated */
  moduleTitle?: string | null;
  status?: "not_started" | "in_progress" | "completed";
  completedAt?: string | null;
  watchedSeconds?: number;
  updatedAt?: string;

  courseName?: string;
  percent?: number;
  completedModules?: number;
  totalModules?: number;
  completedLessons?: number;
  totalLessons?: number;
  [key: string]: unknown;
};

function normalizeProgressEntry(raw: unknown): ProgressEntry {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const lessonId =
    (o.lessonId ?? o.lesson_id ?? o.moduleId ?? o.module_id) as
      | string
      | undefined;
  const lessonTitle = (o.lessonTitle ??
    o.lesson_title ??
    o.moduleTitle ??
    o.module_title ??
    null) as string | null;
  return {
    ...o,
    id: (o.id as string | undefined) ?? undefined,
    courseId: (o.courseId ?? o.course_id) as string | undefined,
    courseTitle: (o.courseTitle ?? o.course_title ?? null) as string | null,
    lessonId: lessonId != null ? String(lessonId) : undefined,
    lessonTitle,
    moduleId: lessonId != null ? String(lessonId) : undefined,
    moduleTitle: lessonTitle,
    status: (o.status as ProgressEntry["status"]) ?? undefined,
    completedAt: (o.completedAt ?? o.completed_at ?? null) as string | null,
    watchedSeconds: Number(o.watchedSeconds ?? o.watched_seconds ?? 0),
    updatedAt: (o.updatedAt ?? o.updated_at) as string | undefined,
    courseName: (o.courseName ?? o.course_title) as string | undefined,
    completedLessons: numOpt(o.completedLessons ?? o.completed_lessons),
    totalLessons: numOpt(o.totalLessons ?? o.total_lessons),
    completedModules: numOpt(
      o.completedModules ?? o.completed_modules ?? o.completedLessons,
    ),
    totalModules: numOpt(
      o.totalModules ?? o.total_modules ?? o.totalLessons,
    ),
  };
}

function numOpt(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function fetchUserProgress(): Promise<ProgressEntry[]> {
  const res = await apiFetch(STUDENT_ROUTES.USER_ME_PROGRESS);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data.map(normalizeProgressEntry);
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: unknown[] }).data.map(normalizeProgressEntry);
  }
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: unknown[] }).items.map(normalizeProgressEntry);
  }
  return [];
}

export type CertificateItem = {
  id: string;
  title?: string;
  courseId?: string;
  courseTitle?: string | null;
  uniqueCode?: string;
  downloadUrl?: string;
  pdfUrl?: string;
  issuedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

function normalizeCertificate(raw: unknown): CertificateItem {
  if (!raw || typeof raw !== "object") {
    return { id: "" };
  }
  const o = raw as Record<string, unknown>;
  return {
    ...o,
    id: String(o.id ?? ""),
    title: (o.title ?? o.courseTitle ?? o.course_title) as string | undefined,
    courseId: (o.courseId ?? o.course_id) as string | undefined,
    courseTitle: (o.courseTitle ?? o.course_title ?? null) as string | null,
    uniqueCode: (o.uniqueCode ?? o.unique_code) as string | undefined,
    downloadUrl: (o.downloadUrl ?? o.download_url) as string | undefined,
    pdfUrl: (o.pdfUrl ?? o.pdf_url) as string | undefined,
    issuedAt: (o.issuedAt ?? o.issued_at) as string | undefined,
    createdAt: (o.createdAt ?? o.created_at) as string | undefined,
  };
}

export async function fetchCertificates(): Promise<CertificateItem[]> {
  const res = await apiFetch(STUDENT_ROUTES.USER_ME_CERTIFICATES);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data.map(normalizeCertificate);
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: unknown[] }).data.map(normalizeCertificate);
  }
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: unknown[] }).items.map(normalizeCertificate);
  }
  return [];
}
