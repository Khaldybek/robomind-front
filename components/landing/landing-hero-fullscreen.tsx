"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react";

/**
 * Фоны героя: лента сдвигается влево — кадр уходит влево, следующий въезжает справа.
 * При 2+ кадрах в конец добавляется клон первого для цикла без «отмотки» назад.
 */
const HERO_SLIDES = [
  "/landing/hero-main.png",
  "/landing/img.png",
    "/landing/img_1.png",
] as const;

const INTERVAL_MS = 7000;
const SLIDE_MS = 1100;

const ROBOT_FALLBACK = "/student/hero-robot.svg" as const;

export function LandingHeroFullscreen({
  alt,
  children,
}: {
  alt: string;
  children: ReactNode;
}) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [instant, setInstant] = useState(false);
  const indexRef = useRef(0);

  const slides = useMemo(() => {
    const ok = HERO_SLIDES.filter((s) => !failed.has(s));
    if (ok.length > 0) return ok;
    return [ROBOT_FALLBACK];
  }, [failed]);

  const trackSlides = useMemo(() => {
    if (slides.length < 2 || reducedMotion) return slides;
    return [...slides, slides[0]];
  }, [slides, reducedMotion]);

  const markFailed = useCallback((src: string) => {
    setFailed((prev) => new Set(prev).add(src));
  }, []);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setIndex((i) =>
      trackSlides.length === 0 ? 0 : Math.min(i, trackSlides.length - 1),
    );
  }, [trackSlides.length]);

  useEffect(() => {
    if (reducedMotion || slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => {
        if (trackSlides.length < 2) return i;
        if (i >= trackSlides.length - 1) return i;
        return i + 1;
      });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, slides.length, trackSlides.length]);

  const onTrackTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return;
      if (reducedMotion || slides.length < 2) return;
      const last = trackSlides.length - 1;
      if (indexRef.current !== last) return;
      setInstant(true);
      setIndex(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setInstant(false));
      });
    },
    [reducedMotion, slides.length, trackSlides.length],
  );

  const n = trackSlides.length;
  const pctPerSlide = n > 0 ? 100 / n : 100;
  const translatePct = n > 0 ? -(index * pctPerSlide) : 0;

  return (
    <section
      id="landing-hero"
      className="relative min-h-[100dvh] w-full overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="flex h-full ease-in-out will-change-transform motion-reduce:transition-none"
          style={{
            width: n > 0 ? `${n * 100}%` : "100%",
            transform: `translate3d(${translatePct}%,0,0)`,
            transitionDuration:
              reducedMotion || instant ? "0ms" : `${SLIDE_MS}ms`,
            transitionProperty: "transform",
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {trackSlides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative h-full shrink-0"
              style={{ width: `${pctPerSlide}%` }}
            >
              <Image
                src={src}
                alt={i === index || slides.length === 1 ? alt : ""}
                fill
                className="object-cover object-[center_30%] brightness-[1.05] contrast-[1.07] saturate-[1.12]"
                sizes="100vw"
                priority={i === 0}
                onError={() => {
                  if (src !== ROBOT_FALLBACK) markFailed(src);
                }}
                aria-hidden={slides.length > 1 && i !== index}
              />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0 z-[2] bg-gradient-to-b from-slate-950/40 via-slate-900/22 to-slate-950/48"
          aria-hidden
        />
      </div>
      <div className="relative z-[3] flex min-h-[100dvh] flex-col">{children}</div>
    </section>
  );
}
