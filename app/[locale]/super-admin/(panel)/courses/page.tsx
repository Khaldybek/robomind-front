"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  listAdminCourses,
  createSuperCourse,
  updateAdminCourse,
  deleteAdminCourse,
  type AdminCourse,
  type CourseLevel,
  type CourseSort,
  type CreateCourseBody,
  type PatchCourseBody,
} from "@/lib/api/super-admin/courses-modules";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured, resolvePublicFileUrl } from "@/lib/env";
import { AdminModal } from "@/components/super-admin/admin-modal";

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];

export default function Page() {
  const t = useTranslations("SuperAdminCourses");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [pub, setPub] = useState<"all" | "yes" | "no">("all");
  const [level, setLevel] = useState<"" | CourseLevel>("");
  const [sort, setSort] = useState<CourseSort>("order_asc");
  const [data, setData] = useState<{
    items: AdminCourse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [modalCreate, setModalCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<AdminCourse | null>(null);

  function levelLabel(l: CourseLevel) {
    if (l === "beginner") return t("levelBeginner");
    if (l === "intermediate") return t("levelIntermediate");
    return t("levelAdvanced");
  }

  const sortOptions = useMemo(
    () =>
      (
        [
          ["order_asc", "sortOrderAsc"],
          ["order_desc", "sortOrderDesc"],
          ["title_asc", "sortTitleAsc"],
          ["title_desc", "sortTitleDesc"],
          ["createdAt_asc", "sortCreatedAsc"],
          ["createdAt_desc", "sortCreatedDesc"],
        ] as const
      ).map(([value, key]) => ({
        value: value as CourseSort,
        label: t(key),
      })),
    [t],
  );

  const listParams = {
    limit,
    search: search.trim() || undefined,
    isPublished:
      pub === "yes" ? true : pub === "no" ? false : undefined,
    level: level || undefined,
    sort,
  } as const;

  const refresh = useCallback(
    (pageOverride?: number) => {
      if (!isApiConfigured()) {
        setData(null);
        setLoading(false);
        return;
      }
      const p = pageOverride ?? page;
      setLoading(true);
      setErr(null);
      listAdminCourses({ ...listParams, page: p })
        .then((d) => {
          setData(d);
          if (pageOverride != null) setPage(pageOverride);
        })
        .catch((e) => {
          setErr(e instanceof Error ? e.message : t("errorGeneric"));
          setData(null);
        })
        .finally(() => setLoading(false));
    },
    [page, limit, search, pub, level, sort, t],
  );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- список по page/search/фильтрам
  }, [page, limit, search, pub, level, sort]);

  function applySearch() {
    setPage(1);
    setSearch(searchDraft);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
      <p className="ds-text-caption text-ds-gray-text">{t("lead")}</p>
      {err && (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}
      {ok && (
        <p className="rounded-lg border border-ds-success/30 bg-[#F0FFF4] px-3 py-2 ds-text-small text-ds-success">
          {ok}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-ds-card border border-ds-gray-border bg-ds-white p-4">
        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <label className="ds-text-caption text-ds-gray-text">
            {t("searchLabel")}
          </label>
          <input
            className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <button
          type="button"
          className="rounded-lg bg-ds-primary px-4 py-2 ds-text-small font-medium text-ds-white"
          onClick={applySearch}
        >
          {t("find")}
        </button>
        <div className="flex flex-col gap-1">
          <label className="ds-text-caption text-ds-gray-text">
            {t("pubLabel")}
          </label>
          <select
            className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={pub}
            onChange={(e) => {
              setPage(1);
              setPub(e.target.value as typeof pub);
            }}
          >
            <option value="all">{t("pubAll")}</option>
            <option value="yes">{t("pubYes")}</option>
            <option value="no">{t("pubNo")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="ds-text-caption text-ds-gray-text">
            {t("levelLabel")}
          </label>
          <select
            className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={level}
            onChange={(e) => {
              setPage(1);
              setLevel(e.target.value as "" | CourseLevel);
            }}
          >
            <option value="">{t("levelAll")}</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {levelLabel(l)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[200px] flex-col gap-1">
          <label className="ds-text-caption text-ds-gray-text">
            {t("sortLabel")}
          </label>
          <select
            className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value as CourseSort);
            }}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="rounded-lg border border-ds-gray-border px-4 py-2 ds-text-small font-medium text-ds-black hover:bg-[#F5F5F5]"
          onClick={() => {
            setOk(null);
            setModalCreate(true);
          }}
        >
          {t("addCourse")}
        </button>
      </div>

      {loading && (
        <p className="ds-text-caption text-ds-gray-text">{t("loading")}</p>
      )}
      {!loading && data && (
        <>
          <ul className="space-y-3">
            {data.items.map((c) => {
              const thumbSrc = resolvePublicFileUrl(c.thumbnailUrl);
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap gap-4 rounded-ds-card border border-ds-gray-border bg-ds-white p-4"
                >
                  {thumbSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbSrc}
                      alt=""
                      className="h-20 w-28 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5] ds-text-caption text-ds-gray-text">
                      {t("noPhoto")}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/super-admin/courses/${c.id}`}
                      className="ds-text-h3 text-ds-primary hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-1 ds-text-caption text-ds-gray-text">
                      {levelLabel(c.level)} · {t("orderWord")} {c.order}
                      {c.isPublished
                        ? ` · ${t("publishedShort")}`
                        : ` · ${t("draftShort")}`}
                      {c.ageGroup ? ` · ${c.ageGroup}` : ""}
                    </p>
                    <p className="mt-1 ds-text-small text-ds-black line-clamp-2">
                      {c.description ?? "—"}
                    </p>
                    <p className="mt-2 ds-text-caption text-ds-gray-text">
                      {t("modulesStudents", {
                        modules: c.moduleCount,
                        students: c.studentsCount,
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 self-start">
                    <button
                      type="button"
                      className="rounded-lg border border-ds-gray-border px-3 py-1.5 ds-text-small hover:bg-[#F5F5F5]"
                      onClick={() => {
                        setOk(null);
                        setEditCourse(c);
                      }}
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-ds-error/40 px-3 py-1.5 ds-text-small text-ds-error hover:bg-[#FFF5F5]"
                      onClick={async () => {
                        if (!confirm(t("confirmDelete", { title: c.title })))
                          return;
                        setErr(null);
                        setOk(null);
                        try {
                          await deleteAdminCourse(c.id);
                          setOk(t("courseDeleted"));
                          refresh();
                        } catch (e) {
                          if (e instanceof ApiRequestError && e.status === 409) {
                            setErr(
                              e.message || t("deleteConflict"),
                            );
                          } else {
                            setErr(
                              e instanceof Error ? e.message : t("deleteError"),
                            );
                          }
                        }
                      }}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {data.items.length === 0 && (
            <p className="ds-text-caption text-ds-gray-text">{t("noCourses")}</p>
          )}
          {data.totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="ds-text-caption text-ds-gray-text">
                {t("pageInfo", {
                  page: data.page,
                  totalPages: data.totalPages,
                  total: data.total,
                })}
              </span>
              <button
                type="button"
                disabled={data.page <= 1}
                className="rounded-lg border border-ds-gray-border px-3 py-1.5 ds-text-small disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("back")}
              </button>
              <button
                type="button"
                disabled={data.page >= data.totalPages}
                className="rounded-lg border border-ds-gray-border px-3 py-1.5 ds-text-small disabled:opacity-40"
                onClick={() =>
                  setPage((p) => Math.min(data.totalPages, p + 1))
                }
              >
                {t("forward")}
              </button>
            </div>
          )}
        </>
      )}

      <AdminModal
        open={modalCreate}
        wide
        title={t("modalNew")}
        onClose={() => setModalCreate(false)}
      >
        <CourseForm
          mode="create"
          submitLabel={t("create")}
          onSubmit={async (body, opts) => {
            await createSuperCourse(body, opts);
            setModalCreate(false);
            setOk(t("courseCreated"));
            refresh(1);
          }}
        />
      </AdminModal>

      <AdminModal
        open={!!editCourse}
        wide
        title={t("modalEdit")}
        onClose={() => setEditCourse(null)}
      >
        {editCourse && (
          <CourseForm
            mode="edit"
            initial={editCourse}
            submitLabel={t("save")}
            onSubmit={async (patch, opts) => {
              await updateAdminCourse(editCourse.id, patch, opts);
              setEditCourse(null);
              setOk(t("saved"));
              refresh();
            }}
          />
        )}
      </AdminModal>
    </div>
  );
}

type CourseThumbnailOptions = { thumbnail?: File | null };

/** Только отличия от `initial` — для PATCH JSON / multipart (без лишних полей). */
function buildCoursePartialPatch(
  initial: AdminCourse,
  state: {
    title: string;
    level: CourseLevel;
    description: string;
    isPublished: boolean;
    order: number;
    thumbnailUrl: string;
    ageGroup: string;
    defaultMaxQuizAttempts: string;
  },
): PatchCourseBody {
  const patch: PatchCourseBody = {};
  const tit = state.title.trim();
  if (tit !== initial.title) patch.title = tit;

  if (state.level !== initial.level) patch.level = state.level;

  const desc = state.description.trim() === "" ? null : state.description.trim();
  const initialDesc = initial.description ?? null;
  if (desc !== initialDesc) patch.description = desc;

  if (state.isPublished !== initial.isPublished) {
    patch.isPublished = state.isPublished;
  }

  if (state.order !== initial.order) patch.order = state.order;

  const thumb =
    state.thumbnailUrl.trim() === "" ? null : state.thumbnailUrl.trim();
  const initialThumb = initial.thumbnailUrl ?? null;
  if (thumb !== initialThumb) patch.thumbnailUrl = thumb;

  const ag = state.ageGroup.trim() === "" ? null : state.ageGroup.trim();
  const initialAg = initial.ageGroup ?? null;
  if (ag !== initialAg) patch.ageGroup = ag;

  const dm = state.defaultMaxQuizAttempts.trim();
  const initialDm = initial.defaultMaxQuizAttempts;
  if (dm === "") {
    if (initialDm != null) patch.defaultMaxQuizAttempts = null;
  } else {
    const n = Number(dm);
    if (Number.isInteger(n) && n >= 1 && n <= 99 && n !== initialDm) {
      patch.defaultMaxQuizAttempts = n;
    }
  }

  return patch;
}

type CourseFormProps =
  | {
      mode: "create";
      submitLabel: string;
      onSubmit: (
        body: CreateCourseBody,
        opts?: CourseThumbnailOptions,
      ) => Promise<void>;
    }
  | {
      mode: "edit";
      initial: AdminCourse;
      submitLabel: string;
      onSubmit: (
        body: PatchCourseBody,
        opts?: CourseThumbnailOptions,
      ) => Promise<void>;
    };

function CourseForm(props: CourseFormProps) {
  const t = useTranslations("SuperAdminCourses");
  const { submitLabel } = props;
  const initial = props.mode === "edit" ? props.initial : undefined;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [level, setLevel] = useState<CourseLevel>(
    initial?.level ?? "beginner",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initial?.thumbnailUrl ?? "",
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [ageGroup, setAgeGroup] = useState(initial?.ageGroup ?? "");
  const [defaultMaxQuizAttempts, setDefaultMaxQuizAttempts] = useState(
    initial?.defaultMaxQuizAttempts != null
      ? String(initial.defaultMaxQuizAttempts)
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  function levelLabel(l: CourseLevel) {
    if (l === "beginner") return t("levelBeginner");
    if (l === "intermediate") return t("levelIntermediate");
    return t("levelAdvanced");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const titleTrimmed = title.trim();
    if (!titleTrimmed) {
      setFormErr(t("formErrTitle"));
      return;
    }
    const o = Number(order);
    if (Number.isNaN(o)) {
      setFormErr(t("formErrOrder"));
      return;
    }
    const dm = defaultMaxQuizAttempts.trim();
    if (dm !== "") {
      const n = Number(dm);
      if (!Number.isInteger(n) || n < 1 || n > 99) {
        setFormErr(t("formErrDefaultMaxQuiz"));
        setBusy(false);
        return;
      }
    }
    setBusy(true);
    try {
      if (props.mode === "edit" && initial) {
        const patch = buildCoursePartialPatch(initial, {
          title: titleTrimmed,
          level,
          description,
          isPublished,
          order: o,
          thumbnailUrl,
          ageGroup,
          defaultMaxQuizAttempts,
        });
        const hasFile = Boolean(thumbnailFile && thumbnailFile.size > 0);
        const changed =
          Object.keys(patch).length > 0 || hasFile;
        if (!changed) {
          setFormErr(t("formErrNoChanges"));
          setBusy(false);
          return;
        }
        await props.onSubmit(
          patch,
          hasFile ? { thumbnail: thumbnailFile } : undefined,
        );
      } else {
        const body: CreateCourseBody = {
          title: titleTrimmed,
          level,
          description: description.trim() || undefined,
          isPublished,
          order: o,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          ageGroup: ageGroup.trim() || undefined,
          ...(dm !== ""
            ? { defaultMaxQuizAttempts: Number(dm) }
            : {}),
        };
        await props.onSubmit(
          body,
          thumbnailFile ? { thumbnail: thumbnailFile } : undefined,
        );
      }
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : t("formErrGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {formErr && (
        <p className="ds-text-small text-ds-error">{formErr}</p>
      )}
      <div>
        <label className="ds-text-caption text-ds-gray-text">{t("formTitle")}</label>
        <input
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">{t("formLevel")}</label>
        <select
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          value={level}
          onChange={(e) => setLevel(e.target.value as CourseLevel)}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {levelLabel(l)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">
          {t("formDescription")}
        </label>
        <textarea
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("formDescPlaceholder")}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 ds-text-small">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          {t("formPublished")}
        </label>
        <div className="flex items-center gap-2">
          <label className="ds-text-caption text-ds-gray-text">{t("formOrder")}</label>
          <input
            type="number"
            className="w-24 rounded-lg border border-ds-gray-border px-2 py-1 ds-text-small"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">
          {t("formThumbFile")}
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="mt-1 w-full ds-text-small file:mr-3 file:rounded file:border-0 file:bg-ds-gray-light file:px-3 file:py-1.5"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setThumbnailFile(f ?? null);
          }}
        />
        <p className="mt-1 ds-text-caption text-ds-gray-text">
          {t("formThumbHint")}
        </p>
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">{t("formThumbUrl")}</label>
        <input
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder={t("formThumbUrlPlaceholder")}
        />
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">{t("formAge")}</label>
        <input
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          placeholder={t("formAgePlaceholder")}
        />
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">
          {t("formDefaultMaxQuizAttempts")}
        </label>
        <input
          type="number"
          min={1}
          max={99}
          className="mt-1 w-28 rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          value={defaultMaxQuizAttempts}
          onChange={(e) => setDefaultMaxQuizAttempts(e.target.value)}
          placeholder={t("formDefaultMaxQuizPlaceholder")}
        />
        <p className="mt-1 ds-text-caption text-ds-gray-text">
          {t("formDefaultMaxQuizHint")}
        </p>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-ds-primary py-2.5 ds-text-small font-medium text-ds-white disabled:opacity-50"
      >
        {busy ? t("submitBusy") : submitLabel}
      </button>
    </form>
  );
}
