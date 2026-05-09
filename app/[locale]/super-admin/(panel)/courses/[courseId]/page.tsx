"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  getAdminCourse,
  fetchCourseModulesAdmin,
  createSuperModule,
  updateAdminModule,
  deleteAdminModule,
  grantSuperCourseAccess,
  revokeSuperCourseAccess,
  patchSuperCourseAccess,
  type AdminModule,
  type AdminCourse,
} from "@/lib/api/super-admin/courses-modules";
import {
  fetchSuperUsers,
  type AdminUser,
} from "@/lib/api/super-admin/users";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";
import { AdminModal } from "@/components/super-admin/admin-modal";

export default function Page() {
  const t = useTranslations("SuperAdminCourse");
  const { courseId } = useParams() as { courseId: string };
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("1");
  const [isPublishedNew, setIsPublishedNew] = useState(false);
  const [unlockAfterId, setUnlockAfterId] = useState("");
  const [userId, setUserId] = useState("");
  const [maxQuizAttemptsGrant, setMaxQuizAttemptsGrant] = useState("");
  const [maxQuizAttemptsPatch, setMaxQuizAttemptsPatch] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [moduleModal, setModuleModal] = useState(false);
  const [editMod, setEditMod] = useState<AdminModule | null>(null);

  function load() {
    if (!isApiConfigured()) return;
    getAdminCourse(courseId)
      .then(setCourse)
      .catch(() => setCourse(null));
    fetchCourseModulesAdmin(courseId)
      .then(setModules)
      .catch(() => setModules([]));
    fetchSuperUsers({ limit: "300" })
      .then((r) => setUsers(r.items))
      .catch(() => setUsers([]));
  }

  useEffect(() => {
    load();
  }, [courseId]);

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href="/super-admin/courses"
        className="ds-text-caption text-ds-primary"
      >
        {t("backCourses")}
      </Link>
      <h1 className="ds-text-h2 text-ds-black">
        {course?.title ?? t("fallbackTitle")}
      </h1>
      <p className="ds-text-caption text-ds-gray-text">
        {course != null
          ? t("metaCounts", {
              modules: course.moduleCount,
              students: course.studentsCount,
            })
          : null}
      </p>
      <p className="ds-text-caption text-ds-gray-text/80 break-all">{courseId}</p>
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

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="ds-text-h3 text-ds-black">{t("sectionsTitle")}</h2>
          <button
            type="button"
            className="ui-btn ui-btn--1"
            onClick={() => {
              setErr(null);
              setModuleModal(true);
            }}
          >
            {t("addSection")}
          </button>
        </div>
        <ol className="space-y-2">
          {modules.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-3"
            >
              <Link
                href={`/super-admin/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(m.id)}`}
                className="min-w-0 flex-1 transition-colors hover:text-ds-primary"
              >
                <span className="ds-text-small font-medium text-ds-black">
                  {m.order}. {m.title}
                </span>
                <span className="ml-2 ds-text-caption text-ds-gray-text">
                  {t("sectionRowMeta", {
                    pub: m.isPublished ? t("publishedShort") : t("draftShort"),
                    blocks: m.contentCount,
                    progress: m.progressCount,
                    quiz: m.hasQuiz ? t("hasQuiz") : "",
                  })}
                </span>
              </Link>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-ds-gray-border px-3 py-1 ds-text-caption hover:bg-[#F5F5F5]"
                  onClick={() => {
                    setErr(null);
                    setEditMod(m);
                  }}
                >
                  {t("editShort")}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-ds-error/40 px-3 py-1 ds-text-caption text-ds-error hover:bg-[#FFF5F5]"
                  onClick={async () => {
                    if (!confirm(t("confirmDeleteSection", { title: m.title })))
                      return;
                    setErr(null);
                    setOk(null);
                    try {
                      await deleteAdminModule(m.id);
                      setOk(t("sectionDeleted"));
                      load();
                    } catch (e) {
                      if (e instanceof ApiRequestError && e.status === 409) {
                        setErr(
                          e.message || t("deleteSectionConflict"),
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
          ))}
        </ol>
        {modules.length === 0 && (
          <p className="ds-text-caption text-ds-gray-text">{t("noSections")}</p>
        )}
      </section>

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">{t("accessTitle")}</h2>
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          {t("accessMaxHint")}
        </p>
        <select
          className="mt-3 ds-input"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          <option value="">—</option>
          {users
            .filter((u) => u.role === "student" || !u.role)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.email} ({u.id.slice(0, 8)}…)
              </option>
            ))}
        </select>
        <div className="mt-3">
          <label className="ds-text-caption text-ds-gray-text">
            {t("maxQuizAttemptsGrantLabel")}
          </label>
          <input
            type="number"
            min={1}
            max={99}
            className="mt-1 ds-input w-32"
            value={maxQuizAttemptsGrant}
            onChange={(e) => setMaxQuizAttemptsGrant(e.target.value)}
            placeholder={t("maxQuizAttemptsPlaceholder")}
          />
        </div>
        <div className="mt-3">
          <label className="ds-text-caption text-ds-gray-text">
            {t("maxQuizAttemptsPatchLabel")}
          </label>
          <input
            type="number"
            min={1}
            max={99}
            className="mt-1 ds-input w-32"
            value={maxQuizAttemptsPatch}
            onChange={(e) => setMaxQuizAttemptsPatch(e.target.value)}
            placeholder={t("maxQuizAttemptsPlaceholder")}
          />
          <p className="mt-1 ds-text-caption text-ds-gray-text">
            {t("maxQuizAttemptsPatchHint")}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="ui-btn ui-btn--1"
            onClick={() => {
              if (!userId) return;
              const raw = maxQuizAttemptsGrant.trim();
              let maxQuizAttempts: number | undefined;
              if (raw !== "") {
                const n = Number(raw);
                if (!Number.isInteger(n) || n < 1 || n > 99) {
                  setErr(t("maxQuizAttemptsInvalid"));
                  return;
                }
                maxQuizAttempts = n;
              }
              grantSuperCourseAccess(courseId, {
                userId,
                accessType: "permanent",
                ...(maxQuizAttempts != null ? { maxQuizAttempts } : {}),
              })
                .then(() => {
                  setErr(null);
                  setOk(t("grantOk"));
                  setMaxQuizAttemptsGrant("");
                })
                .catch((e) => setErr(String(e)));
            }}
          >
            {t("grantBtn")}
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--4"
            onClick={() => {
              if (!userId) return;
              const raw = maxQuizAttemptsPatch.trim();
              if (raw === "") {
                setErr(t("maxQuizAttemptsPatchEmpty"));
                return;
              }
              const n = Number(raw);
              if (!Number.isInteger(n) || n < 1 || n > 99) {
                setErr(t("maxQuizAttemptsInvalid"));
                return;
              }
              patchSuperCourseAccess(courseId, userId, { maxQuizAttempts: n })
                .then(() => {
                  setErr(null);
                  setOk(t("patchAccessOk"));
                  setMaxQuizAttemptsPatch("");
                })
                .catch((e) => setErr(String(e)));
            }}
          >
            {t("patchAccessBtn")}
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--4"
            onClick={() => {
              if (!userId) return;
              if (!confirm(t("patchAccessClearConfirm"))) return;
              patchSuperCourseAccess(courseId, userId, {
                maxQuizAttempts: null,
              })
                .then(() => {
                  setErr(null);
                  setOk(t("patchAccessClearOk"));
                  setMaxQuizAttemptsPatch("");
                })
                .catch((e) => setErr(String(e)));
            }}
          >
            {t("patchAccessClearBtn")}
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--6"
            onClick={() =>
              userId &&
              revokeSuperCourseAccess(courseId, userId)
                .then(() => {
                  setErr(null);
                  setOk(t("revokeOk"));
                })
                .catch((e) => setErr(String(e)))
            }
          >
            {t("revokeBtn")}
          </button>
        </div>
      </section>

      <AdminModal
        open={moduleModal}
        wide
        title={t("modalNewSection")}
        onClose={() => setModuleModal(false)}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            createSuperModule({
              courseId,
              title: title.trim(),
              description: description.trim() || undefined,
              order: Number(order) || 0,
              isPublished: isPublishedNew,
              unlockAfterCourseModuleId: unlockAfterId || undefined,
            })
              .then(() => {
                setModuleModal(false);
                setTitle("");
                setDescription("");
                setOrder("1");
                setIsPublishedNew(false);
                setUnlockAfterId("");
                setOk(t("sectionCreated"));
                load();
              })
              .catch((er) => setErr(String(er)));
          }}
        >
          <div>
            <label className="ds-text-caption text-ds-gray-text">
              {t("labelTitle")}
            </label>
            <input
              className="mt-1 ds-input w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="ds-text-caption text-ds-gray-text">
              {t("labelDescription")}
            </label>
            <textarea
              className="mt-1 ds-input min-h-[80px] w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="ds-text-caption text-ds-gray-text">
              {t("labelOrder")}
            </label>
            <input
              className="mt-1 ds-input w-24"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>
          <div>
            <label className="ds-text-caption text-ds-gray-text">
              {t("unlockAfterSection")}
            </label>
            <select
              className="mt-1 ds-input w-full"
              value={unlockAfterId}
              onChange={(e) => setUnlockAfterId(e.target.value)}
            >
              <option value="">{t("optionNone")}</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.order}. {m.title}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 ds-text-small">
            <input
              type="checkbox"
              checked={isPublishedNew}
              onChange={(e) => setIsPublishedNew(e.target.checked)}
            />
            {t("published")}
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="ui-btn ui-btn--1">
              {t("create")}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--4"
              onClick={() => setModuleModal(false)}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={!!editMod}
        wide
        title={t("modalEditSection")}
        onClose={() => setEditMod(null)}
      >
        {editMod && (
          <EditModuleForm
            courseId={courseId}
            mod={editMod}
            siblings={modules.filter((x) => x.id !== editMod.id)}
            onSaved={() => {
              setEditMod(null);
              setOk(t("saved"));
              load();
            }}
            onErr={setErr}
          />
        )}
      </AdminModal>
    </div>
  );
}

