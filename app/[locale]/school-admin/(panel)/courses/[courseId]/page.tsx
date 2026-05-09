"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  fetchSchoolAdminCourse,
  fetchCourseAccesses,
  fetchCourseStudents,
  grantCourseAccess,
  grantCourseAccessBulk,
  revokeCourseAccess,
  patchCourseAccess,
  type AdminCourseRow,
  type CourseSchoolStudentRow,
} from "@/lib/api/school-admin/courses";
import {
  fetchSchoolUsersAllPages,
  type SchoolStudentRow,
} from "@/lib/api/school-admin/users";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

function pickAccessUserId(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const direct = o.userId ?? o.user_id ?? o.studentId ?? o.student_id;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const nestedUser = o.user;
  if (
    nestedUser &&
    typeof nestedUser === "object" &&
    "id" in nestedUser &&
    typeof (nestedUser as { id: unknown }).id === "string"
  ) {
    return String((nestedUser as { id: unknown }).id);
  }
  return null;
}

function readAccessRow(row: unknown): {
  userId: string;
  accessType?: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  maxQuizAttempts?: number | null;
} {
  if (!row || typeof row !== "object") return { userId: "" };
  const o = row as Record<string, unknown>;
  const maxRaw = o.maxQuizAttempts ?? o.max_quiz_attempts;
  const maxQuizAttempts =
    maxRaw === null || maxRaw === undefined || maxRaw === ""
      ? null
      : (() => {
          const n = Number(maxRaw);
          return Number.isFinite(n) && n >= 1 ? n : null;
        })();
  return {
    userId: String(o.userId ?? o.user_id ?? ""),
    accessType:
      o.accessType != null
        ? String(o.accessType)
        : o.access_type != null
          ? String(o.access_type)
          : undefined,
    expiresAt: (o.expiresAt ?? o.expires_at) as string | null | undefined,
    revokedAt: (o.revokedAt ?? o.revoked_at) as string | null | undefined,
    maxQuizAttempts,
  };
}

function accessRowsFromRaw(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: unknown[] }).items;
  }
  return [];
}

