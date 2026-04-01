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

export type SchoolStatsResponse = {
  schoolId: string;
  students: {
    total: number;
    active: number;
    inactive: number;
  };
  courseAccess: {
    activeRows: number;
    coursesWithAccess: number;
  };
  deviceViolationsTotal: number;
  unreadNotificationsForCurrentAdmin: number;
  generatedAt: string;
};

function mapStats(raw: Record<string, unknown>): SchoolStatsResponse {
  const studentsRaw = (raw.students as Record<string, unknown>) ?? {};
  const courseAccessRaw =
    (raw.courseAccess as Record<string, unknown>) ??
    (raw.course_access as Record<string, unknown>) ??
    {};

  return {
    schoolId: String(raw.schoolId ?? raw.school_id ?? ""),
    students: {
      total: num(studentsRaw.total, 0),
      active: num(studentsRaw.active, 0),
      inactive: num(studentsRaw.inactive, 0),
    },
    courseAccess: {
      activeRows: num(
        courseAccessRaw.activeRows ?? courseAccessRaw.active_rows,
        0,
      ),
      coursesWithAccess: num(
        courseAccessRaw.coursesWithAccess ??
          courseAccessRaw.courses_with_access,
        0,
      ),
    },
    deviceViolationsTotal: num(
      raw.deviceViolationsTotal ?? raw.device_violations_total,
      0,
    ),
    unreadNotificationsForCurrentAdmin: num(
      raw.unreadNotificationsForCurrentAdmin ??
        raw.unread_notifications_for_current_admin,
      0,
    ),
    generatedAt: String(
      raw.generatedAt ?? raw.generated_at ?? new Date().toISOString(),
    ),
  };
}

/** `GET /admin/school/stats` — только `school_admin` */
export async function fetchSchoolStats(): Promise<SchoolStatsResponse> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.SCHOOL_STATS);
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  return mapStats(data);
}
