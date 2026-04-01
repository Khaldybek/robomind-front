# Авторизация (все роли)

База: `{ORIGIN}/api/v1`

## POST `/auth/login`

После проверки пароля (и лимита устройств для ученика с `deviceId`):

| Поле | Описание |
|------|----------|
| `accessToken` | JWT (`sub`, `role`, `email`) |
| `refreshToken` | случайная строка (на сервере SHA-256) |
| `expiresIn` | TTL access в секундах |
| `tokenType` | `"Bearer"` |
| `user` | `id`, `role`, `email`, `firstName`, `lastName`, `schoolId` |

**Ученик:** тело `{ "email", "password", "deviceId" }`.  
**Админы:** `{ "email", "password" }` (без `deviceId`).

## POST `/auth/refresh`

Тело: `{ "refreshToken" }`  
Ответ: новая пара `accessToken` + `refreshToken` (ротация, старый refresh недействителен).

Фронт при **401** один раз обновляет сессию через refresh и повторяет запрос (student / school_admin / super_admin — отдельные хранилища токенов).

### Роли и панели

- В **JWT** желательно всегда указывать claim **`role`** (`student` | `school_admin` | `super_admin` и т.д.). Фронт проверяет роль при входе и в гардах (`/school-admin/*`, `/super-admin/*`), чтобы школьный админ не открывал панель супер-админа и наоборот.
- **Настоящая защита** — на бэкенде: каждый маршрут `/admin/*` должен отклонять запросы с токеном чужой роли (**403**). Фронт только улучшает UX и не заменяет проверки на сервере.

## POST `/auth/logout`

Тело: опционально `{ "refreshToken" }` — отзыв одной сессии. Ответ **204**.

Выход из UI: вызывается перед очисткой `localStorage`.

## POST `/auth/logout-all`

Заголовок: `Authorization: Bearer <accessToken>`. Все refresh-сессии пользователя удаляются. **204**.

Кнопки «Выйти на всех устройствах»: ученик — настройки; школьный и супер-админ — блок на дашборде.

## Код

- `lib/api/auth-api.ts` — refresh, logout, logout-all, разбор ответа логина
- `lib/api/client.ts` — авто-refresh ученика
- `lib/api/school-admin/client.ts`, `super-admin/client.ts` — то же для админов
