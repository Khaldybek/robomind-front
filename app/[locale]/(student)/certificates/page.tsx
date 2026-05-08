"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchCertificates,
  type CertificateItem,
} from "@/lib/api/student/user";
import { isApiConfigured } from "@/lib/env";

export default function CertificatesPage() {
  const t = useTranslations("StudentCertificates");
  const tc = useTranslations("Common");
  const [list, setList] = useState<CertificateItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured()) {
      setError(tc("apiEnvMissing"));
      setLoading(false);
      return;
    }
    fetchCertificates()
      .then(setList)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tc]);

  return (
    <div className="ds-container py-10 lg:py-14">
      <header className="mb-8 rounded-3xl border border-sky-200/55 bg-white/90 px-5 py-5 shadow-sm sm:px-7">
        <h1 className="text-balance text-2xl font-bold text-slate-900 sm:text-3xl">
          {t("title")}
        </h1>
      </header>
      {loading && (
        <p className="text-base text-slate-600">{tc("loading")}</p>
      )}
      {error && (
        <p className="mb-6 text-sm text-rose-600" role="alert">
          {error}
          {t("endpointHint")}
        </p>
      )}
      <ul className="space-y-4">
        {list.map((c) => {
          const href =
            c.downloadUrl ?? c.pdfUrl ?? (c.url as string) ?? "";
          return (
            <li
              key={String(c.id)}
              className="student-surface-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 sm:px-6"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {c.title ?? t("certFallback", { id: String(c.id) })}
                </p>
                {c.issuedAt && (
                  <p className="mt-1 text-xs text-slate-500">
                    {String(c.issuedAt)}
                  </p>
                )}
              </div>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/25 transition hover:bg-sky-700"
                >
                  {t("downloadPdf")}
                </a>
              ) : (
                <span className="text-xs text-slate-500">{t("noUrlHint")}</span>
              )}
            </li>
          );
        })}
      </ul>
      {!loading && !error && list.length === 0 && (
        <p className="text-base text-slate-600">{t("empty")}</p>
      )}
    </div>
  );
}
