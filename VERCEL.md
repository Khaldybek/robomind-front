# Деплой на Vercel

Next.js 16 + App Router + `next-intl` (локали в URL: `/kk/...`, `/ru/...`). Отдельный конфиг сборки не требуется: Vercel определяет фреймворк автоматически.

## 1. Подключение репозитория

1. [Vercel Dashboard](https://vercel.com) → **Add New** → **Project** → импорт Git-репозитория.
2. **Framework Preset:** Next.js (по умолчанию).
3. **Root Directory:** корень репозитория (если монорепо — укажите подпапку).
4. **Build Command:** `npm run build` (по умолчанию). **Output:** управляется Next.js, менять не нужно.
5. **Install Command:** `npm install` (по умолчанию).

## 2. Переменные окружения

В **Settings → Environment Variables** задайте для **Production** и **Preview** (как минимум):

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | URL API с суффиксом `/api/v1`, без слэша в конце, например `https://api.example.com/api/v1` |

Без этой переменной клиент не ходит в API (`isApiConfigured()` вернёт false).

Опционально для отладки превью: `NEXT_PUBLIC_DEV_USER_ID` — только если согласовано с бэкендом (см. `lib/api/client.ts`).

После изменения env — **Redeploy** последнего деплоя.

## 3. CORS на бэкенде

Браузер обращается к API с **origin** страницы Vercel, например:

- `https://<имя-проекта>.vercel.app`
- кастомный домен: `https://app.example.com`

В **`CORS_ORIGIN`** на бэкенде перечислите эти origin через запятую **без пробелов**, вместе с локальными при необходимости:

```env
CORS_ORIGIN=http://localhost:3000,https://my-app.vercel.app,https://app.example.com
```

Иначе заблокируются и `fetch` к `/api/v1`, и загрузка файлов (`/api/v1/files/...`) для видео и картинок.

Для **Preview deployments** у каждой ветки свой URL (`*.vercel.app`). Либо добавляйте их в CORS по мере необходимости, либо на бэке используйте шаблон/список доверенных origin.

## 4. Домен и редиректы

- **Domains:** привяжите свой домен в Vercel; SSL выдаётся автоматически.
- Корень сайта обрабатывает middleware `next-intl` (редирект на локаль по умолчанию — `kk`).

## 5. Проверка после деплоя

1. Открыть `https://<deployment>/kk` или `/ru` — главная и навигация.
2. Страница логина и запросы к API при корректном `NEXT_PUBLIC_API_BASE_URL` и CORS.

## 6. Локальная связка с Vercel CLI (опционально)

```bash
npm i -g vercel
vercel login
vercel link   # в каталоге проекта
vercel env pull .env.local   # подтянуть env с Vercel для локального запуска
```

Каталог `.vercel` в `.gitignore` — не коммитить.
