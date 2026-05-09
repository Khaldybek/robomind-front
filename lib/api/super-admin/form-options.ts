import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

function num(raw: unknown, d = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : d;
}

export type FormOptionSchoolRow = {
  id: string;
  name: string;
  number: number | null;
  districtId: string;
  districtName: string;
  isActive: boolean;
};

export type FormOptionSchoolsList = {
  items: FormOptionSchoolRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function mapSchoolRow(raw: Record<string, unknown>): FormOptionSchoolRow {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    number:
      raw.number === null || raw.number === undefined
        ? null
        : (() => {
            const n = num(raw.number, NaN);
            return Number.isFinite(n) ? n : null;
          })(),
    districtId: String(raw.districtId ?? raw.district_id ?? ""),
    districtName: String(raw.districtName ?? raw.district_name ?? ""),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
  };
}

/**
 * `GET /admin/form-options/schools` — компактный список школ для селектов (super_admin).
 */
export async function fetchFormOptionSchools(params?: {
  page?: number;
  limit?: number;
  search?: string;
  /** По умолчанию `true` — только активные школы */
  isActive?: boolean;
}): Promise<FormOptionSchoolsList> {
  const page = params?.page ?? 1;
  const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);
  const u = new URLSearchParams();
  u.set("page", String(page));
  u.set("limit", String(limit));
  if (params?.search?.trim()) u.set("search", params.search.trim());
  if (params?.isActive !== undefined) {
    u.set("isActive", String(params.isActive));
  } else {
    u.set("isActive", "true");
  }
  const res = await apiSuperAdminFetch(
    `${SUPER_ADMIN_ROUTES.FORM_OPTIONS_SCHOOLS}?${u.toString()}`,
  );
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  const itemsRaw = (data.items as unknown[]) ?? [];
  return {
    items: itemsRaw.map((x) =>
      mapSchoolRow(
        typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
      ),
    ),
    total: num(data.total, 0),
    page: num(data.page, page),
    limit: num(data.limit, limit),
    totalPages: num(data.totalPages ?? data.total_pages, 1),
  };
}

export type FormOptionLessonRow = {
  id: string;
  courseModuleId: string;
  courseModuleTitle: string;
  courseId: string;
  courseTitle: string;
  title: string;
  order: number;
  isPublished: boolean;
};

export type FormOptionLessonsList = {
  items: FormOptionLessonRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function mapLessonRow(raw: Record<string, unknown>): FormOptionLessonRow {
  return {
    id: String(raw.id ?? ""),
    courseModuleId: String(
      raw.courseModuleId ?? raw.course_module_id ?? "",
    ),
    courseModuleTitle: String(
      raw.courseModuleTitle ?? raw.course_module_title ?? "",
    ),
    courseId: String(raw.courseId ?? raw.course_id ?? ""),
    courseTitle: String(raw.courseTitle ?? raw.course_title ?? ""),
    title: String(raw.title ?? ""),
    order: num(raw.order, 0),
    isPublished: Boolean(raw.isPublished ?? raw.is_published ?? false),
  };
}

/**
 * `GET /admin/form-options/lessons` — компактный список уроков (super_admin).
 */
export async function fetchFormOptionLessons(params?: {
  page?: number;
  limit?: number;
  search?: string;
  courseModuleId?: string;
}): Promise<FormOptionLessonsList> {
  const page = params?.page ?? 1;
  const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);
  const u = new URLSearchParams();
  u.set("page", String(page));
  u.set("limit", String(limit));
  if (params?.search?.trim()) u.set("search", params.search.trim());
  if (params?.courseModuleId?.trim()) {
    u.set("courseModuleId", params.courseModuleId.trim());
  }
  const res = await apiSuperAdminFetch(
    `${SUPER_ADMIN_ROUTES.FORM_OPTIONS_LESSONS}?${u.toString()}`,
  );
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  const itemsRaw = (data.items as unknown[]) ?? [];
  return {
    items: itemsRaw.map((x) =>
      mapLessonRow(
        typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
      ),
    ),
    total: num(data.total, 0),
    page: num(data.page, page),
    limit: num(data.limit, limit),
    totalPages: num(data.totalPages ?? data.total_pages, 1),
  };
}
