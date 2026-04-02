"use client";

import type { LucideIcon } from "lucide-react";
import {
  File,
  FileText,
  Link2,
  Play,
  Radio,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ModuleContentItem } from "@/lib/api/student/modules";

function iconForLessonType(type: string | undefined): LucideIcon {
  switch ((type ?? "").toLowerCase()) {
    case "video":
      return Play;
    case "file":
      return File;
    case "text":
      return FileText;
    case "livestream":
      return Radio;
    case "link":
      return Link2;
    default:
      return FileText;
  }
}

type ModuleLessonListProps = {
  items: ModuleContentItem[];
  moduleHref: string;
  labelFallback: string;
  /** Локализованная подпись типа (видео, текст…) или `undefined`, чтобы скрыть строку */
  formatLessonType?: (type: string | undefined) => string | undefined;
};

export function ModuleLessonList({
  items,
  moduleHref,
  labelFallback,
  formatLessonType,
}: ModuleLessonListProps) {
  return (
    <ul className="space-y-2">
      {items.map((item, li) => {
        const step = li + 1;
        const label = item.title ?? item.type ?? labelFallback;
        const hash = `content-${encodeURIComponent(item.id)}`;
        const Icon = iconForLessonType(item.type);
        const typeLine = formatLessonType?.(item.type);

        return (
          <li key={item.id}>
            <Link
              href={`${moduleHref}#${hash}`}
              className="group flex items-stretch gap-3 overflow-hidden rounded-xl border border-ds-gray-border/80 bg-white/95 px-3 py-2.5 shadow-sm transition-all hover:border-ds-primary/45 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
            >
              <span className="flex w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-ds-gray-light/90 text-ds-gray-text transition-colors group-hover:bg-ds-primary/10 group-hover:text-ds-primary">
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-ds-gray-text">
                    {step}
                  </span>
                  <span className="ds-text-body font-medium leading-snug text-ds-black group-hover:text-ds-primary">
                    {label}
                  </span>
                </span>
                {typeLine ? (
                  <span className="mt-0.5 block text-[11px] font-medium text-ds-gray-text">
                    {typeLine}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
