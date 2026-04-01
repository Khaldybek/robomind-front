"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  fetchSchoolAdminCourse,
  fetchCourseAccesses,
  fetchCourseStudents,
  grantCourseAccess,
  grantCourseAccessBulk,
  revokeCourseAccess,
  type AdminCourseRow,
  type CourseSchoolStudentRow,
} from "@/lib/api/school-admin/courses";
import {
  fetchSchoolUsersAllPages,
  type SchoolStudentRow,
} from "@/lib/api/school-admin/users";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

function levelRu(level: string): string {
  if (level === "beginner") return "Начальный";
  if (level === "intermediate") return "Средний";
  if (level === "advanced") return "Продвинутый";
  return level;
}

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
} {
  if (!row || typeof row !== "object") return { userId: "" };
  const o = row as Record<string, unknown>;
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

  function load() {
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
        setUsersErr(e.message || "Не удалось загрузить учеников школы");
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
  }

  useEffect(() => {
    load();
  }, [courseId]);

  async function grant() {
    setError(null);
    setMsg(null);
    if (!userId) {
      setError("Выберите ученика");
      return;
    }
    try {
      await grantCourseAccess(courseId, {
        userId,
        accessType,
        expiresAt:
          accessType === "temporary" && expiresAt
            ? new Date(expiresAt).toISOString()
            : undefined,
      });
      setMsg("Доступ выдан");
      setUserId("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
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
      setError(
        "Укажите от 1 до 200 уникальных UUID (через запятую или с новой строки)",
      );
      return;
    }
    setBulkBusy(true);
    try {
      const r = await grantCourseAccessBulk(courseId, {
        userIds: uniq,
        accessType,
        expiresAt:
          accessType === "temporary" && expiresAt
            ? new Date(expiresAt).toISOString()
            : undefined,
      });
      setMsg(
        `Массовая выдача: успешно ${r.grantedCount}, ошибок: ${r.errors.length}`,
      );
      setBulkText("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBulkBusy(false);
    }
  }

  async function revoke(uid: string) {
    if (!confirm("Отозвать доступ?")) return;
    try {
      await revokeCourseAccess(courseId, uid);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
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
        <span aria-hidden>←</span> К каталогу курсов
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
                  Обложка курса
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ds-primary">
              Доступ к обучению
            </p>
            <h1 className="mt-2 text-balance font-semibold leading-tight text-ds-black [font-size:clamp(1.35rem,3vw,2rem)]">
              {course?.title ?? "Курс"}
            </h1>
            {courseErr && (
              <p className="mt-2 ds-text-caption text-ds-error">{courseErr}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {course?.level && (
                <span className="rounded-full border border-ds-primary/25 bg-ds-primary/10 px-3 py-1 text-xs font-medium text-ds-black">
                  {levelRu(course.level)}
                </span>
              )}
              <span className="rounded-full border border-ds-gray-border bg-white/80 px-3 py-1 text-xs font-medium text-ds-gray-text">
                Модулей:{" "}
                <span className="tabular-nums text-ds-black">
                  {course?.moduleCount ?? "—"}
                </span>
              </span>
              <span className="rounded-full border border-ds-gray-border bg-white/80 px-3 py-1 text-xs font-medium text-ds-gray-text">
                Учеников школы с доступом:{" "}
                <span className="tabular-nums text-ds-primary">{grantedCount}</span>
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ds-gray-text">
              Выдайте доступ ученикам вашей школы к этому курсу. Временный доступ
              можно ограничить датой окончания; отзыв доступа доступен в списке
              ниже.
            </p>
            <p className="mt-3 font-mono text-[11px] text-ds-gray-text/90">
              ID курса: <span className="text-ds-black/80">{courseId}</span>
            </p>
            <Link
              href={`/school-admin/courses/${encodeURIComponent(courseId)}/modules`}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-ds-primary/30 bg-ds-primary/8 px-4 py-2 text-sm font-medium text-ds-primary transition hover:bg-ds-primary/15"
            >
              Модули курса — проверка ДЗ
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-[1] grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="sa-card-in rounded-[22px] border border-white/90 bg-white/80 p-6 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.12)] backdrop-blur-sm">
          <h2 className="ds-text-h3 text-ds-black">Выдать доступ</h2>
          <p className="mt-1 text-sm text-ds-gray-text">
            Один ученик — быстро из списка вашей школы.
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
                Ученик
              </label>
              <select
                className="ds-input w-full"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={usersLoading}
              >
                <option value="">
                  {usersLoading ? "Загрузка…" : "— выберите ученика —"}
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
                  Список пуст. Проверьте раздел «Ученики» и запрос к API.
                </p>
              )}
            </div>
            <div>
              <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
                Тип доступа
              </label>
              <select
                className="ds-input w-full"
                value={accessType}
                onChange={(e) =>
                  setAccessType(e.target.value as "permanent" | "temporary")
                }
              >
                <option value="permanent">Постоянный</option>
                <option value="temporary">Временный</option>
              </select>
            </div>
            {accessType === "temporary" && (
              <div>
                <label className="ds-text-small mb-1.5 block font-medium text-ds-black">
                  Действует до
                </label>
                <input
                  type="datetime-local"
                  className="ds-input w-full"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            )}
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
              Выдать доступ
            </button>
          </div>
        </section>

        <section className="sa-card-in rounded-[22px] border border-white/90 bg-white/80 p-6 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.12)] backdrop-blur-sm">
          <h2 className="ds-text-h3 text-ds-black">Массовая выдача</h2>
          <p className="mt-1 text-sm text-ds-gray-text">
            До 200 UUID в одном запросе — те же тип и срок, что слева.
          </p>
          <textarea
            className="ds-input mt-4 min-h-[120px] w-full font-mono text-xs"
            placeholder={"uuid\nuuid, uuid"}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <button
            type="button"
            className="ui-btn ui-btn--4 mt-4 w-full sm:w-auto"
            disabled={bulkBusy}
            onClick={() => void grantBulk()}
          >
            {bulkBusy ? "Отправка…" : "Выдать по списку"}
          </button>
        </section>
      </div>

      <section className="sa-card-in relative z-[1] mt-8 rounded-[22px] border border-white/90 bg-white/85 p-6 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.1)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="ds-text-h3 text-ds-black">Кто уже с доступом</h2>
            <p className="mt-1 text-sm text-ds-gray-text">
              Ученики вашей школы с активным доступом или прогрессом по курсу.
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
                Отозвать
              </button>
            </li>
          ))}
        </ul>
        {withAccessView.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-ds-gray-border bg-ds-gray-light/40 px-4 py-8 text-center text-sm text-ds-gray-text">
            Пока никого нет — выдайте доступ выше или проверьте данные на бэкенде.
          </p>
        )}
      </section>

      <section className="sa-card-in relative z-[1] mt-8 rounded-[22px] border border-ds-gray-border/60 bg-[#FAFAFA]/90 p-6 backdrop-blur-sm">
        <h2 className="ds-text-h3 text-ds-black">Записи доступа (API)</h2>
        <p className="mt-1 text-sm text-ds-gray-text">
          Ответ{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-xs">
            GET …/accesses
          </code>{" "}
          в удобном виде.
        </p>
        {accessesLoading && (
          <p className="mt-4 ds-text-caption text-ds-gray-text">Загрузка…</p>
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
                      {uid ? userLabel(uid) : "Запись"}
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
                      До: {a.expiresAt}
                    </p>
                  )}
                  {revoked && (
                    <p className="mt-1 text-xs text-ds-error">Отозвано</p>
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
              Пустой список доступов.
            </p>
          )}

        <details className="mt-6 rounded-xl border border-ds-gray-border bg-white/80 p-3">
          <summary className="cursor-pointer text-sm font-medium text-ds-primary">
            Сырой JSON (для отладки)
          </summary>
          <pre className="mt-3 max-h-48 overflow-auto font-mono text-[11px] text-ds-gray-text">
            {accessesRaw != null
              ? JSON.stringify(accessesRaw, null, 2)
              : "—"}
          </pre>
        </details>
      </section>
    </div>
  );
}
