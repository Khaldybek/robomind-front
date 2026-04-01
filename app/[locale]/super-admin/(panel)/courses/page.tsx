"use client";

import { useCallback, useEffect, useState } from "react";
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
const SORT_OPTIONS: { value: CourseSort; label: string }[] = [
  { value: "order_asc", label: "Порядок ↑" },
  { value: "order_desc", label: "Порядок ↓" },
  { value: "title_asc", label: "Название А–Я" },
  { value: "title_desc", label: "Название Я–А" },
  { value: "createdAt_asc", label: "Создание: старые" },
  { value: "createdAt_desc", label: "Создание: новые" },
];

function levelLabel(l: CourseLevel) {
  if (l === "beginner") return "Начальный";
  if (l === "intermediate") return "Средний";
  return "Продвинутый";
}

export default function Page() {
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
          setErr(e instanceof Error ? e.message : "Ошибка");
          setData(null);
        })
        .finally(() => setLoading(false));
    },
    [page, limit, search, pub, level, sort],
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
      <h1 className="ds-text-h2 text-ds-black">Курсы</h1>
      <p className="ds-text-caption text-ds-gray-text">
        Список, фильтры и CRUD (API §4). Удаление возможно только без модулей и
        без студентов.
      </p>
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
          <label className="ds-text-caption text-ds-gray-text">Поиск по названию</label>
          <input
            className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder="Название…"
          />
        </div>
        <button
          type="button"
          className="rounded-lg bg-ds-primary px-4 py-2 ds-text-small font-medium text-ds-white"
          onClick={applySearch}
        >
          Найти
        </button>
        <div className="flex flex-col gap-1">
          <label className="ds-text-caption text-ds-gray-text">Публикация</label>
          <select
            className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={pub}
            onChange={(e) => {
              setPage(1);
              setPub(e.target.value as typeof pub);
            }}
          >
            <option value="all">Все</option>
            <option value="yes">Опубликован</option>
            <option value="no">Черновик</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="ds-text-caption text-ds-gray-text">Уровень</label>
          <select
            className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={level}
            onChange={(e) => {
              setPage(1);
              setLevel(e.target.value as "" | CourseLevel);
            }}
          >
            <option value="">Все</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {levelLabel(l)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[200px] flex-col gap-1">
          <label className="ds-text-caption text-ds-gray-text">Сортировка</label>
          <select
            className="rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value as CourseSort);
            }}
          >
            {SORT_OPTIONS.map((o) => (
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
          + Курс
        </button>
      </div>

      {loading && <p className="ds-text-caption text-ds-gray-text">Загрузка…</p>}
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
                    нет фото
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
                    {levelLabel(c.level)} · порядок {c.order}
                    {c.isPublished ? " · опубликован" : " · черновик"}
                    {c.ageGroup ? ` · ${c.ageGroup}` : ""}
                  </p>
                  <p className="mt-1 ds-text-small text-ds-black line-clamp-2">
                    {c.description ?? "—"}
                  </p>
                  <p className="mt-2 ds-text-caption text-ds-gray-text">
                    Модулей: {c.moduleCount} · Студентов: {c.studentsCount}
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
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-ds-error/40 px-3 py-1.5 ds-text-small text-ds-error hover:bg-[#FFF5F5]"
                    onClick={async () => {
                      if (!confirm(`Удалить курс «${c.title}»?`)) return;
                      setErr(null);
                      setOk(null);
                      try {
                        await deleteAdminCourse(c.id);
                        setOk("Курс удалён");
                        refresh();
                      } catch (e) {
                        if (e instanceof ApiRequestError && e.status === 409) {
                          setErr(
                            e.message ||
                              "Нельзя удалить: есть модули или студенты. Снимите с публикации или уберьте доступ.",
                          );
                        } else {
                          setErr(
                            e instanceof Error ? e.message : "Ошибка удаления",
                          );
                        }
                      }
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
            })}
          </ul>
          {data.items.length === 0 && (
            <p className="ds-text-caption text-ds-gray-text">Нет курсов.</p>
          )}
          {data.totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="ds-text-caption text-ds-gray-text">
                Стр. {data.page} из {data.totalPages} · всего {data.total}
              </span>
              <button
                type="button"
                disabled={data.page <= 1}
                className="rounded-lg border border-ds-gray-border px-3 py-1.5 ds-text-small disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </button>
              <button
                type="button"
                disabled={data.page >= data.totalPages}
                className="rounded-lg border border-ds-gray-border px-3 py-1.5 ds-text-small disabled:opacity-40"
                onClick={() =>
                  setPage((p) => Math.min(data.totalPages, p + 1))
                }
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}

      <AdminModal
        open={modalCreate}
        wide
        title="Новый курс"
        onClose={() => setModalCreate(false)}
      >
        <CourseForm
          mode="create"
          submitLabel="Создать"
          onSubmit={async (body, opts) => {
            await createSuperCourse(body, opts);
            setModalCreate(false);
            setOk("Курс создан");
            refresh(1);
          }}
        />
      </AdminModal>

      <AdminModal
        open={!!editCourse}
        wide
        title="Редактировать курс"
        onClose={() => setEditCourse(null)}
      >
        {editCourse && (
          <CourseForm
            mode="edit"
            initial={editCourse}
            submitLabel="Сохранить"
            onSubmit={async (patch, opts) => {
              await updateAdminCourse(editCourse.id, patch, opts);
              setEditCourse(null);
              setOk("Сохранено");
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
  },
): PatchCourseBody {
  const patch: PatchCourseBody = {};
  const t = state.title.trim();
  if (t !== initial.title) patch.title = t;

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
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    const t = title.trim();
    if (!t) {
      setFormErr("Укажите название");
      return;
    }
    const o = Number(order);
    if (Number.isNaN(o)) {
      setFormErr("Порядок — число");
      return;
    }
    setBusy(true);
    try {
      if (props.mode === "edit" && initial) {
        const patch = buildCoursePartialPatch(initial, {
          title: t,
          level,
          description,
          isPublished,
          order: o,
          thumbnailUrl,
          ageGroup,
        });
        const hasFile = Boolean(thumbnailFile && thumbnailFile.size > 0);
        const changed =
          Object.keys(patch).length > 0 || hasFile;
        if (!changed) {
          setFormErr("Нет изменений");
          setBusy(false);
          return;
        }
        await props.onSubmit(
          patch,
          hasFile ? { thumbnail: thumbnailFile } : undefined,
        );
      } else {
        const body: CreateCourseBody = {
          title: t,
          level,
          description: description.trim() || undefined,
          isPublished,
          order: o,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          ageGroup: ageGroup.trim() || undefined,
        };
        await props.onSubmit(
          body,
          thumbnailFile ? { thumbnail: thumbnailFile } : undefined,
        );
      }
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "Ошибка");
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
        <label className="ds-text-caption text-ds-gray-text">Название *</label>
        <input
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">Уровень *</label>
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
        <label className="ds-text-caption text-ds-gray-text">Описание</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Пусто = сброс при сохранении (редактирование)"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 ds-text-small">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Опубликован
        </label>
        <div className="flex items-center gap-2">
          <label className="ds-text-caption text-ds-gray-text">Порядок</label>
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
          Файл обложки (jpeg, png, gif, webp, svg)
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
          Файл — поле{" "}
          <code className="rounded bg-ds-gray-light px-1">thumbnail</code> (
          <code className="rounded bg-ds-gray-light px-1">multipart</code>).
          Можно отправить <strong>только файл</strong> (без изменения остальных
          полей) — тогда уходит только обложка. URL ниже при загрузке файла
          бэкенд перезаписывает.
        </p>
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">URL обложки</label>
        <input
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="Пусто = сброс (редактирование); не нужен, если загрузили файл"
        />
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">Возрастная метка</label>
        <input
          className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          placeholder="Пусто = сброс (редактирование)"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-ds-primary py-2.5 ds-text-small font-medium text-ds-white disabled:opacity-50"
      >
        {busy ? "…" : submitLabel}
      </button>
    </form>
  );
}
