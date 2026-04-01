"use client";

import { useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  importSchoolUsersFromXlsx,
  SCHOOL_USERS_IMPORT_MAX_BYTES,
  type SchoolUsersImportCreatedRow,
  type SchoolUsersImportResponse,
} from "@/lib/api/school-admin/users";
import { isApiConfigured } from "@/lib/env";

function formatFio(row: {
  lastName?: string;
  firstName?: string;
  patronymic?: string | null;
}): string {
  const p = [row.lastName, row.firstName, row.patronymic].filter(
    (x) => x != null && String(x).trim() !== "",
  );
  return p.length ? p.join(" ") : "—";
}

function PasswordCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex max-w-[220px] flex-col gap-1 sm:max-w-none sm:flex-row sm:items-center sm:gap-2">
      <code className="block truncate rounded bg-ds-gray-light/80 px-1.5 py-0.5 font-mono text-xs text-ds-black">
        {value}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        className="shrink-0 text-left text-xs font-medium text-ds-primary hover:underline"
      >
        {copied ? "Скопировано" : "Копировать"}
      </button>
    </div>
  );
}

export function SchoolUsersImportPanel({
  onImported,
}: {
  onImported?: () => void;
}) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SchoolUsersImportResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isApiConfigured()) {
      setError("Задайте NEXT_PUBLIC_API_BASE_URL");
      return;
    }
    if (!file) {
      setError("Выберите файл .xlsx");
      return;
    }
    setPending(true);
    try {
      const r = await importSchoolUsersFromXlsx(file);
      setResult(r);
      onImported?.();
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Ошибка импорта");
    } finally {
      setPending(false);
    }
  }

  function onFileChange(list: FileList | null) {
    setError(null);
    setResult(null);
    const f = list?.[0] ?? null;
    setFile(f);
  }

  const mb = (SCHOOL_USERS_IMPORT_MAX_BYTES / (1024 * 1024)).toFixed(0);

  return (
    <section className="mb-8 rounded-[var(--radius-ds-section)] border border-ds-primary/25 bg-white/90 p-5 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:p-6">
      <h2 className="ds-text-subtitle text-ds-black">Импорт из Excel</h2>
      <p className="mt-2 text-sm leading-relaxed text-ds-gray-text">
        Загрузите таблицу{" "}
        <strong className="font-medium text-ds-black">.xlsx</strong> (первый
        лист, строка 1 — заголовки, данные со 2-й). Поле формы:{" "}
        <code className="rounded bg-ds-gray-light/90 px-1 font-mono text-xs">
          file
        </code>
        . Максимум {mb} МБ, не больше 500 строк с данными. Пароли генерирует
        сервер и показывается <strong className="font-medium">один раз</strong>{" "}
        в таблице ниже.
      </p>
      <details className="mt-3 rounded-xl border border-ds-gray-border/80 bg-ds-gray-light/40 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-ds-black">
          Обязательные колонки и примеры заголовков
        </summary>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ds-gray-text">
          <li>
            <strong className="text-ds-black">ИИН</strong> — заголовок{" "}
            <code className="text-xs">ИИН</code> или <code className="text-xs">iin</code>{" "}
            (лучше формат ячейки «Текст», 12 цифр).
          </li>
          <li>
            Email — <code className="text-xs">email</code>,{" "}
            <code className="text-xs">почта</code>, <code className="text-xs">mail</code>…
          </li>
          <li>
            Имя / Фамилия — <code className="text-xs">Имя</code>,{" "}
            <code className="text-xs">firstName</code>,{" "}
            <code className="text-xs">Фамилия</code>,{" "}
            <code className="text-xs">lastName</code>…
          </li>
          <li>
            Отчество — по желанию:{" "}
            <code className="text-xs">Отчество</code>,{" "}
            <code className="text-xs">patronymic</code>…
          </li>
        </ul>
      </details>

      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={inputId} className="ds-text-caption text-ds-gray-text">
            Файл .xlsx
          </label>
          <input
            id={inputId}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="ds-input mt-1 block max-w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ds-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            onChange={(e) => onFileChange(e.target.files)}
          />
        </div>
        <button
          type="submit"
          disabled={pending || !file}
          className="ui-btn ui-btn--1"
        >
          {pending ? "Загрузка…" : "Импортировать"}
        </button>
        {file ? (
          <span className="ds-text-caption text-ds-gray-text">
            {(file.size / 1024).toFixed(1)} КБ
          </span>
        ) : null}
      </form>

      {error ? (
        <p className="mt-3 text-sm text-ds-error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <ImportResultBlock data={result} />
      ) : null}
    </section>
  );
}

