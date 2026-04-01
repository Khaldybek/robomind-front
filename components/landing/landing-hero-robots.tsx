/**
 * Иллюстрация героя: «живые» роботы и детали на чистом CSS (без canvas).
 * Текст в облачке — из переводов (4–7 классы).
 */
export function LandingHeroRobots({ bubbleText }: { bubbleText: string }) {
  return (
    <div className="landing-kid-hero-wrap relative mx-auto w-full max-w-[min(100%,min(1040px,96vw))] pb-5 sm:pb-7 lg:pb-9">
      <div
        className="landing-kid-bubble absolute left-[4%] top-[3%] z-10 max-w-[min(92%,min(340px,92vw))] rounded-2xl border-2 border-white/90 bg-white px-4 py-2.5 text-center text-base font-bold leading-tight text-ds-black shadow-[0_12px_36px_-12px_rgba(255,46,31,0.35)] sm:left-[7%] sm:top-[4%] sm:px-5 sm:py-3 sm:text-lg lg:text-xl"
        style={{ animationDelay: "0.15s" }}
      >
        {bubbleText}
        <span
          className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-white/90 bg-white sm:h-5 sm:w-5"
          aria-hidden
        />
      </div>

      <svg
        viewBox="0 0 700 520"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full overflow-visible drop-shadow-[0_28px_56px_rgba(38,38,38,0.14)]"
        role="img"
        aria-hidden
      >
        <defs>
          <linearGradient id="lkd-stage" x1="40" y1="60" x2="660" y2="480" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e8eeff" />
            <stop offset="0.5" stopColor="#f4f0ff" />
            <stop offset="1" stopColor="#fff5f2" />
          </linearGradient>
          <linearGradient id="lkd-bot" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#3d3d42" />
            <stop offset="1" stopColor="#1e1e22" />
          </linearGradient>
          <linearGradient id="lkd-accent" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#ff2e1f" />
            <stop offset="1" stopColor="#ff7a6e" />
          </linearGradient>
        </defs>

        <g transform="translate(350 268) scale(1.12) translate(-350 -268)">
        {/* сцена */}
        <rect x="32" y="48" width="636" height="424" rx="32" fill="url(#lkd-stage)" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />

        {/* звёздочки */}
        <circle className="landing-kid-spark" cx="120" cy="110" r="5" fill="#ff2e1f" opacity="0.85" />
        <circle className="landing-kid-spark landing-kid-spark--d" cx="590" cy="200" r="4" fill="#5b7cff" opacity="0.7" />
        <circle className="landing-kid-spark" cx="520" cy="380" r="4" fill="#ffb020" opacity="0.75" />

        {/* шестерёнки — вращающиеся «пончики» */}
        <g className="landing-kid-gear" style={{ transformBox: "fill-box", transformOrigin: "580px 96px" }}>
          <circle cx="580" cy="96" r="32" fill="none" stroke="url(#lkd-accent)" strokeWidth="10" strokeDasharray="18 14" strokeLinecap="round" opacity="0.95" />
          <circle cx="580" cy="96" r="14" fill="#2a2a2e" />
        </g>
        <g className="landing-kid-gear landing-kid-gear--slow" style={{ transformBox: "fill-box", transformOrigin: "498px 124px" }}>
          <circle cx="498" cy="124" r="22" fill="none" stroke="#5b7cff" strokeWidth="7" strokeDasharray="12 10" strokeLinecap="round" opacity="0.88" />
          <circle cx="498" cy="124" r="9" fill="#2a2a2e" />
        </g>

        {/* мини-дрон — парит над сценой */}
        <g transform="translate(392 88)">
          <g className="landing-kid-drone" style={{ transformBox: "fill-box" as const }}>
            <ellipse cx="0" cy="6" rx="26" ry="7" fill="#2a2a2e" opacity="0.92" />
            <rect x="-20" y="-6" width="40" height="20" rx="7" fill="#3d3d42" />
            <circle cx="-8" cy="4" r="4" fill="#5b7cff" opacity="0.9" />
            <circle cx="8" cy="4" r="4" fill="#5b7cff" opacity="0.9" />
            <g className="landing-kid-drone-prop" style={{ transformBox: "fill-box" as const, transformOrigin: "-28px -10px" }}>
              <line x1="-28" y1="-10" x2="-28" y2="-22" stroke="#888" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="-28" cy="-22" r="11" fill="none" stroke="#c8c8c8" strokeWidth="2" strokeDasharray="5 6" />
            </g>
            <g className="landing-kid-drone-prop" style={{ transformBox: "fill-box" as const, transformOrigin: "28px -10px" }}>
              <line x1="28" y1="-10" x2="28" y2="-22" stroke="#888" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="28" cy="-22" r="11" fill="none" stroke="#c8c8c8" strokeWidth="2" strokeDasharray="5 6" />
            </g>
            <g className="landing-kid-drone-prop landing-kid-drone-prop--slow" style={{ transformBox: "fill-box" as const, transformOrigin: "-28px 22px" }}>
              <line x1="-28" y1="16" x2="-28" y2="28" stroke="#888" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="-28" cy="28" r="11" fill="none" stroke="#c8c8c8" strokeWidth="2" strokeDasharray="5 6" />
            </g>
            <g className="landing-kid-drone-prop landing-kid-drone-prop--slow" style={{ transformBox: "fill-box" as const, transformOrigin: "28px 22px" }}>
              <line x1="28" y1="16" x2="28" y2="28" stroke="#888" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="28" cy="28" r="11" fill="none" stroke="#c8c8c8" strokeWidth="2" strokeDasharray="5 6" />
            </g>
          </g>
        </g>

        {/* робот А — качается целиком */}
        <g className="landing-kid-bot-a" style={{ transformBox: "fill-box", transformOrigin: "220px 340px" }}>
          <rect x="140" y="260" width="160" height="132" rx="22" fill="url(#lkd-bot)" />
          <rect x="160" y="200" width="120" height="72" rx="18" fill="#fafafa" stroke="#e5e5e5" strokeWidth="2" />
          <circle className="landing-kid-eye" cx="196" cy="232" r="10" fill="#262626" />
          <circle className="landing-kid-eye" cx="244" cy="232" r="10" fill="#262626" />
          <circle cx="188" cy="242" r="5" fill="#ff9ec4" opacity="0.5" />
          <circle cx="252" cy="242" r="5" fill="#ff9ec4" opacity="0.5" />
          <g className="landing-kid-antenna" style={{ transformBox: "fill-box", transformOrigin: "220px 200px" }}>
            <line x1="220" y1="200" x2="220" y2="168" stroke="#c8c8c8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="220" cy="160" r="10" fill="url(#lkd-accent)" />
          </g>
          <rect x="118" y="288" width="36" height="88" rx="12" fill="#3d3d42" className="landing-kid-arm-l" style={{ transformBox: "fill-box", transformOrigin: "136px 320px" }} />
          <rect x="286" y="288" width="36" height="88" rx="12" fill="#3d3d42" className="landing-kid-arm-r" style={{ transformBox: "fill-box", transformOrigin: "304px 320px" }} />
          <g className="landing-kid-wheel" style={{ transformBox: "fill-box" as const, transformOrigin: "175px 410px" }}>
            <circle cx="175" cy="410" r="22" fill="#2a2a2e" stroke="#444" strokeWidth="3" />
            <circle cx="175" cy="410" r="8" fill="#666" />
            <circle cx="175" cy="410" r="18" fill="none" stroke="#555" strokeWidth="2" strokeDasharray="4 7" opacity="0.65" />
          </g>
          <g className="landing-kid-wheel landing-kid-wheel--r" style={{ transformBox: "fill-box" as const, transformOrigin: "265px 410px" }}>
            <circle cx="265" cy="410" r="22" fill="#2a2a2e" stroke="#444" strokeWidth="3" />
            <circle cx="265" cy="410" r="8" fill="#666" />
            <circle cx="265" cy="410" r="18" fill="none" stroke="#555" strokeWidth="2" strokeDasharray="4 7" opacity="0.65" />
          </g>
        </g>

        {/* робот Б — меньше, другой ритм */}
        <g className="landing-kid-bot-b" style={{ transformBox: "fill-box", transformOrigin: "520px 360px" }}>
          <rect x="440" y="300" width="112" height="96" rx="18" fill="url(#lkd-bot)" />
          <rect x="456" y="252" width="80" height="56" rx="14" fill="#fafafa" stroke="#e5e5e5" strokeWidth="2" />
          <circle className="landing-kid-eye" cx="476" cy="276" r="7" fill="#262626" />
          <circle className="landing-kid-eye" cx="508" cy="276" r="7" fill="#262626" />
          <rect
            x="428"
            y="318"
            width="26"
            height="56"
            rx="10"
            fill="#4a4a52"
            className="landing-kid-bot-b-arm-l"
            style={{ transformBox: "fill-box" as const, transformOrigin: "441px 346px" }}
          />
          <rect
            x="538"
            y="318"
            width="26"
            height="56"
            rx="10"
            fill="#4a4a52"
            className="landing-kid-bot-b-arm-r"
            style={{ transformBox: "fill-box" as const, transformOrigin: "551px 346px" }}
          />
          <ellipse cx="496" cy="400" rx="28" ry="12" fill="#2a2a2e" />
        </g>

        {/* «пол» с мягкой тенью */}
        <ellipse cx="350" cy="448" rx="240" ry="18" fill="rgba(38,38,38,0.07)" />
        </g>
      </svg>
    </div>
  );
}
