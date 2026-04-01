"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
  type GeoCity,
  type GeoDistrict,
  type GeoPaginated,
  getCity,
  listDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from "@/lib/api/super-admin/geo";
import { isApiConfigured } from "@/lib/env";
import { AdminModal } from "@/components/super-admin/admin-modal";
import {
  DistrictFormCard,
  GeoActiveBadge,
  GeoPagination,
} from "@/components/super-admin/geo-forms";

const PAGE_SIZE = 20;

export default function Page() {
  const { cityId } = useParams() as { cityId: string };
  const [city, setCity] = useState<GeoCity | null>(null);
  const [cityErr, setCityErr] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const setApiErr = (e: unknown) =>
    setErr(e instanceof Error ? e.message : "Ошибка");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [data, setData] = useState<GeoPaginated<GeoDistrict> | null>(null);
  const [loading, setLoading] = useState(true);

  const activeParam = (v: "all" | "yes" | "no") =>
    v === "all" ? undefined : v === "yes";

  useEffect(() => {
    if (!isApiConfigured() || !cityId) return;
    setCityErr(null);
    getCity(cityId)
      .then(setCity)
      .catch(() => {
        setCity(null);
        setCityErr("Город не найден");
      });
  }, [cityId]);

  const loadDistricts = useCallback(async () => {
    if (!isApiConfigured() || !cityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const r = await listDistricts({
        cityId,
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
  }, [cityId, page, search, activeFilter]);

  useEffect(() => {
    void loadDistricts();
  }, [loadDistricts]);

  const [modalNew, setModalNew] = useState(false);
  const [editDist, setEditDist] = useState<GeoDistrict | null>(null);

  if (cityErr) {
    return (
      <div className="max-w-4xl">
        <Link
          href="/super-admin/geo"
          className="ds-text-caption text-ds-primary"
        >
          ← Города
        </Link>
        <p className="mt-4 text-ds-error">{cityErr}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-12">
      <nav className="mb-4 ds-text-caption text-ds-gray-text">
        <Link href="/super-admin/geo" className="text-ds-primary hover:underline">
          Города
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ds-black">{city?.name ?? "…"}</span>
      </nav>

      <header className="mb-6">
        <h1 className="ds-text-h2 text-ds-black">
          Районы: {city?.name ?? "…"}
        </h1>
        <p className="mt-1 ds-text-caption text-ds-gray-text">
          Школы — на странице района.
        </p>
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
            setEditDist(null);
          }}
        >
          + Район
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
            Районов нет
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse ds-text-small">
              <thead>
                <tr className="border-b border-ds-gray-border bg-[#F8F8F8] text-left text-ds-gray-text">
                  <th className="px-3 py-2 font-medium">Район</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">
                    KZ
                  </th>
                  <th className="px-3 py-2 font-medium">Акт.</th>
                  <th className="px-3 py-2 text-right font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-ds-gray-border/60 last:border-0"
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/super-admin/geo/districts/${encodeURIComponent(d.id)}`}
                        className="font-medium text-ds-black hover:text-ds-primary"
                      >
                        {d.name}
                      </Link>
                    </td>
                    <td className="hidden px-3 py-2.5 text-ds-gray-text sm:table-cell">
                      {d.nameKz ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <GeoActiveBadge active={d.isActive} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/super-admin/geo/districts/${encodeURIComponent(d.id)}`}
                        className="mr-3 ds-text-caption text-ds-primary"
                      >
                        Школы
                      </Link>
                      <button
                        type="button"
                        className="mr-2 ds-text-caption text-ds-gray-text underline"
                        onClick={() => setEditDist(d)}
                      >
                        Изм.
                      </button>
                      <button
                        type="button"
                        className="ds-text-caption text-ds-error underline"
                        onClick={() => {
                          if (!confirm(`Удалить «${d.name}»?`)) return;
                          void (async () => {
                            try {
                              await deleteDistrict(d.id);
                              await loadDistricts();
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
        title="Новый район"
        onClose={() => setModalNew(false)}
      >
        <DistrictFormCard
          key="new-dist"
          plain
          cityId={cityId}
          onCancel={() => setModalNew(false)}
          onCreate={async (b) => {
            await createDistrict(b);
            setModalNew(false);
            await loadDistricts();
          }}
          onUpdate={async () => {}}
          onError={setApiErr}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(editDist)}
        title="Редактировать район"
        onClose={() => setEditDist(null)}
      >
        {editDist && (
          <DistrictFormCard
            key={editDist.id}
            plain
            cityId={editDist.cityId}
            initial={editDist}
            onCancel={() => setEditDist(null)}
            onCreate={async () => {}}
            onUpdate={async (b) => {
              await updateDistrict(editDist.id, b);
              setEditDist(null);
              await loadDistricts();
            }}
            onError={setApiErr}
          />
        )}
      </AdminModal>
    </div>
  );
}