function EditModuleForm({
  courseId,
  mod,
  siblings,
  onSaved,
  onErr,
}: {
  courseId: string;
  mod: AdminModule;
  siblings: AdminModule[];
  onSaved: () => void;
  onErr: (s: string | null) => void;
}) {
  const t = useTranslations("SuperAdminCourse");
  const [title, setTitle] = useState(mod.title);
  const [description, setDescription] = useState(mod.description ?? "");
  const [order, setOrder] = useState(String(mod.order));
  const [isPublished, setIsPublished] = useState(mod.isPublished);
  const [unlockAfterId, setUnlockAfterId] = useState(
    mod.unlockAfterCourseModuleId ?? "",
  );
  const [clearUnlock, setClearUnlock] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onErr(null);
        updateAdminModule(mod.id, {
          title: title.trim(),
          description: description.trim() === "" ? null : description.trim(),
          order: Number(order) || 0,
          isPublished,
          unlockAfterCourseModuleId: clearUnlock
            ? null
            : unlockAfterId
              ? unlockAfterId
              : null,
        })
          .then(onSaved)
          .catch((er) => onErr(er instanceof Error ? er.message : String(er)));
      }}
    >
      <div>
        <label className="ds-text-caption text-ds-gray-text">
          {t("labelTitleEdit")}
        </label>
        <input
          className="mt-1 ds-input w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">
          {t("labelDescription")}
        </label>
        <textarea
          className="mt-1 ds-input min-h-[80px] w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descPlaceholder")}
        />
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">{t("labelOrder")}</label>
        <input
          className="mt-1 ds-input w-24"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
      </div>
      <div>
        <label className="ds-text-caption text-ds-gray-text">
          {t("unlockAfterSection")}
        </label>
        <select
          className="mt-1 ds-input w-full"
          value={unlockAfterId}
          onChange={(e) => {
            setUnlockAfterId(e.target.value);
            setClearUnlock(false);
          }}
          disabled={clearUnlock}
        >
          <option value="">{t("optionNone")}</option>
          {siblings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.order}. {m.title}
            </option>
          ))}
        </select>
        <label className="mt-2 flex items-center gap-2 ds-text-caption">
          <input
            type="checkbox"
            checked={clearUnlock}
            onChange={(e) => {
              setClearUnlock(e.target.checked);
            }}
          />
          {t("clearUnlock")}
        </label>
      </div>
      <label className="flex items-center gap-2 ds-text-small">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        {t("published")}
      </label>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="ui-btn ui-btn--1">
          {t("save")}
        </button>
        <Link
          href={`/super-admin/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(mod.id)}`}
          className="ui-btn ui-btn--4 inline-flex items-center"
          onClick={() => {}}
        >
          {t("ctaSectionLessons")}
        </Link>
      </div>
    </form>
  );
}
