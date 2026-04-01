# API панели студента — запросы и ответы

Базовый URL: **`{ORIGIN}/api/v1`**

## Зачем всё в одном файле

| Зачем | Пояснение |
|--------|-----------|
| **Один источник для фронта** | Разработчики панели студента смотрят один документ: не нужно собирать контракт из разных модулей кода (`app-api`, `auth`, `ai`). |
| **Сквозной сценарий** | Регистрация → гео → логин → курсы → модуль → тест → прогресс → ИИ — идут по порядку в одном месте. |
| **Короткая навигация** | `API-STRUCTURE.md` — только **список путей**; этот файл — **тела запросов и формы ответов** для UI. |
| **Версионирование** | Проще отслеживать изменения контракта студента в одном diff, чем по многим README. |

Общие заголовки:

- `Authorization: Bearer <access_token>` — для маршрутов `/app/*` (кроме гео), `/app/ai/*`, `logout-all`
- `Content-Type: application/json` — для POST/PATCH с телом

Для защищённых маршрутов приложения: **`Authorization: Bearer <accessToken>`**, роль **`student`**.

### Сводка маршрутов (панель студента)

| Метод | Путь | Тело | Кратко ответ |
|--------|------|------|----------------|
| POST | `/auth/register` | регистрация, опц. `deviceId` | профиль или токены + user |
| POST | `/auth/login` | `email`, `password`, `deviceId` (для student) | токены + user |
| POST | `/auth/refresh` | `refreshToken` | новая пара токенов |
| POST | `/auth/logout` | опц. `refreshToken` | `204` |
| POST | `/auth/logout-all` | — (Bearer) | `204` |
| POST | `/auth/forgot-password` | `email` | `{ ok: true }` |
| POST | `/auth/reset-password` | `token`, `password` | `{ ok: true }` |
| GET | `/app/cities` | — | список городов |
| GET | `/app/cities/:cityId/districts` | — | районы |
| GET | `/app/districts/:districtId/schools` | — | школы |
| GET | `/app/users/me` | — (Bearer) | профиль + школа |
| PATCH | `/app/users/me` | опц. имя, отчество, `avatarUrl` | обновлённый профиль |
| GET | `/app/users/me/dashboard` | — | сводка + курсы |
| GET | `/app/users/me/progress` | — | массив прогресса по модулям |
| GET | `/app/users/me/certificates` | — | сертификаты |
| GET | `/app/courses` | — | курсы с доступом |
| GET | `/app/courses/:courseId/modules` | — | модули курса |
| GET | `/app/modules/:moduleId/content` | — | блоки контента |
| GET | `/app/modules/:moduleId/quiz` | — | тест (вопросы с `answers`, без правильных) |
| PATCH | `/app/modules/:moduleId/progress` | опц. `watchedSeconds`, `status`, `completed` | запись прогресса |
| POST | `/app/quizzes/:quizId/attempt` | — | `attemptId`, `startedAt`, `maxScore`, `resumed` |
| POST | `/app/attempts/:attemptId/submit` | `answers`: объект `questionId` → ответ | баллы, `isPassed`, при успехе прогресс модуля |
| POST | `/app/ai/chat` | `moduleId`, `messages[]` | ответ ассистента |
| GET | `/app/ai/recommendations` | query `courseId?` | рекомендации |
| POST | `/app/ai/grade-text` | текст вопроса, ответы, эталон | оценка |
| GET | `/app/gamification/me` | — | XP, уровень, стрик, бейджи |
| GET | `/app/gamification/leaderboard` | query `schoolId?`, `limit?` | топ учеников |

Ниже — те же эндпоинты с полями и примерами JSON.

---

## Статика файлов (`GET /api/v1/files/*`)

Используется для **видео, изображений, HLS** и др.: в контенте модулей (`fileUrl`, `content`) часто приходит путь вида `/api/v1/files/videos/...` или `/api/v1/files/images/...`.

