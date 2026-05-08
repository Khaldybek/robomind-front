"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  formatLocalizedUaSummary,
  formatViolationWhen,
  violationStudentDisplay,
} from "@/lib/device-violations-display";

export type DeviceViolationRowLike = {
  id: string;
  createdAt?: string;
  attemptedDeviceId?: string;
  userAgent?: string;
  ip?: string;
  student?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    schoolId?: string;
  };
};

export function AdminDeviceViolationsView({
  variant,
  items,
  loading,
  error,
  showBuiltInHeader = true,
}: {
  variant: "school" | "super";
  items: DeviceViolationRowLike[];
  loading?: boolean;
  error?: string | null;
  /** When false, parent renders the title (e.g. school-admin `SchoolAdminPageHero`). */
  showBuiltInHeader?: boolean;
}) {
  const t = useTranslations("AdminDeviceViolations");
  const tc = useTranslations("Common");
  const locale = useLocale();

  const isPanel = variant === "school";
  const userBase =
    variant === "school" ? "/school-admin/users" : "/super-admin/users";

  const outerClass = isPanel ? "w-full" : "mx-auto max-w-3xl";

  return (
    <div className={outerClass}>
      {showBuiltInHeader ? (
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ds-black sm:text-3xl">
            {variant === "school" ? t("titleSchool") : t("titleSuper")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ds-gray-dark-2 sm:text-lg">
            {variant === "school" ? t("leadSchool") : t("leadSuper")}
          </p>
        </header>
      ) : null}

      {loading && (
        <p
          className={
            isPanel
              ? "text-sm text-slate-600"
              : "text-base text-ds-gray-text"
          }
        >
          {tc("loading")}
        </p>
      )}

      {error && (
        <p
          className={
            isPanel
              ? "mb-4 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-700"
              : "mb-6 rounded-xl border-2 border-ds-error/25 bg-red-50 px-4 py-3 text-base text-ds-error"
          }
          role="alert"
        >
          {error}
        </p>
      )}

      <ul className={isPanel ? "flex flex-col gap-4" : "flex flex-col gap-6"}>
        {items.map((v, idx) => {
          const when = formatViolationWhen(v.createdAt, locale);
          const uaShort = formatLocalizedUaSummary(v.userAgent, t);
          const st = v.student
            ? violationStudentDisplay(v.student)
            : null;

          const cardClass = isPanel
            ? "sa-card sa-card-in overflow-hidden"
            : "overflow-hidden rounded-2xl border-2 border-ds-gray-border bg-ds-white shadow-sm";

          const whenColClass = isPanel
            ? "border-b border-slate-200/90 bg-slate-50/50 px-5 py-4 sm:border-b-0 sm:border-r sm:border-slate-200/90"
            : "border-b border-ds-gray-border bg-ds-gray-light/60 px-5 py-4 sm:border-b-0 sm:border-r";

          const labelClass = isPanel
            ? "text-xs font-semibold uppercase tracking-wide text-slate-500"
            : "text-xs font-bold uppercase tracking-wide text-ds-gray-text";

          const whenTextClass = isPanel
            ? "mt-2 text-lg font-semibold leading-snug text-slate-900"
            : "mt-2 text-lg font-semibold leading-snug text-ds-black";

          const linkClass = isPanel
            ? "mt-2 inline-block text-lg font-semibold text-sky-700 hover:text-sky-900 hover:underline sm:text-xl"
            : "mt-2 inline-block text-xl font-semibold text-ds-primary hover:underline";

          const innerBoxClass = isPanel
            ? "rounded-xl border border-slate-100 bg-white/90 px-4 py-3 shadow-sm shadow-slate-900/[0.02]"
            : "rounded-xl bg-ds-gray-light/50 px-4 py-3";

          const summaryClass = isPanel
            ? "cursor-pointer text-sm font-semibold text-sky-700 hover:text-sky-900"
            : "cursor-pointer text-sm font-semibold text-ds-primary";

          return (
            <li
              key={v.id}
              className={cardClass}
              style={
                isPanel
                  ? { animationDelay: `${Math.min(idx * 60, 420)}ms` }
                  : undefined
              }
            >
              <div className="grid gap-0 sm:grid-cols-[minmax(160px,220px)_1fr]">
                <div className={whenColClass}>
                  <p className={labelClass}>{t("when")}</p>
                  <p className={whenTextClass}>{when}</p>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                  {v.student && st ? (
                    <div>
                      <p className={labelClass}>{t("student")}</p>
                      <Link
                        href={`${userBase}/${encodeURIComponent(v.student.id)}`}
                        className={linkClass}
                      >
                        {st.primary}
                      </Link>
                      {st.secondary ? (
                        <p
                          className={
                            isPanel
                              ? "mt-1 text-sm text-slate-600 sm:text-base"
                              : "mt-1 text-base text-ds-gray-dark-2"
                          }
                        >
                          {st.secondary}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-1">
                    <div className={innerBoxClass}>
                      <p className={labelClass}>{t("deviceId")}</p>
                      <p className="mt-1 break-all font-mono text-sm leading-relaxed text-slate-900 sm:text-base">
                        {v.attemptedDeviceId ?? "—"}
                      </p>
                    </div>

                    <div className={innerBoxClass}>
                      <p className={labelClass}>{t("browser")}</p>
                      <p className="mt-1 text-base font-medium leading-relaxed text-slate-900">
                        {uaShort || "—"}
                      </p>
                      {v.ip ? (
                        <p className="mt-2 text-sm text-slate-600">
                          <span className="font-semibold text-slate-700">
                            {t("ip")}:{" "}
                          </span>
                          <span className="font-mono text-slate-800">
                            {v.ip}
                          </span>
                        </p>
                      ) : null}
                      {v.userAgent && v.userAgent.length > 80 ? (
                        <details className="mt-3">
                          <summary className={summaryClass}>
                            {t("fullUa")}
                          </summary>
                          <p className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs leading-relaxed text-slate-700">
                            {v.userAgent}
                          </p>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!loading && items.length === 0 && !error && (
        <p
          className={
            isPanel
              ? "rounded-[22px] border border-dashed border-slate-200/90 bg-white/70 px-6 py-12 text-center text-sm text-slate-600 sm:text-base"
              : "rounded-2xl border-2 border-dashed border-ds-gray-border bg-ds-gray-light/30 px-6 py-12 text-center text-lg text-ds-gray-text"
          }
        >
          {t("empty")}
        </p>
      )}
    </div>
  );
}
