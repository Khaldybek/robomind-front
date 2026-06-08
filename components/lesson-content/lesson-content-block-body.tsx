"use client";

import { ModuleFileAttachment } from "@/components/student/module-file-attachment";
import { ModuleVideoPlayer } from "@/components/student/module-video-player";
import { resolvePublicFileUrl } from "@/lib/env";

export type LessonContentBlockLike = {
  type: string;
  content?: string | null;
  fileUrl?: string | null;
  livestreamUrl?: string | null;
  livestreamStartsAt?: string | null;
};

function looksLikeVideoUrl(s: string): boolean {
  const x = s.trim().toLowerCase();
  if (!x) return false;
  if (/youtube\.com|youtu\.be/.test(x)) return true;
  return /\.(mp4|webm|ogg|mov|m3u8)(\?|#|$)/i.test(x) || /\.m3u8/i.test(x);
}

function videoSourceRaw(item: LessonContentBlockLike): string | null {
  const c = (item.content ?? "").trim();
  const f = (item.fileUrl ?? "").trim();

  if (item.type === "video" && f) {
    return f;
  }
  if (f && (looksLikeVideoUrl(f) || f.startsWith("/api/v1/files/"))) {
    return f;
  }
  if (c && looksLikeVideoUrl(c)) {
    return c;
  }
  return f || c || null;
}

function shouldShowVideoPlayer(item: LessonContentBlockLike): boolean {
  const raw = videoSourceRaw(item);
  if (!raw) return false;
  if (item.type === "video") return true;
  return looksLikeVideoUrl(raw);
}

const proseHtml =
  "w-full max-w-none text-ds-black [&_a]:font-semibold [&_a]:text-ds-primary [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6";

function TextContent({ content }: { content: string }) {
  const trimmed = content.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("<")) {
    return (
      <div
        className={`${proseHtml} ds-text-body leading-relaxed`}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  return (
    <p className="ds-text-body w-full max-w-none whitespace-pre-wrap leading-relaxed text-ds-black">
      {trimmed}
    </p>
  );
}

export function LessonContentBlockBody({
  block,
  labels,
}: {
  block: LessonContentBlockLike;
  labels?: {
    fileMissing?: string;
    openLink?: string;
    livestream?: string;
    downloadFile?: string;
  };
}) {
  const rawVideo = videoSourceRaw(block);
  const showVideo = shouldShowVideoPlayer(block) && rawVideo;
  const content = block.content?.trim() ?? "";
  const fileUrl = block.fileUrl?.trim() ?? "";

  if (showVideo && rawVideo) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-ds-input bg-ds-black">
          <ModuleVideoPlayer
            src={rawVideo}
            className="aspect-video w-full max-w-none rounded-none"
          />
        </div>
        {block.type === "video" &&
          content &&
          (!looksLikeVideoUrl(content) || content.startsWith("<")) && (
            <TextContent content={content} />
          )}
      </div>
    );
  }

  if (block.type === "file") {
    return (
      <div className="space-y-4">
        {content ? <TextContent content={content} /> : null}
        {fileUrl ? (
          <ModuleFileAttachment fileUrl={fileUrl} />
        ) : (
          <p className="ds-text-caption text-ds-gray-text">
            {labels?.fileMissing ?? "Файл не прикреплён"}
          </p>
        )}
      </div>
    );
  }

  if (block.type === "image" && fileUrl) {
    const resolved = resolvePublicFileUrl(fileUrl) ?? fileUrl;
    return (
      <div className="space-y-4">
        {content ? <TextContent content={content} /> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved}
          alt={content || block.type}
          className="max-h-[min(70vh,640px)] max-w-full rounded-ds-input border border-ds-gray-border object-contain"
        />
      </div>
    );
  }

  if (block.type === "text" || block.type == null) {
    if (content) return <TextContent content={content} />;
    return null;
  }

  if (block.type === "link" || (content && content.startsWith("http"))) {
    const href = content || fileUrl;
    if (!href) return null;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="ui-btn ui-btn--6 inline-flex"
      >
        {labels?.openLink ?? "Открыть ссылку"}
      </a>
    );
  }

  if (block.type === "livestream" || block.livestreamUrl) {
    return (
      <p className="ds-text-body text-ds-gray-dark-2">
        <span className="font-semibold text-ds-black">
          {labels?.livestream ?? "Эфир"}
        </span>{" "}
        {String(block.livestreamStartsAt ?? "—")}
        {block.livestreamUrl ? (
          <>
            {" · "}
            <a
              href={block.livestreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium text-ds-primary underline"
            >
              {block.livestreamUrl}
            </a>
          </>
        ) : null}
      </p>
    );
  }

  if (content) {
    return <TextContent content={content} />;
  }

  if (fileUrl) {
    const resolved = resolvePublicFileUrl(fileUrl) ?? fileUrl;
    if (looksLikeVideoUrl(fileUrl)) {
      return (
        <div className="overflow-hidden rounded-ds-input bg-ds-black">
          <ModuleVideoPlayer
            src={fileUrl}
            className="aspect-video w-full max-w-none rounded-none"
          />
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <ModuleFileAttachment fileUrl={fileUrl} />
        <a
          href={resolved}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-btn ui-btn--6 inline-flex ds-text-caption"
        >
          {labels?.downloadFile ?? "Скачать"}
        </a>
      </div>
    );
  }

  return null;
}