| Аспект | Поведение |
|--------|-----------|
| **Доступ** | Статика **публична** — для `<video>`, `<img>`, **hls.js** заголовок `Authorization` **не передаётся** (обычный запрос к URL файла). Закрытие по JWT потребует отдельного стриминг-эндпоинта — согласуется отдельно. |
| **CORS** | Для `/api/v1/files/*` выставляются заголовки доступа с origin из `CORS_ORIGIN`, методы `GET`, `HEAD`, `OPTIONS`, заголовки `Range`, `Authorization`, …; preflight `OPTIONS` → **204**. |
| **Range** | Поддерживаются **частичные запросы** (`Range: bytes=...`) для перемотки и HLS; `Accept-Ranges: bytes` в ответе. |
| **HLS** | Для `.m3u8` — `Content-Type: application/vnd.apple.mpegurl`; для `.ts` — `video/mp2t`. |

**Фронт:** полный URL собирает `resolvePublicFileUrl()` в `lib/env.ts` (учёт `NEXT_PUBLIC_API_BASE_URL` в виде `https://host/api/v1`, без дублирования пути). Плеер: `components/student/module-video-player.tsx` (MP4/WebM, HLS через `hls.js`, YouTube — iframe).

---

## 1. Auth

### `POST /auth/login`

| | |
|--|--|
| **Назначение** | Вход **student \| school_admin \| super_admin** |

**Тело (JSON):**

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `email` | string | да | Email |
| `password` | string | да | Пароль |
| `deviceId` | string (UUID) | **да для student** | Стабильный ID устройства |

**Ответ `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs…",
  "refreshToken": "base64url_одноразовый_секрет",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "uuid",
    "role": "student",
    "email": "…",
    "firstName": "…",
    "lastName": "…",
    "schoolId": "uuid | null"
  }
}
```

- **`expiresIn`** — через сколько секунд протухнет access (см. `JWT_ACCESS_EXPIRES`).
- **`refreshToken`** — хранить безопасно; по нему выдаётся новая пара токенов.

**Ошибки:** `401`, `400` (нет deviceId у ученика), `403` (лимит устройств).

---

### `POST /auth/refresh`

**Тело:** `{ "refreshToken": "<тот же, что при login>" }`

**Ответ `200`:** такая же структура, как у login (новые `accessToken`, **новый** `refreshToken`, старый refresh инвалидируется — ротация).

**Ошибка `401`:** неверный или истёкший refresh.

---

### `POST /auth/logout`

**Тело (опционально):** `{ "refreshToken": "…" }` — отозвать эту сессию.

**Ответ:** `204` без тела.

---

### `POST /auth/logout-all`

**Заголовок:** `Authorization: Bearer <accessToken>`

Отзывает **все** refresh-сессии пользователя.

**Ответ:** `204`

---

### `POST /auth/register`

Регистрация ученика.

**Тело (JSON):**

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `email` | string | да | Email |
| `password` | string | да | Пароль (мин. 8 символов) |
| `firstName`, `lastName` | string | да | Имя, фамилия |
| `patronymic` | string? | нет | Отчество |
| `iin` | string (12 цифр) | да | ИИН |
| `schoolId` | uuid | да | Активная школа |
| `deviceId` | uuid | нет | Если указан — ответ как у **login** (токены + `user`) |

**Ответ `201` без `deviceId`:** профиль `{ id, email, role, firstName, lastName, schoolId }`.

**Ответ `201` с `deviceId`:** как у `POST /auth/login` (`accessToken`, `refreshToken`, `expiresIn`, `tokenType`, `user`). Ошибка `403` — лимит устройств.

---

### `POST /auth/forgot-password`

**Тело:** `{ "email": "…" }`

**Ответ `202`:** `{ "ok": true }` (в dev токен сброса может печататься в лог сервера).

---

### `POST /auth/reset-password`

**Тело:** `{ "token": "…", "password": "…" }` (новый пароль)

**Ответ `200`:** `{ "ok": true }`

---

## 2. Гео (регистрация)

### `GET /app/cities`

| Вход | Нет тела. Query нет. |
|------|----------------------|

