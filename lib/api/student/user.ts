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

export type ProgressEntry = {
  id?: string;
  courseId?: string;
  courseTitle?: string | null;
  moduleId?: string;
  moduleTitle?: string | null;
  status?: "not_started" | "in_progress" | "completed";
  completedAt?: string | null;
  watchedSeconds?: number;
  updatedAt?: string;

  // legacy/fallback fields (still used by some screens)
  courseName?: string;
  percent?: number;
  completedModules?: number;
  totalModules?: number;
  [key: string]: unknown;
};

function normalizeProgressEntry(raw: unknown): ProgressEntry {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    ...o,
    id: (o.id as string | undefined) ?? undefined,
    courseId: (o.courseId ?? o.course_id) as string | undefined,
    courseTitle: (o.courseTitle ?? o.course_title ?? null) as string | null,
    moduleId: (o.moduleId ?? o.module_id) as string | undefined,
    moduleTitle: (o.moduleTitle ?? o.module_title ?? null) as string | null,
    status: (o.status as ProgressEntry["status"]) ?? undefined,
    completedAt: (o.completedAt ?? o.completed_at ?? null) as string | null,
    watchedSeconds: Number(o.watchedSeconds ?? o.watched_seconds ?? 0),
    updatedAt: (o.updatedAt ?? o.updated_at) as string | undefined,
    courseName: (o.courseName ?? o.course_title) as string | undefined,
  };
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
