"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  fetchSuperNotifications,
  markSuperNotificationRead,
  type SuperNotificationRow,
} from "@/lib/api/super-admin/notifications";
import { isApiConfigured } from "@/lib/env";

export default function Page() {
  const [items, setItems] = useState<SuperNotificationRow[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    if (!isApiConfigured()) {
      setErr("Задайте NEXT_PUBLIC_API_BASE_URL");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    fetchSuperNotifications(unreadOnly)
      .then(setItems)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [unreadOnly]);

  return (
    <div className="max-w-5xl space-y-5">
      <header>
        <h1 className="ds-text-h2 text-ds-black">Уведомления</h1>
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          Лента системных уведомлений по всей платформе.
        </p>
      </header>
      <label className="inline-flex gap-2 rounded-lg border border-ds-gray-border bg-ds-white px-3 py-2 ds-text-caption text-ds-black">
        <input
          type="checkbox"
          checked={unreadOnly}
          onChange={(e) => setUnreadOnly(e.target.checked)}
        />
        Только непрочитанные
      </label>
      {err && (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}
      {loading && <p className="ds-text-caption text-ds-gray-text">Загрузка…</p>}
      {!loading && items.length === 0 && (
        <p className="rounded-lg border border-dashed border-ds-gray-border bg-[#FAFAFA] py-8 text-center ds-text-caption text-ds-gray-text">
          Уведомлений нет.
        </p>
      )}
      <ul className="space-y-4">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-ds-card border p-4 sm:p-5 ${
              n.readAt ? "bg-ds-white" : "border-ds-primary/30 bg-ds-gray-light"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-ds-black">{n.title}</p>
              <span className="shrink-0 ds-text-caption text-ds-gray-text">
                {n.createdAt ?? "—"}
              </span>
            </div>
            <p className="mt-1 ds-text-caption text-ds-gray-text">{n.body}</p>
            {typeof n.metadata?.studentUserId === "string" && (
              <Link
                href={`/super-admin/users/${encodeURIComponent(n.metadata.studentUserId)}`}
                className="mt-2 inline-block ds-text-caption text-ds-primary"
              >
                Ученик
              </Link>
            )}
            {!n.readAt && (
              <button
                type="button"
                className="ui-btn ui-btn--4 mt-2"
                onClick={() => markSuperNotificationRead(n.id).then(load)}
              >
                Прочитано
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
