import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

export type GeoCity = {
  id: string;
  name: string;
  nameKz: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GeoDistrict = {
  id: string;
  cityId: string;
  name: string;
  nameKz: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GeoSchool = {
  id: string;
  districtId: string;
  name: string;
  number: number | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GeoPaginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

function mapCity(raw: Record<string, unknown>): GeoCity {
  const id = String(raw.id ?? "");
  return {
    id,
    name: String(raw.name ?? ""),
    nameKz:
      raw.nameKz != null
        ? String(raw.nameKz)
        : raw.name_kz != null
          ? String(raw.name_kz)
          : null,
    isActive: Boolean(raw.isActive ?? raw.is_active),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

function mapDistrict(raw: Record<string, unknown>): GeoDistrict {
  return {
    id: String(raw.id ?? ""),
    cityId: String(raw.cityId ?? raw.city_id ?? ""),
    name: String(raw.name ?? ""),
    nameKz:
      raw.nameKz != null
        ? String(raw.nameKz)
        : raw.name_kz != null
          ? String(raw.name_kz)
          : null,
    isActive: Boolean(raw.isActive ?? raw.is_active),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

function mapSchool(raw: Record<string, unknown>): GeoSchool {
  const n = raw.number;
  return {
    id: String(raw.id ?? ""),
    districtId: String(raw.districtId ?? raw.district_id ?? ""),
    name: String(raw.name ?? ""),
    number:
      n === null || n === undefined || n === ""
        ? null
        : Number(n),
    address:
      raw.address === null || raw.address === undefined
        ? null
        : String(raw.address),
    isActive: Boolean(raw.isActive ?? raw.is_active),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

function parsePaginated<T>(
  data: unknown,
  mapItem: (r: Record<string, unknown>) => T,
): GeoPaginated<T> {
  const o = data as Record<string, unknown>;
  const itemsRaw = (o.items as unknown[]) ?? [];
  const limit = Number(o.limit ?? 20);
  const total = Number(o.total ?? 0);
  const page = Number(o.page ?? 1);
  let totalPages = Number(o.totalPages ?? o.total_pages ?? 0);
  if (totalPages < 1 && limit > 0)
    totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    items: itemsRaw.map((x) =>
      mapItem(typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {}),
    ),
    total,
    page,
    limit,
    totalPages,
  };
}

export async function listCities(params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): Promise<GeoPaginated<GeoCity>> {
  const q = buildQuery({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search?.trim() || undefined,
    isActive: params.isActive,
  });
  const res = await apiSuperAdminFetch(`${SUPER_ADMIN_ROUTES.CITIES}${q}`);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return parsePaginated(data, mapCity);
}

const GEO_LIST_PAGE_SIZE = 100;

/**
 * Все города для селектов (несколько запросов `GET /admin/cities`, пока не собраны все страницы).
 */
export async function listAllCities(params?: {
  search?: string;
  isActive?: boolean;
}): Promise<GeoCity[]> {
  const first = await listCities({
    page: 1,
    limit: GEO_LIST_PAGE_SIZE,
    search: params?.search,
    isActive: params?.isActive,
  });
  const out = [...first.items];
  const cap = Math.min(first.totalPages, 100);
  for (let p = 2; p <= cap; p++) {
    const next = await listCities({
      page: p,
      limit: GEO_LIST_PAGE_SIZE,
      search: params?.search,
      isActive: params?.isActive,
    });
    out.push(...next.items);
  }
  return out;
}

export async function getCity(id: string): Promise<GeoCity> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.CITY(id));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapCity(data ?? {});
}

export async function createCity(body: {
  name: string;
  nameKz?: string | null;
  isActive?: boolean;
}): Promise<GeoCity> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.CITIES, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapCity(data ?? {});
}

export async function updateCity(
  id: string,
  body: Partial<{
    name: string;
    nameKz: string | null;
    isActive: boolean;
  }>,
): Promise<GeoCity> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.CITY(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapCity(data ?? {});
}

export async function deleteCity(id: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.CITY(id), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

export async function listDistricts(params: {
  cityId: string;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): Promise<GeoPaginated<GeoDistrict>> {
  const q = buildQuery({
    cityId: params.cityId,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search?.trim() || undefined,
    isActive: params.isActive,
  });
  const res = await apiSuperAdminFetch(`${SUPER_ADMIN_ROUTES.DISTRICTS}${q}`);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return parsePaginated(data, mapDistrict);
}

/**
 * Все районы города для селектов (несколько страниц `GET /admin/districts`).
 */
export async function listAllDistricts(params: {
  cityId: string;
  search?: string;
  isActive?: boolean;
}): Promise<GeoDistrict[]> {
  const first = await listDistricts({
    cityId: params.cityId,
    page: 1,
    limit: GEO_LIST_PAGE_SIZE,
    search: params.search,
    isActive: params.isActive,
  });
  const out = [...first.items];
  const cap = Math.min(first.totalPages, 100);
  for (let p = 2; p <= cap; p++) {
    const next = await listDistricts({
      cityId: params.cityId,
      page: p,
      limit: GEO_LIST_PAGE_SIZE,
      search: params.search,
      isActive: params.isActive,
    });
    out.push(...next.items);
  }
  return out;
}

export async function getDistrict(id: string): Promise<GeoDistrict> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.DISTRICT(id));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapDistrict(data ?? {});
}

export async function createDistrict(body: {
  cityId: string;
  name: string;
  nameKz?: string | null;
  isActive?: boolean;
}): Promise<GeoDistrict> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.DISTRICTS, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapDistrict(data ?? {});
}

export async function updateDistrict(
  id: string,
  body: Partial<{
    name: string;
    nameKz: string | null;
    isActive: boolean;
  }>,
): Promise<GeoDistrict> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.DISTRICT(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapDistrict(data ?? {});
}

export async function deleteDistrict(id: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.DISTRICT(id), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}

export async function listSchools(params: {
  districtId: string;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): Promise<GeoPaginated<GeoSchool>> {
  const q = buildQuery({
    districtId: params.districtId,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search?.trim() || undefined,
    isActive: params.isActive,
  });
  const res = await apiSuperAdminFetch(`${SUPER_ADMIN_ROUTES.SCHOOLS}${q}`);
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  return parsePaginated(data, mapSchool);
}

/**
 * Все школы района для селектов (несколько страниц `GET /admin/schools`).
 */
export async function listAllSchools(params: {
  districtId: string;
  search?: string;
  isActive?: boolean;
}): Promise<GeoSchool[]> {
  const first = await listSchools({
    districtId: params.districtId,
    page: 1,
    limit: GEO_LIST_PAGE_SIZE,
    search: params.search,
    isActive: params.isActive,
  });
  const out = [...first.items];
  const cap = Math.min(first.totalPages, 100);
  for (let p = 2; p <= cap; p++) {
    const next = await listSchools({
      districtId: params.districtId,
      page: p,
      limit: GEO_LIST_PAGE_SIZE,
      search: params.search,
      isActive: params.isActive,
    });
    out.push(...next.items);
  }
  return out;
}

export async function getSchool(id: string): Promise<GeoSchool> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.SCHOOL(id));
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapSchool(data ?? {});
}

export async function createSchool(body: {
  districtId: string;
  name: string;
  number?: number | null;
  address?: string | null;
  isActive?: boolean;
}): Promise<GeoSchool> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.SCHOOLS, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapSchool(data ?? {});
}

export async function updateSchool(
  id: string,
  body: Partial<{
    name: string;
    number: number | null;
    address: string | null;
    isActive: boolean;
  }>,
): Promise<GeoSchool> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.SCHOOL(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<Record<string, unknown>>(res);
  return mapSchool(data ?? {});
}

export async function deleteSchool(id: string): Promise<void> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.SCHOOL(id), {
    method: "DELETE",
  });
  await throwIfNotOk(res);
}
