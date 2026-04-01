"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  fetchAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AdminNotificationRow,
} from "@/lib/api/school-admin/notifications";
import { isApiConfigured } from "@/lib/env";

export default function SchoolAdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotificationRow[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!isApiConfigured()) return;
    fetchAdminNotifications(unreadOnly)
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, [unreadOnly]);

  async function read(id: string) {
    try {
      await markNotificationRead(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  async function readAll() {
    try {
      await markAllNotificationsRead();
      setError(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  return (
    <div>
      <h1 className="ds-text-h1 mb-6 text-ds-black">Уведомления</h1>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 ds-text-body">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Только непрочитанные
        </label>
        <button
          type="button"
          className="ui-btn ui-btn--4 ds-text-caption"
          onClick={() => void readAll()}
        >
          Прочитать все (PATCH /read-all)
        </button>
      </div>
      {error && <p className="ds-text-small text-ds-error mb-4">{error}</p>}
      <ul className="space-y-4">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-ds-card border p-4 ${
              n.readAt ? "border-ds-gray-border bg-ds-white" : "border-ds-primary/40 bg-ds-gray-light"
            }`}
          >
            <p className="ds-text-subtitle text-ds-black">{n.title}</p>
            <p className="ds-text-body mt-2 text-ds-gray-text">{n.body}</p>
            <p className="ds-text-caption mt-2 text-ds-gray-text">
              {n.createdAt}
            </p>
            {typeof n.metadata?.studentUserId === "string" && (
              <Link
                href={`/school-admin/users/${encodeURIComponent(n.metadata.studentUserId)}`}
                className="ds-text-caption mt-2 inline-block text-ds-primary"
              >
                Карточка ученика
              </Link>
            )}
            {!n.readAt && (
              <button
                type="button"
                className="ui-btn ui-btn--4 mt-3"
                onClick={() => void read(n.id)}
              >
                Прочитано
              </button>
            )}
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="ds-text-caption text-ds-gray-text">Пусто</p>
      )}
    </div>
  );
}
