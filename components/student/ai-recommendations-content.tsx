"use client";

import { useTranslations } from "next-intl";

/** Человекочитаемый вывод ответа ИИ-рекомендаций (без сырого JSON в основном виде). */
export function AiRecommendationsContent({ data }: { data: unknown }) {
  const t = useTranslations("StudentDashboard");
  if (data == null) return null;
  if (typeof data === "string") {
    return (
      <p className="ds-text-body whitespace-pre-wrap text-ds-black">{data}</p>
    );
  }
  if (typeof data !== "object" || data === null) {
    return (
      <p className="ds-text-caption text-ds-gray-text">{t("aiNoFormat")}</p>
    );
  }
  const o = data as Record<string, unknown>;
  const summary = o.summary;
  const weak = o.weakTopics;
  const materials = o.suggestedMaterials;
  const repeat =
    o.repeatLessonIds ??
    o.repeatModuleIds ??
    (o as Record<string, unknown>).repeat_lesson_ids;
  const hasStructured =
    (typeof summary === "string" && summary.trim()) ||
    (Array.isArray(weak) && weak.length > 0) ||
    (Array.isArray(materials) && materials.length > 0) ||
    (Array.isArray(repeat) && repeat.length > 0);

  if (!hasStructured) {
    return (
      <details className="rounded-lg border border-ds-gray-border bg-ds-gray-light/40 p-3">
        <summary className="cursor-pointer ds-text-caption text-ds-gray-text">
          {t("aiTechSummary")}
        </summary>
        <pre className="mt-2 max-h-40 overflow-auto ds-text-caption text-ds-black">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    );
  }

  return (
    <div className="space-y-4">
      {typeof summary === "string" && summary.trim() ? (
        <p className="ds-text-body leading-relaxed text-slate-800">{summary}</p>
      ) : null}
      {Array.isArray(weak) && weak.length > 0 ? (
        <div>
          <p className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
            {t("aiTopicsTitle")}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 ds-text-body text-ds-black">
            {weak.map((topic, i) => (
              <li key={i}>{String(topic)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {Array.isArray(materials) && materials.length > 0 ? (
        <div>
          <p className="ds-text-caption font-medium uppercase tracking-wide text-ds-gray-text">
            {t("aiMaterialsTitle")}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 ds-text-body text-ds-black">
            {materials.map((item, i) => (
              <li key={i}>{String(item)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {Array.isArray(repeat) && repeat.length > 0 ? (
        <p className="ds-text-caption text-ds-gray-text">
          {t("aiRepeatPrefix")}{" "}
          {repeat.map((id) => String(id)).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
