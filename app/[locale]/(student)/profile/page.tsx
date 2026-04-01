"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchUserMe, patchUserMe } from "@/lib/api/student/user";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

export default function ProfilePage() {
  const t = useTranslations("StudentProfile");
  const tc = useTranslations("Common");
  const { refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    fetchUserMe()
      .then((u) => {
        if (!u) return;
        setFirstName(String(u.firstName ?? u.first_name ?? ""));
        setLastName(String(u.lastName ?? u.last_name ?? ""));
        setEmail(String(u.email ?? ""));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await patchUserMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      setSaved(true);
      await refreshProfile();
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError(t("errorSave"));
    }
  }

  return (
    <div className="ds-container max-w-xl py-10 lg:py-14">
      <h1 className="ds-text-h1 mb-8 text-ds-black">{t("title")}</h1>
      <p className="ds-text-caption mb-6 text-ds-gray-text">{t("lead")}</p>
      {loading && (
        <p className="ds-text-body text-ds-gray-text">{tc("loading")}</p>
      )}
      {!loading && (
        <form onSubmit={onSubmit} className="ds-block-section space-y-4">
          <div>
            <label className="ds-text-small mb-1 block">{t("lastName")}</label>
            <input
              className="ds-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label className="ds-text-small mb-1 block">{t("firstName")}</label>
            <input
              className="ds-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="ds-text-small mb-1 block">{t("email")}</label>
            <input
              type="email"
              className="ds-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <p className="ds-text-small text-ds-error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="ds-text-small text-ds-black">{t("saved")}</p>
          )}
          <button type="submit" className="ui-btn ui-btn--1">
            {t("save")}
          </button>
        </form>
      )}
    </div>
  );
}
