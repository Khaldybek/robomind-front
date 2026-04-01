"use client";

import { useState, type ReactNode } from "react";
import type { GeoCity, GeoDistrict, GeoSchool } from "@/lib/api/super-admin/geo";

export function GeoField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="ds-text-caption text-ds-gray-text">
        {label}
      </label>
      {children}
    </div>
  );
}

export function GeoPagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1 && total === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 ds-text-caption text-ds-gray-text">
      <span>
        Всего: {total}
        {totalPages > 1 ? ` · стр. ${page} из ${totalPages}` : ""}
      </span>
      {totalPages > 1 && (
        <div className="flex gap-2">
          <button
            type="button"
            className="ui-btn ui-btn--4 px-3 py-1.5 ds-text-caption"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Назад
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--4 px-3 py-1.5 ds-text-caption"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
}

export function GeoActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-[#E8F5E9] px-2 py-0.5 ds-text-caption text-[#2E7D32]"
          : "rounded-full bg-[#F5F5F5] px-2 py-0.5 ds-text-caption text-ds-gray-text"
      }
    >
      {active ? "да" : "нет"}
    </span>
  );
}

export function CityFormCard({
  initial,
  onCancel,
  onSave,
  onError,
  plain,
}: {
  initial?: GeoCity;
  onCancel: () => void;
  onSave: (b: {
    name: string;
    nameKz?: string | null;
    isActive?: boolean;
  }) => Promise<void>;
  onError: (e: unknown) => void;
  plain?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameKz, setNameKz] = useState(initial?.nameKz ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={plain ? "space-y-3" : "rounded-lg border border-ds-gray-border bg-[#FAFAFA] p-4"}
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void (async () => {
          try {
            await onSave({
              name,
              nameKz: nameKz.trim() ? nameKz : null,
              isActive,
            });
          } catch (er) {
            onError(er);
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-1">
        <GeoField id="fc-name" label="Название (RU)">
          <input
            id="fc-name"
            className="ds-input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </GeoField>
        <GeoField id="fc-kz" label="Название (KZ)">
          <input
            id="fc-kz"
            className="ds-input w-full"
            value={nameKz}
            onChange={(e) => setNameKz(e.target.value)}
          />
        </GeoField>
      </div>
      <label className="flex items-center gap-2 ds-text-caption text-ds-black">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Активен
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="ui-btn ui-btn--1" disabled={busy}>
          Сохранить
        </button>
        <button type="button" className="ui-btn ui-btn--4" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}

export function DistrictFormCard({
  cityId,
  initial,
  onCancel,
  onCreate,
  onUpdate,
  onError,
  plain,
}: {
  cityId: string;
  initial?: GeoDistrict;
  onCancel: () => void;
  onCreate: (b: {
    cityId: string;
    name: string;
    nameKz?: string | null;
    isActive?: boolean;
  }) => Promise<void>;
  onUpdate: (b: {
    name: string;
    nameKz?: string | null;
    isActive?: boolean;
  }) => Promise<void>;
  onError: (e: unknown) => void;
  plain?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameKz, setNameKz] = useState(initial?.nameKz ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(initial);
  return (
    <form
      className={plain ? "space-y-3" : "rounded-lg border border-ds-gray-border bg-[#FAFAFA] p-4"}
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void (async () => {
          try {
            if (isEdit) {
              await onUpdate({
                name,
                nameKz: nameKz.trim() ? nameKz : null,
                isActive,
              });
            } else {
              await onCreate({
                cityId,
                name,
                nameKz: nameKz.trim() ? nameKz : undefined,
                isActive,
              });
            }
          } catch (er) {
            onError(er);
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      <div className="grid gap-3">
        <GeoField id="fd-name" label="Название (RU)">
          <input
            id="fd-name"
            className="ds-input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </GeoField>
        <GeoField id="fd-kz" label="Название (KZ)">
          <input
            id="fd-kz"
            className="ds-input w-full"
            value={nameKz}
            onChange={(e) => setNameKz(e.target.value)}
          />
        </GeoField>
      </div>
      <label className="flex items-center gap-2 ds-text-caption text-ds-black">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Активен
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="ui-btn ui-btn--1" disabled={busy}>
          Сохранить
        </button>
        <button type="button" className="ui-btn ui-btn--4" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}

export function SchoolFormCard({
  districtId,
  initial,
  onCancel,
  onCreate,
  onUpdate,
  onError,
  plain,
}: {
  districtId: string;
  initial?: GeoSchool;
  onCancel: () => void;
  onCreate: (b: {
    districtId: string;
    name: string;
    number?: number | null;
    address?: string | null;
    isActive?: boolean;
  }) => Promise<void>;
  onUpdate: (b: {
    name: string;
    number?: number | null;
    address?: string | null;
    isActive?: boolean;
  }) => Promise<void>;
  onError: (e: unknown) => void;
  plain?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [number, setNumber] = useState(
    initial?.number != null ? String(initial.number) : "",
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(initial);
  return (
    <form
      className={plain ? "space-y-3" : "rounded-lg border border-ds-gray-border bg-[#FAFAFA] p-4"}
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void (async () => {
          try {
            const num = number.trim() === "" ? null : Number(number);
            if (isEdit) {
              await onUpdate({
                name,
                number: num,
                address: address.trim() ? address : null,
                isActive,
              });
            } else {
              await onCreate({
                districtId,
                name,
                number: num,
                address: address.trim() ? address : null,
                isActive,
              });
            }
          } catch (er) {
            onError(er);
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      <GeoField id="fs-name" label="Название">
        <input
          id="fs-name"
          className="ds-input w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </GeoField>
      <div className="grid gap-3 sm:grid-cols-2">
        <GeoField id="fs-num" label="Номер">
          <input
            id="fs-num"
            type="number"
            className="ds-input w-full"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </GeoField>
        <GeoField id="fs-addr" label="Адрес">
          <input
            id="fs-addr"
            className="ds-input w-full"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </GeoField>
      </div>
      <label className="flex items-center gap-2 ds-text-caption text-ds-black">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Активна
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="ui-btn ui-btn--1" disabled={busy}>
          Сохранить
        </button>
        <button type="button" className="ui-btn ui-btn--4" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}
