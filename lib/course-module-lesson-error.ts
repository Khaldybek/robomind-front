import { ApiRequestError } from "@/lib/api/types";

export type ModuleLessonLoadErrorKind = "locked" | "generic";

export type ModuleLessonLoadError = {
  message: string;
  kind: ModuleLessonLoadErrorKind;
};

/**
 * Ошибка загрузки уроков модуля: «замок» (нет доступа / сначала другой модуль) или общая.
 */
export function classifyModuleLessonLoadError(
  e: unknown,
): ModuleLessonLoadError {
  const message =
    e instanceof Error ? e.message : typeof e === "string" ? e : String(e);
  let kind: ModuleLessonLoadErrorKind = "generic";

  if (e instanceof ApiRequestError) {
    if (e.status === 403 || e.status === 423 || e.status === 409) {
      kind = "locked";
    }
  }

  if (kind === "generic") {
    const m = message.toLowerCase();
    if (
      /предыдущ|завершите|недоступ|доступ\s+запрещ|нет\s+доступ|unlock|locked|forbidden/i.test(
        message,
      ) ||
      /complete\s+the\s+previous/i.test(m) ||
      /сначала\s+заверш/i.test(m)
    ) {
      kind = "locked";
    }
  }

  return { message, kind };
}
