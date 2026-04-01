"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  listSchoolAdmins,
  createSchoolAdmin,
  updateSchoolAdmin,
  deleteSchoolAdmin,
  type SchoolAdmin,
  type SchoolAdminList,
} from "@/lib/api/super-admin/school-admins";
import {
  listAllCities,
  listAllDistricts,
  listAllSchools,
  getSchool,
  getDistrict,
} from "@/lib/api/super-admin/geo";
import type { GeoCity, GeoDistrict, GeoSchool } from "@/lib/api/super-admin/geo";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";
import { AdminModal } from "@/components/super-admin/admin-modal";

const LIMIT = 20;

function schoolLabel(s: GeoSchool): string {
  const n = s.number != null ? ` №${s.number}` : "";
  return `${s.name}${n}`.trim() || s.id;
}

function SchoolAdminsContent() {
  const searchParams = useSearchParams();
  const [schoolIdDraft, setSchoolIdDraft] = useState(
    () => searchParams.get("schoolId")?.trim() ?? "",
  );
  const [schoolId, setSchoolId] = useState(() =>
    searchParams.get("schoolId")?.trim() ?? "",
  );
  const [selectedSchoolLabel, setSelectedSchoolLabel] = useState("");

  const [cities, setCities] = useState<GeoCity[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [schools, setSchools] = useState<GeoSchool[]>([]);
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolSearchApplied, setSchoolSearchApplied] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [districtSearchApplied, setDistrictSearchApplied] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [citySearchApplied, setCitySearchApplied] = useState("");
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [districtErr, setDistrictErr] = useState<string | null>(null);
  const [schoolErr, setSchoolErr] = useState<string | null>(null);
  const [districtReloadKey, setDistrictReloadKey] = useState(0);
  const [geoReloadKey, setGeoReloadKey] = useState(0);
  const [geoLoading, setGeoLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [data, setData] = useState<SchoolAdminList | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<SchoolAdmin | null>(null);

  useEffect(() => {
    const q = searchParams.get("schoolId")?.trim() ?? "";
    if (q) {
      setSchoolIdDraft(q);
      setSchoolId(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setCitySearchApplied(citySearch.trim()), 350);
    return () => clearTimeout(t);
  }, [citySearch]);

  useEffect(() => {
    const t = setTimeout(
      () => setDistrictSearchApplied(districtSearch.trim()),
      350,
    );
    return () => clearTimeout(t);
  }, [districtSearch]);

  useEffect(() => {
    const t = setTimeout(() => setSchoolSearchApplied(schoolSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [schoolSearch]);

  /** Справочники: города (все страницы + поиск по API) */
  useEffect(() => {
    if (!isApiConfigured()) {
      setGeoErr("Задайте NEXT_PUBLIC_API_BASE_URL");
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    setGeoErr(null);
    listAllCities({
      search: citySearchApplied || undefined,
    })
      .then(setCities)
      .catch((e) => {
        setCities([]);
        setGeoErr(
          e instanceof Error ? e.message : "Не удалось загрузить города",
        );
      })
      .finally(() => setCitiesLoading(false));
  }, [citySearchApplied, geoReloadKey]);

  /** Районы при смене города (все страницы + поиск по API) */
  useEffect(() => {
    if (!isApiConfigured() || !cityId) {
      if (!cityId) setDistricts([]);
      setDistrictErr(null);
      return;
    }
    setGeoLoading(true);
    setDistrictErr(null);
    listAllDistricts({
      cityId,
      search: districtSearchApplied || undefined,
    })
      .then(setDistricts)
      .catch((e) => {
        setDistricts([]);
        setDistrictErr(
          e instanceof Error ? e.message : "Не удалось загрузить районы",
        );
      })
      .finally(() => setGeoLoading(false));
  }, [cityId, districtSearchApplied, geoReloadKey, districtReloadKey]);

  /** Школы при смене района / поиске по названию */
  useEffect(() => {
    if (!isApiConfigured() || !districtId) {
      if (!districtId) setSchools([]);
      setSchoolErr(null);
      return;
    }
    setGeoLoading(true);
    setSchoolErr(null);
    listAllSchools({
      districtId,
      search: schoolSearchApplied || undefined,
      isActive: true,
    })
      .then(setSchools)
      .catch((e) => {
        setSchools([]);
        setSchoolErr(
          e instanceof Error ? e.message : "Не удалось загрузить школы",
        );
      })
      .finally(() => setGeoLoading(false));
  }, [districtId, schoolSearchApplied]);

  /** Подставить каскад из ?schoolId= в URL */
  const urlSchoolId = searchParams.get("schoolId")?.trim() ?? "";
  useEffect(() => {
    if (!urlSchoolId || !isApiConfigured()) return;
    let cancelled = false;
    (async () => {
      try {
        const sch = await getSchool(urlSchoolId);
        const dist = await getDistrict(sch.districtId);
        if (cancelled) return;
        setCityId(dist.cityId);
        setDistrictId(sch.districtId);
        setSelectedSchoolLabel(schoolLabel(sch));
        const [dList, sList] = await Promise.all([
          listAllDistricts({ cityId: dist.cityId }),
          listAllSchools({
            districtId: sch.districtId,
            isActive: true,
          }),
        ]);
        if (cancelled) return;
        setDistricts(dList);
        setSchools(sList);
      } catch {
        /* школа не найдена — оставить ручной ввод */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [urlSchoolId]);

  const load = useCallback(() => {
    /** URL — источник истины при открытии `?schoolId=`, state может обновиться позже */
    const sid =
      searchParams.get("schoolId")?.trim() || schoolId.trim();
    if (!isApiConfigured() || !sid) {
      setData(null);
      return;
    }
    setLoading(true);
    setErr(null);
    listSchoolAdmins({
      schoolId: sid,
      page,
      limit: LIMIT,
      search: search.trim() || undefined,
      isActive:
        activeFilter === "yes" ? true : activeFilter === "no" ? false : undefined,
    })
      .then(setData)
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Ошибка");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [searchParams, schoolId, page, search, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function commitSchoolId(id: string, label?: string) {
    const trimmed = id.trim();
    setSchoolIdDraft(trimmed);
    setSchoolId(trimmed);
    if (label) setSelectedSchoolLabel(label);
    setPage(1);
    if (typeof window !== "undefined" && trimmed) {
      const u = new URL(window.location.href);
      u.searchParams.set("schoolId", trimmed);
      window.history.replaceState(null, "", u.toString());
    }
  }

  function applySchoolId() {
    commitSchoolId(schoolIdDraft);
  }

  function onPickSchool(schoolIdPicked: string) {
    const sch = schools.find((x) => x.id === schoolIdPicked);
    commitSchoolId(
      schoolIdPicked,
      sch ? schoolLabel(sch) : undefined,
    );
  }

  function applySearch() {
    setPage(1);
    setSearch(searchDraft);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="ds-text-h2 text-ds-black">Администраторы школ</h1>
      <p className="ds-text-caption text-ds-gray-text">
        Выберите школу каскадом (те же API, что в{" "}
        <Link href="/super-admin/geo" className="text-ds-primary hover:underline">
          Гео / школы
        </Link>
        ): город → район → школа. Для списка админов по-прежнему нужен{" "}
        <code className="font-mono">schoolId</code> — он подставляется из выбора.
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

      <div className="space-y-4 rounded-ds-card border border-ds-gray-border bg-ds-white p-4">
        <p className="ds-text-caption font-medium text-ds-black">
          Выбор школы
        </p>
        <div className="mb-3 max-w-md">
          <label className="ds-text-caption text-ds-gray-text">
            Поиск города (к API)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder="Начните вводить название…"
          />
        </div>
        {geoErr && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
            <span>{geoErr}</span>
            <button
              type="button"
              className="rounded border border-ds-error/50 px-2 py-0.5 ds-text-caption"
              onClick={() => setGeoReloadKey((k) => k + 1)}
            >
              Повторить
            </button>
            <Link
              href="/super-admin/geo"
              className="ds-text-caption text-ds-primary underline"
            >
              Гео: города
            </Link>
          </div>
        )}
        {citiesLoading && (
          <p className="mb-2 ds-text-caption text-ds-gray-text">
            Загрузка городов…
          </p>
        )}
        {!citiesLoading &&
          !geoErr &&
          cities.length === 0 &&
          !citySearchApplied && (
          <p className="mb-3 ds-text-caption text-amber-800">
            Городов нет в ответе API. Добавьте города в разделе «Гео» или
            уточните поиск.
          </p>
        )}
        {cityId && (
          <div className="mb-3 max-w-md">
            <label className="ds-text-caption text-ds-gray-text">
              Поиск района (к API)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              placeholder="Начните вводить название…"
            />
          </div>
        )}
        {districtErr && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
            <span>{districtErr}</span>
            <button
              type="button"
              className="rounded border border-ds-error/50 px-2 py-0.5 ds-text-caption"
              onClick={() => setDistrictReloadKey((k) => k + 1)}
            >
              Повторить
            </button>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="ds-text-caption text-ds-gray-text">
              Город
              {citiesLoading ? " (загрузка…)" : ` (${cities.length})`}
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
              value={cityId}
              disabled={citiesLoading}
              onChange={(e) => {
                const v = e.target.value;
                setCityId(v);
                setDistrictId("");
                setSchools([]);
                setSchoolSearch("");
                setSchoolSearchApplied("");
                setDistrictSearch("");
                setDistrictSearchApplied("");
                setDistrictErr(null);
                setSchoolErr(null);
                setSchoolId("");
                setSchoolIdDraft("");
                setSelectedSchoolLabel("");
                if (typeof window !== "undefined") {
                  const u = new URL(window.location.href);
                  u.searchParams.delete("schoolId");
                  window.history.replaceState(null, "", u.toString());
                }
              }}
            >
              <option value="">— выберите город —</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ds-text-caption text-ds-gray-text">
              Район
              {cityId && !districtErr
                ? ` (${districts.length})`
                : ""}
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
              value={districtId}
              disabled={!cityId}
              onChange={(e) => {
                const v = e.target.value;
                setDistrictId(v);
                setSchoolSearch("");
                setSchoolSearchApplied("");
                setSchoolErr(null);
                setSchoolId("");
                setSchoolIdDraft("");
                setSelectedSchoolLabel("");
                if (typeof window !== "undefined") {
                  const u = new URL(window.location.href);
                  u.searchParams.delete("schoolId");
                  window.history.replaceState(null, "", u.toString());
                }
              }}
            >
              <option value="">— район —</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ds-text-caption text-ds-gray-text">
              Школа {geoLoading && districtId ? "(загрузка…)" : ""}
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
              value={
                schoolId &&
                (schools.some((s) => s.id === schoolId) ||
                  selectedSchoolLabel)
                  ? schoolId
                  : ""
              }
              disabled={!districtId}
              onChange={(e) => {
                const v = e.target.value;
                if (v) onPickSchool(v);
              }}
            >
              <option value="">— школа —</option>
              {schoolId &&
                !schools.some((s) => s.id === schoolId) &&
                selectedSchoolLabel && (
                  <option value={schoolId}>
                    {selectedSchoolLabel} (текущая)
                  </option>
                )}
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {schoolLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {districtId && (
          <div className="max-w-md space-y-2">
            <div>
              <label className="ds-text-caption text-ds-gray-text">
                Поиск школы в районе (к API)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                placeholder="Часть названия…"
              />
            </div>
            {schoolErr && (
              <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
                {schoolErr}
              </p>
            )}
          </div>
        )}
        {(schoolId || selectedSchoolLabel) && (
          <p className="ds-text-caption text-ds-gray-text">
            Выбрано:{" "}
            <span className="font-medium text-ds-black">
              {selectedSchoolLabel || "—"}
            </span>
            {schoolId ? (
              <>
                {" "}
                <code className="break-all text-ds-gray-text">{schoolId}</code>
              </>
            ) : null}
          </p>
        )}
        <details className="rounded-lg border border-ds-gray-border bg-[#FAFAFA] px-3 py-2">
          <summary className="cursor-pointer ds-text-caption text-ds-primary">
            Ввести UUID школы вручную
          </summary>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <input
              className="min-w-[240px] flex-1 rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small font-mono"
              value={schoolIdDraft}
              onChange={(e) => setSchoolIdDraft(e.target.value)}
              placeholder="uuid школы"
            />
            <button
              type="button"
              className="rounded-lg bg-ds-primary px-4 py-2 ds-text-small font-medium text-ds-white"
              onClick={applySchoolId}
            >
              Показать
            </button>
          </div>
        </details>
      </div>

      {schoolId.trim() && (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-ds-card border border-ds-gray-border bg-ds-white p-4">
            <div className="min-w-[200px] flex-1">
              <label className="ds-text-caption text-ds-gray-text">Поиск</label>
              <input
                className="mt-1 w-full rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                placeholder="Email, ФИО…"
              />
            </div>
            <button
              type="button"
              className="rounded-lg bg-ds-primary px-4 py-2 ds-text-small text-ds-white"
              onClick={applySearch}
            >
              Найти
            </button>
            <div>
              <label className="ds-text-caption text-ds-gray-text">Статус</label>
              <select
                className="mt-1 block rounded-lg border border-ds-gray-border px-3 py-2 ds-text-small"
                value={activeFilter}
                onChange={(e) => {
                  setPage(1);
                  setActiveFilter(e.target.value as typeof activeFilter);
                }}
              >
                <option value="all">Все</option>
                <option value="yes">Активные</option>
                <option value="no">Неактивные</option>
              </select>
            </div>
            <button
              type="button"
              className="rounded-lg border border-ds-gray-border px-4 py-2 ds-text-small"
              onClick={() => {
                setOk(null);
                setCreateOpen(true);
              }}
            >
              + Админ школы
            </button>
          </div>

          {loading && (
            <p className="ds-text-caption text-ds-gray-text">Загрузка…</p>
          )}
          {!loading && data && (
            <>
              <ul className="space-y-2">
                {data.items.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-ds-card border border-ds-gray-border bg-ds-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="ds-text-small font-medium text-ds-black">
                        {a.email}
                      </p>
                      <p className="ds-text-caption text-ds-gray-text">
                        {a.lastName} {a.firstName}{" "}
                        {a.patronymic ?? ""} · ИИН: {a.iin ?? "—"} ·{" "}
                        {a.isActive ? "активен" : "отключён"}
                      </p>
                      <p className="ds-text-caption text-ds-gray-text">
                        {a.school.name}
                        {a.school.number != null ? ` №${a.school.number}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-ds-gray-border px-3 py-1 ds-text-caption"
                        onClick={() => {
                          setErr(null);
                          setEdit(a);
                        }}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-ds-error/40 px-3 py-1 ds-text-caption text-ds-error"
                        onClick={async () => {
                          if (
                            !confirm(
                              "Отключить администратора (мягкое удаление)?",
                            )
                          )
                            return;
                          setErr(null);
                          setOk(null);
                          try {
                            await deleteSchoolAdmin(a.id);
                            setOk("Администратор отключён");
                            load();
                          } catch (e) {
                            setErr(
                              e instanceof Error ? e.message : "Ошибка",
                            );
                          }
                        }}
                      >
                        Отключить
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {data.items.length === 0 && (
                <p className="ds-text-caption text-ds-gray-text">
                  Нет записей.
                </p>
              )}
              {data.totalPages > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ds-text-caption text-ds-gray-text">
                    Стр. {data.page} / {data.totalPages} · всего {data.total}
                  </span>
                  <button
                    type="button"
                    disabled={data.page <= 1}
                    className="rounded border px-2 py-1 ds-text-caption disabled:opacity-40"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    disabled={data.page >= data.totalPages}
                    className="rounded border px-2 py-1 ds-text-caption disabled:opacity-40"
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
        </>
      )}

      <AdminModal
        open={createOpen}
        wide
        title="Новый администратор школы"
        onClose={() => setCreateOpen(false)}
      >
        <CreateForm
          schoolIdFixed={schoolId.trim()}
          schoolTitle={selectedSchoolLabel || undefined}
          onSuccess={() => {
            setCreateOpen(false);
            setOk("Создан");
            load();
          }}
          onErr={setErr}
        />
      </AdminModal>

      <AdminModal
        open={!!edit}
        wide
        title="Редактировать"
        onClose={() => setEdit(null)}
      >
        {edit && (
          <EditForm
            admin={edit}
            onSuccess={() => {
              setEdit(null);
              setOk("Сохранено");
              load();
            }}
            onErr={setErr}
          />
        )}
      </AdminModal>
    </div>
  );
}

function CreateForm({
  schoolIdFixed,
  schoolTitle,
  onSuccess,
  onErr,
}: {
  schoolIdFixed: string;
  schoolTitle?: string;
  onSuccess: () => void;
  onErr: (s: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [iin, setIin] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onErr(null);
        if (password.length < 8) {
          onErr("Пароль не короче 8 символов");
          return;
        }
        if (iin.trim() && !/^\d{12}$/.test(iin.trim())) {
          onErr("ИИН — 12 цифр");
          return;
        }
        setBusy(true);
        createSchoolAdmin({
          schoolId: schoolIdFixed,
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          patronymic: patronymic.trim() || undefined,
          iin: iin.trim() || undefined,
        })
          .then(onSuccess)
          .catch((e) => {
            if (e instanceof ApiRequestError && e.status === 409) {
              onErr(e.message || "Email или ИИН уже заняты");
            } else {
              onErr(e instanceof Error ? e.message : "Ошибка");
            }
          })
          .finally(() => setBusy(false));
      }}
    >
      <p className="ds-text-caption text-ds-gray-text">
        Школа:{" "}
        {schoolTitle ? (
          <span className="font-medium text-ds-black">{schoolTitle}</span>
        ) : null}{" "}
        <code className="break-all text-ds-gray-text">{schoolIdFixed}</code>
      </p>
      <input
        className="ds-input w-full"
        type="email"
        required
        placeholder="Email *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="ds-input w-full"
        type="password"
        required
        placeholder="Пароль (≥8) *"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="ds-input"
          required
          placeholder="Имя *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="ds-input"
          required
          placeholder="Фамилия *"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <input
        className="ds-input w-full"
        placeholder="Отчество"
        value={patronymic}
        onChange={(e) => setPatronymic(e.target.value)}
      />
      <input
        className="ds-input w-full font-mono"
        placeholder="ИИН (12 цифр)"
        value={iin}
        onChange={(e) => setIin(e.target.value.replace(/\D/g, "").slice(0, 12))}
      />
      <button type="submit" className="ui-btn ui-btn--1 w-full" disabled={busy}>
        {busy ? "…" : "Создать"}
      </button>
    </form>
  );
}

function EditForm({
  admin,
  onSuccess,
  onErr,
}: {
  admin: SchoolAdmin;
  onSuccess: () => void;
  onErr: (s: string | null) => void;
}) {
  const [email, setEmail] = useState(admin.email);
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(admin.firstName);
  const [lastName, setLastName] = useState(admin.lastName);
  const [patronymic, setPatronymic] = useState(admin.patronymic ?? "");
  const [iin, setIin] = useState(admin.iin ?? "");
  const [isActive, setIsActive] = useState(admin.isActive);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onErr(null);
        if (password && password.length < 8) {
          onErr("Пароль не короче 8 символов");
          return;
        }
        if (iin.trim() && !/^\d{12}$/.test(iin.trim())) {
          onErr("ИИН — 12 цифр");
          return;
        }
        setBusy(true);
        const body: Parameters<typeof updateSchoolAdmin>[1] = {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          patronymic: patronymic.trim() === "" ? null : patronymic.trim(),
          iin: iin.trim() === "" ? null : iin.trim(),
          isActive,
        };
        if (password.trim()) body.password = password;
        updateSchoolAdmin(admin.id, body)
          .then(onSuccess)
          .catch((e) => {
            if (e instanceof ApiRequestError && e.status === 409) {
              onErr(e.message || "Конфликт email/ИИН");
            } else {
              onErr(e instanceof Error ? e.message : "Ошибка");
            }
          })
          .finally(() => setBusy(false));
      }}
    >
      <input
        className="ds-input w-full"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="ds-input w-full"
        type="password"
        placeholder="Новый пароль (необязательно)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="ds-input"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="ds-input"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <input
        className="ds-input w-full"
        placeholder="Отчество"
        value={patronymic}
        onChange={(e) => setPatronymic(e.target.value)}
      />
      <input
        className="ds-input w-full font-mono"
        placeholder="ИИН"
        value={iin}
        onChange={(e) => setIin(e.target.value.replace(/\D/g, "").slice(0, 12))}
      />
      <label className="flex items-center gap-2 ds-text-small">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Активен
      </label>
      <button type="submit" className="ui-btn ui-btn--1 w-full" disabled={busy}>
        {busy ? "…" : "Сохранить"}
      </button>
    </form>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="ds-text-caption text-ds-gray-text py-8">Загрузка…</div>
      }
    >
      <SchoolAdminsContent />
    </Suspense>
  );
}