function ImportResultBlock({ data }: { data: SchoolUsersImportResponse }) {
  const { summary, created, errors } = data;

  return (
    <div className="mt-6 space-y-6 border-t border-ds-gray-border/70 pt-6">
      <div className="rounded-xl border border-ds-gray-border/80 bg-ds-gray-light/30 px-4 py-3">
        <p className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
          Итог
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ds-black">
          <li>
            Строк с данными: <strong>{summary.totalRows}</strong>
          </li>
          <li>
            Создано аккаунтов:{" "}
            <strong className="text-ds-primary">{summary.created}</strong>
          </li>
          <li>
            Ошибок:{" "}
            <strong className={summary.failed > 0 ? "text-ds-error" : ""}>
              {summary.failed}
            </strong>
          </li>
        </ul>
        {created.length > 0 ? (
          <p className="mt-3 text-xs leading-relaxed text-ds-error">
            Сохраните временные пароли или передайте их ученикам по защищённому
            каналу — повторно они в интерфейсе не отобразятся.
          </p>
        ) : null}
      </div>

      {created.length > 0 ? (
        <div>
          <h3 className="ds-text-body font-semibold text-ds-black">
            Созданные учётные записи
          </h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-ds-gray-border">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ds-gray-border bg-white/90">
                  <th className="px-3 py-2 font-medium">Строка</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">ИИН</th>
                  <th className="px-3 py-2 font-medium">ФИО</th>
                  <th className="px-3 py-2 font-medium">Временный пароль</th>
                  <th className="px-3 py-2 font-medium">Профиль</th>
                </tr>
              </thead>
              <tbody>
                {created.map((row) => (
                  <CreatedRow key={`${row.sheetRow}-${row.id}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div>
          <h3 className="ds-text-body font-semibold text-ds-black">
            Строки с ошибками
          </h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-ds-error/30">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ds-gray-border bg-white/90">
                  <th className="px-3 py-2 font-medium">Строка</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">ИИН</th>
                  <th className="px-3 py-2 font-medium">Причина</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((row, i) => (
                  <tr
                    key={`${row.sheetRow}-${i}`}
                    className="border-b border-ds-gray-border/60 last:border-0"
                  >
                    <td className="px-3 py-2 align-top">{row.sheetRow}</td>
                    <td className="px-3 py-2 align-top text-ds-gray-text">
                      {row.email ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-xs text-ds-gray-text">
                      {row.iin ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-ds-error">
                      {row.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CreatedRow({ row }: { row: SchoolUsersImportCreatedRow }) {
  return (
    <tr className="border-b border-ds-gray-border/60 last:border-0">
      <td className="px-3 py-2 align-top">{row.sheetRow}</td>
      <td className="px-3 py-2 align-top">{row.email}</td>
      <td className="px-3 py-2 align-top font-mono text-xs">{row.iin}</td>
      <td className="px-3 py-2 align-top">{formatFio(row)}</td>
      <td className="px-3 py-2 align-top">
        <PasswordCell value={row.temporaryPassword} />
      </td>
      <td className="px-3 py-2 align-top">
        <Link
          href={`/school-admin/users/${encodeURIComponent(row.id)}`}
          className="font-medium text-ds-primary hover:underline"
        >
          Открыть
        </Link>
      </td>
    </tr>
  );
}
