"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  type GeoCity,
  type GeoPaginated,
  listCities,
  createCity,
  updateCity,
  deleteCity,
} from "@/lib/api/super-admin/geo";
import { isApiConfigured } from "@/lib/env";
import { AdminModal } from "@/components/super-admin/admin-modal";
import {
  CityFormCard,
  GeoActiveBadge,
  GeoPagination,
} from "@/components/super-admin/geo-forms";

const PAGE_SIZE = 20;

export function GeoCitiesPage() {
  const t = useTranslations("SuperAdminGeoCities");
  const tc = useTranslations("Common");
  const [err, setErr] = useState<string | null>(null);
  const setApiErr = (e: unknown) =>
    setErr(e instanceof Error ? e.message : t("errorGeneric"));

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [data, setData] = useState<GeoPaginated<GeoCity> | null>(null);
  const [loading, setLoading] = useState(true);

  const activeParam = (v: "all" | "yes" | "no") =>
    v === "all" ? undefined : v === "yes";

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setErr(tc("apiEnvMissing"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const r = await listCities({
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
  }, [page, search, activeFilter, t, tc]);

  useEffect(() => {
    void load();
  }, [load]);

  const [modalNew, setModalNew] = useState(false);
  const [editCity, setEditCity] = useState<GeoCity | null>(null);

  return (
    <div className="max-w-4xl pb-12">
      <header className="mb-6">
        <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
        <p className="mt-1 ds-text-caption text-ds-gray-text">{t("lead")}</p>
      </header>

      {err && (
        <div
          className="mb-4 rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error"
          role="alert"
        >
          {err}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="ui-btn ui-btn--1"
          onClick={() => {
            setModalNew(true);
            setEditCity(null);
          }}
        >
          {t("addCity")}
        </button>
        <input
          className="ds-input min-w-[160px] flex-1 sm:max-w-xs"
          placeholder={t("searchPlaceholder")}
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
          {t("find")}
        </button>
        <select
          className="ds-input w-auto min-w-[120px]"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as "all" | "yes" | "no");
            setPage(1);
          }}
        >
          <option value="all">{t("filterAll")}</option>
          <option value="yes">{t("filterActive")}</option>
          <option value="no">{t("filterInactive")}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-ds-card border border-ds-gray-border bg-ds-white">
        {loading ? (
          <p className="p-6 ds-text-caption text-ds-gray-text">{t("loading")}</p>
        ) : !data?.items.length ? (
          <p className="p-8 text-center ds-text-caption text-ds-gray-text">
            {t("empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse ds-text-small">
              <thead>
                <tr className="border-b border-ds-gray-border bg-[#F8F8F8] text-left text-ds-gray-text">
                  <th className="px-3 py-2 font-medium">{t("thCity")}</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">
                    {t("thKz")}
                  </th>
                  <th className="px-3 py-2 font-medium">{t("thActive")}</th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t("thActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-ds-gray-border/60 last:border-0"
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/super-admin/geo/cities/${encodeURIComponent(c.id)}`}
                        className="font-medium text-ds-black hover:text-ds-primary"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="hidden px-3 py-2.5 text-ds-gray-text sm:table-cell">
                      {c.nameKz ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <GeoActiveBadge active={c.isActive} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/super-admin/geo/cities/${encodeURIComponent(c.id)}`}
                        className="mr-3 ds-text-caption text-ds-primary"
                      >
                        {t("districts")}
                      </Link>
                      <button
                        type="button"
                        className="mr-2 ds-text-caption text-ds-gray-text underline"
                        onClick={() => setEditCity(c)}
                      >
                        {t("editShort")}
                      </button>
                      <button
                        type="button"
                        className="ds-text-caption text-ds-error underline"
                        onClick={() => {
                          if (!confirm(t("confirmDelete", { name: c.name })))
                            return;
                          void (async () => {
                            try {
                              await deleteCity(c.id);
                              await load();
                            } catch (e) {
                              setApiErr(e);
                            }
                          })();
                        }}
                      >
                        {t("deleteShort")}
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
        title={t("modalNew")}
        onClose={() => setModalNew(false)}
      >
        <CityFormCard
          key="new"
          plain
          onCancel={() => setModalNew(false)}
          onSave={async (b) => {
            await createCity(b);
            setModalNew(false);
            await load();
          }}
          onError={setApiErr}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(editCity)}
        title={t("modalEdit")}
        onClose={() => setEditCity(null)}
      >
        {editCity && (
          <CityFormCard
            key={editCity.id}
            plain
            initial={editCity}
            onCancel={() => setEditCity(null)}
            onSave={async (b) => {
              await updateCity(editCity.id, b);
              setEditCity(null);
              await load();
            }}
            onError={setApiErr}
          />
        )}
      </AdminModal>
    </div>
  );
}
