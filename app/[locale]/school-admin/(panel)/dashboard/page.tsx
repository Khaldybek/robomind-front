"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { apiAuthLogoutAll } from "@/lib/api/auth-api";
import {
  clearSchoolAdminTokens,
  getSchoolAdminAccessToken,
} from "@/lib/auth/school-admin-tokens";
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

export default function SchoolAdminDashboardPage() {
  const router = useRouter();
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
      setErr("API");
      return;
    }
    setErr(null);
    fetchSchoolStats()
      .then((s) => {
        setErr(null);
        setUsersCount(s.students.total);
        setUsersSub(
          `активных: ${s.students.active} · неактивных: ${s.students.inactive}`,
        );
        setCoursesCount(s.courseAccess.coursesWithAccess);
        setCoursesSub(
          s.courseAccess.activeRows > 0
            ? `активных строк доступа: ${s.courseAccess.activeRows}`
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
  }, []);

  return (
    <div>
      <section className="relative mb-10 overflow-hidden rounded-[var(--radius-ds-section)] border border-white/70 bg-gradient-to-br from-white via-white to-ds-gray-light/80 p-8 shadow-[0_20px_70px_-28px_rgba(0,0,0,0.12)] lg:p-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ds-primary/12 blur-3xl"
          aria-hidden
        />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-ds-primary">
          Рабочий стол
        </p>
        <h1 className="relative mt-2 max-w-2xl text-balance font-medium leading-tight text-ds-black [font-size:clamp(1.75rem,2.5vw,2.5rem)]">
          Ваша школа под контролем
        </h1>
        <p className="relative mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-ds-gray-text lg:text-base">
          Следите за учениками, выдавайте доступы к курсам и реагируйте на
          уведомления — всё собрано на одном экране.
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link
            href="/school-admin/users"
            className="inline-flex items-center rounded-full bg-ds-black px-5 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-ds-gray-dark-2"
          >
            Ученики
          </Link>
          <Link
            href="/school-admin/courses"
            className="inline-flex items-center rounded-full border border-ds-gray-border bg-white px-5 py-2.5 text-sm font-medium text-ds-black shadow-sm transition hover:border-ds-primary hover:text-ds-primary"
          >
            Курсы и доступы
          </Link>
        </div>
      </section>

      {err && (
        <p className="ds-text-small mb-6 rounded-xl border border-ds-error/30 bg-red-50 px-4 py-3 text-ds-error">
          {err} — проверьте токен
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SchoolAdminStatCardLink
          href="/school-admin/users"
          label="Ученики"
          value={usersCount ?? "—"}
          sub={usersSub}
          icon={<IconUsers className="text-ds-black" />}
          delayMs={40}
        />
        <SchoolAdminStatCardLink
          href="/school-admin/courses"
          label="Курсы с доступом"
          value={coursesCount ?? "—"}
          sub={coursesSub}
          icon={<IconBookOpen className="text-ds-black" />}
          delayMs={120}
        />
        <SchoolAdminStatCardLink
          href="/school-admin/notifications"
          label="Непрочитанные"
          value={unread ?? "—"}
          icon={<IconBell className="text-ds-black" />}
          delayMs={200}
        />
        <SchoolAdminStatCardLink
          href="/school-admin/device-violations"
          label="Лишние устройства"
          value={violations ?? "—"}
          icon={<IconSmartphone className="text-ds-black" />}
          delayMs={280}
        />
      </div>
      {generatedAt && (
        <p className="ds-text-caption mt-6 text-ds-gray-text">
          Сводка на{" "}
          <time dateTime={generatedAt}>
            {new Date(generatedAt).toLocaleString()}
          </time>{" "}
          · <code className="text-xs">GET /admin/school/stats</code>
        </p>
      )}
      <section className="mt-12 rounded-[var(--radius-ds-card)] border border-white/80 bg-white/70 p-6 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.1)] backdrop-blur-sm lg:p-8">
        <h2 className="ds-text-h3 mb-2 text-ds-black">Безопасность сессии</h2>
        <p className="ds-text-caption mb-5 max-w-xl text-ds-gray-text">
          <code className="text-ds-black">POST /auth/logout-all</code> — завершить
          все активные сессии (все устройства). Используйте при утере доступа к
          аккаунту.
        </p>
        <button
          type="button"
          className="ui-btn ui-btn--4"
          onClick={() => {
            void (async () => {
              const at = getSchoolAdminAccessToken();
              if (at) {
                try {
                  await apiAuthLogoutAll(at);
                } catch {
                  /* ignore */
                }
              }
              clearSchoolAdminTokens();
              router.push("/school-admin/login");
            })();
          }}
        >
          Выйти на всех устройствах
        </button>
      </section>
    </div>
  );
}
