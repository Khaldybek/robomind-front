"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  fetchSchoolHomeworkSubmissions,
  fetchSchoolLessonGradeOverview,
  patchSchoolHomeworkSubmission,
  type HomeworkSubmissionRow,
} from "@/lib/api/school-admin/homework";
import {
  fetchSuperHomeworkSubmissions,
  fetchSuperLessonGradeOverview,
  patchSuperHomeworkSubmission,
} from "@/lib/api/super-admin/homework";
import {
  fetchSuperCourseStudents,
  type CourseStudentRow,
} from "@/lib/api/super-admin/courses-modules";
import { getSchool } from "@/lib/api/super-admin/geo";
import {
  gradeOverviewUserLabel,
  parseModuleGradeOverview,
  type GradeOverviewHomework,
  type ModuleGradeOverview,
} from "@/lib/api/admin/module-grade-overview";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

function extractStudentSchoolId(s: CourseStudentRow): string | null {
  const raw = s.schoolId;
  const direct =
    typeof raw === "string"
      ? raw.trim()
      : raw != null
        ? String(raw).trim()
        : "";
  if (direct) return direct;
  const sch = (s as Record<string, unknown>).school;
  if (sch && typeof sch === "object") {
    const id = (sch as Record<string, unknown>).id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return null;
}

function formatSchoolLabelFromGeo(s: {
  id: string;
  name: string;
  number?: number | null;
}): string {
  const n = s.number != null ? ` №${s.number}` : "";
  const line = `${s.name}${n}`.trim();
  return line || s.id;
}

function pickUserLabel(row: HomeworkSubmissionRow): string {
  const s = row.student;
  if (s && typeof s === "object") {
    const o = s as Record<string, unknown>;
    const fn = [o.lastName, o.firstName].filter(Boolean).join(" ");
    if (fn) return fn;
    if (o.email) return String(o.email);
  }
  const uid =
    row.userId ??
    (row as Record<string, unknown>).userId ??
    (row as Record<string, unknown>).user_id;
  if (typeof uid === "string" && uid) return uid;
  return "—";
}

function fileHref(row: HomeworkSubmissionRow): string | null {
  const u = row.fileUrl;
  if (u == null || typeof u !== "string" || !u.trim()) return null;
  return resolvePublicFileUrl(u) ?? u;
}

function formatOverviewDate(iso: string | null | undefined, locale: string): string {
  if (!iso || !iso.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

/**
 * Список GET …/homework-submissions иногда приходит без fileUrl, тогда как
 * grade-overview уже содержит файл — подставляем, чтобы блок оценки совпадал с журналом.
 */
function enrichSubmissionRowsFromOverview(
  list: HomeworkSubmissionRow[],
  overview: ModuleGradeOverview,
): HomeworkSubmissionRow[] {
  return list.map((sub) => enrichOneSubmissionFromOverview(sub, overview));
}

function enrichOneSubmissionFromOverview(
  sub: HomeworkSubmissionRow,
  overview: ModuleGradeOverview,
): HomeworkSubmissionRow {
  const fileUrlNow =
    typeof sub.fileUrl === "string" && sub.fileUrl.trim()
      ? sub.fileUrl.trim()
      : "";
  if (fileUrlNow) return sub;

  const subId = String(sub.id ?? "").trim();
  const uid = String(sub.userId ?? "").trim();
  const studentId = String(sub.student?.id ?? "").trim();
  const email = String(sub.student?.email ?? "").trim().toLowerCase();
  const userIdSet = new Set<string>();
  if (uid) userIdSet.add(uid);
  if (studentId) userIdSet.add(studentId);

  let hw: GradeOverviewHomework | null = null;
  for (const r of overview.rows) {
    const h = r.homework;
    if (!h) continue;
    const hid = String(h.submissionId ?? "").trim();
    if (hid && hid === subId) {
      hw = h;
      break;
    }
  }
  if (!hw) {
    for (const r of overview.rows) {
      const h = r.homework;
      if (!h) continue;
      const url = (h.fileUrl ?? "").trim();
      if (!url) continue;
      const ru = String(r.user.id ?? "").trim();
      if (ru && userIdSet.has(ru)) {
        hw = h;
        break;
      }
      const re = (r.user.email ?? "").trim().toLowerCase();
      if (email && re && re === email) {
        hw = h;
        break;
      }
    }
  }

  const url = (hw?.fileUrl ?? "").trim();
  if (!url) return sub;

  const name =
    sub.originalFileName?.trim() ||
    sub.fileName?.trim() ||
    hw?.originalFilename?.trim() ||
    undefined;

  return {
    ...sub,
    fileUrl: url,
    ...(name
      ? {
          originalFileName: name,
          fileName: sub.fileName?.trim() ? sub.fileName : name,
        }
      : {}),
  };
}

type GradeDraft = {
  points: string;
  maxPoints: string;
  feedback: string;
};

function GradeOverviewJournal({
  overview,
  locale,
}: {
  overview: ModuleGradeOverview;
  locale: string;
}) {
  const t = useTranslations("AdminModuleHomework");
  const { module: mod, quiz, rows } = overview;

  return (
    <div className="space-y-4">
      {(mod?.courseTitle || mod?.title || quiz?.title) && (
        <div className="space-y-1 rounded-xl border border-sky-100/80 bg-sky-50/50 px-4 py-3 text-sm text-ds-black">
          {mod?.courseTitle ? (
            <p className="font-medium">
              {t("contextCourse", { title: mod.courseTitle })}
            </p>
          ) : null}
          {mod?.title ? (
            <p className="text-ds-gray-text">
              {t("contextModule", { title: mod.title })}
            </p>
          ) : null}
          {quiz?.title != null && quiz.title !== "" ? (
            <p className="text-ds-gray-text">
              {t("contextQuiz", {
                title: quiz.title,
                pct: quiz.passingScore ?? "—",
              })}
            </p>
          ) : null}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-ds-gray-text">{t("noJournalRows")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ds-gray-border/80 bg-white/60">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ds-gray-border bg-ds-gray-light/40">
                <th className="px-3 py-2 font-semibold text-ds-black">
                  {t("colStudent")}
                </th>
                <th className="px-3 py-2 font-semibold text-ds-black">
                  {t("colIin")}
                </th>
                <th className="px-3 py-2 font-semibold text-ds-black">
                  {t("colQuiz")}
                </th>
                <th className="px-3 py-2 font-semibold text-ds-black">
                  {t("colTestDate")}
                </th>
                <th className="px-3 py-2 font-semibold text-ds-black">
                  {t("colHomework")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const uid = row.user.id ?? `r-${idx}`;
                const label = gradeOverviewUserLabel(row.user);
                const q = row.quiz;
                const h = row.homework;
                const hasAttempt =
                  q != null &&
                  ((q.attemptId != null && String(q.attemptId).length > 0) ||
                    q.score != null ||
                    q.maxScore != null);
                const quizLine =
                  hasAttempt && q!.maxScore != null && q!.maxScore > 0
                    ? t("scoreOf", {
                        points: String(q!.score ?? "—"),
                        max: String(q!.maxScore),
                      })
                    : hasAttempt
                      ? t("scoreOf", {
                          points: String(q!.score ?? "—"),
                          max: String(q!.maxScore ?? "—"),
                        })
                      : t("quizNone");
                const passTag =
                  hasAttempt && q!.isPassed === true
                    ? t("quizPassed")
                    : hasAttempt && q!.isPassed === false
                      ? t("quizFailed")
                      : null;
                const hwHref =
                  h?.fileUrl && h.fileUrl.trim()
                    ? resolvePublicFileUrl(h.fileUrl) ?? h.fileUrl
                    : null;
                const hwName = h?.originalFilename?.trim() || t("hwOpen");
                const hasHw =
                  h != null &&
                  (Boolean(String(h.submissionId ?? "").trim()) ||
                    Boolean(String(h.fileUrl ?? "").trim()));
                const hwScoreLine =
                  hasHw &&
                  h!.points != null &&
                  h!.maxPoints != null
                    ? t("scoreOf", {
                        points: String(h!.points),
                        max: String(h!.maxPoints),
                      })
                    : hasHw
                      ? t("hwPending")
                      : null;

                return (
                  <tr
                    key={uid}
                    className="border-b border-ds-gray-border last:border-0"
                  >
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium text-ds-black">{label}</div>
                      {row.user.email &&
                      row.user.email !== label &&
                      !label.includes(row.user.email) ? (
                        <div className="ds-text-caption text-ds-gray-text">
                          {row.user.email}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-top font-mono text-xs text-ds-gray-text">
                      {row.user.iin?.trim() || "—"}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div>{quizLine}</div>
                      {passTag ? (
                        <span className="ds-text-caption text-ds-gray-text">
                          {passTag}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-top text-ds-gray-text">
                      {formatOverviewDate(q?.completedAt, locale)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {hasHw ? (
                        <>
                          {hwHref ? (
                            <a
                              href={hwHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ds-primary hover:underline"
                            >
                              {hwName}
                            </a>
                          ) : (
                            <span className="text-ds-gray-text">
                              {t("hwPending")}
                            </span>
                          )}
                          {hwScoreLine ? (
                            <div className="ds-text-caption mt-1 text-ds-gray-text">
                              {hwScoreLine}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-ds-gray-text">{t("hwNone")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminModuleHomeworkGrading({
  variant,
  lessonId: lessonIdProp,
  moduleId: moduleIdProp,
  courseId,
}: {
  variant: "school" | "super";
  lessonId?: string;
  /** @deprecated */
  moduleId?: string;
  courseId: string;
}) {
  const lessonId = lessonIdProp ?? moduleIdProp ?? "";
  const t = useTranslations("AdminModuleHomework");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const schoolIdFromQuery = searchParams.get("schoolId")?.trim() ?? "";

  const [schoolId, setSchoolId] = useState(schoolIdFromQuery);

  useEffect(() => {
    if (schoolIdFromQuery) setSchoolId(schoolIdFromQuery);
  }, [schoolIdFromQuery]);
  const [rows, setRows] = useState<HomeworkSubmissionRow[]>([]);
  const [overview, setOverview] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, GradeDraft>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [schoolPickList, setSchoolPickList] = useState<
    { id: string; label: string }[]
  >([]);
  const [resolvingSchools, setResolvingSchools] = useState(false);
  const [schoolsErr, setSchoolsErr] = useState<string | null>(null);

  useEffect(() => {
    if (variant !== "super" || !courseId.trim()) {
      setSchoolPickList([]);
      setResolvingSchools(false);
      setSchoolsErr(null);
      return;
    }
    let cancelled = false;
    setResolvingSchools(true);
    setSchoolsErr(null);
    void (async () => {
      try {
        const students = await fetchSuperCourseStudents(courseId.trim());
        if (cancelled) return;
        const idSet = new Set<string>();
        for (const st of students) {
          const sid = extractStudentSchoolId(st);
          if (sid) idSet.add(sid);
        }
        const ids = [...idSet].sort((a, b) => a.localeCompare(b));
        const labeled = await Promise.all(
          ids.map(async (id) => {
            try {
              const sch = await getSchool(id);
              return { id, label: formatSchoolLabelFromGeo(sch) };
            } catch {
              return { id, label: id };
            }
          }),
        );
        if (cancelled) return;
        setSchoolPickList(labeled);
        const q = schoolIdFromQuery;
        if (q) {
          setSchoolId(q);
        } else if (labeled.length === 1) {
          setSchoolId(labeled[0].id);
        } else if (labeled.length > 1) {
          setSchoolId((prev) =>
            prev && labeled.some((x) => x.id === prev) ? prev : "",
          );
        } else {
          setSchoolId("");
        }
      } catch (e) {
        if (!cancelled) {
          setSchoolPickList([]);
          setSchoolsErr(e instanceof Error ? e.message : t("errGeneric"));
        }
      } finally {
        if (!cancelled) setResolvingSchools(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variant, courseId, schoolIdFromQuery, t]);

  const parsedOverview = useMemo(
    () => parseModuleGradeOverview(overview),
    [overview],
  );

  const load = useCallback(() => {
    if (!isApiConfigured() || !lessonId) return;
    if (variant === "super" && !schoolId.trim()) {
      setRows([]);
      setOverview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    const p = (async () => {
      if (variant === "school") {
        const [list, ov] = await Promise.all([
          fetchSchoolHomeworkSubmissions(lessonId),
          fetchSchoolLessonGradeOverview(lessonId),
        ]);
        const parsedOv = parseModuleGradeOverview(ov);
        setRows(enrichSubmissionRowsFromOverview(list, parsedOv));
        setOverview(ov);
      } else {
        const [list, ov] = await Promise.all([
          fetchSuperHomeworkSubmissions(lessonId, schoolId.trim()),
          fetchSuperLessonGradeOverview(lessonId, schoolId.trim()),
        ]);
        const parsedOv = parseModuleGradeOverview(ov);
        setRows(enrichSubmissionRowsFromOverview(list, parsedOv));
        setOverview(ov);
      }
    })();
    p.catch((e: Error) => setErr(e.message)).finally(() => setLoading(false));
  }, [variant, lessonId, schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  function openGrade(sub: HomeworkSubmissionRow) {
    const id = String(sub.id ?? "");
    setOpenId(id);
    setDrafts((d) => ({
      ...d,
      [id]: {
        points: String(sub.points ?? ""),
        maxPoints: String(sub.maxPoints ?? 100),
        feedback: typeof sub.feedback === "string" ? sub.feedback : "",
      },
    }));
  }

  async function saveGrade(sub: HomeworkSubmissionRow) {
    const sid = String(sub.id ?? "");
    const dr = drafts[sid];
    if (!dr) return;
    const points = Number(dr.points);
    const maxPoints = Number(dr.maxPoints);
    if (!Number.isFinite(points)) {
      setErr(t("errInvalidPoints"));
      return;
    }
    setSavingId(sid);
    setErr(null);
    try {
      const body = {
        points,
        maxPoints: Number.isFinite(maxPoints) ? maxPoints : undefined,
        feedback: dr.feedback.trim() || undefined,
      };
      if (variant === "school") {
        await patchSchoolHomeworkSubmission(sid, body);
      } else {
        await patchSuperHomeworkSubmission(sid, body);
      }
      setOpenId(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("errGeneric"));
    } finally {
      setSavingId(null);
    }
  }

  const cardSection =
    "sa-card-in rounded-[22px] border border-white/90 bg-white/85 p-5 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:p-6";

  return (
    <div className="space-y-8">
      {variant === "super" && (
        <div className={`${cardSection}`}>
          {schoolsErr && (
            <p className="mb-2 text-sm text-ds-error" role="alert">
              {schoolsErr}
            </p>
          )}
          {resolvingSchools && (
            <p className="text-sm text-ds-gray-text">{t("superSchoolLoading")}</p>
          )}
          {!resolvingSchools && schoolPickList.length > 1 && (
            <>
              <p className="mb-2 text-sm text-ds-gray-text">
                {t("superSchoolHintMany")}
              </p>
              <label className="ds-text-caption text-ds-gray-text">
                {t("superSchoolSelectLabel")}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  className="ds-input min-w-[240px] flex-1 text-sm"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                >
                  <option value="">{t("superSchoolSelectPlaceholder")}</option>
                  {schoolPickList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="ui-btn ui-btn--4"
                  onClick={() => load()}
                >
                  {t("load")}
                </button>
              </div>
            </>
          )}
          {!resolvingSchools && schoolPickList.length === 1 && (
            <div className="space-y-2">
              <p className="text-sm text-ds-gray-text">
                {t("superSchoolHintSingle")}
              </p>
              <p className="text-sm text-ds-black">
                <span className="font-medium">{schoolPickList[0].label}</span>{" "}
                <code className="break-all font-mono text-xs text-ds-gray-text">
                  {schoolPickList[0].id}
                </code>
              </p>
              <button
                type="button"
                className="ui-btn ui-btn--4"
                onClick={() => load()}
              >
                {t("load")}
              </button>
            </div>
          )}
          {!resolvingSchools && schoolPickList.length === 0 && (
            <>
              <p className="mb-2 text-sm text-ds-gray-text">
                {t("superSchoolHintNone")}
              </p>
              <label className="ds-text-caption text-ds-gray-text">
                {t("schoolIdLabel")}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  className="ds-input min-w-[240px] flex-1 font-mono text-sm"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  placeholder={t("schoolIdPlaceholder")}
                />
                <button
                  type="button"
                  className="ui-btn ui-btn--4"
                  onClick={() => load()}
                >
                  {t("load")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {loading && (
        <p className="ds-text-caption text-ds-gray-text">{tc("loading")}</p>
      )}
      {err && (
        <p className="ds-text-small text-ds-error" role="alert">
          {err}
        </p>
      )}

      <section className={cardSection}>
        <h2 className="ds-text-h3 text-ds-black">{t("submissionsTitle")}</h2>
        <p className="mt-1 text-sm text-ds-gray-text">{t("submissionsHint")}</p>
        {rows.length === 0 && !loading ? (
          <p className="mt-4 text-sm text-ds-gray-text">{t("noSubmissions")}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {rows.map((sub) => {
              const sid = String(sub.id ?? "");
              const href = fileHref(sub);
              const draft = drafts[sid];
              const open = openId === sid;
              return (
                <li
                  key={sid}
                  className="rounded-xl border border-ds-gray-border/70 bg-gradient-to-br from-slate-50/90 to-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-ds-black">
                        {pickUserLabel(sub)}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-ds-primary hover:underline"
                        >
                          {sub.originalFileName ?? sub.fileName ?? t("file")}
                        </a>
                      ) : (
                        <span className="text-sm text-ds-gray-text">—</span>
                      )}
                      <p className="ds-text-caption mt-1 text-ds-gray-text">
                        {sub.points != null
                          ? t("scoreOf", {
                              points: String(sub.points),
                              max: String(sub.maxPoints ?? 100),
                            })
                          : t("notGraded")}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ui-btn ui-btn--6 !px-3 !py-1 text-xs"
                      onClick={() =>
                        open ? setOpenId(null) : openGrade(sub)
                      }
                    >
                      {open ? t("hide") : t("grade")}
                    </button>
                  </div>
                  {open && draft && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="ds-text-caption text-ds-gray-text">
                          {t("points")}
                        </label>
                        <input
                          type="number"
                          className="ds-input mt-1 w-full"
                          value={draft.points}
                          onChange={(e) =>
                            setDrafts((p) => ({
                              ...p,
                              [sid]: { ...draft, points: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="ds-text-caption text-ds-gray-text">
                          {t("maxPoints")}
                        </label>
                        <input
                          type="number"
                          className="ds-input mt-1 w-full"
                          value={draft.maxPoints}
                          onChange={(e) =>
                            setDrafts((p) => ({
                              ...p,
                              [sid]: { ...draft, maxPoints: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="ds-text-caption text-ds-gray-text">
                          {t("comment")}
                        </label>
                        <textarea
                          className="ds-input mt-1 min-h-[72px] w-full"
                          value={draft.feedback}
                          onChange={(e) =>
                            setDrafts((p) => ({
                              ...p,
                              [sid]: { ...draft, feedback: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          className="ui-btn ui-btn--1 text-sm"
                          disabled={savingId === sid}
                          onClick={() => void saveGrade(sub)}
                        >
                          {savingId === sid ? t("saving") : t("save")}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={cardSection}>
        <h2 className="ds-text-h3 text-ds-black">{t("journalTitle")}</h2>
        <p className="mt-1 text-sm text-ds-gray-text">{t("journalApi")}</p>
        <div className="mt-4">
          <GradeOverviewJournal overview={parsedOverview} locale={locale} />
        </div>
      </section>

      <p className="font-mono text-[11px] text-ds-gray-text">
        {t("footerMeta", { courseId, lessonId })}
      </p>
    </div>
  );
}
