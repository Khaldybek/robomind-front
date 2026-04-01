type LandingAnimatedBoardProps = {
  alt: string;
  variant?: "hero" | "card";
  theme?: "circuit" | "mechanics" | "launch";
};

/**
 * Унифицированная анимированная "панель обучения" для лендинга.
 * Используется в блоке "Как это работает" и как fallback в карточках курсов.
 */
export function LandingAnimatedBoard({
  alt,
  variant = "hero",
  theme = "circuit",
}: LandingAnimatedBoardProps) {
  const isCard = variant === "card";

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl"
      role="img"
      aria-label={alt}
    >
      <svg
        viewBox="0 0 640 400"
        className={`h-full w-full ${isCard ? "landing-board landing-board--card" : "landing-board landing-board--hero"}`}
        aria-hidden
      >
        <defs>
          <linearGradient id="lb-bg" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#2e313d" />
            <stop offset="1" stopColor="#1f222d" />
          </linearGradient>
          <linearGradient id="lb-accent" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ff2e1f" />
            <stop offset="1" stopColor="#ff7a6e" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="640" height="400" rx="36" fill="url(#lb-bg)" />

        <g className="landing-board-glow">
          <circle cx="540" cy="76" r="46" fill="#ff6f61" opacity="0.28" />
          <circle cx="52" cy="338" r="44" fill="#d2d8ef" opacity="0.14" />
        </g>

        <rect
          x="56"
          y="76"
          width="190"
          height="140"
          rx="24"
          fill="url(#lb-accent)"
          className="landing-board-panel"
        />

        {theme === "circuit" ? (
          <>
            <g className="landing-board-lines">
              <rect x="270" y="82" width="244" height="24" rx="12" fill="#5a5d69" />
              <rect x="270" y="118" width="224" height="24" rx="12" fill="#545762" />
              <rect x="270" y="158" width="196" height="24" rx="12" fill="#50535d" />
              <rect x="88" y="242" width="430" height="14" rx="7" fill="#51545f" />
              <rect x="88" y="270" width="380" height="14" rx="7" fill="#4c4f5b" />
            </g>
            <g className="landing-board-cards">
              <rect x="56" y="222" width="190" height="112" rx="20" fill="#3f424e" />
              <rect x="270" y="222" width="150" height="112" rx="20" fill="#474a56" />
              <rect x="440" y="222" width="140" height="112" rx="20" fill="#434653" />
            </g>
            <g
              className="landing-board-trace"
              fill="none"
              stroke="#7f8cff"
              strokeLinecap="round"
              strokeWidth="3"
              opacity="0.85"
            >
              <path d="M294 260 H350 V306 H446" />
              <path d="M188 134 H240 V286 H266" />
              <path d="M486 100 H546 V186 H500" />
            </g>
          </>
        ) : null}

        {theme === "mechanics" ? (
          <>
            <g className="landing-board-gear" style={{ transformOrigin: "436px 126px" }}>
              <circle cx="436" cy="126" r="44" fill="none" stroke="#7f8cff" strokeWidth="13" strokeDasharray="20 14" />
              <circle cx="436" cy="126" r="18" fill="#50535d" />
            </g>
            <g className="landing-board-gear landing-board-gear--rev" style={{ transformOrigin: "520px 184px" }}>
              <circle cx="520" cy="184" r="30" fill="none" stroke="#ff8f86" strokeWidth="10" strokeDasharray="14 10" />
              <circle cx="520" cy="184" r="12" fill="#50535d" />
            </g>
            <g className="landing-board-arm" style={{ transformOrigin: "306px 272px" }}>
              <rect x="258" y="242" width="84" height="26" rx="12" fill="#585c67" />
              <rect x="292" y="186" width="30" height="68" rx="12" fill="#656a77" />
              <rect x="314" y="168" width="84" height="20" rx="10" fill="#5a5d69" />
              <rect x="388" y="160" width="26" height="46" rx="10" fill="#717688" />
              <circle cx="306" cy="254" r="12" fill="#7f8cff" opacity="0.8" />
              <circle cx="400" cy="180" r="8" fill="#ffb2ac" opacity="0.9" />
              <rect x="408" y="204" width="30" height="14" rx="7" fill="#7a7f90" />
              <rect x="445" y="204" width="30" height="14" rx="7" fill="#7a7f90" />
            </g>
            <g className="landing-board-cards">
              <rect x="88" y="266" width="166" height="68" rx="16" fill="#3f424e" />
              <rect x="302" y="272" width="144" height="62" rx="16" fill="#454955" />
              <rect x="468" y="272" width="116" height="62" rx="16" fill="#434653" />
            </g>
          </>
        ) : null}

        {theme === "launch" ? (
          <>
            <g className="landing-board-wave" fill="none" strokeLinecap="round">
              <path d="M272 150 C308 126,338 170,370 148 C404 124,430 166,462 146 C494 126,520 164,554 142" stroke="#7f8cff" strokeWidth="5" />
              <path d="M272 186 C306 162,338 206,370 182 C404 158,430 204,462 180 C494 160,520 198,554 176" stroke="#ff8f86" strokeWidth="4" opacity="0.8" />
            </g>
            <g className="landing-board-rocket" style={{ transformOrigin: "406px 270px" }}>
              <path d="M406 202 L436 272 L406 258 L376 272 Z" fill="#7f8cff" />
              <path d="M386 272 L406 318 L426 272" fill="#ff7a6e" opacity="0.95" />
              <ellipse cx="406" cy="334" rx="16" ry="24" className="landing-board-flame" fill="#ffb020" opacity="0.85" />
            </g>
            <g className="landing-board-lines">
              <rect x="82" y="238" width="172" height="16" rx="8" fill="#595d6a" />
              <rect x="82" y="266" width="146" height="16" rx="8" fill="#525662" />
              <rect x="82" y="294" width="188" height="16" rx="8" fill="#4c505d" />
            </g>
            <g className="landing-board-stars">
              <circle cx="526" cy="94" r="5" fill="#ffb020" />
              <circle cx="486" cy="64" r="4" fill="#ff7a6e" />
              <circle cx="556" cy="132" r="4" fill="#7f8cff" />
            </g>
          </>
        ) : null}

        <circle
          cx="122"
          cy="300"
          r="16"
          fill="#6972b0"
          opacity="0.5"
          className="landing-board-pulse"
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}
