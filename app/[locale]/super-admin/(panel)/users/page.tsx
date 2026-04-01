"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  fetchSuperUsers,
  type AdminUser,
} from "@/lib/api/super-admin/users";
import { isApiConfigured } from "@/lib/env";

const PAGE_SIZE = 20;

export default function Page() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState<"all" | "yes" | "no">("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  function load(nextPage = page) {
    if (!isApiConfigured()) return;
    setLoading(true);
    fetchSuperUsers({
      page: String(nextPage),
      limit: String(PAGE_SIZE),
      search: search.trim() || undefined,
      schoolId: schoolId.trim() || undefined,
      role: role.trim() || undefined,
      isActive:
        isActive === "yes"
          ? "true"
          : isActive === "no"
            ? "false"
            : undefined,
    })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setTotalPages(r.totalPages);
        setPage(r.page);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="ds-text-h2 text-ds-black">Пользователи</h1>
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          Поиск по email, ФИО, ИИН; фильтры: школа, роль, активность (
          <code>GET /admin/users</code>).
        </p>
      </header>

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="ds-input"
            placeholder="Поиск: email / ФИО / ИИН"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)}
          />
          <input
            className="ds-input font-mono"
            placeholder="schoolId (uuid)"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
          />
          <select
            className="ds-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Все роли</option>
            <option value="student">student</option>
            <option value="school_admin">school_admin</option>
            <option value="super_admin">super_admin</option>
          </select>
          <select
            className="ds-input"
            value={isActive}
            onChange={(e) =>
              setIsActive(e.target.value as typeof isActive)
            }
          >
            <option value="all">Активность: все</option>
            <option value="yes">Активные</option>
            <option value="no">Неактивные</option>
          </select>
          <button
            type="button"
            className="ui-btn ui-btn--4"
            onClick={() => load(1)}
          >
            Обновить список
          </button>
        </div>
      </section>

      {err && (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="ds-text-caption text-ds-gray-text">
            {loading
              ? "Загрузка…"
              : `Всего: ${total} · стр. ${page} / ${totalPages}`}
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border px-2 py-1 ds-text-caption disabled:opacity-40"
                disabled={page <= 1 || loading}
                onClick={() => load(page - 1)}
              >
                Назад
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1 ds-text-caption disabled:opacity-40"
                disabled={page >= totalPages || loading}
                onClick={() => load(page + 1)}
              >
                Вперёд
              </button>
            </div>
          )}
        </div>

        {items.length === 0 && !loading ? (
          <p className="rounded-lg border border-dashed border-ds-gray-border bg-[#FAFAFA] py-8 text-center ds-text-caption text-ds-gray-text">
            Ничего не найдено по текущим фильтрам.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/super-admin/users/${encodeURIComponent(u.id)}`}
                  className="block rounded-lg border border-ds-gray-border bg-white px-4 py-3 transition-colors hover:border-ds-primary/40 hover:bg-[#FAFAFA]"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-ds-black">
                      {[u.lastName, u.firstName, u.patronymic]
                        .filter(Boolean)
                        .join(" ") || u.email}
                    </span>
                    <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 ds-text-caption text-ds-gray-text">
                      {u.role}
                    </span>
                    {!u.isActive && (
                      <span className="rounded-full bg-[#FFF5F5] px-2 py-0.5 ds-text-caption text-ds-error">
                        неактивен
                      </span>
                    )}
                  </div>
                  <p className="mt-1 ds-text-caption text-ds-gray-text">
                    {u.email}
                    {u.iin ? ` · ИИН ${u.iin}` : ""}
                  </p>
                  <p className="mt-0.5 ds-text-caption text-ds-gray-text">
                    {u.role === "super_admin"
                      ? "Школа: — (super_admin)"
                      : u.school
                        ? `Школа: ${u.school.name}${
                            u.school.number != null
                              ? ` №${u.school.number}`
                              : ""
                          }`
                        : `schoolId: ${u.schoolId ?? "—"}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
