import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

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

export async function fetchSuperDeviceViolations(): Promise<
  DeviceViolationRow[]
> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.DEVICE_VIOLATIONS,
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return Array.isArray(data) ? (data as DeviceViolationRow[]) : [];
}

export type SuperNotificationRow = {
  id: string;
  title?: string;
  body?: string;
  readAt?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export async function fetchSuperNotifications(
  unreadOnly?: boolean,
): Promise<SuperNotificationRow[]> {
  const q = unreadOnly === true ? "?unreadOnly=true" : "";
  const res = await apiSuperAdminFetch(
    `${SUPER_ADMIN_ROUTES.NOTIFICATIONS}${q}`,
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return Array.isArray(data) ? (data as SuperNotificationRow[]) : [];
}

export async function markSuperNotificationRead(id: string): Promise<void> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.NOTIFICATION_READ(id),
    { method: "PATCH" },
  );
  await throwIfNotOk(res);
}

/** `PATCH /admin/notifications/read-all` — **200** `{ updated: number }` */
export async function markAllSuperNotificationsRead(): Promise<{
  updated: number;
}> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.NOTIFICATIONS_READ_ALL,
    { method: "PATCH" },
  );
  await throwIfNotOk(res);
  const data =
    (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  return { updated: Number(data.updated ?? 0) };
}
