"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Camera, User } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { AiRecommendationsContent } from "@/components/student/ai-recommendations-content";
import { AiChatScrollArea } from "@/components/student/course-ai-chat";
import { StudentProfileEditModal } from "@/components/student/student-profile-edit-modal";
import { StudentProfileProgressRing } from "@/components/student/student-profile-progress-ring";
import { fetchAiRecommendations } from "@/lib/api/student/ai";
import {
  fetchUserMe,
  fetchUserProfileMe,
  postUserAvatar,
  type CertificateItem,
  type ProfileCourseItem,
  type StudentProfileFull,
} from "@/lib/api/student/user";
import { ApiRequestError, type CourseSummary } from "@/lib/api/types";
import {
  normalizeCourseSummary,
  pickCourseAgeGroup,
  resolveCourseThumbnailUrl,
} from "@/lib/course-display";
import { useStudentAiChat } from "@/components/student/use-student-ai-chat";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";

function displayName(p: StudentProfileFull | null): string {
  if (!p) return "";
  const fn = String(
    p.firstName ?? (p as { first_name?: string }).first_name ?? "",
  ).trim();
  const ln = String(
    p.lastName ?? (p as { last_name?: string }).last_name ?? "",
  ).trim();
  const combined = [ln, fn].filter(Boolean).join(" ").trim();
  return combined || String(p.email ?? "").trim();
}

function schoolLine(p: StudentProfileFull | null): string {
  if (!p?.school || typeof p.school !== "object") return "";
  const s = p.school as { name?: string };
  return String(s.name ?? "").trim();
}

function classLine(p: StudentProfileFull | null): string {
  const r = p as Record<string, unknown> | null;
  if (!r) return "";
  const raw =
    r.grade ??
    r.schoolClass ??
    r.className ??
    r.class_name ??
    r.classroom ??
    r.class;
  if (raw == null) return "";
  return String(raw).trim();
}

function translatedLevel(
  level: string | undefined,
  t: (key: string) => string,
): string | undefined {
  if (!level || typeof level !== "string") return undefined;
  const k = level.trim().toLowerCase();
  if (k === "beginner") return t("level_beginner");
  if (k === "intermediate") return t("level_intermediate");
  if (k === "advanced") return t("level_advanced");
  return level.trim();
}

function overallPercent(profile: StudentProfileFull | null): number {
  if (!profile) return 0;
  const o = profile.performance?.overallProgressPercent;
  if (typeof o === "number" && Number.isFinite(o)) {
    return Math.min(100, Math.max(0, o));
  }
  const list = profile.courses ?? [];
  if (list.length === 0) return 0;
  let sum = 0;
  let n = 0;
  for (const c of list) {
    const pct = c.progressPercent;
    if (typeof pct === "number" && Number.isFinite(pct)) {
      sum += Math.min(100, Math.max(0, pct));
      n += 1;
    }
  }
  if (n === 0) return 0;
  return Math.round(sum / n);
}

const MAX_AVATAR_MB = 5;

