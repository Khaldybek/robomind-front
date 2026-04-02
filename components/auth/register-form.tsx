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

const STEPS = [
  { label: "Школа", icon: "🏫" },
  { label: "Данные", icon: "👤" },
  { label: "Вход", icon: "🔑" },
];

/**
 * Онбординг: город → район → школа (только для выбора `schoolId`) + поля регистрации.
 * В `POST /auth/register` уходит только контрактное тело: без `cityId`/`districtId`, отчество — `patronymic`.
 */
export function RegisterForm() {
  const t = useTranslations("Auth.register");
  const tc = useTranslations("Common");
  const [step, setStep] = useState(0);
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

  const fieldClass =
    "w-full rounded-xl border-2 border-ds-gray-border bg-ds-gray-light/50 px-4 py-3 text-sm font-medium text-ds-black transition-all placeholder:text-ds-gray-text/60 focus:border-ds-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-ds-primary/20";

  const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ds-gray-text";

  return (
    <div className="relative mx-auto max-w-lg overflow-visible pb-24 sm:pb-20">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,46,31,0.3) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-12 h-32 w-32 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)" }}
        aria-hidden
      />

      <form
        onSubmit={onSubmit}
        className="relative z-[2] overflow-hidden rounded-2xl bg-white shadow-xl"
        style={{ border: "2px solid rgba(255,46,31,0.12)", boxShadow: "0 8px 40px rgba(38,38,38,0.12)" }}
      >
        {/* Gradient top bar */}
        <div
          className="h-2 w-full"
          style={{ background: "linear-gradient(90deg, #ff2e1f 0%, #ff7a30 50%, #f59e0b 100%)" }}
        />

        <div className="px-8 pb-8 pt-6">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #ff2e1f 0%, #ff7a30 100%)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
                <circle cx="12" cy="8" r="3.5" fill="white" opacity="0.95" />
                <rect x="8" y="13" width="8" height="7" rx="2" fill="white" opacity="0.9" />
                <rect x="5" y="15" width="3" height="4" rx="1.5" fill="white" opacity="0.7" />
                <rect x="16" y="15" width="3" height="4" rx="1.5" fill="white" opacity="0.7" />
                <circle cx="10" cy="8" r="1" fill="#ff2e1f" opacity="0.7" />
                <circle cx="14" cy="8" r="1" fill="#ff2e1f" opacity="0.7" />
              </svg>
            </span>
            <div>
              <h1 className="text-xl font-black text-ds-black">{t("title")}</h1>
              <p className="text-xs text-ds-gray-text">Стань частью Robomind!</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    i <= step
                      ? "bg-ds-primary text-white shadow-md shadow-ds-primary/30"
                      : "bg-ds-gray-light text-ds-gray-text"
                  }`}
                >
                  {i < step ? (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <path fillRule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span aria-hidden>{s.icon}</span>
                  )}
                </div>
                <span className={`text-xs font-semibold ${i <= step ? "text-ds-primary" : "text-ds-gray-text"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {geoError && (
            <div className="mb-4 rounded-xl border border-[#ff2e1f]/30 bg-[#fff0ee] px-4 py-3 text-sm text-[#cc1a0d]" role="alert">
              {geoError}
            </div>
          )}

          <div className="space-y-4">
            {/* Step 0 — School selection */}
            <div
              className={`space-y-4 transition-all duration-300 ${step === 0 ? "block" : "hidden"}`}
              aria-hidden={step !== 0}
            >
              <div>
                <label className={labelClass}>{t("city")}</label>
                <select
                  className={fieldClass}
                  value={cityId}
                  onChange={(e) => { setCityId(e.target.value); setStep(0); }}
                  disabled={geoLoading || cities.length === 0}
                  required
                >
                  <option value="">{geoLoading ? t("selectCityLoading") : t("selectCity")}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("district")}</label>
                <select
                  className={fieldClass}
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                  disabled={!cityId}
                  required
                >
                  <option value="">{t("selectDistrict")}</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("school")}</label>
                <select
                  className={fieldClass}
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  disabled={!districtId}
                  required
                >
                  <option value="">{t("selectSchool")}</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="w-full rounded-xl py-3 text-sm font-black text-white shadow-md shadow-ds-primary/25 transition-all hover:scale-[1.02] disabled:opacity-40"
                style={{ background: "linear-gradient(90deg, #ff2e1f 0%, #ff7a30 100%)" }}
                disabled={!schoolId}
                onClick={() => setStep(1)}
              >
                Далее →
              </button>
            </div>

            {/* Step 1 — Personal info */}
            <div
              className={`space-y-4 transition-all duration-300 ${step === 1 ? "block" : "hidden"}`}
              aria-hidden={step !== 1}
            >
              <div>
                <label className={labelClass}>{t("iin")}</label>
                <input className={fieldClass} value={iin} onChange={(e) => setIin(e.target.value)} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("lastName")}</label>
                  <input className={fieldClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t("firstName")}</label>
                  <input className={fieldClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t("patronymic")}</label>
                  <input className={fieldClass} value={patronymic} onChange={(e) => setPatronymic(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-xl border-2 border-ds-gray-border py-3 text-sm font-bold text-ds-black transition-all hover:border-ds-primary/40"
                  onClick={() => setStep(0)}
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl py-3 text-sm font-black text-white shadow-md shadow-ds-primary/25 transition-all hover:scale-[1.02] disabled:opacity-40"
                  style={{ background: "linear-gradient(90deg, #ff2e1f 0%, #ff7a30 100%)" }}
                  disabled={!iin || !lastName || !firstName}
                  onClick={() => setStep(2)}
                >
                  Далее →
                </button>
              </div>
            </div>

            {/* Step 2 — Account credentials */}
            <div
              className={`space-y-4 transition-all duration-300 ${step === 2 ? "block" : "hidden"}`}
              aria-hidden={step !== 2}
            >
              <div>
                <label className={labelClass}>{t("email")}</label>
                <input
                  type="email"
                  className={fieldClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t("password")}</label>
                <input
                  type="password"
                  className={fieldClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-[#ff2e1f]/30 bg-[#fff0ee] px-4 py-3 text-sm text-[#cc1a0d]" role="alert">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-xl border-2 border-ds-gray-border py-3 text-sm font-bold text-ds-black transition-all hover:border-ds-primary/40"
                  onClick={() => setStep(1)}
                >
                  ← Назад
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl py-3 text-sm font-black text-white shadow-lg shadow-ds-primary/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-60"
                  style={{ background: pending ? "#aaa" : "linear-gradient(90deg, #ff2e1f 0%, #ff7a30 100%)" }}
                  disabled={pending}
                >
                  {pending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
                      </svg>
                      {t("submitting")}
                    </span>
                  ) : t("submit")}
                </button>
              </div>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-ds-gray-text">
              {t("haveAccount") ?? "Уже есть аккаунт?"}{" "}
              <Link href="/login" className="font-bold text-ds-primary hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </form>
      <AuthCardMascot />
    </div>
  );
}