export default function SchoolAdminCourseAccessPage() {
  const t = useTranslations("SchoolAdminCourseAccess");
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<AdminCourseRow | null>(null);
  const [courseErr, setCourseErr] = useState<string | null>(null);

  const [withAccess, setWithAccess] = useState<CourseSchoolStudentRow[]>([]);
  const [allUsers, setAllUsers] = useState<SchoolStudentRow[]>([]);
  const [userId, setUserId] = useState("");
  const [accessType, setAccessType] = useState<"permanent" | "temporary">(
    "permanent",
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [maxQuizAttemptsGrant, setMaxQuizAttemptsGrant] = useState("");
  const [maxQuizAttemptsBulk, setMaxQuizAttemptsBulk] = useState("");
  const [patchUserId, setPatchUserId] = useState("");
  const [patchMaxAttempts, setPatchMaxAttempts] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [accessesRaw, setAccessesRaw] = useState<unknown>(null);
  const [accessesErr, setAccessesErr] = useState<string | null>(null);
  const [accessesLoading, setAccessesLoading] = useState(true);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [usersErr, setUsersErr] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);

  const accessListRows = useMemo(
    () => accessRowsFromRaw(accessesRaw),
    [accessesRaw],
  );

  const withAccessView = useMemo(() => {
    if (withAccess.length > 0) return withAccess;
    const ids = [
      ...new Set(accessListRows.map(pickAccessUserId).filter(Boolean)),
    ] as string[];
    if (ids.length === 0) return [] as CourseSchoolStudentRow[];
    return ids.map((id) => {
      const u = allUsers.find((x) => x.id === id);
      return {
        id,
        email: u?.email ?? "",
        firstName: u?.firstName ?? "",
        lastName: u?.lastName ?? "",
        schoolId: u?.schoolId ?? "",
        isActive: u?.isActive ?? true,
      };
    });
  }, [withAccess, accessListRows, allUsers]);

  function userLabel(id: string): string {
    const u = allUsers.find((x) => x.id === id);
    const name = [u?.lastName, u?.firstName].filter(Boolean).join(" ");
    if (name) return name;
    if (u?.email) return u.email;
    return id;
  }

  const accessLevel = useCallback(
    (level: string) => {
      if (level === "beginner") return t("levelBeginner");
      if (level === "intermediate") return t("levelIntermediate");
      if (level === "advanced") return t("levelAdvanced");
      return level;
    },
    [t],
  );

  const load = useCallback(() => {
    if (!isApiConfigured() || !courseId) return;
    setCourseErr(null);
    fetchSchoolAdminCourse(courseId)
      .then(setCourse)
      .catch((e: Error) => {
        setCourse(null);
        setCourseErr(e.message);
      });

    fetchCourseStudents(courseId)
      .then(setWithAccess)
      .catch(() => setWithAccess([]));

    setUsersErr(null);
    setUsersLoading(true);
    fetchSchoolUsersAllPages()
      .then((items) => {
        setAllUsers(items);
      })
      .catch((e: Error) => {
        setAllUsers([]);
        setUsersErr(e.message || t("usersLoadError"));
      })
      .finally(() => setUsersLoading(false));

    setAccessesErr(null);
    setAccessesLoading(true);
    fetchCourseAccesses(courseId)
      .then((data) => {
        setAccessesRaw(data);
      })
      .catch((e: Error) => {
        setAccessesRaw(null);
        setAccessesErr(e.message);
      })
      .finally(() => setAccessesLoading(false));
  }, [courseId, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function grant() {
    setError(null);
    setMsg(null);
    if (!userId) {
      setError(t("grantPickStudent"));
      return;
    }
    const rawM = maxQuizAttemptsGrant.trim();
    let maxQuizAttempts: number | undefined;
    if (rawM !== "") {
      const n = Number(rawM);
      if (!Number.isInteger(n) || n < 1 || n > 99) {
        setError(t("maxQuizAttemptsInvalid"));
        return;
      }
      maxQuizAttempts = n;
    }
    try {
      await grantCourseAccess(courseId, {
        userId,
        accessType,
        expiresAt:
          accessType === "temporary" && expiresAt
            ? new Date(expiresAt).toISOString()
            : undefined,
        ...(maxQuizAttempts != null ? { maxQuizAttempts } : {}),
      });
      setMsg(t("grantSuccess"));
      setUserId("");
      setMaxQuizAttemptsGrant("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    }
  }

  async function grantBulk() {
    setError(null);
    setMsg(null);
    const ids = bulkText
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const uniq = [...new Set(ids)];
    if (uniq.length < 1 || uniq.length > 200) {
      setError(t("bulkUuidHint"));
      return;
    }
    setBulkBusy(true);
    try {
      const rawM = maxQuizAttemptsBulk.trim();
      let maxQuizAttempts: number | undefined;
      if (rawM !== "") {
        const n = Number(rawM);
        if (!Number.isInteger(n) || n < 1 || n > 99) {
          setError(t("maxQuizAttemptsInvalid"));
          setBulkBusy(false);
          return;
        }
        maxQuizAttempts = n;
      }
      const r = await grantCourseAccessBulk(courseId, {
        userIds: uniq,
        accessType,
        expiresAt:
          accessType === "temporary" && expiresAt
            ? new Date(expiresAt).toISOString()
            : undefined,
        ...(maxQuizAttempts != null ? { maxQuizAttempts } : {}),
      });
      setMsg(
        t("bulkSuccess", {
          granted: r.grantedCount,
          errors: r.errors.length,
        }),
      );
      setBulkText("");
      setMaxQuizAttemptsBulk("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setBulkBusy(false);
    }
  }

  async function revoke(uid: string) {
    if (!confirm(t("revokeConfirm"))) return;
    try {
      await revokeCourseAccess(courseId, uid);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    }
  }

  const thumbSrc = resolvePublicFileUrl(course?.thumbnailUrl ?? null);
  const grantedCount = withAccessView.length;

  return (
    <div className="relative pb-16">
      <div className="pointer-events-none absolute inset-x-0 -top-4 h-72 overflow-hidden opacity-90">
        <div className="sa-orb sa-orb--a" />
        <div className="sa-orb sa-orb--b" />
        <div className="sa-grid-mask" />
      </div>

      <Link
        href="/school-admin/courses"
        className="relative z-[1] mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-medium text-ds-primary shadow-sm backdrop-blur-sm transition hover:border-ds-primary/30 hover:bg-white"
      >
        <span aria-hidden>←</span> {t("backToCatalog")}
      </Link>

      <header className="sa-card-in relative z-[1] mb-8 overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white/95 via-white/85 to-ds-gray-light/50 p-6 shadow-[0_24px_70px_-32px_rgba(0,0,0,0.18)] backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl border border-white/90 shadow-inner sm:h-48 lg:h-auto lg:w-[min(100%,320px)]">
            {thumbSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbSrc}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(255,96,84,0.25),transparent_50%),linear-gradient(135deg,#eef2f9,#f8f9fc)]">
                <span className="ds-text-caption text-ds-gray-text">
                  {t("coverPlaceholder")}
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ds-primary">
              {t("eyebrow")}
            </p>
            <h1 className="mt-2 text-balance font-semibold leading-tight text-ds-black [font-size:clamp(1.35rem,3vw,2rem)]">
              {course?.title ?? t("courseFallback")}
            </h1>
            {courseErr && (
              <p className="mt-2 ds-text-caption text-ds-error">{courseErr}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {course?.level && (
                <span className="rounded-full border border-ds-primary/25 bg-ds-primary/10 px-3 py-1 text-xs font-medium text-ds-black">
                  {accessLevel(course.level)}
                </span>
              )}
              <span className="rounded-full border border-ds-gray-border bg-white/80 px-3 py-1 text-xs font-medium text-ds-gray-text">
                {t("modulesCount")}{" "}
                <span className="tabular-nums text-ds-black">
                  {course?.moduleCount ?? "—"}
                </span>
              </span>
              <span className="rounded-full border border-ds-gray-border bg-white/80 px-3 py-1 text-xs font-medium text-ds-gray-text">
                {t("studentsWithAccess")}{" "}
                <span className="tabular-nums text-ds-primary">{grantedCount}</span>
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ds-gray-text">
              {t("lead")}
            </p>
            <p className="mt-3 font-mono text-[11px] text-ds-gray-text/90">
              {t("courseId")} <span className="text-ds-black/80">{courseId}</span>
            </p>
            <Link
              href={`/school-admin/courses/${encodeURIComponent(courseId)}/modules`}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-ds-primary/30 bg-ds-primary/8 px-4 py-2 text-sm font-medium text-ds-primary transition hover:bg-ds-primary/15"
            >
              {t("modulesHomework")}
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-[1] grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="sa-card-in rounded-[22px] border border-white/90 bg-white/80 p-6 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.12)] backdrop-blur-sm">
          <h2 className="ds-text-h3 text-ds-black">{t("grantTitle")}</h2>
          <p className="mt-1 text-sm text-ds-gray-text">
            {t("grantLead")}
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
                {t("studentLabel")}
              </label>
              <select
                className="ds-input w-full"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={usersLoading}
              >
                <option value="">
                  {usersLoading ? t("selectLoading") : t("selectPlaceholder")}
                </option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {[u.lastName, u.firstName].filter(Boolean).join(" ") ||
                      u.email ||
                      u.id}{" "}
                    {u.email ? `(${u.email})` : ""}
                  </option>
                ))}
              </select>
              {usersErr && (
                <p className="ds-text-caption mt-1.5 text-ds-error" role="alert">
                  {usersErr}
                </p>
              )}
              {!usersLoading && !usersErr && allUsers.length === 0 && (
                <p className="ds-text-caption mt-1.5 text-ds-gray-text">
                  {t("usersEmpty")}
                </p>
              )}
            </div>
            <div>
              <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
                {t("accessType")}
              </label>
              <select
                className="ds-input w-full"
                value={accessType}
                onChange={(e) =>
                  setAccessType(e.target.value as "permanent" | "temporary")
                }
              >
                <option value="permanent">{t("accessPermanent")}</option>
                <option value="temporary">{t("accessTemporary")}</option>
              </select>
            </div>
            {accessType === "temporary" && (
              <div>
                <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
                  {t("validUntil")}
                </label>
                <input
                  type="datetime-local"
                  className="ds-input w-full"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
                {t("maxQuizAttemptsLabel")}
              </label>
              <input
                type="number"
                min={1}
                max={99}
                className="ds-input w-full max-w-[200px]"
                value={maxQuizAttemptsGrant}
                onChange={(e) => setMaxQuizAttemptsGrant(e.target.value)}
                placeholder={t("maxQuizAttemptsPlaceholder")}
              />
              <p className="ds-text-caption mt-1 text-ds-gray-text">
                {t("maxQuizAttemptsHint")}
              </p>
            </div>
            {error && (
              <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
                {error}
              </p>
            )}
            {msg && (
              <p className="rounded-lg border border-ds-success/30 bg-[#F0FFF4] px-3 py-2 ds-text-small text-ds-success">
                {msg}
              </p>
            )}
            <button
              type="button"
              onClick={() => void grant()}
              className="ui-btn ui-btn--1 w-full sm:w-auto"
            >
              {t("grantButton")}
            </button>
          </div>
        </section>

        <section className="sa-card-in rounded-[22px] border border-white/90 bg-white/80 p-6 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.12)] backdrop-blur-sm">
          <h2 className="ds-text-h3 text-ds-black">{t("bulkTitle")}</h2>
          <p className="mt-1 text-sm text-ds-gray-text">
            {t("bulkLead")}
          </p>
          <textarea
            className="ds-input mt-4 min-h-[120px] w-full font-mono text-xs"
            placeholder={t("bulkPlaceholder")}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <div className="mt-4">
            <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
              {t("maxQuizAttemptsBulkLabel")}
            </label>
            <input
              type="number"
              min={1}
              max={99}
              className="ds-input w-full max-w-[200px]"
              value={maxQuizAttemptsBulk}
              onChange={(e) => setMaxQuizAttemptsBulk(e.target.value)}
              placeholder={t("maxQuizAttemptsPlaceholder")}
            />
            <p className="ds-text-caption mt-1 text-ds-gray-text">
              {t("maxQuizAttemptsBulkHint")}
            </p>
          </div>
          <button
            type="button"
            className="ui-btn ui-btn--4 mt-4 w-full sm:w-auto"
            disabled={bulkBusy}
            onClick={() => void grantBulk()}
          >
            {bulkBusy ? t("bulkSubmitting") : t("bulkSubmit")}
          </button>
        </section>
      </div>

      <section className="sa-card-in relative z-[1] mt-8 rounded-[22px] border border-white/90 bg-white/80 p-6 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.12)] backdrop-blur-sm">
        <h2 className="ds-text-h3 text-ds-black">{t("patchAccessTitle")}</h2>
        <p className="mt-1 text-sm text-ds-gray-text">{t("patchAccessLead")}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
              {t("patchAccessStudent")}
            </label>
            <select
              className="ds-input w-full"
              value={patchUserId}
              onChange={(e) => setPatchUserId(e.target.value)}
            >
              <option value="">{t("patchAccessStudentPlaceholder")}</option>
              {withAccessView.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.lastName, u.firstName].filter(Boolean).join(" ") || u.email || u.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
              {t("patchAccessMaxLabel")}
            </label>
            <input
              type="number"
              min={1}
              max={99}
              className="ds-input w-full"
              value={patchMaxAttempts}
              onChange={(e) => setPatchMaxAttempts(e.target.value)}
              placeholder={t("maxQuizAttemptsPlaceholder")}
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              className="ui-btn ui-btn--1"
              onClick={() => {
                void (async () => {
                  setError(null);
                  setMsg(null);
                  if (!patchUserId) {
                    setError(t("patchAccessPickStudent"));
                    return;
                  }
                  const raw = patchMaxAttempts.trim();
                  if (raw === "") {
                    setError(t("patchAccessNeedNumber"));
                    return;
                  }
                  const n = Number(raw);
                  if (!Number.isInteger(n) || n < 1 || n > 99) {
                    setError(t("maxQuizAttemptsInvalid"));
                    return;
                  }
                  try {
                    await patchCourseAccess(courseId, patchUserId, {
                      maxQuizAttempts: n,
                    });
                    setMsg(t("patchAccessOk"));
                    setPatchMaxAttempts("");
                    load();
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : t("errorGeneric"),
                    );
                  }
                })();
              }}
            >
              {t("patchAccessSave")}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--6 !border-ds-error/30 !text-ds-error"
              onClick={() => {
                void (async () => {
                  if (!patchUserId) {
                    setError(t("patchAccessPickStudent"));
                    return;
                  }
                  if (!confirm(t("patchAccessClearConfirm"))) return;
                  setError(null);
                  setMsg(null);
                  try {
                    await patchCourseAccess(courseId, patchUserId, {
                      maxQuizAttempts: null,
                    });
                    setMsg(t("patchAccessClearOk"));
                    load();
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : t("errorGeneric"),
                    );
                  }
                })();
              }}
            >
              {t("patchAccessClear")}
            </button>
          </div>
        </div>
      </section>

      <section className="sa-card-in relative z-[1] mt-8 rounded-[22px] border border-white/90 bg-white/85 p-6 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.1)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="ds-text-h3 text-ds-black">{t("withAccessTitle")}</h2>
            <p className="mt-1 text-sm text-ds-gray-text">
              {t("withAccessLead")}
            </p>
          </div>
          <span className="rounded-full bg-ds-gray-light px-4 py-1.5 text-sm font-medium tabular-nums text-ds-black">
            {grantedCount}
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {withAccessView.map((u, i) => (
            <li
              key={u.id}
              className="sa-card-in flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ds-gray-border/80 bg-white/90 px-4 py-3 shadow-sm"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ds-primary/15 to-ds-primary/5 text-sm font-bold text-ds-primary">
                  {(u.firstName?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ds-black">
                    {[u.lastName, u.firstName].filter(Boolean).join(" ") || u.id}
                  </p>
                  {u.email ? (
                    <p className="truncate ds-text-caption text-ds-gray-text">
                      {u.email}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="ui-btn ui-btn--6 shrink-0 !border-ds-error/40 !text-ds-error hover:!bg-[#FFF5F5]"
                onClick={() => revoke(u.id)}
              >
                {t("revoke")}
              </button>
            </li>
          ))}
        </ul>
        {withAccessView.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-ds-gray-border bg-ds-gray-light/40 px-4 py-8 text-center text-sm text-ds-gray-text">
            {t("withAccessEmpty")}
          </p>
        )}
      </section>

      <section className="sa-card-in relative z-[1] mt-8 rounded-[22px] border border-ds-gray-border/60 bg-[#FAFAFA]/90 p-6 backdrop-blur-sm">
        <h2 className="ds-text-h3 text-ds-black">{t("apiTitle")}</h2>
        <p className="mt-1 text-sm text-ds-gray-text">{t("apiLead")}</p>
        {accessesLoading && (
          <p className="mt-4 ds-text-caption text-ds-gray-text">{t("apiLoading")}</p>
        )}
        {!accessesLoading && accessesErr && (
          <p className="mt-4 ds-text-small text-ds-error">{accessesErr}</p>
        )}
        {!accessesLoading && !accessesErr && accessListRows.length > 0 && (
          <ul className="mt-4 space-y-2">
            {accessListRows.map((row, idx) => {
              const a = readAccessRow(row);
              const uid = a.userId || pickAccessUserId(row) || "";
              const revoked = Boolean(a.revokedAt);
              return (
                <li
                  key={`${uid}-${idx}`}
                  className="rounded-xl border border-ds-gray-border/70 bg-white px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ds-black">
                      {uid ? userLabel(uid) : t("rowFallback")}
                    </span>
                    {a.accessType && (
                      <span className="rounded-full bg-ds-gray-light px-2 py-0.5 text-xs text-ds-black">
                        {a.accessType}
                      </span>
                    )}
                  </div>
                  {uid && (
                    <p className="mt-1 font-mono text-[11px] text-ds-gray-text">
                      {uid}
                    </p>
                  )}
                  {a.expiresAt && (
                    <p className="mt-1 text-xs text-ds-gray-text">
                      {t("expiresUntil", { date: a.expiresAt })}
                    </p>
                  )}
                  {a.maxQuizAttempts != null && (
                    <p className="mt-1 text-xs text-ds-gray-text">
                      {t("rowMaxQuizAttempts", { n: a.maxQuizAttempts })}
                    </p>
                  )}
                  {revoked && (
                    <p className="mt-1 text-xs text-ds-error">{t("revoked")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {!accessesLoading &&
          !accessesErr &&
          accessListRows.length === 0 &&
          accessesRaw != null && (
            <p className="mt-4 ds-text-caption text-ds-gray-text">
              {t("emptyAccessList")}
            </p>
          )}

        <details className="mt-6 rounded-xl border border-ds-gray-border bg-white/80 p-3">
          <summary className="cursor-pointer text-sm font-medium text-ds-primary">
            {t("rawJson")}
          </summary>
          <pre className="mt-3 max-h-48 overflow-auto font-mono text-[11px] text-ds-gray-text">
            {accessesRaw != null
              ? JSON.stringify(accessesRaw, null, 2)
              : t("dash")}
          </pre>
        </details>
      </section>
    </div>
  );
}