**Ответ `200`:** массив активных городов — поля вроде `id`, `name`, `nameKz`, `isActive`, `createdAt`, `updatedAt`.

### `GET /app/cities/:cityId/districts`

| Вход | Параметр пути: `cityId` (UUID) |

**Целевой ответ `200`:**

```json
[
  { "id": "uuid", "name": "…", "nameKz": "…", "cityId": "uuid" }
]
```

### `GET /app/districts/:districtId/schools`

| Вход | Параметр пути: `districtId` (UUID) |

**Целевой ответ `200`:**

```json
[
  {
    "id": "uuid",
    "name": "Школа …",
    "number": 12,
    "districtId": "uuid",
    "address": "…",
    "isActive": true
  }
]
```

---

## 3. Профиль

### `GET /app/users/me`

**Заголовок:** `Authorization: Bearer <accessToken>`

Пользователь определяется из JWT (`sub`).

**Ответ `200`:** объект с полями `id`, `email`, `firstName`, `lastName`, `patronymic`, `iin`, `role`, `schoolId`, `school` (`id`, `name`, `districtId` или `null`), `avatarUrl`, `isActive`, `createdAt`, `updatedAt`.

*(пароль не отдаётся)*

### `PATCH /app/users/me`

**Тело:** только изменяемые поля (все опционально): `firstName`, `lastName`, `patronymic`, `avatarUrl` (строка URL или пустая строка для сброса).

**Ответ `200`:** тот же формат, что у `GET /app/users/me`.

### `GET /app/users/me/dashboard`

Сводный payload для главного экрана студента (бэкенд может вернуть агрегаты + курсы + прогресс).

### `GET /app/users/me/progress`

Массив прогресса по модулям/курсам.

### `GET /app/users/me/certificates`

Массив сертификатов студента.

---

## 4. Курсы

### `GET /app/courses`

**Целевой ответ `200`:** список курсов с доступом у ученика:

```json
[
  {
    "id": "uuid",
    "title": "…",
    "description": "…",
    "thumbnailUrl": "…",
    "level": "beginner",
    "ageGroup": "…",
    "order": 0
  }
]
```

### `GET /app/courses/:courseId/modules`

| Вход | `courseId` — UUID в пути |

**Ответ `200`:** для каждого опубликованного модуля: `id`, `title`, `description`, `order`, `unlockAfterModuleId`, `createdAt`, `updatedAt`.  
Флаги «заблокирован / пройден» на фронте считают по `GET /app/users/me/progress` и `unlockAfterModuleId`.

---

## 5. Контент модуля и тест

### `GET /app/modules/:moduleId/content`

**Целевой ответ `200`:**

```json
[
  {
    "id": "uuid",
    "moduleId": "uuid",
    "type": "video | file | text | livestream | link",
    "title": "…",
    "content": "HTML или URL",
    "fileUrl": "ключ MinIO / URL",
    "duration": 120,
    "order": 0,
    "livestreamUrl": "…",
    "livestreamStartsAt": "2025-01-01T12:00:00.000Z"
  }
]
```

### `GET /app/modules/:moduleId/quiz`

**Ответ `200`:** объект квиза: `id`, `moduleId`, `title`, `passingScore`, `maxAttempts`, `timeLimitMinutes`, `shuffleQuestions`, `createdAt`, `updatedAt`, `questions[]`.  
У каждого вопроса: `id`, `text`, `type` (`single` | `multiple` | `text`), `order`, `imageUrl`, **`answers`**: `[{ "id", "text", "createdAt", "updatedAt" }]` — **без** признака правильности.  
Для `text`-вопросов `answers` может быть пустым массивом.

### `PATCH /app/modules/:moduleId/progress`

Пример:

```json
{
  "watchedSeconds": 320,
  "status": "in_progress",
  "completed": false
}
```

---

## 6. Попытка и сдача теста

### `POST /app/quizzes/:quizId/attempt`

| Вход | Путь: `quizId` (UUID). Тело не требуется. |

