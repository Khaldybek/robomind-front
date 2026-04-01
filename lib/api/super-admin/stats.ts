import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

/** `GET /admin/stats/summary` — агрегированная статистика */
export async function fetchAdminStatsSummary(): Promise<unknown> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.STATS_SUMMARY);
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}
