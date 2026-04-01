import {
  apiSchoolAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/school-admin/client";
import { SCHOOL_ADMIN_ROUTES } from "@/lib/api/school-admin/routes";

export type DeviceViolationRow = {
  id: string;
  createdAt?: string;
  attemptedDeviceId?: string;
  userAgent?: string;
  ip?: string;
  student?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    schoolId?: string;
  };
};

export async function fetchDeviceViolations(): Promise<DeviceViolationRow[]> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.DEVICE_VIOLATIONS,
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return Array.isArray(data) ? (data as DeviceViolationRow[]) : [];
}

export type AdminNotificationRow = {
  id: string;
  recipientUserId?: string;
  type?: string;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
  readAt?: string | null;
  createdAt?: string;
};

export async function fetchAdminNotifications(
  unreadOnly?: boolean,
): Promise<AdminNotificationRow[]> {
  const q =
    unreadOnly === true ? "?unreadOnly=true" : "";
  const res = await apiSchoolAdminFetch(
    `${SCHOOL_ADMIN_ROUTES.NOTIFICATIONS}${q}`,
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return Array.isArray(data) ? (data as AdminNotificationRow[]) : [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.NOTIFICATION_READ(id),
    { method: "PATCH" },
  );
  await throwIfNotOk(res);
}

/** `PATCH /admin/notifications/read-all` — **200** `{ updated: number }` */
export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.NOTIFICATIONS_READ_ALL,
    { method: "PATCH" },
  );
  await throwIfNotOk(res);
  const data =
    (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  return {
    updated: Number(data.updated ?? 0),
  };
}
