"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  fetchSchoolUser,
  updateSchoolUser,
  activateSchoolUser,
  fetchUserProgressAdmin,
  fetchUserCertificatesAdmin,
  fetchUserQuizAttemptsAdmin,
  fetchUserDevices,
  deleteUserDevice,
  schoolStudentDisplayHeading,
  type SchoolStudentRow,
  type UserDeviceRow,
  type UserProgressRowAdmin,
  type UserCertificateRowAdmin,
  type UserQuizAttemptRowAdmin,
} from "@/lib/api/school-admin/users";
import { isApiConfigured } from "@/lib/env";

const cardClass =
  "rounded-2xl border border-ds-gray-border/80 bg-white/95 p-5 shadow-sm sm:p-6";

export default function SchoolAdminUserDetailPage() {
  const t = useTranslations("SchoolAdminUserDetail");
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<SchoolStudentRow | null>(null);
  const [devices, setDevices] = useState<UserDeviceRow[]>([]);
  const [progress, setProgress] = useState<UserProgressRowAdmin[] | null>(null);
  const [certs, setCerts] = useState<UserCertificateRowAdmin[] | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<
    UserQuizAttemptRowAdmin[] | null
  >(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  function refresh() {
    if (!isApiConfigured() || !userId) return;
    setLoaded(false);
    fetchSchoolUser(userId)
      .then((u) => {
        setUser(u);
        setError(null);
        if (u) {
          setFirstName(String(u.firstName ?? ""));
          setLastName(String(u.lastName ?? ""));
          setPatronymic(
            u.patronymic != null ? String(u.patronymic) : "",
          );
          setNewPassword("");
          setIsActive(Boolean(u.isActive));
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoaded(true));
    fetchUserDevices(userId)
      .then(setDevices)
      .catch(() => setDevices([]));
    fetchUserProgressAdmin(userId)
      .then(setProgress)
      .catch(() => setProgress(null));
    fetchUserCertificatesAdmin(userId)
      .then(setCerts)
      .catch(() => setCerts(null));
    fetchUserQuizAttemptsAdmin(userId)
      .then(setQuizAttempts)
      .catch(() => setQuizAttempts(null));
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  const heading = useMemo(() => {
    if (!user) return "";
    const h = schoolStudentDisplayHeading(user);
    return h || t("unnamed");
  }, [user, t]);

  const email = (user?.email ?? "").trim();
  const nameFieldsMimicEmail = useMemo(() => {
    if (!email) return false;
    const el = email.toLowerCase();
    return [lastName, firstName, patronymic].some(
      (x) => x.trim() && x.trim().toLowerCase() === el,
    );
  }, [email, lastName, firstName, patronymic]);

  const nameFieldsHaveAt = [lastName, firstName, patronymic].some((x) =>
    x.includes("@"),
  );

  async function save() {
    setError(null);
    setMsg(null);
    try {
      const body: Parameters<typeof updateSchoolUser>[1] = {
        firstName,
        lastName,
        isActive,
        patronymic: patronymic.trim() === "" ? null : patronymic.trim(),
      };
      if (newPassword.trim().length >= 8) {
        body.password = newPassword.trim();
      }
      await updateSchoolUser(userId, body);
      setMsg(t("saved"));
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    }
  }

  async function activate() {
    try {
      await activateSchoolUser(userId);
      setMsg(t("activated"));
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    }
  }

  async function removeDevice(deviceId: string) {
    if (!confirm(t("removeDeviceConfirm"))) return;
    try {
      await deleteUserDevice(userId, deviceId);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    }
  }

  if (!loaded) {
    return (
      <p className="ds-text-body text-ds-gray-text">{t("loading")}</p>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/school-admin/users"
          className="ds-text-caption text-ds-primary hover:underline"
        >
          {t("backToList")}
        </Link>
        <p className="ds-text-body mt-4 text-ds-error" role="alert">
          {error ?? t("notFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <Link
        href="/school-admin/users"
        className="ds-text-caption inline-block font-medium text-ds-primary hover:underline"
      >
        {t("backToList")}
      </Link>

      <header
        className={`${cardClass} flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`}
      >
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="ds-text-h2 text-balance break-words text-ds-black">
            {heading}
          </h1>
          <dl className="grid gap-2 text-sm sm:max-w-xl">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt className="shrink-0 font-medium text-ds-gray-text">
                {t("metaEmail")}
              </dt>
              <dd className="min-w-0 break-all font-mono text-ds-black">
                {user.email ?? t("emptyData")}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <dt className="shrink-0 font-medium text-ds-gray-text">
                {t("metaIin")}
              </dt>
              <dd className="font-mono text-ds-black">
                {user.iin ?? t("emptyData")}
              </dd>
              <dd className="w-full text-ds-gray-text sm:w-auto sm:pl-1">
                ({t("iinNote")})
              </dd>
            </div>
          </dl>
        </div>
        <span
          className={`inline-flex shrink-0 self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            isActive
              ? "bg-emerald-100 text-emerald-900"
              : "bg-ds-gray-light text-ds-gray-text"
          }`}
        >
          {isActive ? t("badgeActive") : t("badgeInactive")}
        </span>
      </header>

      {error && (
        <p className="ds-text-small text-ds-error" role="alert">
          {error}
        </p>
      )}
      {msg && (
        <p className="ds-text-small font-medium text-ds-black" role="status">
          {msg}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        <section className={`${cardClass} space-y-5 lg:col-span-5`}>
          <h2 className="ds-text-h3 text-ds-black">{t("sectionEdit")}</h2>
          {(nameFieldsMimicEmail || nameFieldsHaveAt) && (
            <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 ds-text-caption text-amber-950">
              {t("nameEmailClashHint")}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="ds-text-small mb-1 block font-medium text-ds-black">
                {t("lastName")}
              </label>
              <input
                className="ds-input w-full"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="ds-text-small mb-1 block font-medium text-ds-black">
                {t("firstName")}
              </label>
              <input
                className="ds-input w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="ds-text-small mb-1 block font-medium text-ds-black">
                {t("patronymic")}
              </label>
              <input
                className="ds-input w-full"
                value={patronymic}
                onChange={(e) => setPatronymic(e.target.value)}
                placeholder={t("emptyData")}
                autoComplete="additional-name"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="ds-text-small mb-1 block font-medium text-ds-black">
                {t("newPassword")}
                <span className="ml-1 font-normal text-ds-gray-text">
                  · {t("newPasswordHint")}
                </span>
              </label>
              <input
                type="password"
                className="ds-input w-full"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 ds-text-body text-ds-black">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ds-gray-border"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            {t("active")}
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void save()}
              className="ui-btn ui-btn--1"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => void activate()}
              className="ui-btn ui-btn--4"
            >
              {t("activate")}
            </button>
          </div>
        </section>

        <section className={`${cardClass} lg:col-span-7`}>
          <h2 className="ds-text-h3 mb-4 text-ds-black">{t("sectionDevices")}</h2>
          <ul className="space-y-2">
            {devices.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-3 rounded-xl border border-ds-gray-border/90 bg-ds-gray-light/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="ds-text-caption min-w-0 break-all text-ds-black">
                  <span className="font-mono text-ds-gray-text">
                    {d.deviceId ?? d.id}
                  </span>
                  {d.userAgent ? (
                    <>
                      <span className="mx-1 text-ds-gray-text">·</span>
                      <span>{d.userAgent}</span>
                    </>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="ui-btn ui-btn--6 shrink-0 self-start !py-2 !text-ds-error sm:self-center"
                  onClick={() => {
                    const dev = d.deviceId ?? d.id;
                    if (dev) void removeDevice(String(dev));
                  }}
                >
                  {t("detach")}
                </button>
              </li>
            ))}
          </ul>
          {devices.length === 0 && (
            <p className="ds-text-caption text-ds-gray-text">{t("noDevices")}</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="ds-text-h3 mb-3 text-ds-black">{t("sectionProgress")}</h2>
          <pre className="ds-text-caption max-h-56 overflow-auto rounded-xl border border-ds-gray-border/60 bg-ds-gray-light/50 p-4 font-mono text-xs leading-relaxed text-ds-black">
            {progress != null
              ? JSON.stringify(progress, null, 2)
              : t("emptyData")}
          </pre>
        </section>
        <section className={cardClass}>
          <h2 className="ds-text-h3 mb-3 text-ds-black">
            {t("sectionCertificates")}
          </h2>
          <pre className="ds-text-caption max-h-56 overflow-auto rounded-xl border border-ds-gray-border/60 bg-ds-gray-light/50 p-4 font-mono text-xs leading-relaxed text-ds-black">
            {certs != null ? JSON.stringify(certs, null, 2) : t("emptyData")}
          </pre>
        </section>
      </div>

      <section className={cardClass}>
        <h2 className="ds-text-h3 mb-2 text-ds-black">{t("sectionQuizzes")}</h2>
        <p className="ds-text-caption mb-3 text-ds-gray-text">{t("quizHint")}</p>
        <pre className="ds-text-caption max-h-64 overflow-auto rounded-xl border border-ds-gray-border/60 bg-ds-gray-light/50 p-4 font-mono text-xs leading-relaxed text-ds-black">
          {quizAttempts != null
            ? JSON.stringify(quizAttempts, null, 2)
            : t("emptyData")}
        </pre>
      </section>
    </div>
  );
}
