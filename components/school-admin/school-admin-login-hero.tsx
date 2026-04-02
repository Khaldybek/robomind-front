"use client";

/**
 * Маркетинговый блок слева на экране входа.
 * Картинка — из `public/`; при отсутствии файла показывается SVG-иллюстрация.
 */
export function SchoolAdminLoginHero() {
  return (
    <div className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[var(--radius-ds-section)] border border-white/60 bg-gradient-to-br from-[#2a2a2c] via-[#1f1f22] to-[#141416] p-8 text-ds-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)] lg:min-h-0 lg:p-10">
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-ds-primary/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[1]">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/80">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ds-primary" />
          Панель школы
        </p>
        <h2 className="mt-4 max-w-md text-balance font-medium leading-tight text-white [font-size:clamp(1.5rem,3vw,2.25rem)]">
          Управляйте учениками и доступами к курсам — в одном месте
        </h2>
        <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-white/70">
          Roboschool помогает школе запускать цифровое обучение: курсы, прогресс,
          уведомления и безопасность устройств — без лишней бюрократики.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ds-primary/90 text-xs font-bold">
              ✓
            </span>
            <span>Выдача доступов к опубликованным курсам за минуты</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs font-bold">
              ✓
            </span>
            <span>Сводка по школе: ученики, курсы, уведомления</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs font-bold">
              ✓
            </span>
            <span>Контроль лишних устройств и прозрачность для админа</span>
          </li>
        </ul>
      </div>

      <div className="relative z-[1] mt-10 flex justify-center lg:mt-12">
        <HeroVisual />
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative h-[180px] w-full max-w-md lg:h-[200px]">
      {/* Замените файл на свою фотографию школы / класса: положите в public/school-admin/login-hero.jpg */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="sa-float relative h-full w-full max-w-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- декоративный SVG */}
          <img
            src="/school-admin/login-hero.svg"
            alt=""
            width={320}
            height={200}
            className="h-auto w-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
