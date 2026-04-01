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

export type SchoolAdminSchoolRef = {
  id: string;
  name: string;
  number: number | null;
};

/** Элемент списка / GET :id / POST / PATCH */
export type SchoolAdmin = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  iin: string | null;
  role: "school_admin";
  schoolId: string;
  school: SchoolAdminSchoolRef;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SchoolAdminList = {
  items: SchoolAdmin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function mapSchoolRef(raw: unknown): SchoolAdminSchoolRef {
  if (!raw || typeof raw !== "object") {
    return { id: "", name: "", number: null };
  }
  const o = raw as Record<string, unknown>;
  const n = o.number;
  return {
    id: String(o.id ?? ""),
    name: String(o.name ?? ""),
    number:
      n === null || n === undefined || n === ""
        ? null
        : num(n, 0),
  };
}

function mapSchoolAdmin(raw: Record<string, unknown>): SchoolAdmin {
  return {
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    firstName: String(raw.firstName ?? raw.first_name ?? ""),
    lastName: String(raw.lastName ?? raw.last_name ?? ""),
    patronymic:
      raw.patronymic === null || raw.patronymic === undefined
        ? null
        : String(raw.patronymic),
    iin:
      raw.iin === null || raw.iin === undefined
        ? null
        : String(raw.iin),
    role: "school_admin",
    schoolId: String(raw.schoolId ?? raw.school_id ?? ""),
    school: mapSchoolRef(raw.school),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

/** Query для `GET /admin/schools/:schoolId/admins` — schoolId только в пути */
function buildSchoolAdminsListQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): string {
  const u = new URLSearchParams();
  if (params.page != null) u.set("page", String(params.page));
  if (params.limit != null) u.set("limit", String(params.limit));
  if (params.search?.trim()) u.set("search", params.search.trim());
  if (params.isActive !== undefined)
    u.set("isActive", String(params.isActive));
  const s = u.toString();
  return s ? `?${s}` : "";
}

function parseSchoolAdminListPayload(
  raw: unknown,
): Omit<SchoolAdminList, "items"> & { itemsRaw: unknown[] } {
  if (Array.isArray(raw)) {
    const itemsRaw = raw;
    return {
      itemsRaw,
      total: itemsRaw.length,
      page: 1,
      limit: itemsRaw.length || 20,
      totalPages: 1,
    };
  }
  if (!raw || typeof raw !== "object") {
    return {
      itemsRaw: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }
  const data = raw as Record<string, unknown>;
  const meta =
    data.meta && typeof data.meta === "object"
      ? (data.meta as Record<string, unknown>)
      : {};
  const itemsRaw =
    (data.items as unknown[]) ??
    (data.data as unknown[]) ??
    (data.schoolAdmins as unknown[]) ??
    (data.school_admins as unknown[]) ??
    [];
  const limit = num(data.limit ?? meta.limit, 20);
  const total = num(data.total ?? meta.total, itemsRaw.length);
  const page = num(data.page ?? meta.page, 1);
  let totalPages = num(
    data.totalPages ?? data.total_pages ?? meta.totalPages ?? meta.total_pages,
    0,
  );
  if (totalPages < 1 && limit > 0)
    totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages < 1) totalPages = 1;
  return { itemsRaw, total, page, limit, totalPages };
}

export async function listSchoolAdmins(params: {
  schoolId: string;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): Promise<SchoolAdminList> {
  const q = buildSchoolAdminsListQuery({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search,
    isActive: params.isActive,
  });
  const res = await apiSuperAdminFetch(
    `${SUPER_ADMIN_ROUTES.SCHOOL_ADMINS_BY_SCHOOL(params.schoolId)}${q}`,
  );
  await throwIfNotOk(res);
  const raw = await parseJsonSafe<unknown>(res);
  const { itemsRaw, total, page, limit, totalPages } =
    parseSchoolAdminListPayload(raw);
  return {
    items: itemsRaw.map((x) =>
      mapSchoolAdmin(
        typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
      ),
    ),
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getSchoolAdmin(id: string): Promise<SchoolAdmin> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.SCHOOL_ADMIN(id));
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapSchoolAdmin(d ?? {});
}

export type CreateSchoolAdminBody = {
  schoolId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  iin?: string;
};

export async function createSchoolAdmin(
  body: CreateSchoolAdminBody,
): Promise<SchoolAdmin> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.SCHOOL_ADMINS, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapSchoolAdmin(d ?? {});
}

export type PatchSchoolAdminBody = Partial<{
  schoolId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  iin: string | null;
  isActive: boolean;
}>;

export async function updateSchoolAdmin(
  id: string,
  body: PatchSchoolAdminBody,
): Promise<SchoolAdmin> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.SCHOOL_ADMIN(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const d = await parseJsonSafe<Record<string, unknown>>(res);
  return mapSchoolAdmin(d ?? {});
}

/** Мягкое отключение на бэкенде (isActive: false). */
export async function deleteSchoolAdmin(id: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.SCHOOL_ADMIN(id), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}
