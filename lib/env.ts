/**
 * URL API для клиентских запросов (браузер).
 * Формат: https://host/api/v1 (без слэша в конце).
 */
export function getPublicApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!base) {
    return "";
  }
  return base.replace(/\/$/, "");
}

export function isApiConfigured(): boolean {
  return Boolean(getPublicApiBaseUrl());
}

/**
 * Публичные файлы с бэка: путь вида `/api/v1/files/...` (статика через `express.static`).
 * Склеивать **нельзя** как `NEXT_PUBLIC_API_BASE_URL + path`, если база уже `…/api/v1`, а путь начинается с `/api/v1/…` — получится дублирование `/api/v1`.
 * Здесь: origin без суффикса `/api/v1` + полный путь → `https://host/api/v1/files/...`.
 * Для `<img>`, `<video>`, hls.js — нужен абсолютный URL; Bearer на статику не требуется (контракт бэка).
 */
export function resolvePublicFileUrl(
  pathOrUrl: string | null | undefined,
): string | undefined {
  if (!pathOrUrl?.trim()) return undefined;
  const s = pathOrUrl.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base = getPublicApiBaseUrl();
  if (!base) return s;
  if (s.startsWith("/")) {
    const origin = base.replace(/\/api\/v1\/?$/, "");
    return `${origin}${s}`;
  }
  return `${base}/${s.replace(/^\//, "")}`;
}
