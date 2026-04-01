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
      <h1 className="ds-text-h1 mb-8 text-ds-black">{t("title")}</h1>
      {loading && (
        <p className="ds-text-body text-ds-gray-text">{tc("loading")}</p>
      )}
      {error && (
        <p className="ds-text-small text-ds-error mb-6" role="alert">
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
              className="flex flex-wrap items-center justify-between gap-4 rounded-ds-card border border-ds-gray-border bg-ds-white px-6 py-4"
            >
              <div>
                <p className="ds-text-subtitle text-ds-black">
                  {c.title ?? t("certFallback", { id: String(c.id) })}
                </p>
                {c.issuedAt && (
                  <p className="ds-text-caption text-ds-gray-text">
                    {String(c.issuedAt)}
                  </p>
                )}
              </div>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-btn ui-btn--1"
                >
                  {t("downloadPdf")}
                </a>
              ) : (
                <span className="ds-text-caption text-ds-gray-text">
                  {t("noUrlHint")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {!loading && !error && list.length === 0 && (
        <p className="ds-text-body text-ds-gray-text">{t("empty")}</p>
      )}
    </div>
  );
}
