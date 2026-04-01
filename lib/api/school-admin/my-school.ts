import {
  apiSchoolAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/school-admin/client";
import { SCHOOL_ADMIN_ROUTES } from "@/lib/api/school-admin/routes";

export type MySchoolGeoCity = {
  id: string;
  name: string;
  nameKz: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MySchoolGeoDistrict = {
  id: string;
  cityId: string;
  name: string;
  nameKz: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MySchoolSchool = {
  id: string;
  districtId: string;
  name: string;
  number: number | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** `GET /admin/my-school` — только `school_admin` */
export type MySchoolResponse = {
  school: MySchoolSchool;
  district: MySchoolGeoDistrict | null;
  city: MySchoolGeoCity | null;
};

function mapSchool(raw: Record<string, unknown>): MySchoolSchool {
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
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

function mapDistrict(
  raw: Record<string, unknown> | null | undefined,
): MySchoolGeoDistrict | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id ?? ""),
    cityId: String(o.cityId ?? o.city_id ?? ""),
    name: String(o.name ?? ""),
    nameKz:
      o.nameKz === null || o.nameKz === undefined
        ? null
        : String(o.nameKz),
    isActive: Boolean(o.isActive ?? o.is_active ?? true),
    createdAt: String(o.createdAt ?? o.created_at ?? ""),
    updatedAt: String(o.updatedAt ?? o.updated_at ?? ""),
  };
}

function mapCity(
  raw: Record<string, unknown> | null | undefined,
): MySchoolGeoCity | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id ?? ""),
    name: String(o.name ?? ""),
    nameKz:
      o.nameKz === null || o.nameKz === undefined
        ? null
        : String(o.nameKz),
    isActive: Boolean(o.isActive ?? o.is_active ?? true),
    createdAt: String(o.createdAt ?? o.created_at ?? ""),
    updatedAt: String(o.updatedAt ?? o.updated_at ?? ""),
  };
}

export async function fetchMySchool(): Promise<MySchoolResponse> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.MY_SCHOOL);
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  const schoolRaw = data.school;
  if (!schoolRaw || typeof schoolRaw !== "object") {
    throw new Error("В ответе нет school");
  }
  return {
    school: mapSchool(schoolRaw as Record<string, unknown>),
    district: mapDistrict(
      data.district as Record<string, unknown> | null | undefined,
    ),
    city: mapCity(data.city as Record<string, unknown> | null | undefined),
  };
}

/** Профиль текущего пользователя — `GET /admin/me` */
export type AdminMeSchoolRef = {
  id: string;
  name: string;
  number: number | null;
  districtId: string;
};

export type SchoolAdminMe = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  iin: string | null;
  role: "school_admin" | "super_admin";
  isActive: boolean;
  schoolId: string | null;
  school: AdminMeSchoolRef | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapMeSchool(raw: unknown): AdminMeSchoolRef | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const n = o.number;
  return {
    id: String(o.id ?? ""),
    name: String(o.name ?? ""),
    number:
      n === null || n === undefined || n === ""
        ? null
        : Number(n),
    districtId: String(o.districtId ?? o.district_id ?? ""),
  };
}

export function mapSchoolAdminMe(raw: Record<string, unknown>): SchoolAdminMe {
  const roleRaw = String(raw.role ?? "");
  const role: "school_admin" | "super_admin" =
    roleRaw === "super_admin" ? "super_admin" : "school_admin";
  return {
    id: String(raw.id ?? ""),
    email: String(raw.email ?? ""),
    firstName: String(raw.firstName ?? raw.first_name ?? ""),
    lastName: String(raw.lastName ?? raw.last_name ?? ""),
    patronymic:
      raw.patronymic === null || raw.patronymic === undefined
        ? null
        : String(raw.patronymic),
    iin:
      raw.iin === null || raw.iin === undefined ? null : String(raw.iin),
    role,
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    schoolId:
      raw.schoolId === null || raw.schoolId === undefined || raw.schoolId === ""
        ? null
        : String(raw.schoolId ?? raw.school_id),
    school: mapMeSchool(raw.school),
    avatarUrl:
      raw.avatarUrl != null
        ? String(raw.avatarUrl)
        : raw.avatar_url != null
          ? String(raw.avatar_url)
          : null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}

export async function fetchSchoolAdminMe(): Promise<SchoolAdminMe> {
  const res = await apiSchoolAdminFetch(SCHOOL_ADMIN_ROUTES.ME);
  await throwIfNotOk(res);
  const data = (await parseJsonSafe<Record<string, unknown>>(res)) ?? {};
  return mapSchoolAdminMe(data);
}