**Ответ `201`:**

```json
{
  "attemptId": "uuid",
  "quizId": "uuid",
  "startedAt": "2025-01-01T12:00:00.000Z",
  "maxScore": 10,
  "resumed": false
}
```

Если незавершённая попытка уже есть — та же структура с `"resumed": true` (новая не создаётся).  
**Ошибки:** `400` (лимит попыток, нет вопросов), `403/404` (нет доступа к модулю).

### `POST /app/attempts/:attemptId/submit`

**Тело:** объект `answers` — словарь `questionId` (UUID) → ответ.

| Тип вопроса | Значение в `answers[questionId]` |
|-------------|----------------------------------|
| `single` | строка — UUID выбранного `answer.id` |
| `multiple` | массив строк — UUID выбранных ответов |
| `text` | строка — текст ответа |

Пример:

```json
{
  "answers": {
    "uuid-вопроса-1": "uuid-варианта",
    "uuid-вопроса-2": ["uuid-a", "uuid-b"],
    "uuid-вопроса-3": "текст ответа"
  }
}
```

**Ответ `200`:**

```json
{
  "attemptId": "uuid",
  "quizId": "uuid",
  "score": 8,
  "maxScore": 10,
  "percent": 80,
  "isPassed": true,
  "passingScore": 70,
  "completedAt": "2025-01-01T12:30:00.000Z"
}
```

При `isPassed: true` бэкенд дополнительно помечает прогресс модуля как завершённый.  
**Ошибки:** `400` (уже сдана, истекло время), `404` (нет попытки).

---

## 7. Прогресс и сертификаты

### `GET /app/users/me/dashboard`

**Заголовок:** `Authorization: Bearer <accessToken>`

**Ответ `200`:** сводка для главной.

```json
{
  "coursesCount": 2,
  "modulesCompleted": 5,
  "modulesInProgress": 1,
  "certificatesCount": 0,
  "courses": [
    {
      "id": "uuid",
      "title": "…",
      "thumbnailUrl": "…",
      "level": "…",
      "order": 1
    }
  ]
}
```

### `GET /app/users/me/progress`

**Заголовок:** `Authorization: Bearer <accessToken>`

**Ответ `200`:** массив, для каждой записи: `id`, `courseId`, `courseTitle`, `moduleId`, `moduleTitle`, `status` (`not_started` | `in_progress` | `completed`), `completedAt`, `watchedSeconds`, `updatedAt`.

### `PATCH /app/modules/:moduleId/progress`

**Заголовок:** `Authorization: Bearer <accessToken>`

Обновление прогресса по модулю (доступ проверяется как у контента модуля).

**Тело (все поля опционально):**

| Поле | Тип | Описание |
|------|-----|----------|
| `watchedSeconds` | number | Накопленное время просмотра (берётся максимум с сохранённым) |
| `status` | `not_started`, `in_progress` или `completed` | Статус |
| `completed` | boolean | Если `true` — модуль завершён (`completedAt` выставляется) |

**Ответ `200`:** актуальная запись `{ id, courseId, moduleId, status, completedAt, watchedSeconds, updatedAt }`.

### `GET /app/users/me/certificates`

**Ответ `200`:** массив: `id`, `courseId`, `courseTitle`, `uniqueCode`, `issuedAt`, `pdfUrl`, `createdAt`.

---

## 8. ИИ

### `POST /app/ai/chat`

**Тело:**

```json
{
  "moduleId": "uuid",
  "messages": [
    { "role": "user", "content": "Объясни, как работает датчик" }
  ]
}
```

### `GET /app/ai/recommendations?courseId=...`

Рекомендации по обучению.

### `POST /app/ai/grade-text`

Оценка свободного ответа (вопрос, ответ ученика, эталон/критерии).

---

## 9. Геймификация

Все маршруты: **`Authorization: Bearer <accessToken>`**, роль `student`.

### Система вознаграждений

