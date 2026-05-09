"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchFormOptionLessons,
  type FormOptionLessonRow,
} from "@/lib/api/super-admin/form-options";
import { isApiConfigured } from "@/lib/env";

type Props = {
  value: string;
  selectedLabel: string | null;
  onSelect: (id: string, label: string) => void;
  onClear: () => void;
};

export function FormOptionLessonPicker({
  value,
  selectedLabel,
  onSelect,
  onClear,
}: Props) {
  const t = useTranslations("SuperAdminAi");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FormOptionLessonRow[]>([]);
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
    fetchFormOptionLessons({
      page,
      limit: 50,
      search: searchApplied || undefined,
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

  const rowLabel = (row: FormOptionLessonRow) =>
    `${row.courseTitle} · ${row.courseModuleTitle} · ${row.title}`.trim() ||
    row.id;

  return (
    <div className="rounded-lg border border-ds-gray-border bg-ds-gray-light/20 p-4">
      <label className="ds-text-caption text-ds-gray-text">
        {t("lessonFilterLabel")}
      </label>
      {value ? (
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <span className="ds-text-small text-ds-black">
            {selectedLabel ?? value}
          </span>
          <code className="break-all font-mono text-xs text-ds-gray-text">
            {value}
          </code>
          <button
            type="button"
            className="ds-text-caption text-ds-primary underline sm:ml-auto"
            onClick={onClear}
          >
            {t("lessonClear")}
          </button>
        </div>
      ) : null}
      <input
        className="ds-input mt-3 w-full text-sm"
        placeholder={t("lessonSearchPlaceholder")}
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
          {t("lessonPickLoading")}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          {t("lessonPickEmpty")}
        </p>
      ) : (
        <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto rounded border border-ds-gray-border bg-ds-white p-1">
          {items.map((row) => {
            const active = row.id === value;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className={`w-full rounded px-2 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-ds-primary/10 font-medium text-ds-black"
                      : "text-ds-black hover:bg-ds-gray-light"
                  }`}
                  onClick={() => onSelect(row.id, rowLabel(row))}
                >
                  <span className="block leading-snug">{rowLabel(row)}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 ds-text-caption text-ds-gray-text">
                    <span className="font-mono">{row.id}</span>
                    <span>
                      {t("orderShort", { order: row.order })}
                      {row.isPublished
                        ? ` · ${t("publishedBadge")}`
                        : ` · ${t("draftBadge")}`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ds-gray-border pt-3">
          <span className="ds-text-caption text-ds-gray-text">
            {t("lessonPickPage", { page, totalPages })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-ds-gray-border bg-ds-white px-3 py-1.5 ds-text-caption text-ds-black transition-colors hover:bg-ds-gray-light disabled:opacity-40"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("back")}
            </button>
            <button
              type="button"
              className="rounded border border-ds-gray-border bg-ds-white px-3 py-1.5 ds-text-caption text-ds-black transition-colors hover:bg-ds-gray-light disabled:opacity-40"
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
