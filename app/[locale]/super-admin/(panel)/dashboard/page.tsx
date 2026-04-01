"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { apiAuthLogoutAll } from "@/lib/api/auth-api";
import {
  clearSuperAdminTokens,
  getSuperAdminAccessToken,
} from "@/lib/auth/super-admin-tokens";
import { listAdminCourses } from "@/lib/api/super-admin/courses-modules";
import { fetchSuperUsers } from "@/lib/api/super-admin/users";
import {
  fetchSuperDeviceViolations,
  fetchSuperNotifications,
} from "@/lib/api/super-admin/notifications";
import { isApiConfigured } from "@/lib/env";

export default function Page() {
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    violations: 0,
    unread: 0,
  });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setErr("API");
      return;
    }
    Promise.all([
      fetchSuperUsers({ limit: "1" }).then((r) => r.total),
      listAdminCourses({ page: 1, limit: 1 }).then((r) => r.total),
      fetchSuperDeviceViolations().then((v) => v.length),
      fetchSuperNotifications(true).then((n) => n.length),
    ])
      .then(([u, c, v, n]) =>
        setStats({ users: u, courses: c, violations: v, unread: n }),
      )
      .catch((e: Error) => setErr(e.message));
  }, []);

  const cards = [
    { href: "/super-admin/users", label: "Пользователи", v: stats.users },
    { href: "/super-admin/courses", label: "Курсы", v: stats.courses },
    {
      href: "/super-admin/device-violations",
      label: "Нарушения устройств",
      v: stats.violations,
    },
    {
      href: "/super-admin/notifications",
      label: "Непрочитанные",
      v: stats.unread,
    },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <header>
        <h1 className="ds-text-h2 text-ds-black">Обзор панели</h1>
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          Краткая статистика по платформе и быстрые переходы.
        </p>
      </header>
      {err && (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err} — проверьте токен
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-4 shadow-sm transition-all hover:border-ds-primary/40 hover:shadow-md"
          >
            <p className="ds-text-caption text-ds-gray-text">{c.label}</p>
            <p className="mt-1 text-[28px] font-medium leading-none text-ds-black">
              {c.v ?? "—"}
            </p>
          </Link>
        ))}
      </div>
      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">Сессия</h2>
        <p className="mb-4 mt-1 ds-text-caption text-ds-gray-text">
          <code className="text-ds-black">POST /auth/logout-all</code>
        </p>
        <button
          type="button"
          className="ui-btn ui-btn--4"
          onClick={() => {
            void (async () => {
              const at = getSuperAdminAccessToken();
              if (at) {
                try {
                  await apiAuthLogoutAll(at);
                } catch {
                  /* ignore */
                }
              }
              clearSuperAdminTokens();
              router.push("/super-admin/login");
            })();
          }}
        >
          Выйти на всех устройствах
        </button>
      </section>
    </div>
  );
}
