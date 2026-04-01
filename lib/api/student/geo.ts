import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { STUDENT_ROUTES } from "@/lib/api/routes";
import type { GeoItem } from "@/lib/api/types";

function normalizeList(raw: unknown): GeoItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    if (x && typeof x === "object" && "id" in x && "name" in x) {
      return { id: String((x as GeoItem).id), name: String((x as GeoItem).name) };
    }
    return { id: String(x), name: String(x) };
  });
}

export type CityRow = GeoItem & {
  nameKz?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type DistrictRow = GeoItem & {
  nameKz?: string;
  cityId?: string;
  [key: string]: unknown;
};

export type SchoolRow = GeoItem & {
  number?: number;
  districtId?: string;
  address?: string;
  isActive?: boolean;
  [key: string]: unknown;
};

export async function fetchCities(): Promise<CityRow[]> {
  const res = await apiFetch(STUDENT_ROUTES.GEO_CITIES, { skipAuth: true });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data as CityRow[];
  if (data && typeof data === "object" && "data" in data) {
    const rows = (data as { data: unknown }).data;
    if (Array.isArray(rows)) return rows as CityRow[];
  }
  return normalizeList(data) as CityRow[];
}

export async function fetchDistricts(cityId: string): Promise<DistrictRow[]> {
  const res = await apiFetch(STUDENT_ROUTES.GEO_DISTRICTS(cityId), {
    skipAuth: true,
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data as DistrictRow[];
  if (data && typeof data === "object" && "data" in data) {
    const rows = (data as { data: unknown }).data;
    if (Array.isArray(rows)) return rows as DistrictRow[];
  }
  return normalizeList(data) as DistrictRow[];
}

export async function fetchSchools(districtId: string): Promise<SchoolRow[]> {
  const res = await apiFetch(STUDENT_ROUTES.GEO_SCHOOLS(districtId), {
    skipAuth: true,
  });
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  if (Array.isArray(data)) return data as SchoolRow[];
  if (data && typeof data === "object" && "data" in data) {
    const rows = (data as { data: unknown }).data;
    if (Array.isArray(rows)) return rows as SchoolRow[];
  }
  return normalizeList(data) as SchoolRow[];
}
