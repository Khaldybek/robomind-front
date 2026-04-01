"use client";

import { useState } from "react";
import { uploadSuperVideo, uploadSuperFile } from "@/lib/api/super-admin/upload";
import { isApiConfigured } from "@/lib/env";

export default function Page() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="ds-text-h2 text-ds-black">Загрузки</h1>
        <p className="mt-2 ds-text-caption text-ds-gray-text">
          Загрузка медиа в хранилище платформы.
        </p>
      </header>
      <p className="rounded-lg border border-ds-gray-border bg-ds-white px-3 py-2 ds-text-caption text-ds-gray-text">
        Используются <code className="text-ds-black">POST /admin/upload/video</code>{" "}
        и <code className="text-ds-black">POST /admin/upload/file</code> (поле
        файла обычно <code className="text-ds-black">file</code>).
      </p>
      {err && (
        <p className="rounded-lg border border-ds-error/30 bg-[#FFF5F5] px-3 py-2 ds-text-small text-ds-error">
          {err}
        </p>
      )}
      {out && (
        <pre className="max-h-64 overflow-auto rounded-lg border border-ds-gray-border bg-ds-gray-light p-4 ds-text-caption">
          {out}
        </pre>
      )}

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">Видео</h2>
        <input
          type="file"
          accept="video/*"
          className="mt-3 block w-full ds-text-caption"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="mt-4 ui-btn ui-btn--1"
          disabled={!videoFile}
          onClick={() => {
            if (!videoFile || !isApiConfigured()) return;
            setErr("");
            uploadSuperVideo(videoFile)
              .then((r) => setOut(JSON.stringify(r, null, 2)))
              .catch((e) => setErr(String(e)));
          }}
        >
          Загрузить видео
        </button>
      </section>

      <section className="rounded-ds-card border border-ds-gray-border bg-ds-white p-5 sm:p-6">
        <h2 className="ds-text-h3 text-ds-black">Файл (PDF / архив)</h2>
        <input
          type="file"
          className="mt-3 block w-full ds-text-caption"
          onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="mt-4 ui-btn ui-btn--1"
          disabled={!docFile}
          onClick={() => {
            if (!docFile || !isApiConfigured()) return;
            setErr("");
            uploadSuperFile(docFile)
              .then((r) => setOut(JSON.stringify(r, null, 2)))
              .catch((e) => setErr(String(e)));
          }}
        >
          Загрузить файл
        </button>
      </section>
    </div>
  );
}
