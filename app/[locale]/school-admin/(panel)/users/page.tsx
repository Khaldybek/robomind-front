"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import {
  fetchSchoolUsers,
  downloadSchoolUsersCsv,
  type SchoolStudentRow,
} from "@/lib/api/school-admin/users";
import { SchoolUsersImportPanel } from "@/components/school-admin/users-import-panel";
import { isApiConfigured } from "@/lib/env";

const PAGE_SIZE = 20;

export default function SchoolAdminUsersPage() {
  const [items, setItems] = useState<SchoolStudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    if (!isApiConfigured()) {
      setError("Задайте NEXT_PUBLIC_API_BASE_URL");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchSchoolUsers({
      page: String(page),
      limit: String(PAGE_SIZE),
      search: search.trim() || undefined,
      isActive:
        isActiveFilter === "all"
          ? undefined
          : isActiveFilter === "yes"
            ? "true"
            : "false",
    })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setTotalPages(r.totalPages ?? Math.max(1, Math.ceil(r.total / PAGE_SIZE)));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, isActiveFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function applySearch() {
    setSearch(searchDraft.trim());
    setPage(1);
  }

  return (
    <div>
      <header className="mb-8 rounded-[var(--radius-ds-section)] border border-white/70 bg-gradient-to-br from-white/95 to-ds-gray-light/60 p-6 shadow-[0_16px_50px_-24px_rgba(0,0,0,0.1)] backdrop-blur-sm lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ds-primary">
          База школы
        </p>
        <h1 className="ds-text-h1 mt-2 text-balance text-ds-black">
          Ученики
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-ds-gray-text">
          Поиск по email, ФИО и ИИН. Импорт учеников из Excel или экспорт в CSV
          для отчётов и сверки.
        </p>
      </header>

      <SchoolUsersImportPanel onImported={load} />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="ds-text-caption text-ds-gray-text">Поиск</label>
          <input
            className="ds-input mt-1 max-w-xs"
            placeholder="Email, ФИО…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
        </div>
        <div>
          <label className="ds-text-caption text-ds-gray-text">Статус</label>
          <select
            className="ds-input mt-1 block min-w-[140px]"
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value as typeof isActiveFilter);
              setPage(1);
            }}
          >
            <option value="all">Все</option>
            <option value="yes">Активные</option>
            <option value="no">Неактивные</option>
          </select>
        </div>
        <button type="button" onClick={applySearch} className="ui-btn ui-btn--4">
          Найти
        </button>
        <button
          type="button"
          disabled={exporting || !isApiConfigured()}
          className="ui-btn ui-btn--4"
          onClick={() => {
            setExporting(true);
            setError(null);
            downloadSchoolUsersCsv()
              .catch((e: Error) => setError(e.message))
              .finally(() => setExporting(false));
          }}
        >
          {exporting ? "Экспорт…" : "CSV (Excel)"}
        </button>
      </div>
      {error && (
        <p className="ds-text-small text-ds-error mb-4">{error}</p>
      )}
      {loading && (
        <p className="ds-text-body text-ds-gray-text mb-4">Загрузка…</p>
      )}
      <p className="ds-text-caption mb-4 text-ds-gray-text">
        Всего: {total}
        {totalPages > 1
          ? ` · стр. ${page} / ${totalPages}`
          : ""}
      </p>
      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u.id}>
            <Link
              href={`/school-admin/users/${encodeURIComponent(u.id)}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-3 hover:border-ds-primary"
            >
              <span className="ds-text-body font-medium text-ds-black">
                {[u.lastName, u.firstName].filter(Boolean).join(" ") || u.email}
              </span>
              <span className="ds-text-caption text-ds-gray-text">
                {u.isActive ? "активен" : "не активен"} · {u.email}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded border border-ds-gray-border px-3 py-1 ds-text-caption disabled:opacity-40"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </button>
          <button
            type="button"
            className="rounded border border-ds-gray-border px-3 py-1 ds-text-caption disabled:opacity-40"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
}
