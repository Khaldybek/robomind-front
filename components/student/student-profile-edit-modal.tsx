"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { patchUserMe } from "@/lib/api/student/user";
import { ApiRequestError } from "@/lib/api/types";

type StudentProfileEditModalProps = {
  open: boolean;
  onClose: () => void;
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
  onSaved: () => Promise<void>;
};

export function StudentProfileEditModal({
  open,
  onClose,
  initialFirstName,
  initialLastName,
  initialEmail,
  onSaved,
}: StudentProfileEditModalProps) {
  const t = useTranslations("StudentProfile");
  const tc = useTranslations("Common");
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setEmail(initialEmail);
    setError(null);
    setSaved(false);
  }, [open, initialFirstName, initialLastName, initialEmail]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await patchUserMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      setSaved(true);
      await onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError(t("errorSave"));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label={tc("close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
        className="relative z-[1] w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-900/15"
      >
        <h2
          id="profile-edit-title"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          {t("modalTitle")}
        </h2>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("lastName")}
            </label>
            <input
              className="ds-input w-full"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("firstName")}
            </label>
            <input
              className="ds-input w-full"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("email")}
            </label>
            <input
              type="email"
              className="ds-input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          {error && (
            <p className="text-sm text-ds-error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-sm text-emerald-700">{t("saved")}</p>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={onClose}
              disabled={busy}
            >
              {t("modalCancel")}
            </button>
            <button
              type="submit"
              className="ui-btn ui-btn--1 rounded-full px-5 py-2 text-sm"
              disabled={busy}
            >
              {busy ? "…" : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
