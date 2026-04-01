"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
    <div className="relative mx-auto max-w-lg overflow-visible pb-24 sm:pb-20">
      <form
        onSubmit={onSubmit}
        className="relative z-[2] space-y-5 rounded-ds-card border border-ds-gray-border bg-ds-white p-8 pr-6 shadow-sm sm:pr-10"
      >
      <h1 className="ds-text-h2 text-ds-black">{t("title")}</h1>
      {geoError && (
        <p className="ds-text-small text-ds-error" role="alert">
          {geoError}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="ds-text-small mb-1 block">{t("city")}</label>
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
          <label className="ds-text-small mb-1 block">{t("district")}</label>
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
          <label className="ds-text-small mb-1 block">{t("school")}</label>
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
        <label className="ds-text-small mb-1 block">{t("iin")}</label>
        <input
          className="ds-input"
          value={iin}
          onChange={(e) => setIin(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="ds-text-small mb-1 block">{t("lastName")}</label>
          <input
            className="ds-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="ds-text-small mb-1 block">{t("firstName")}</label>
          <input
            className="ds-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="ds-text-small mb-1 block">{t("patronymic")}</label>
          <input
            className="ds-input"
            value={patronymic}
            onChange={(e) => setPatronymic(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="ds-text-small mb-1 block">{t("email")}</label>
        <input
          type="email"
          className="ds-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="ds-text-small mb-1 block">{t("password")}</label>
        <input
          type="password"
          className="ds-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="ds-text-small text-ds-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="ui-btn ui-btn--1" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </button>
        <Link href="/login" className="ui-btn ui-btn--2">
          {t("haveAccount")}
        </Link>
      </div>
    </form>
      <AuthCardMascot />
    </div>
  );
}
