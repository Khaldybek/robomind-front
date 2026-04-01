import {
  mapSchoolAdminMe,
  type SchoolAdminMe,
} from "@/lib/api/school-admin/my-school";
import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

export type { SchoolAdminMe as AdminMeProfile };

function num(raw: unknown, d = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : d;
}

/** Роль в ответах GET /admin/users, GET /admin/users/:id */
export type UserRole = "student" | "school_admin" | "super_admin";

export type UserSchoolRef = {
  id: string;
  name: string;
  number: number | null;
};

/**
 * Пользователь без пароля (список и карточка).
 * У `super_admin` всегда `schoolId: null`, `school: null`.
 */
export type AdminUser = {
  id: string;
  iin: string | null;
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  role: UserRole;
  schoolId: string | null;
  school: UserSchoolRef | null;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserList = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function parseRole(raw: unknown): UserRole {
  const r = String(raw ?? "");
  if (r === "student" || r === "school_admin" || r === "super_admin") return r;
  return "student";
}

function mapSchool(raw: unknown): UserSchoolRef | null {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
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

export function mapAdminUser(raw: Record<string, unknown>): AdminUser {
  return {
    id: String(raw.id ?? ""),
    iin:
      raw.iin === null || raw.iin === undefined
        ? null
        : String(raw.iin),
    email: String(raw.email ?? ""),
    firstName: String(raw.firstName ?? raw.first_name ?? ""),
    lastName: String(raw.lastName ?? raw.last_name ?? ""),
    patronymic:
      raw.patronymic === null || raw.patronymic === undefined
        ? null
        : String(raw.patronymic),
    role: parseRole(raw.role),
    schoolId: (() => {
      const sid = raw.schoolId ?? raw.school_id;
      if (sid === null || sid === undefined || sid === "") return null;
      return String(sid);
    })(),
    school: mapSchool(raw.school),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    avatarUrl:
      raw.avatarUrl != null
        ? String(raw.avatarUrl)
        : raw.avatar_url != null
          ? String(raw.avatar_url)
          : null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

/** @deprecated используйте AdminUser */
export type SuperUserRow = AdminUser;

export type FetchSuperUsersQuery = {
  page?: number | string;
  limit?: number | string;
  schoolId?: string;
  role?: string;
  search?: string;
  isActive?: boolean | string;
};

/**
 * `GET /admin/users` — query: page, limit, schoolId, role, search, isActive
 */
export async function fetchSuperUsers(
  query?: FetchSuperUsersQuery | Record<string, string | undefined>,
): Promise<AdminUserList> {
  const u = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      u.set(k, String(v));
    });
  }
  const qs = u.toString();
  const path = `${SUPER_ADMIN_ROUTES.USERS}${qs ? `?${qs}` : ""}`;
  const res = await apiSuperAdminFetch(path);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (data && typeof data === "object" && "items" in data) {
    const o = data as Record<string, unknown>;
    const itemsRaw = (o.items as unknown[]) ?? [];
    return {
      items: itemsRaw.map((x) =>
        mapAdminUser(
          typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
        ),
      ),
      total: num(o.total, 0),
      page: num(o.page, 1),
      limit: num(o.limit, 20),
      totalPages: Math.max(1, num(o.totalPages ?? o.total_pages, 1)),
    };
  }
  if (Array.isArray(data)) {
    return {
      items: data.map((x) =>
        mapAdminUser(
          typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {},
        ),
      ),
      total: data.length,
      page: 1,
      limit: data.length || 20,
      totalPages: 1,
    };
  }
  return {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };
}

/** `GET /admin/me` — профиль текущего пользователя (`school_admin` | `super_admin`) */
export async function fetchSuperAdminMe(): Promise<SchoolAdminMe> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.ME);
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  return mapSchoolAdminMe(data);
}

/** `GET /admin/users/:userId` — 200 или 404 */
export async function fetchSuperUser(
  userId: string,
): Promise<AdminUser | null> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.USER(userId));
  if (res.status === 404) return null;
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapAdminUser(data ?? {});
}

/**
 * `PUT /admin/users/:userId` — полное обновление профиля: в т.ч. пароль, роль, школа.
 * На бэкенде при роли **`super_admin`** привязка к школе сбрасывается (`schoolId` / `school`).
 */
export type PutAdminUserBody = Partial<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  iin: string | null;
  role: UserRole;
  schoolId: string | null;
  isActive: boolean;
  avatarUrl: string | null;
}>;

export async function updateSuperUser(
  userId: string,
  body: PutAdminUserBody,
): Promise<AdminUser> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.USER(userId), {
    method: "PUT",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapAdminUser(data ?? {});
}

/** `DELETE /admin/users/:userId` */
export async function deleteSuperUser(userId: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.USER(userId), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

export async function activateSuperUser(userId: string): Promise<unknown> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.USER_ACTIVATE(userId),
    { method: "PATCH" },
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export async function fetchSuperUserProgress(
  userId: string,
): Promise<unknown> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.USER_PROGRESS(userId),
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export async function fetchSuperUserCertificates(
  userId: string,
): Promise<unknown> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.USER_CERTIFICATES(userId),
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export type UserDeviceRow = {
  id: string;
  deviceId?: string;
  userAgent?: string;
  ip?: string;
  lastLoginAt?: string;
};

export async function fetchSuperUserDevices(
  userId: string,
): Promise<UserDeviceRow[]> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.USER_DEVICES(userId),
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return Array.isArray(data) ? (data as UserDeviceRow[]) : [];
}

export async function deleteSuperUserDevice(
  userId: string,
  deviceId: string,
): Promise<void> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.USER_DEVICE_DELETE(userId, deviceId),
    { method: "DELETE" },
  );
  await throwIfNotOk(res);
}
