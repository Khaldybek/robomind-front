"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchFormOptionSchools,
  type FormOptionSchoolRow,
} from "@/lib/api/super-admin/form-options";
import { isApiConfigured } from "@/lib/env";

function schoolLine(row: FormOptionSchoolRow): string {
  const n = row.number != null ? ` №${row.number}` : "";
  const name = `${row.name}${n}`.trim() || row.id;
  const dist = row.districtName?.trim();
  return dist ? `${name} · ${dist}` : name;
}

type Props = {
  value: string;
  selectedLabel: string | null;
  onSelect: (id: string, label: string) => void;
  onClear: () => void;
};

export function FormOptionSchoolPicker({
  value,
  selectedLabel,
  onSelect,
  onClear,
}: Props) {
  const t = useTranslations("SuperAdminUsers");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FormOptionSchoolRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchApplied(searchDraft.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchDraft]);

  const load = useCallback(() => {
    if (!isApiConfigured()) return;
    setLoading(true);
    setErr(null);
    fetchFormOptionSchools({
      page,
      limit: 50,
      search: searchApplied || undefined,
      isActive: true,
    })
      .then((r) => {
        setItems(r.items);
        setTotalPages(Math.max(1, r.totalPages));
      })
      .catch((e: Error) => {
        setErr(e.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [page, searchApplied]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-lg border border-ds-gray-border bg-ds-gray-light/20 p-3">
      <label className="ds-text-caption text-ds-gray-text">
        {t("schoolFilterLabel")}
      </label>
      {value ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="ds-text-small text-ds-black">
            {selectedLabel ?? value}
          </span>
          <code className="break-all font-mono text-xs text-ds-gray-text">
            {value}
          </code>
          <button
            type="button"
            className="ds-text-caption text-ds-primary underline"
            onClick={onClear}
          >
            {t("schoolClear")}
          </button>
        </div>
      ) : null}
      <input
        className="ds-input mt-2 w-full text-sm"
        placeholder={t("schoolSearchPlaceholder")}
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
      />
      {err && (
        <p className="mt-2 ds-text-caption text-ds-error" role="alert">
          {err}
        </p>
      )}
      {loading ? (
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          {t("schoolPickLoading")}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          {t("schoolPickEmpty")}
        </p>
      ) : (
        <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded border border-ds-gray-border bg-ds-white p-1">
          {items.map((row) => {
            const active = row.id === value;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className={`w-full rounded px-2 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-ds-primary/10 font-medium text-ds-black"
                      : "text-ds-black hover:bg-ds-gray-light"
                  }`}
                  onClick={() => onSelect(row.id, schoolLine(row))}
                >
                  <span className="block">{schoolLine(row)}</span>
                  <span className="ds-text-caption font-mono text-ds-gray-text">
                    {row.id}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="ds-text-caption text-ds-gray-text">
            {t("schoolPickPage", { page, totalPages })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border px-2 py-1 ds-text-caption disabled:opacity-40"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("back")}
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 ds-text-caption disabled:opacity-40"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("forward")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
