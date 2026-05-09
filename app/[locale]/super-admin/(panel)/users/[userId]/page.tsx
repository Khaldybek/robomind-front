"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("SuperAdminUser");
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
    return <p className="ds-text-caption text-ds-gray-text">{t("loading")}</p>;
  }
  if (!user) {
    return (
      <div>
        <Link href="/super-admin/users" className="text-ds-primary">
          {t("back")}
        </Link>
        <p className="mt-4 text-ds-error">{err ?? t("notFound")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/super-admin/users" className="ds-text-caption text-ds-primary">
        {t("backList")}
      </Link>
      <h1 className="ds-text-h2 text-ds-black">
        {[user.lastName, user.firstName, user.patronymic]
          .filter(Boolean)
          .join(" ")}
      </h1>
      <p className="ds-text-caption text-ds-gray-text">
        {user.email} · {user.role}
        {user.iin ? ` · ${t("iin", { iin: user.iin })}` : ""}
      </p>
      {user.school && (
        <p className="ds-text-caption text-ds-gray-text">
          {t("schoolLine", {
            name: user.school.name,
            numberSuffix:
              user.school.number != null
                ? t("numberSuffix", { n: user.school.number })
                : "",
            id: user.school.id,
          })}
        </p>
      )}
      {user.role === "super_admin" && (
        <p className="ds-text-caption text-ds-gray-text">{t("superNoSchool")}</p>
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
              setMsg(t("saved"));
              refresh();
            })
            .catch((e) => setErr(e instanceof Error ? e.message : t("errorGeneric")));
        }}
      >
        <h2 className="ds-text-h3 text-ds-black">{t("profileTitle")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="ds-input"
            placeholder={t("placeholderLastName")}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            className="ds-input"
            placeholder={t("placeholderFirstName")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <input
          className="mt-3 ds-input sm:max-w-md"
          placeholder={t("placeholderSchoolId")}
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
        />
        <label className="mt-3 flex gap-2 ds-text-caption text-ds-black">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          {t("active")}
        </label>
        {err && (
          <p className="mt-3 rounded border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
            {err}
          </p>
        )}
        {msg && <p className="mt-3 ds-text-small text-ds-black">{msg}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="ui-btn ui-btn--1">
            {t("save")}
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
            {t("activate")}
          </button>
        </div>
      </form>

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 mb-4 text-ds-black">{t("devicesTitle")}</h2>
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
                {t("remove")}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">{t("progressTitle")}</h2>
        <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light p-4 ds-text-caption">
          {JSON.stringify({ progress, certs }, null, 2)}
        </pre>
      </section>
    </div>
  );
}