export default function ProfilePage() {
  const t = useTranslations("StudentProfile");
  const tDash = useTranslations("StudentDashboard");
  const tCert = useTranslations("StudentCertificates");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const profileAiLanguage = locale === "ru" ? "ru" : "kk";
  const profileChat = useStudentAiChat({
    mode: "profile",
    language: profileAiLanguage,
  });
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<StudentProfileFull | null>(null);
  const [aiBlock, setAiBlock] = useState<unknown>(null);
  const [aiError, setAiError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    if (!isApiConfigured()) {
      setLoadErr(tc("apiEnvMissing"));
      setProfile(null);
      return;
    }
    setLoadErr(null);
    try {
      const full = await fetchUserProfileMe().catch(() => null);
      if (full) {
        setProfile(full);
        return;
      }
      const me = await fetchUserMe().catch(() => null);
      if (me) {
        setProfile({
          ...me,
          certificates: [],
          courses: [],
          performance: {},
        });
      } else {
        setProfile(null);
      }
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : String(e));
      setProfile(null);
    }
  }, [tc]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await reload();
      if (cancelled) return;
      fetchAiRecommendations()
        .then((d) => {
          if (!cancelled) setAiBlock(d);
        })
        .catch(() => {
          if (!cancelled) setAiError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const avatarSrc = useMemo(() => {
    const raw =
      profile?.avatarUrl ?? (profile as { avatar_url?: string })?.avatar_url;
    if (!raw || typeof raw !== "string") return null;
    return resolvePublicFileUrl(raw.trim()) ?? raw.trim();
  }, [profile]);

  const pct = overallPercent(profile);

  const courseMeta = useCallback(
    (raw: ProfileCourseItem) => {
      const norm = normalizeCourseSummary(raw as CourseSummary);
      const levelText = translatedLevel(norm.level, t);
      const age = pickCourseAgeGroup(norm);
      const agePart = age
        ? /жас|лет|years/i.test(age) || /\d\s*[-–]\s*\d/.test(age)
          ? age
          : t("ageSuffix", { age })
        : null;
      return [levelText, agePart].filter(Boolean).join(" · ");
    },
    [t],
  );

  async function afterSave() {
    await reload();
    await refreshProfile();
  }

  async function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarErr(null);
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setAvatarErr(t("avatarErrSize", { maxMb: MAX_AVATAR_MB }));
      return;
    }
    setAvatarBusy(true);
    try {
      const url = await postUserAvatar(file);
      if (url) {
        setProfile((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
      } else {
        await reload();
      }
      await refreshProfile();
    } catch (err) {
      setAvatarErr(
        err instanceof ApiRequestError ? err.message : t("avatarErrUpload"),
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(180deg,#dbeafe_0%,#e0f2fe_36%,#fefce8_100%)] pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="ds-container max-w-6xl">
        <h1 className="sr-only">{t("title")}</h1>
        {loading && (
          <p className="text-sm text-slate-600">{tc("loading")}</p>
        )}
        {loadErr && !loading && (
          <p className="mb-6 rounded-xl border border-ds-error/30 bg-red-50 px-4 py-3 text-sm text-ds-error">
            {loadErr}
          </p>
        )}
        {!loading && !profile && !loadErr && (
          <p className="text-sm text-slate-600">{t("loadError")}</p>
        )}
        {!loading && profile && (
          <>
            <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="space-y-6 lg:col-span-8">
                <article className="overflow-hidden rounded-3xl border border-sky-200/60 bg-white/95 p-6 shadow-[0_20px_50px_-24px_rgba(14,116,144,0.14)] sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-5">
                      <div className="shrink-0">
                        <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 sm:h-28 sm:w-28">
            <input
                            ref={avatarFileRef}
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            aria-label={t("avatarInputAria")}
                            onChange={onAvatarFileChange}
                            disabled={avatarBusy}
                          />
                          {avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element -- динамический URL с API
                            <img
                              src={avatarSrc}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <User className="h-12 w-12" strokeWidth={1.25} />
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={avatarBusy}
                            onClick={() => avatarFileRef.current?.click()}
                            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-slate-900/55 py-1.5 text-[0.6875rem] font-semibold text-white backdrop-blur-[2px] transition hover:bg-slate-900/70 disabled:opacity-60"
                          >
                            <Camera className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {avatarBusy ? t("avatarUploading") : t("avatarChange")}
                          </button>
                        </div>
                        {avatarErr ? (
                          <p className="mt-2 max-w-[12rem] text-xs text-ds-error">
                            {avatarErr}
                          </p>
                        ) : null}
                      </div>
                      <dl className="min-w-0 flex-1 space-y-3 text-sm sm:text-base">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t("fullNameLabel")}
                          </dt>
                          <dd className="mt-0.5 font-medium text-slate-900">
                            {displayName(profile) || t("notSpecified")}
                          </dd>
          </div>
          <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t("schoolLabel")}
                          </dt>
                          <dd className="mt-0.5 text-slate-800">
                            {schoolLine(profile) || t("notSpecified")}
                          </dd>
          </div>
          <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {t("classLabel")}
                          </dt>
                          <dd className="mt-0.5 text-slate-800">
                            {classLine(profile) || t("notSpecified")}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditOpen(true)}
                      className="shrink-0 rounded-full bg-[#2b7fff] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-[#1a6fee] sm:self-end"
                    >
                      {t("settingsBtn")}
                    </button>
                  </div>
                  <div className="mt-8 border-t border-slate-200/90 pt-8">
                    <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">
                      {t("recommendationsTitle")}
                    </h2>
                    <div className="mt-4">
                      {aiError && (
                        <p className="text-sm text-slate-600">
                          {tDash("aiUnavailable")}
                        </p>
                      )}
                      {!aiError && aiBlock == null && (
                        <p className="text-sm text-slate-600">
                          {t("recommendationsEmpty")}
                        </p>
                      )}
                      {!aiError && aiBlock != null && (
                        <AiRecommendationsContent data={aiBlock} />
                      )}
                    </div>
                  </div>
                  <div className="mt-8 border-t border-slate-200/90 pt-8">
                    <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">
                      {t("profileAiTitle")}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {t("profileAiLead")}
                    </p>
                    <div className="mt-4">
                      <AiChatScrollArea
                        appearance="embedded"
                        messages={profileChat.messages}
                        input={profileChat.input}
                        setInput={profileChat.setInput}
                        send={profileChat.send}
                        pending={profileChat.pending}
                        error={profileChat.error}
            />
          </div>
                  </div>
                </article>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    {(profile.courses ?? []).length === 0 ? (
                      <p className="rounded-3xl border border-white/80 bg-white/90 p-6 text-sm text-slate-600 shadow-sm">
                        {t("coursesEmpty")}
                      </p>
                    ) : (
                      (profile.courses ?? []).map((raw) => {
                        const c = normalizeCourseSummary(raw as CourseSummary);
                        const id = String(c.id);
                        const thumb = resolveCourseThumbnailUrl(c);
                        const title =
                          c.title ?? c.name ?? t("courseFallback", { id });
                        const pctCourse = Math.min(
                          100,
                          Math.max(
                            0,
                            Math.round(
                              Number(raw.progressPercent ?? 0),
                            ),
                          ),
                        );
                        const meta = courseMeta(raw);
                        return (
                          <Link
                            key={id}
                            href={`/courses/${encodeURIComponent(id)}`}
                            aria-label={t("openCourseAria")}
                            className="block overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.1)] transition hover:border-teal-200/80 hover:shadow-md"
                          >
                            <div className="relative aspect-[16/10] w-full bg-slate-100">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <span className="text-4xl" aria-hidden>
                                    🤖
                                  </span>
                                </div>
                              )}
                              <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-800 shadow-sm">
                                {t("courseProgress", { pct: pctCourse })}
                              </span>
                            </div>
                            <div className="p-4 sm:p-5">
                              <h3 className="text-base font-semibold leading-snug text-slate-900">
                                {title}
                              </h3>
                              {meta ? (
                                <p className="mt-2 text-sm text-slate-600">
                                  {meta}
                                </p>
                              ) : null}
                              {c.description ? (
                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                                  {String(c.description)}
                                </p>
                              ) : null}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>

                  <article className="flex h-full min-h-[12rem] flex-col rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.1)] sm:p-7">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-900">
                      {t("certificatesCardTitle")}
                    </h2>
                    <div className="mt-4 flex-1 border-t border-slate-200/90 pt-4">
                      {(profile.certificates ?? []).length === 0 ? (
                        <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-500">
                          {tCert("empty")}
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {(profile.certificates ?? []).map((c: CertificateItem) => {
                            const hrefRaw =
                              c.downloadUrl ??
                              c.pdfUrl ??
                              (c as { url?: string }).url ??
                              "";
                            const href =
                              hrefRaw && hrefRaw.startsWith("/")
                                ? resolvePublicFileUrl(hrefRaw) ?? hrefRaw
                                : hrefRaw;
                            return (
                              <li
                                key={String(c.id)}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                              >
                                <span className="min-w-0 text-sm font-medium text-slate-800">
                                  {c.title ??
                                    tCert("certFallback", {
                                      id: String(c.id).slice(0, 8),
                                    })}
                                </span>
                                {href ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 text-sm font-semibold text-[#2b7fff] underline-offset-2 hover:underline"
                                  >
                                    {tCert("downloadPdf")}
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-500">
                                    {tCert("noUrlHint")}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </article>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)] lg:sticky lg:top-24 lg:p-8">
                  <StudentProfileProgressRing
                    percent={pct}
                    label={t("yourProgress")}
                  />
                </div>
              </div>
            </div>

            <StudentProfileEditModal
              open={editOpen}
              onClose={() => setEditOpen(false)}
              initialFirstName={String(
                profile.firstName ??
                  (profile as { first_name?: string }).first_name ??
                  "",
              )}
              initialLastName={String(
                profile.lastName ??
                  (profile as { last_name?: string }).last_name ??
                  "",
              )}
              initialEmail={String(profile.email ?? "")}
              onSaved={afterSave}
            />
          </>
        )}
      </div>
    </div>
  );
}
