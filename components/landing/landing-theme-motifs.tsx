/**
 * Тематические мини-анимации для лендинга: код, логика, запуск, сборка, схема.
 * Чистый SVG + CSS (без canvas). Подписи под иконками — из переводов.
 */
export function LandingThemeMotifs({
  labels,
}: {
  labels: [string, string, string, string, string];
}) {
  const [lCode, lLogic, lLaunch, lBuild, lCircuit] = labels;

  return (
    <section className="landing-motifs mt-10 lg:mt-12">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <li className="landing-motif-card st-card-in rounded-2xl border border-white/85 bg-white/65 p-3 shadow-[0_10px_32px_-20px_rgba(91,124,255,0.2)] backdrop-blur-sm sm:p-4">
          <svg
            viewBox="0 0 120 100"
            className="mx-auto h-[72px] w-full max-w-[120px] overflow-visible sm:h-[84px]"
            aria-hidden
          >
            <defs>
              <linearGradient id="lm-code" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#ff2e1f" />
                <stop offset="1" stopColor="#ff7a6e" />
              </linearGradient>
            </defs>
            <g className="landing-motif-code" style={{ transformBox: "fill-box" as const }}>
              <text
                x="60"
                y="38"
                textAnchor="middle"
                fill="#262626"
                className="text-[22px] font-bold"
              >
                {"{ }"}
              </text>
            </g>
            <path
              className="landing-motif-code-line"
              d="M24 58h72"
              fill="none"
              stroke="url(#lm-code)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle className="landing-motif-dot" cx="36" cy="74" r="4" fill="#5b7cff" />
            <circle className="landing-motif-dot landing-motif-dot--d" cx="60" cy="74" r="4" fill="#ffb020" />
            <circle className="landing-motif-dot landing-motif-dot--b" cx="84" cy="74" r="4" fill="#5b7cff" />
          </svg>
          <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ds-gray-text sm:text-xs">
            {lCode}
          </p>
        </li>

        <li className="landing-motif-card st-card-in rounded-2xl border border-white/85 bg-white/65 p-3 shadow-[0_10px_32px_-20px_rgba(91,124,255,0.2)] backdrop-blur-sm sm:p-4">
          <svg
            viewBox="0 0 120 100"
            className="mx-auto h-[72px] w-full max-w-[120px] overflow-visible sm:h-[84px]"
            aria-hidden
          >
            <text
              x="60"
              y="42"
              textAnchor="middle"
              className="landing-motif-bin-a font-mono text-[15px] font-semibold"
              fill="#262626"
            >
              10110101
            </text>
            <text
              x="60"
              y="64"
              textAnchor="middle"
              className="landing-motif-bin-b font-mono text-[13px] font-semibold"
              fill="#5b7cff"
            >
              01001100
            </text>
            <rect
              x="28"
              y="72"
              width="64"
              height="6"
              rx="3"
              fill="rgba(38,38,38,0.08)"
              className="landing-motif-bar"
            />
          </svg>
          <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ds-gray-text sm:text-xs">
            {lLogic}
          </p>
        </li>

        <li className="landing-motif-card st-card-in rounded-2xl border border-white/85 bg-white/65 p-3 shadow-[0_10px_32px_-20px_rgba(91,124,255,0.2)] backdrop-blur-sm sm:p-4">
          <svg
            viewBox="0 0 120 100"
            className="mx-auto h-[72px] w-full max-w-[120px] overflow-visible sm:h-[84px]"
            aria-hidden
          >
            <defs>
              <linearGradient id="lm-rocket" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#5b7cff" />
                <stop offset="1" stopColor="#3d4fd9" />
              </linearGradient>
            </defs>
            <g className="landing-motif-rocket" style={{ transformBox: "fill-box" as const }}>
              <path
                d="M60 22 L72 52 L60 46 L48 52 Z"
                fill="url(#lm-rocket)"
                stroke="#2a2f6e"
                strokeWidth="1.2"
              />
              <path d="M52 52 L60 68 L68 52" fill="#ff2e1f" opacity="0.9" />
              <ellipse
                cx="60"
                cy="76"
                rx="10"
                ry="14"
                className="landing-motif-flame"
                fill="#ffb020"
                opacity="0.85"
              />
            </g>
            <circle className="landing-motif-star" cx="24" cy="30" r="3" fill="#ffb020" opacity="0.9" />
            <circle className="landing-motif-star landing-motif-star--b" cx="96" cy="36" r="2.5" fill="#ff2e1f" opacity="0.75" />
          </svg>
          <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ds-gray-text sm:text-xs">
            {lLaunch}
          </p>
        </li>

        <li className="landing-motif-card st-card-in rounded-2xl border border-white/85 bg-white/65 p-3 shadow-[0_10px_32px_-20px_rgba(91,124,255,0.2)] backdrop-blur-sm sm:p-4">
          <svg
            viewBox="0 0 120 100"
            className="mx-auto h-[72px] w-full max-w-[120px] overflow-visible sm:h-[84px]"
            aria-hidden
          >
            <g className="landing-motif-block landing-motif-block--3">
              <rect x="44" y="58" width="32" height="22" rx="4" fill="#5b7cff" opacity="0.95" />
            </g>
            <g className="landing-motif-block landing-motif-block--2">
              <rect x="36" y="38" width="28" height="20" rx="4" fill="#ff2e1f" opacity="0.92" />
            </g>
            <g className="landing-motif-block landing-motif-block--1">
              <rect x="56" y="22" width="28" height="18" rx="4" fill="#262626" opacity="0.88" />
            </g>
          </svg>
          <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ds-gray-text sm:text-xs">
            {lBuild}
          </p>
        </li>

        <li className="landing-motif-card st-card-in col-span-2 rounded-2xl border border-white/85 bg-white/65 p-3 shadow-[0_10px_32px_-20px_rgba(91,124,255,0.2)] backdrop-blur-sm sm:col-span-1 sm:p-4">
          <svg
            viewBox="0 0 120 100"
            className="mx-auto h-[72px] w-full max-w-[120px] overflow-visible sm:h-[84px]"
            aria-hidden
          >
            <rect
              x="34"
              y="36"
              width="52"
              height="36"
              rx="6"
              fill="#fafafa"
              stroke="#e5e5e5"
              strokeWidth="2"
            />
            <circle cx="48" cy="48" r="4" fill="#262626" />
            <circle cx="72" cy="48" r="4" fill="#262626" />
            <path
              className="landing-motif-trace"
              d="M28 56 H34 M86 56 H92 M60 36 V30 M60 72 V78 M22 54 L28 56 L22 58 M98 54 L92 56 L98 58"
              fill="none"
              stroke="#5b7cff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle className="landing-motif-pulse" cx="60" cy="54" r="5" fill="#ff2e1f" opacity="0.85" />
          </svg>
          <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-ds-gray-text sm:text-xs">
            {lCircuit}
          </p>
        </li>
      </ul>
    </section>
  );
}
