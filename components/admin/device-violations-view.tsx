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

  const labelSuper =
    "text-[11px] font-semibold uppercase tracking-wide text-ds-gray-text";

  return (
    <div className={outerClass}>
      {showBuiltInHeader ? (
        <header
          className={
            isPanel ? "mb-8" : "mb-5 border-b border-ds-gray-border pb-5"
          }
        >
          <h1
            className={
              isPanel
                ? "text-2xl font-bold tracking-tight text-ds-black sm:text-3xl"
                : "ds-text-h2 text-ds-black"
            }
          >
            {variant === "school" ? t("titleSchool") : t("titleSuper")}
          </h1>
          <p
            className={
              isPanel
                ? "mt-3 text-base leading-relaxed text-ds-gray-dark-2 sm:text-lg"
                : "mt-2 max-w-2xl ds-text-caption leading-relaxed text-ds-gray-text"
            }
          >
            {variant === "school" ? t("leadSchool") : t("leadSuper")}
          </p>
        </header>
      ) : null}

      {loading && (
        <p
          className={
            isPanel
              ? "text-sm text-slate-600"
              : "ds-text-caption text-ds-gray-text"
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
              : "mb-4 rounded-lg border border-ds-error/25 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error"
          }
          role="alert"
        >
          {error}
        </p>
      )}

      <ul className={isPanel ? "flex flex-col gap-4" : "flex flex-col gap-3"}>
        {items.map((v, idx) => {
          const when = formatViolationWhen(v.createdAt, locale);
          const uaShort = formatLocalizedUaSummary(v.userAgent, t);
          const st = v.student
            ? violationStudentDisplay(v.student)
            : null;

          if (!isPanel) {
            return (
              <li
                key={v.id}
                className="rounded-lg border border-ds-gray-border bg-ds-white p-3 shadow-sm sm:p-4"
              >
                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:items-start sm:gap-x-4">
                  <div className="shrink-0 border-b border-ds-gray-border pb-2 sm:border-0 sm:border-r sm:pb-0 sm:pr-4">
                    <p className={labelSuper}>{t("when")}</p>
                    <p className="mt-0.5 text-sm font-medium leading-snug text-ds-black">
                      {when}
                    </p>
                  </div>

                  <div className="min-w-0 space-y-2.5">
                    {v.student && st ? (
                      <div>
                        <p className={labelSuper}>{t("student")}</p>
                        <Link
                          href={`${userBase}/${encodeURIComponent(v.student.id)}`}
                          className="mt-0.5 inline-block text-sm font-semibold text-ds-primary hover:underline"
                        >
                          {st.primary}
                        </Link>
                        {st.secondary ? (
                          <p className="mt-0.5 truncate text-xs text-ds-gray-dark-2">
                            {st.secondary}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-md border border-ds-gray-border bg-ds-gray-light/50 px-2.5 py-2">
                      <dl className="space-y-2 text-xs">
                        <div>
                          <dt className={labelSuper}>{t("deviceId")}</dt>
                          <dd className="mt-0.5 break-all font-mono text-[11px] leading-relaxed text-ds-black">
                            {v.attemptedDeviceId ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className={labelSuper}>{t("browser")}</dt>
                          <dd className="mt-0.5 text-xs font-medium leading-snug text-ds-black">
                            {uaShort || "—"}
                          </dd>
                        </div>
                        {v.ip ? (
                          <div>
                            <dt className={labelSuper}>{t("ip")}</dt>
                            <dd className="mt-0.5 font-mono text-[11px] text-ds-black">
                              {v.ip}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                      {v.userAgent && v.userAgent.length > 80 ? (
                        <details className="mt-2 border-t border-ds-gray-border pt-2">
                          <summary className="cursor-pointer text-xs font-semibold text-ds-primary hover:underline">
                            {t("fullUa")}
                          </summary>
                          <p className="mt-1.5 max-h-28 overflow-auto rounded border border-ds-gray-border bg-ds-white p-2 font-mono text-[10px] leading-relaxed text-ds-gray-dark-2">
                            {v.userAgent}
                          </p>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          }

          const cardClass = "sa-card sa-card-in overflow-hidden";
          const whenColClass =
            "border-b border-slate-200/90 bg-slate-50/50 px-5 py-4 sm:border-b-0 sm:border-r sm:border-slate-200/90";
          const labelClass =
            "text-xs font-semibold uppercase tracking-wide text-slate-500";
          const whenTextClass =
            "mt-2 text-lg font-semibold leading-snug text-slate-900";
          const linkClass =
            "mt-2 inline-block text-lg font-semibold text-sky-700 hover:text-sky-900 hover:underline sm:text-xl";
          const innerBoxClass =
            "rounded-xl border border-slate-100 bg-white/90 px-4 py-3 shadow-sm shadow-slate-900/[0.02]";
          const summaryClass =
            "cursor-pointer text-sm font-semibold text-sky-700 hover:text-sky-900";

          return (
            <li
              key={v.id}
              className={cardClass}
              style={{ animationDelay: `${Math.min(idx * 60, 420)}ms` }}
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
                        <p className="mt-1 text-sm text-slate-600 sm:text-base">
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
              : "rounded-lg border border-dashed border-ds-gray-border bg-ds-gray-light/30 px-4 py-8 text-center ds-text-caption text-ds-gray-text"
          }
        >
          {t("empty")}
        </p>
      )}
    </div>
  );
}
