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
}: {
  variant: "school" | "super";
  items: DeviceViolationRowLike[];
  loading?: boolean;
  error?: string | null;
}) {
  const t = useTranslations("AdminDeviceViolations");
  const tc = useTranslations("Common");
  const locale = useLocale();

  const userBase =
    variant === "school" ? "/school-admin/users" : "/super-admin/users";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ds-black sm:text-3xl">
          {variant === "school" ? t("titleSchool") : t("titleSuper")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ds-gray-dark-2 sm:text-lg">
          {variant === "school" ? t("leadSchool") : t("leadSuper")}
        </p>
      </header>

      {loading && (
        <p className="text-base text-ds-gray-text">{tc("loading")}</p>
      )}

      {error && (
        <p
          className="mb-6 rounded-xl border-2 border-ds-error/25 bg-red-50 px-4 py-3 text-base text-ds-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-6">
        {items.map((v) => {
          const when = formatViolationWhen(v.createdAt, locale);
          const uaShort = formatLocalizedUaSummary(v.userAgent, t);
          const st = v.student
            ? violationStudentDisplay(v.student)
            : null;

          return (
            <li
              key={v.id}
              className="overflow-hidden rounded-2xl border-2 border-ds-gray-border bg-ds-white shadow-sm"
            >
              <div className="grid gap-0 sm:grid-cols-[minmax(140px,200px)_1fr]">
                <div className="border-b border-ds-gray-border bg-ds-gray-light/60 px-5 py-4 sm:border-b-0 sm:border-r">
                  <p className="text-xs font-bold uppercase tracking-wide text-ds-gray-text">
                    {t("when")}
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-snug text-ds-black">
                    {when}
                  </p>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                  {v.student && st ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-ds-gray-text">
                        {t("student")}
                      </p>
                      <Link
                        href={`${userBase}/${encodeURIComponent(v.student.id)}`}
                        className="mt-2 inline-block text-xl font-semibold text-ds-primary hover:underline"
                      >
                        {st.primary}
                      </Link>
                      {st.secondary ? (
                        <p className="mt-1 text-base text-ds-gray-dark-2">
                          {st.secondary}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-1">
                    <div className="rounded-xl bg-ds-gray-light/50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-ds-gray-text">
                        {t("deviceId")}
                      </p>
                      <p className="mt-1 break-all font-mono text-sm leading-relaxed text-ds-black sm:text-base">
                        {v.attemptedDeviceId ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-ds-gray-light/50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-ds-gray-text">
                        {t("browser")}
                      </p>
                      <p className="mt-1 text-base font-medium leading-relaxed text-ds-black">
                        {uaShort || "—"}
                      </p>
                      {v.ip ? (
                        <p className="mt-2 text-sm text-ds-gray-text">
                          <span className="font-semibold text-ds-gray-dark-2">
                            {t("ip")}:{" "}
                          </span>
                          <span className="font-mono">{v.ip}</span>
                        </p>
                      ) : null}
                      {v.userAgent && v.userAgent.length > 80 ? (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-semibold text-ds-primary">
                            {t("fullUa")}
                          </summary>
                          <p className="mt-2 max-h-40 overflow-auto rounded-lg bg-white p-3 font-mono text-xs leading-relaxed text-ds-gray-dark-2">
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
        <p className="rounded-2xl border-2 border-dashed border-ds-gray-border bg-ds-gray-light/30 px-6 py-12 text-center text-lg text-ds-gray-text">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
