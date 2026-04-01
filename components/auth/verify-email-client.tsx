"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { verifyEmailWithToken } from "@/lib/api/student/auth";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

export function VerifyEmailClient() {
  const t = useTranslations("StudentVerifyEmail");
  const tc = useTranslations("Common");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage(t("noToken"));
      return;
    }
    if (!isApiConfigured()) {
      setStatus("err");
      setMessage(tc("apiEnvMissing"));
      return;
    }
    let cancelled = false;
    verifyEmailWithToken(token)
      .then(() => {
        if (!cancelled) {
          setStatus("ok");
          setMessage(t("success"));
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("err");
        if (err instanceof ApiRequestError) setMessage(err.message);
        else setMessage(t("errorGeneric"));
      });
    return () => {
      cancelled = true;
    };
  }, [token, t, tc]);

  return (
    <div className="mx-auto max-w-md rounded-ds-card border border-ds-gray-border bg-ds-white p-8 text-center shadow-sm">
      <h1 className="ds-text-h2 mb-4 text-ds-black">{t("title")}</h1>
      {status === "idle" && (
        <p className="ds-text-body text-ds-gray-text">{t("checking")}</p>
      )}
      {status === "ok" && (
        <p className="ds-text-body text-ds-black">{message}</p>
      )}
      {status === "err" && (
        <p className="ds-text-small text-ds-error" role="alert">
          {message}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/pending-activation" className="ui-btn ui-btn--4">
          {t("accountStatus")}
        </Link>
        <Link href="/login" className="ui-btn ui-btn--2">
          {t("login")}
        </Link>
      </div>
    </div>
  );
}
