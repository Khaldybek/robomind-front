"use client";

import Image from "next/image";

/**
 * Декор: персонаж у нижнего правого угла карточки входа/регистрации (`public/child.png`).
 */
export function AuthCardMascot() {
  return (
    <div
      className="pointer-events-none absolute bottom-0 right-0 z-[1] w-[min(46%,220px)] translate-x-[12%] translate-y-[14%] sm:w-[min(38%,260px)] sm:translate-x-[18%] sm:translate-y-[10%]"
      aria-hidden
    >
      <Image
        src="/child.png"
        alt=""
        width={320}
        height={420}
        className="h-auto w-full select-none object-contain object-bottom drop-shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
        sizes="(max-width: 640px) 46vw, 260px"
      />
    </div>
  );
}
