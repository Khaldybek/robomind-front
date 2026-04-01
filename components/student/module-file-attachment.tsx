"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { resolvePublicFileUrl } from "@/lib/env";

function fileLabelFromPath(pathOrUrl: string): string {
  const s = pathOrUrl.trim();
  if (!s) return "Файл";
  try {
    const url = s.startsWith("http://") || s.startsWith("https://")
      ? new URL(s)
      : new URL(s, "http://placeholder.local");
    const seg = url.pathname.split("/").filter(Boolean).pop();
    if (seg) return decodeURIComponent(seg);
  } catch {
    /* fall through */
  }
  const parts = s.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return last ? decodeURIComponent(last) : "Файл";
}

function extensionOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return (m?.[1] ?? "").toLowerCase();
}

const PDF_EXT = new Set(["pdf"]);
const IMAGE_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
]);
const DOC_EXT = new Set(["doc", "docx", "odt", "rtf"]);
const SHEET_EXT = new Set(["xls", "xlsx", "ods", "csv"]);
const ARCHIVE_EXT = new Set(["zip", "rar", "7z", "tar", "gz"]);

function kindLabel(ext: string): string {
  if (PDF_EXT.has(ext)) return "PDF";
  if (IMAGE_EXT.has(ext)) return "Изображение";
  if (DOC_EXT.has(ext)) return "Документ";
  if (SHEET_EXT.has(ext)) return "Таблица";
  if (ARCHIVE_EXT.has(ext)) return "Архив";
  if (ext) return ext.toUpperCase();
  return "Файл";
}

type ViewerKind = "pdf" | "image" | "none";

function viewerKindForExt(ext: string): ViewerKind {
  if (PDF_EXT.has(ext)) return "pdf";
  if (IMAGE_EXT.has(ext)) return "image";
  return "none";
}

function FileTypeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="6"
        y="4"
        width="24"
        height="32"
        rx="3"
        className="fill-ds-gray-light stroke-ds-gray-border"
        strokeWidth="1.5"
      />
      <path
        d="M12 14h16M12 19h12M12 24h14"
        className="stroke-ds-gray-text"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22 4v8h8"
        className="stroke-ds-gray-border"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileViewerModal({
  open,
  title,
  resolvedUrl,
  viewerKind,
  label,
  onClose,
}: {
  open: boolean;
  title: string;
  resolvedUrl: string;
  viewerKind: ViewerKind;
  label: string;
  onClose: () => void;
}) {
  const titleId = useId();

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
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-ds-card border border-ds-gray-border bg-ds-white shadow-xl sm:max-h-[90vh] sm:rounded-ds-card"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ds-gray-border px-4 py-3 sm:px-5">
          <h2
            id={titleId}
            className="min-w-0 flex-1 ds-text-small font-semibold text-ds-black sm:ds-text-body"
          >
            <span className="line-clamp-2">{title}</span>
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={resolvedUrl}
              download={label}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn ui-btn--6 px-3 py-1.5 ds-text-caption"
            >
              Скачать
            </a>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 ds-text-caption text-ds-gray-text hover:bg-ds-gray-light hover:text-ds-black"
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-ds-gray-page/80 p-2 sm:p-4">
          {viewerKind === "pdf" ? (
            <iframe
              title={title}
              src={resolvedUrl}
              className="h-[min(78dvh,720px)] w-full rounded-md border border-ds-gray-border bg-ds-white sm:h-[min(75vh,680px)]"
            />
          ) : null}
          {viewerKind === "image" ? (
            <div className="flex min-h-[min(78dvh,720px)] items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedUrl}
                alt={title}
                className="max-h-[min(78dvh,720px)] max-w-full object-contain shadow-sm"
              />
            </div>
          ) : null}
          {viewerKind === "none" ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
              <FileTypeIcon className="h-16 w-16 opacity-80" />
              <p className="ds-text-body max-w-md text-ds-black">
                Предпросмотр этого типа файла в окне недоступен. Скачайте файл и
                откройте на устройстве.
              </p>
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-btn ui-btn--1"
              >
                Открыть в новой вкладке
              </a>
            </div>
          ) : null}
        </div>

        {(viewerKind === "pdf" || viewerKind === "image") && (
          <p className="shrink-0 border-t border-ds-gray-border px-4 py-2 ds-text-caption text-ds-gray-text sm:px-5">
            Если содержимое не отображается, нажмите «Скачать» или откройте файл
            в новой вкладке — так может требовать браузер или настройки сервера.
          </p>
        )}
      </div>
    </div>
  );
}

export type ModuleFileAttachmentProps = {
  /** Путь `/api/v1/files/...` или полный URL */
  fileUrl: string;
};

/**
 * Карточка вложения: имя файла, тип, «Открыть» в модальном окне на странице, «Скачать».
 */
export function ModuleFileAttachment({ fileUrl }: ModuleFileAttachmentProps) {
  const resolved = resolvePublicFileUrl(fileUrl) ?? fileUrl;
  const label = useMemo(() => fileLabelFromPath(fileUrl), [fileUrl]);
  const ext = extensionOf(label);
  const kind = kindLabel(ext);
  const viewerKind = viewerKindForExt(ext);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-4 rounded-ds-card border border-ds-gray-border bg-ds-gray-light/80 p-4 sm:flex-row sm:items-stretch">
        <div className="flex shrink-0 justify-center sm:justify-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-ds-gray-border bg-ds-white shadow-sm">
            <FileTypeIcon className="h-9 w-9" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="ds-text-small font-medium text-ds-black break-words">
            {label}
          </p>
          <p className="ds-text-caption mt-1 text-ds-gray-text">{kind}</p>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:justify-center">
          <button
            type="button"
            onClick={openModal}
            className="ui-btn ui-btn--1 inline-flex items-center justify-center px-4 py-2 text-center"
          >
            Открыть
          </button>
          <a
            href={resolved}
            download={label}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn--6 inline-flex items-center justify-center px-4 py-2 text-center"
          >
            Скачать
          </a>
        </div>
      </div>

      <FileViewerModal
        open={modalOpen}
        onClose={closeModal}
        title={label}
        resolvedUrl={resolved}
        viewerKind={viewerKind}
        label={label}
      />
    </div>
  );
}
