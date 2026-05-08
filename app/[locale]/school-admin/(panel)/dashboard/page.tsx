"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchSchoolUsers } from "@/lib/api/school-admin/users";
import { fetchAdminCourses } from "@/lib/api/school-admin/courses";
import {
  fetchAdminNotifications,
  fetchDeviceViolations,
} from "@/lib/api/school-admin/notifications";
import { fetchSchoolStats } from "@/lib/api/school-admin/school-stats";
import { isApiConfigured } from "@/lib/env";
import { SchoolAdminStatCardLink } from "@/components/school-admin/school-admin-stat-card";
import {
  IconBell,
  IconBookOpen,
  IconSmartphone,
  IconUsers,
} from "@/components/school-admin/school-admin-icons";
import { SchoolAdminWelcomeBanner } from "@/components/school-admin/dashboard-welcome-banner";
import { SchoolAdminDashboardCoursesStrip } from "@/components/school-admin/dashboard-courses-strip";

export default function SchoolAdminDashboardPage() {
  const t = useTranslations("SchoolAdminDashboard");
  const tc = useTranslations("Common");
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [usersSub, setUsersSub] = useState<string | null>(null);
  const [coursesCount, setCoursesCount] = useState<number | null>(null);
  const [coursesSub, setCoursesSub] = useState<string | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [violations, setViolations] = useState<number | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setErr(tc("apiEnvMissing"));
      return;
    }
    setErr(null);
    fetchSchoolStats()
      .then((s) => {
        setErr(null);
        setUsersCount(s.students.total);
        setUsersSub(
          t("usersSub", {
            active: s.students.active,
            inactive: s.students.inactive,
          }),
        );
        setCoursesCount(s.courseAccess.coursesWithAccess);
        setCoursesSub(
          s.courseAccess.activeRows > 0
            ? t("coursesSub", { rows: s.courseAccess.activeRows })
            : null,
        );
        setUnread(s.unreadNotificationsForCurrentAdmin);
        setViolations(s.deviceViolationsTotal);
        setGeneratedAt(s.generatedAt);
      })
      .catch(() => {
        Promise.all([
          fetchSchoolUsers({ limit: "1" }).then((r) => r.total),
          fetchAdminCourses().then((c) => c.total),
          fetchAdminNotifications(true).then((n) => n.length),
          fetchDeviceViolations().then((v) => v.length),
        ])
          .then(([u, c, n, v]) => {
            setUsersCount(u);
            setUsersSub(null);
            setCoursesCount(c);
            setCoursesSub(null);
            setUnread(n);
            setViolations(v);
            setGeneratedAt(null);
          })
          .catch((e: Error) => setErr(e.message));
      });
  }, [t, tc]);

  return (
    <div>
      <SchoolAdminWelcomeBanner />

      {err && (
        <p className="mb-6 rounded-2xl border border-rose-200/70 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {err}
          {!String(err).includes("NEXT_PUBLIC_API_BASE_URL") ? ` ${t("tokenHint")}` : ""}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SchoolAdminStatCardLink
          href="/school-admin/users"
          label={t("statStudents")}
          value={usersCount ?? "—"}
          sub={usersSub}
          icon={<IconUsers className="h-5 w-5" />}
          delayMs={40}
        />
        <SchoolAdminStatCardLink
          href="/school-admin/courses"
          label={t("statCourses")}
          value={coursesCount ?? "—"}
          sub={coursesSub}
          icon={<IconBookOpen className="h-5 w-5" />}
          delayMs={120}
        />
        <SchoolAdminStatCardLink
          href="/school-admin/notifications"
          label={t("statUnread")}
          value={unread ?? "—"}
          icon={<IconBell className="h-5 w-5" />}
          delayMs={200}
        />
        <SchoolAdminStatCardLink
          href="/school-admin/device-violations"
          label={t("statDevices")}
          value={violations ?? "—"}
          icon={<IconSmartphone className="h-5 w-5" />}
          delayMs={280}
        />
      </div>

      {generatedAt && (
        <p className="mt-4 text-xs text-slate-500">
          {t("summaryPrefix")}{" "}
          <time dateTime={generatedAt}>
            {new Date(generatedAt).toLocaleString()}
          </time>
        </p>
      )}

      <SchoolAdminDashboardCoursesStrip />
    </div>
  );
}
