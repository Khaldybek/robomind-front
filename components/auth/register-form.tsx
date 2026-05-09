"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchCities,
  fetchDistricts,
  fetchSchools,
} from "@/lib/api/student/geo";
import { registerStudent } from "@/lib/api/student/auth";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";
import type { GeoItem } from "@/lib/api/types";
import { AuthCardMascot } from "@/components/auth/auth-card-mascot";

/**
 * Онбординг: город → район → школа (только для выбора `schoolId`) + поля регистрации.
 * В `POST /auth/register` уходит только контрактное тело: без `cityId`/`districtId`, отчество — `patronymic`.
 */
export function RegisterForm() {
  const t = useTranslations("Auth.register");
  const tc = useTranslations("Common");
  const [cities, setCities] = useState<GeoItem[]>([]);
  const [districts, setDistricts] = useState<GeoItem[]>([]);
  const [schools, setSchools] = useState<GeoItem[]>([]);
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [iin, setIin] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!isApiConfigured()) return;
    setGeoLoading(true);
    setGeoError(null);
    fetchCities()
      .then(setCities)
      .catch(() => setGeoError(t("geoLoadError")))
      .finally(() => setGeoLoading(false));
  }, []);

  useEffect(() => {
    if (!cityId || !isApiConfigured()) {
      setDistricts([]);
      setDistrictId("");
      return;
    }
    fetchDistricts(cityId)
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, [cityId]);

  useEffect(() => {
    if (!districtId || !isApiConfigured()) {
      setSchools([]);
      setSchoolId("");
      return;
    }
    fetchSchools(districtId)
      .then(setSchools)
      .catch(() => setSchools([]));
  }, [districtId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      return;
    }
    setPending(true);
    try {
      const p = patronymic.trim();
      await registerStudent({
        iin: iin.trim(),
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        ...(p ? { patronymic: p } : {}),
        email: email.trim(),
        password,
        schoolId,
      });
      window.location.href = "/pending-activation";
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("errorGeneric"));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-lg overflow-visible pb-24 sm:pb-20">
      <form
        onSubmit={onSubmit}
        className="auth-register-form relative z-[2] space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 pr-3.5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.1)] sm:space-y-3.5 sm:p-5 sm:pr-5"
      >
        <h1 className="text-xl font-semibold tracking-tight text-ds-black sm:text-2xl">
          {t("title")}
        </h1>
        {geoError && (
          <div
            className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-xs leading-snug text-amber-950 sm:text-sm"
            role="alert"
          >
            {geoError}
          </div>
        )}
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          <div className="sm:col-span-2">
            <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
              {t("city")}
            </label>
          <select
            className="ds-input"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            disabled={geoLoading || cities.length === 0}
            required
          >
            <option value="">
              {geoLoading ? t("selectCityLoading") : t("selectCity")}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
              {t("district")}
            </label>
          <select
            className="ds-input"
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            disabled={!cityId}
            required
          >
            <option value="">{t("selectDistrict")}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
              {t("school")}
            </label>
          <select
            className="ds-input"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            disabled={!districtId}
            required
          >
            <option value="">{t("selectSchool")}</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          </div>
        </div>
        <div>
          <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
            {t("iin")}
          </label>
          <input
            className="ds-input"
            value={iin}
            onChange={(e) => setIin(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          <div>
            <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
              {t("lastName")}
            </label>
          <input
            className="ds-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
              {t("firstName")}
            </label>
          <input
            className="ds-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
              {t("patronymic")}
            </label>
          <input
            className="ds-input"
            value={patronymic}
            onChange={(e) => setPatronymic(e.target.value)}
          />
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          <div className="min-w-0">
            <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
              {t("email")}
            </label>
            <input
              type="email"
              className="ds-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="min-w-0">
            <label className="mb-0.5 block text-xs font-medium text-ds-black sm:text-[13px]">
              {t("password")}
            </label>
            <input
              type="password"
              className="ds-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        {error && (
          <div
            className="rounded-lg border border-rose-200/85 bg-rose-50/95 px-3 py-2 text-xs leading-snug text-rose-950 sm:text-sm"
            role="alert"
          >
            {error}
          </div>
        )}
        <button type="submit" className="ui-btn ui-btn--1 w-full" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
      <AuthCardMascot />
    </div>
  );
}
