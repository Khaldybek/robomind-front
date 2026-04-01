"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  fetchSuperUser,
  updateSuperUser,
  activateSuperUser,
  fetchSuperUserProgress,
  fetchSuperUserCertificates,
  fetchSuperUserDevices,
  deleteSuperUserDevice,
  type AdminUser,
  type UserDeviceRow,
} from "@/lib/api/super-admin/users";
import { isApiConfigured } from "@/lib/env";

export default function Page() {
  const { userId } = useParams() as { userId: string };
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [devices, setDevices] = useState<UserDeviceRow[]>([]);
  const [progress, setProgress] = useState<unknown>(null);
  const [certs, setCerts] = useState<unknown>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function refresh() {
    if (!isApiConfigured() || !userId) return;
    setLoaded(false);
    fetchSuperUser(userId)
      .then((u) => {
        setUser(u);
        setErr(null);
        if (u) {
          setFirstName(String(u.firstName ?? ""));
          setLastName(String(u.lastName ?? ""));
          setSchoolId(String(u.schoolId ?? ""));
          setIsActive(Boolean(u.isActive));
        }
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoaded(true));
    fetchSuperUserDevices(userId).then(setDevices).catch(() => setDevices([]));
    fetchSuperUserProgress(userId).then(setProgress).catch(() => {});
    fetchSuperUserCertificates(userId).then(setCerts).catch(() => {});
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  if (!loaded) {
    return <p className="ds-text-caption text-ds-gray-text">Загрузка…</p>;
  }
  if (!user) {
    return (
      <div>
        <Link href="/super-admin/users" className="text-ds-primary">
          ← Назад
        </Link>
        <p className="mt-4 text-ds-error">{err ?? "Не найден"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/super-admin/users" className="ds-text-caption text-ds-primary">
        ← Список
      </Link>
      <h1 className="ds-text-h2 text-ds-black">
        {[user.lastName, user.firstName, user.patronymic]
          .filter(Boolean)
          .join(" ")}
      </h1>
      <p className="ds-text-caption text-ds-gray-text">
        {user.email} · {user.role}
        {user.iin ? ` · ИИН ${user.iin}` : ""}
      </p>
      {user.school && (
        <p className="ds-text-caption text-ds-gray-text">
          Школа: {user.school.name}
          {user.school.number != null ? ` №${user.school.number}` : ""} (
          <code className="font-mono">{user.school.id}</code>)
        </p>
      )}
      {user.role === "super_admin" && (
        <p className="ds-text-caption text-ds-gray-text">
          У супер-админа нет привязки к школе (schoolId: null).
        </p>
      )}

      <form
        className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setErr(null);
          updateSuperUser(userId, {
            firstName,
            lastName,
            isActive,
            schoolId: schoolId || undefined,
          })
            .then(() => {
              setMsg("Сохранено");
              refresh();
            })
            .catch((e) => setErr(e instanceof Error ? e.message : "Ошибка"));
        }}
      >
        <h2 className="ds-text-h3 text-ds-black">Профиль пользователя</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="ds-input"
            placeholder="Фамилия"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            className="ds-input"
            placeholder="Имя"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <input
          className="mt-3 ds-input sm:max-w-md"
          placeholder="schoolId (для ученика)"
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
        />
        <label className="mt-3 flex gap-2 ds-text-caption text-ds-black">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Активен
        </label>
        {err && (
          <p className="mt-3 rounded border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
            {err}
          </p>
        )}
        {msg && <p className="mt-3 ds-text-small text-ds-black">{msg}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="ui-btn ui-btn--1">
            Сохранить
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--4"
            onClick={() =>
              activateSuperUser(userId)
                .then(() => refresh())
                .catch((e) => setErr(String(e)))
            }
          >
            Активировать
          </button>
        </div>
      </form>

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 mb-4 text-ds-black">Устройства</h2>
        <ul className="space-y-2">
          {devices.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap justify-between gap-2 rounded-ds-card border border-ds-gray-border bg-ds-white px-3 py-2 ds-text-caption"
            >
              <span className="break-all">{d.deviceId}</span>
              <button
                type="button"
                className="text-ds-error"
                onClick={() =>
                  d.deviceId &&
                  deleteSuperUserDevice(userId, d.deviceId).then(refresh)
                }
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">Прогресс и сертификаты</h2>
        <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light p-4 ds-text-caption">
          {JSON.stringify({ progress, certs }, null, 2)}
        </pre>
      </section>
    </div>
  );
}
