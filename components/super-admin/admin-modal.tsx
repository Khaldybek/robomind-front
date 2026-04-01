"use client";

import { useEffect, type ReactNode } from "react";

export function AdminModal({
  open,
  title,
  onClose,
  wide,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Больше ширина для форм с несколькими полями */
  wide?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className={`relative z-10 max-h-[88dvh] w-full overflow-y-auto rounded-t-ds-card border border-ds-gray-border bg-ds-white p-5 shadow-xl sm:max-h-[90vh] sm:rounded-ds-card ${wide ? "max-w-xl" : "max-w-md"}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="admin-modal-title" className="ds-text-h3 text-ds-black">
            {title}
          </h2>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 ds-text-caption text-ds-gray-text hover:bg-[#F5F5F5] hover:text-ds-black"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
