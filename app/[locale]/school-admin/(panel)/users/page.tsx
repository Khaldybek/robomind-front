"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  fetchSchoolUsers,
  downloadSchoolUsersCsv,
  type SchoolStudentRow,
} from "@/lib/api/school-admin/users";
import { SchoolUsersImportPanel } from "@/components/school-admin/users-import-panel";
import { SchoolAdminPageHero } from "@/components/school-admin/admin-page-hero";
import { isApiConfigured } from "@/lib/env";

const PAGE_SIZE = 20;

export default function SchoolAdminUsersPage() {
  const t = useTranslations("SchoolAdminUsers");
  return (
    <Suspense
      fallback={
        <div className="px-1 py-2 text-sm text-slate-600">{t("suspenseLoading")}</div>
      }
    >
      <SchoolAdminUsersPageInner />
    </Suspense>
  );
}

function SchoolAdminUsersPageInner() {
  const t = useTranslations("SchoolAdminUsers");
  const tc = useTranslations("Common");
  const searchParams = useSearchParams();
  const initialSearch = (searchParams.get("search") ?? "").trim();
  const [items, setItems] = useState<SchoolStudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDraft, setSearchDraft] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const next = (searchParams.get("search") ?? "").trim();
    setSearch((prev) => (prev === next ? prev : next));
    setSearchDraft((prev) => (prev === next ? prev : next));
    setPage(1);
  }, [searchParams]);

  const load = useCallback(() => {
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
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
  }, [page, search, isActiveFilter, tc]);

  useEffect(() => {
    load();
  }, [load]);

  function applySearch() {
    setSearch(searchDraft.trim());
    setPage(1);
  }

  return (
    <div>
      <SchoolAdminPageHero title={t("pageTitle")} description={t("pageLead")} />

      <SchoolUsersImportPanel onImported={load} />

      <div className="sa-card mb-6 flex flex-wrap items-end gap-3 p-4 sm:p-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("searchLabel")}
          </label>
          <input
            className="mt-1 block w-full max-w-xs rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder={t("searchPlaceholder")}
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("statusLabel")}
          </label>
          <select
            className="mt-1 block min-w-[140px] rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value as typeof isActiveFilter);
              setPage(1);
            }}
          >
            <option value="all">{t("statusAll")}</option>
            <option value="yes">{t("statusActive")}</option>
            <option value="no">{t("statusInactive")}</option>
          </select>
        </div>
        <button
          type="button"
          onClick={applySearch}
          className="inline-flex h-[42px] items-center rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm shadow-sky-600/25 transition hover:bg-sky-700"
        >
          {t("find")}
        </button>
        <button
          type="button"
          disabled={exporting || !isApiConfigured()}
          className="inline-flex h-[42px] items-center rounded-2xl border border-slate-200/90 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            setExporting(true);
            setError(null);
            downloadSchoolUsersCsv()
              .catch((e: Error) => setError(e.message))
              .finally(() => setExporting(false));
          }}
        >
          {exporting ? t("exportBusy") : t("exportCsv")}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {loading && (
        <p className="mb-4 text-sm text-slate-600">{tc("loading")}</p>
      )}
      <p className="mb-4 text-xs text-slate-500">
        {t("total", { total })}
        {totalPages > 1
          ? ` · ${t("pageOf", { page, totalPages })}`
          : ""}
      </p>

      <ul className="space-y-2">
        {items.map((u) => (
          <li key={u.id}>
            <Link
              href={`/school-admin/users/${encodeURIComponent(u.id)}`}
              className="sa-card flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:border-sky-300"
            >
              <span className="text-sm font-medium text-slate-900">
                {[u.lastName, u.firstName].filter(Boolean).join(" ") || u.email}
              </span>
              <span className="text-xs text-slate-500">
                {u.isActive ? t("active") : t("inactive")} · {u.email}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("back")}
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("forward")}
          </button>
        </div>
      )}
    </div>
  );
}