| Событие | XP | Условие |
|---------|-----|---------|
| Модуль завершён (прогресс → `completed`) | +20 | |
| Тест сдан | +50 | |
| Тест сдан на 100% | +80 (+30 бонус) | только при 100% |
| Тест сдан с первой попытки | +80 (+30 бонус) | только `attemptNumber == 1` |
| Оба бонуса (100% + первая попытка) | +110 | |
| Активность в новый день (стрик) | +5 | за каждый новый день подряд |

### Уровни (XP → Level)

| Уровень | XP от |
|---------|-------|
| 1 | 0 |
| 2 | 100 |
| 3 | 300 |
| 4 | 600 |
| 5 | 1 000 |
| 6 | 1 600 |
| 7 | 2 400 |
| 8 | 3 600 |
| 9 | 5 400 |
| 10 | 8 000 |

### Бейджи

| Ключ | Название | Условие |
|------|----------|---------|
| `first_module` | Первый шаг | Завершить первый модуль |
| `first_quiz_passed` | Тестовый прорыв | Сдать первый тест |
| `first_course` | Выпускник | Получить первый сертификат |
| `quiz_perfect` | Идеальный результат | Тест на 100% |
| `first_attempt_pass` | С первого раза | Сдать тест с первой попытки |
| `streak_3` | 3 дня подряд | Стрик ≥ 3 |
| `streak_7` | Неделя без перерыва | Стрик ≥ 7 |
| `streak_30` | Месяц упорства | Стрик ≥ 30 |
| `modules_10` | 10 модулей | Завершить 10 модулей |
| `modules_50` | 50 модулей | Завершить 50 модулей |

### `GET /app/gamification/me`

**Заголовок:** `Authorization: Bearer <accessToken>`

**Ответ `200`:**

```json
{
  "xp": 350,
  "level": 3,
  "nextLevelXp": 600,
  "xpInCurrentLevel": 50,
  "xpNeededForNextLevel": 300,
  "streakDays": 4,
  "lastActivityAt": "2025-03-18T09:00:00.000Z",
  "badges": [
    {
      "key": "first_module",
      "title": "Первый шаг",
      "description": "Завершить первый модуль",
      "earnedAt": "2025-03-15T12:00:00.000Z"
    }
  ]
}
```

- `xpInCurrentLevel` — XP накоплено внутри текущего уровня (от его нижней границы).
- `xpNeededForNextLevel` — сколько XP нужно для перехода (`null` на максимальном уровне).

### `GET /app/gamification/leaderboard`

**Query-параметры:**

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `schoolId` | UUID | нет | Фильтр по школе; без него — глобальный рейтинг |
| `limit` | number | нет | Кол-во строк (1–100, по умолчанию 20) |

**Ответ `200`:** массив участников рейтинга.

```json
[
  {
    "rank": 1,
    "userId": "uuid",
    "firstName": "Айгерим",
    "lastName": "Сейткали",
    "avatarUrl": "…",
    "xp": 1200,
    "level": 6,
    "streakDays": 12
  }
]
```

---

## 10. Коды ошибок (общие)

| HTTP | Когда |
|------|--------|
| `400` | Невалидное тело (ValidationPipe) |
| `401` | Не авторизован / неверный логин |
| `403` | Нет доступа к курсу / лимит устройств |
| `404` | Ресурс не найден |
| `429` | Лимиты ИИ |
| `503` | Сервис недоступен (например OpenAI) |

---

## 11. Связь с кодом фронта

| Область | Файлы |
|--------|-------|
| Routes | `lib/api/routes.ts` (`STUDENT_ROUTES`) |
| Auth | `lib/api/student/auth.ts` |
| Geo | `lib/api/student/geo.ts` |
| Профиль/прогресс/сертификаты | `lib/api/student/user.ts` |
| Курсы/модули/тест | `lib/api/student/courses.ts`, `lib/api/student/modules.ts` |
| ИИ | `lib/api/student/ai.ts` |
| Геймификация | `lib/api/student/gamification.ts` |

*Версия документа синхронизирована с текущей реализацией frontend-клиентов.*
