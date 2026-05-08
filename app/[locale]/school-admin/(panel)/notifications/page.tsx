"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  fetchAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AdminNotificationRow,
} from "@/lib/api/school-admin/notifications";
import { SchoolAdminPageHero } from "@/components/school-admin/admin-page-hero";
import { useSchoolAdminMe } from "@/components/school-admin/admin-me-context";
import { isApiConfigured } from "@/lib/env";

export default function SchoolAdminNotificationsPage() {
  const t = useTranslations("SchoolAdminNotifications");
  const [items, setItems] = useState<AdminNotificationRow[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUnread } = useSchoolAdminMe();

  const load = useCallback(() => {
    if (!isApiConfigured()) return;
    fetchAdminNotifications(unreadOnly)
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }, [unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function read(id: string) {
    try {
      await markNotificationRead(id);
      load();
      void refreshUnread();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    }
  }

  async function readAll() {
    try {
      await markAllNotificationsRead();
      setError(null);
      load();
      void refreshUnread();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    }
  }

  return (
    <div>
      <SchoolAdminPageHero title={t("pageTitle")} description={t("pageLead")} />

      <div className="sa-card mb-6 flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          {t("unreadOnly")}
        </label>
        <button
          type="button"
          className="inline-flex items-center rounded-2xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
          onClick={() => void readAll()}
        >
          {t("readAll")}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`sa-card p-5 ${
              n.readAt
                ? ""
                : "border-sky-300/70 ring-1 ring-sky-200/60"
            }`}
          >
            <p className="text-base font-semibold text-slate-900">{n.title}</p>
            {n.body ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {n.body}
              </p>
            ) : null}
            {n.createdAt ? (
              <p className="mt-2 text-xs text-slate-500">{n.createdAt}</p>
            ) : null}
            {typeof n.metadata?.studentUserId === "string" && (
              <Link
                href={`/school-admin/users/${encodeURIComponent(n.metadata.studentUserId)}`}
                className="mt-3 inline-block text-sm font-semibold text-sky-700 hover:text-sky-900"
              >
                {t("studentCard")}
              </Link>
            )}
            {!n.readAt && (
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-2xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
                onClick={() => void read(n.id)}
              >
                {t("markRead")}
              </button>
            )}
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="text-sm text-slate-500">{t("empty")}</p>
      )}
    </div>
  );
}
