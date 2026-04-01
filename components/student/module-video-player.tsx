"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { resolvePublicFileUrl } from "@/lib/env";

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|#|$)/i.test(url);
}

function isYoutubeWatchUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")
    );
  } catch {
    return false;
  }
}

function youtubeEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

function VideoTagWithHls({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    if (isHlsUrl(src)) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (
        video.canPlayType("application/vnd.apple.mpegurl") ||
        video.canPlayType("application/x-mpegURL")
      ) {
        video.src = src;
      } else {
        video.src = src;
      }
    } else {
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={
        className ??
        "aspect-video w-full max-w-3xl rounded-ds-input bg-ds-black"
      }
      controls
      playsInline
      preload="metadata"
    >
      <track kind="captions" />
    </video>
  );
}

type Props = {
  src: string;
  className?: string;
};

/**
 * Воспроизведение: MP4/WebM — нативно; HLS (.m3u8) — `hls.js`;
 * YouTube — iframe. URL с бэка часто относительный — через `resolvePublicFileUrl`.
 */
export function ModuleVideoPlayer({ src, className }: Props) {
  const trimmed = src.trim();
  const resolved = resolvePublicFileUrl(trimmed) ?? trimmed;

  if (isYoutubeWatchUrl(resolved)) {
    const embed = youtubeEmbedSrc(resolved);
    if (embed) {
      return (
        <div
          className={`aspect-video w-full max-w-3xl overflow-hidden rounded-ds-input bg-ds-black ${className ?? ""}`}
        >
          <iframe
            title="Видео"
            src={embed}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }
  }

  return <VideoTagWithHls src={resolved} className={className} />;
}
