"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  type GeoDistrict,
  type GeoSchool,
  type GeoPaginated,
  getDistrict,
  listSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} from "@/lib/api/super-admin/geo";
import { isApiConfigured } from "@/lib/env";
import { AdminModal } from "@/components/super-admin/admin-modal";
import {
  GeoActiveBadge,
  GeoPagination,
  SchoolFormCard,
} from "@/components/super-admin/geo-forms";

const PAGE_SIZE = 20;

export default function Page() {
  const { districtId } = useParams() as { districtId: string };
  const [district, setDistrict] = useState<GeoDistrict | null>(null);
  const [distErr, setDistErr] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const setApiErr = (e: unknown) =>
    setErr(e instanceof Error ? e.message : "Ошибка");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [data, setData] = useState<GeoPaginated<GeoSchool> | null>(null);
  const [loading, setLoading] = useState(true);

  const activeParam = (v: "all" | "yes" | "no") =>
    v === "all" ? undefined : v === "yes";

  useEffect(() => {
    if (!isApiConfigured() || !districtId) return;
    setDistErr(null);
    getDistrict(districtId)
      .then(setDistrict)
      .catch(() => {
        setDistrict(null);
        setDistErr("Район не найден");
      });
  }, [districtId]);

  const loadSchools = useCallback(async () => {
    if (!isApiConfigured() || !districtId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const r = await listSchools({
        districtId,
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        isActive: activeParam(activeFilter),
      });
      setData(r);
    } catch (e) {
      setApiErr(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [districtId, page, search, activeFilter]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  const [modalNew, setModalNew] = useState(false);
  const [editSch, setEditSch] = useState<GeoSchool | null>(null);

  if (distErr) {
    return (
      <div className="max-w-4xl">
        <Link href="/super-admin/geo" className="ds-text-caption text-ds-primary">
          ← Города
        </Link>
        <p className="mt-4 text-ds-error">{distErr}</p>
      </div>
    );
  }

  const cityHref = district?.cityId
    ? `/super-admin/geo/cities/${encodeURIComponent(district.cityId)}`
    : "/super-admin/geo";

  return (
    <div className="max-w-4xl pb-12">
      <nav className="mb-4 ds-text-caption text-ds-gray-text">
        <Link href="/super-admin/geo" className="text-ds-primary hover:underline">
          Города
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={cityHref} className="text-ds-primary hover:underline">
          Районы
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ds-black">{district?.name ?? "…"}</span>
      </nav>

      <header className="mb-6">
        <h1 className="ds-text-h2 text-ds-black">
          Школы: {district?.name ?? "…"}
        </h1>
      </header>

      {err && (
        <div className="mb-4 rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="ui-btn ui-btn--1"
          onClick={() => {
            setModalNew(true);
            setEditSch(null);
          }}
        >
          + Школа
        </button>
        <input
          className="ds-input min-w-[160px] flex-1 sm:max-w-xs"
          placeholder="Поиск…"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearch(searchDraft);
              setPage(1);
            }
          }}
        />
        <button
          type="button"
          className="ui-btn ui-btn--4"
          onClick={() => {
            setSearch(searchDraft);
            setPage(1);
          }}
        >
          Найти
        </button>
        <select
          className="ds-input w-auto min-w-[120px]"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as "all" | "yes" | "no");
            setPage(1);
          }}
        >
          <option value="all">Все</option>
          <option value="yes">Активные</option>
          <option value="no">Неактивные</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-ds-card border border-ds-gray-border bg-ds-white">
        {loading ? (
          <p className="p-6 ds-text-caption text-ds-gray-text">Загрузка…</p>
        ) : !data?.items.length ? (
          <p className="p-8 text-center ds-text-caption text-ds-gray-text">
            Школ нет
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse ds-text-small">
              <thead>
                <tr className="border-b border-ds-gray-border bg-[#F8F8F8] text-left text-ds-gray-text">
                  <th className="px-3 py-2 font-medium">Школа</th>
                  <th className="px-3 py-2 font-medium">№</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">
                    Адрес
                  </th>
                  <th className="px-3 py-2 font-medium">Акт.</th>
                  <th className="px-3 py-2 text-right font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-ds-gray-border/60 last:border-0"
                  >
                    <td className="px-3 py-2.5 font-medium text-ds-black">
                      {s.name}
                    </td>
                    <td className="px-3 py-2.5 text-ds-gray-text">
                      {s.number ?? "—"}
                    </td>
                    <td className="hidden max-w-[200px] truncate px-3 py-2.5 text-ds-gray-text md:table-cell">
                      {s.address ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <GeoActiveBadge active={s.isActive} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        className="mr-2 ds-text-caption text-ds-gray-text underline"
                        onClick={() => setEditSch(s)}
                      >
                        Изм.
                      </button>
                      <button
                        type="button"
                        className="ds-text-caption text-ds-error underline"
                        onClick={() => {
                          if (!confirm(`Удалить «${s.name}»?`)) return;
                          void (async () => {
                            try {
                              await deleteSchool(s.id);
                              await loadSchools();
                            } catch (e) {
                              setApiErr(e);
                            }
                          })();
                        }}
                      >
                        Удал.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.total > 0 && (
          <div className="border-t border-ds-gray-border px-3 py-3">
            <GeoPagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPage={setPage}
            />
          </div>
        )}
      </div>

      <AdminModal
        open={modalNew}
        title="Новая школа"
        onClose={() => setModalNew(false)}
      >
        <SchoolFormCard
          key="new-sch"
          plain
          districtId={districtId}
          onCancel={() => setModalNew(false)}
          onCreate={async (b) => {
            await createSchool(b);
            setModalNew(false);
            await loadSchools();
          }}
          onUpdate={async () => {}}
          onError={setApiErr}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(editSch)}
        title="Редактировать школу"
        onClose={() => setEditSch(null)}
      >
        {editSch && (
          <SchoolFormCard
            key={editSch.id}
            plain
            districtId={editSch.districtId}
            initial={editSch}
            onCancel={() => setEditSch(null)}
            onCreate={async () => {}}
            onUpdate={async (b) => {
              await updateSchool(editSch.id, b);
              setEditSch(null);
              await loadSchools();
            }}
            onError={setApiErr}
          />
        )}
      </AdminModal>
    </div>
  );
}
