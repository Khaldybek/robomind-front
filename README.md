# Roboschool — панель ученика (Next.js)

Клиент для **ученика**: логин с `deviceId`, регистрация (город → район → школа), курсы, дашборд. API — **robomind-back** (`/api/v1/...`).

## Быстрый старт

```bash
cp .env.example .env.local
# Укажите URL бэкенда (порт API — свой; Next.js по умолчанию :3000 или :3001)
npm install
npm run dev
```

В **`.env.local`** задайте `NEXT_PUBLIC_API_BASE_URL` — например `http://localhost:4000/api/v1` (тот хост/порт, где запущен **robomind-back**).

### CORS на бэкенде

Браузер шлёт запросы с **origin** страницы (где открыт фронт), например `http://localhost:3001` или `http://localhost:3000`. На бэкенде в **`CORS_ORIGIN`** должны быть перечислены **все** такие origin через запятую, без пробелов, например:

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

Иначе не только `fetch` к `/api/v1`, но и загрузка **статики** (`/api/v1/files/*` для видео/картинок) может блокироваться. Шаблон переменных — в [`.env.example`](./.env.example).

## Документация

| Файл | Назначение |
|------|------------|
| [docs/BRIEF-STUDENT-PANEL.md](./docs/BRIEF-STUDENT-PANEL.md) | Контекст продукта и бэкенда |
| [docs/API-STUDENT-PANEL.md](./docs/API-STUDENT-PANEL.md) | Черновик HTTP-контракта (сверить с `robomind-back`) |
| [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) | Дизайн-токены |

**Device ID:** один UUID в `localStorage` на браузер; при логине уходит на бэк. **JWT:** заголовок `Authorization: Bearer`. Опционально для локальной разработки без логина: `NEXT_PUBLIC_DEV_USER_ID` → заголовок `x-user-id` (см. [`.env.example`](./.env.example)).

## Код

- `lib/api/` — клиент, маршруты (`routes.ts`), вызовы auth / курсов / гео
- `lib/device-id.ts`, `lib/auth/tokens.ts`
- `app/(auth)/` — login, register, forgot-password, verify-email, pending-activation
- `app/(student)/` — дашборд, курсы, модули, квиз, чат, прогресс, сертификаты, профиль, настройки
- `app/403-device`, `app/logout` — служебные
- Сводка маршрутов: [docs/STUDENT-PAGES.md](./docs/STUDENT-PAGES.md)
- **Школьный админ:** [docs/API-SCHOOL-ADMIN-PANEL.md](./docs/API-SCHOOL-ADMIN-PANEL.md) · `/school-admin/*`
- **Супер-админ:** [docs/API-SUPER-ADMIN-PANEL.md](./docs/API-SUPER-ADMIN-PANEL.md) · `/super-admin/*`
- **Токены / refresh / logout:** [docs/AUTH-TOKENS.md](./docs/AUTH-TOKENS.md)

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
