# API панели супер-администратора (Super Admin)

Роль: **`super_admin`**. Полный доступ: гео, школы, курсы, модули, контент, загрузки, ИИ, все пользователи и нарушения по устройствам.

База: **`{ORIGIN}/api/v1`**

**Авторизация:** `Authorization: Bearer <access_token>`.

**Вход:** `POST /auth/login` — без `deviceId` (`email`, `password`).

### CORS (если в браузере «blocked by CORS» только в админке)

Фронт админки (Next.js) и API (Express/Nest) — **разные origin** (например `http://localhost:3000` и `http://localhost:4000`). Браузер шлёт **preflight `OPTIONS`** на почти все запросы с телом JSON и с заголовками ниже — их должен обрабатывать **бэкенд**, не фронт.

**На бэкенде проверьте:**

1. **`CORS_ORIGIN`** — через запятую **без пробелов**, перечислены **все** origin, с которых открываете админку в браузере (порт важен):
   - `http://localhost:3000` и при необходимости `http://localhost:3001` и т.д.
   - Если открыли `http://127.0.0.1:3000`, это **другой** origin, чем `localhost` — добавьте отдельно.

2. Для **ответов на запросы** и на **OPTIONS** должны быть разрешены заголовки, которые шлёт клиент (`lib/api/super-admin/client.ts`):
   - `Authorization`
   - `Content-Type` (для JSON)
   - `x-user-id` (если бэкенд его требует)

3. Методы: как минимум `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, **`OPTIONS`**.

4. **`NEXT_PUBLIC_API_BASE_URL`** во фронте должен указывать на **реальный хост API** (например `http://localhost:4000/api/v1`), а не на origin Next — иначе это не CORS, а неверный URL.

Те же правила относятся к **school-admin** (`lib/api/school-admin/client.ts`).

---

## Обзор (`/admin/*`)

По умолчанию: **`Authorization: Bearer`**, роль **`super_admin`**, если в коде контроллера не указано иное.

### Сводка и сертификаты

| Метод | Путь | Роль | Описание |
|--------|------|------|----------|
| GET | `/admin/stats/summary` | super_admin | Агрегированная статистика |
| GET | `/admin/certificates` | super_admin | Список сертификатов (фильтры в query) |
| POST | `/admin/certificates` | super_admin | Создать сертификат |
| GET | `/admin/certificates/:id` | super_admin | Один сертификат |
| DELETE | `/admin/certificates/:id` | super_admin | Удалить |

Клиент: `lib/api/super-admin/stats.ts` (`fetchAdminStatsSummary`), `lib/api/super-admin/certificates.ts`.

### Пользователи

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/admin/users` | Список |
| GET | `/admin/users/:userId` | Карточка |
| PUT | `/admin/users/:userId` | Обновление |
| PATCH | `/admin/users/:userId/activate` | Активация / деактивация |
| DELETE | `/admin/users/:userId` | Удаление |
| GET | `/admin/users/:userId/progress` | Прогресс |
| GET | `/admin/users/:userId/certificates` | Сертификаты |

### Гео и школы

| Метод | Путь | Описание |
|--------|------|----------|
| GET/POST | `/admin/cities`, `/admin/cities/:id` | Города |
| PATCH/DELETE | `/admin/cities/:id` | |
| GET/POST | `/admin/districts`, `/admin/districts/:id` | Районы |
| PATCH/DELETE | `/admin/districts/:id` | |
| GET/POST | `/admin/schools`, `/admin/schools/:id` | Школы |
| PATCH/DELETE | `/admin/schools/:id` | |
| GET | `/admin/schools/:schoolId/admins` | Админы школы |

### Курсы

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/admin/courses` | Список |
| POST | `/admin/courses` | Создать |
| GET | `/admin/courses/:courseId` | Детали |
| PATCH | `/admin/courses/:courseId` | Обновить |
| DELETE | `/admin/courses/:courseId` | Удалить |
| GET | `/admin/courses/:courseId/modules` | Модули курса |
| GET | `/admin/courses/:courseId/accesses` | Доступы |
| POST | `/admin/courses/:courseId/access` | Выдать доступ |
| DELETE | `/admin/courses/:courseId/access/:userId` | Отозвать |
| GET | `/admin/courses/:courseId/students` | Ученики курса |

### Модули и контент

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/admin/modules` | Список модулей |
| POST | `/admin/modules` | Создать модуль |
| GET | `/admin/modules/:moduleId` | Модуль |
| PATCH | `/admin/modules/:moduleId` | Обновить |
| DELETE | `/admin/modules/:moduleId` | Удалить |
| GET | `/admin/modules/:moduleId/contents` | Контент |
| POST | `/admin/modules/:moduleId/contents` | Добавить контент |
| POST | `/admin/modules/:moduleId/contents/from-file` | Контент из файла |
| POST | `/admin/modules/:moduleId/content` | (алиас) |
| PATCH | `/admin/modules/:moduleId/contents/:contentId` | Обновить блок |
| DELETE | `/admin/modules/:moduleId/contents/:contentId` | Удалить блок |

### Загрузки

| Метод | Путь | Описание |
|--------|------|----------|
| POST | `/admin/upload/image` | Загрузка изображения |
| POST | `/admin/upload/video` | Загрузка видео |
| POST | `/admin/upload/file` | Файл |

Клиент: `lib/api/super-admin/upload.ts` (`uploadSuperImage`, `uploadSuperVideo`, `uploadSuperFile`).

### Школьные администраторы

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/admin/school-admins` | Список |
| POST | `/admin/school-admins` | Создать |
| GET | `/admin/school-admins/:id` | Карточка |
| PATCH | `/admin/school-admins/:id` | Обновить |
| DELETE | `/admin/school-admins/:id` | Удалить |

Также: **`GET /admin/schools/:schoolId/admins`** — список админов школы (см. §3.1). Клиент: `lib/api/super-admin/school-admins.ts`.

### Тесты (квизы)

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/admin/modules/:moduleId/quiz` | Тест модуля |
| POST | `/admin/modules/:moduleId/quiz/import-generated` | Импорт вопросов из ИИ |
| POST | `/admin/modules/:moduleId/quiz` | Создать тест |
| POST | `/admin/quizzes/:quizId/questions` | Добавить вопрос |
| PATCH | `/admin/quizzes/:quizId` | Обновить тест |
| DELETE | `/admin/quizzes/:quizId` | Удалить тест |
| PATCH | `/admin/questions/:questionId` | Обновить вопрос |
| DELETE | `/admin/questions/:questionId` | Удалить вопрос |
| POST | `/admin/questions/:questionId/answers` | Добавить ответ |
| PATCH | `/admin/answers/:answerId` | Обновить ответ |
| DELETE | `/admin/answers/:answerId` | Удалить ответ |

Клиент: `lib/api/super-admin/quizzes.ts` (`importGeneratedModuleQuiz`).

**UI:** создание теста и добавление вопросов — в панели **«Курс → модуль»** (`/super-admin/courses/[courseId]/modules/[moduleId]`), секция **«Тест модуля»** (раньше только API, без формы).

### ИИ (супер-админ)

| Метод | Путь | Описание |
|--------|------|----------|
| POST | `/admin/ai/quiz/generate` | Генерация вопросов по тексту модуля |
| POST | `/admin/ai/summarize` | Краткое содержание |
| POST | `/admin/ai/transcribe` | Транскрибация файла (`multipart`) |

Клиент: `lib/api/super-admin/ai.ts`.

### Устройства и уведомления

Роли: **`super_admin`** | **`school_admin`** (см. контроллер).

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/admin/device-violations` | Нарушения лимита устройств |
| GET | `/admin/notifications` | Уведомления (`?unreadOnly`) |
| PATCH | `/admin/notifications/:id/read` | Прочитано |
| GET | `/admin/users/:userId/devices` | Устройства ученика |
| DELETE | `/admin/users/:userId/devices/:deviceId` | Снять устройство |

Клиенты: `lib/api/super-admin/notifications.ts`, школьный — `lib/api/school-admin/*`.

---

## Подробнее по админке

См. разделы ниже — сценарии, поля тел и ответы.

---

## Коды ответов (кратко)

- **401** — нет или невалидный JWT
- **403** — роль или доступ (курс/модуль/лимит устройств)
- **404** — сущность не найдена
- **409** — конфликт (дубликат, FK)

Также: **400** (валидация), **503** (например OpenAI). Валидация тела: глобальный `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`).

---

Ниже — детальные разделы с полями DTO и примечаниями.

---

## 1. Вход

`POST /auth/login` → `user.role === "super_admin"`, JWT.

---

## 2. Гео и школы

Все маршруты: **`Authorization: Bearer <accessToken>`**, роль **`super_admin`**. Иначе `401` / `403`.

**Объекты:** город — `id`, `name`, `nameKz`, `isActive`, `createdAt`, `updatedAt`; район — плюс `cityId`; школа — плюс `districtId`, `number`, `address` (nullable).

**Список (200):** `{ items, total, page, limit, totalPages }`.

| Метод | Путь |
|-------|------|
| GET | `/admin/cities?page=&limit=&search=&isActive=` |
| GET | `/admin/cities/:id` |
| POST | `/admin/cities` → 201 |
| PATCH | `/admin/cities/:id` |
| DELETE | `/admin/cities/:id` → 204; **409** если есть районы |
| GET | `/admin/districts?cityId=uuid&page=&limit=&search=&isActive=` |
| GET | `/admin/districts/:id` |
| POST/PATCH/DELETE | `/admin/districts`, `/admin/districts/:id` — DELETE **409** если есть школы |
| GET | `/admin/schools?districtId=uuid&page=&limit=&search=&isActive=` |
| GET | `/admin/schools/:id` |
| POST/PATCH/DELETE | `/admin/schools`, `/admin/schools/:id` — DELETE **409** если есть пользователи школы |

**Ошибки:** `400` (нет `cityId`/`districtId` в списках), `404`, `409` при DELETE.

Панель: `/super-admin/geo` · клиент `lib/api/super-admin/geo.ts`.

---

## 3. Пользователи

Роль **`super_admin`**, **`Authorization: Bearer`**.

### Объект пользователя (без пароля)

| Поле | |
|------|---|
| `id`, `iin`, `email`, `firstName`, `lastName`, `patronymic` | |
| `role` | `student` \| `school_admin` \| `super_admin` |
| `schoolId` | uuid \| null |
| `school` | `{ id, name, number }` \| null |
| `isActive`, `avatarUrl`, `createdAt`, `updatedAt` | |

У **`super_admin`** всегда `schoolId: null`, `school: null`. Для **`student`** / **`school_admin`** обычно заданы `schoolId` и `school`.

### `GET /admin/me`

Текущий пользователь по JWT (`school_admin` | `super_admin`), профиль без пароля. Клиент: **`fetchSuperAdminMe()`** — `lib/api/super-admin/users.ts` (см. также `API-SCHOOL-ADMIN-PANEL.md` §3).

### `GET /admin/users`

**Query:** `page`, `limit`, `schoolId`, `role`, `search` (email, ФИО, ИИН), `isActive`

**200:** `{ items[], total, page, limit, totalPages }`

### `GET /admin/users/:userId`

**200** — один пользователь. **404**

### `PUT /admin/users/:userId`

Полное обновление: в т.ч. **пароль**, **роль**, **школа** (`schoolId`), ФИО, `iin`, `email`, `isActive`, `avatarUrl`.  
При выставлении роли **`super_admin`** бэкенд **сбрасывает** привязку к школе.

Клиент: `updateSuperUser(userId, PutAdminUserBody)` — `lib/api/super-admin/users.ts`.

### `DELETE /admin/users/:userId`

Удаление пользователя (семантика на бэке). Клиент: `deleteSuperUser(userId)`.

### `PATCH /admin/users/:userId/activate`

### `GET /admin/users/:userId/progress` · `GET .../certificates`

### `GET /admin/users/:userId/devices` · `DELETE .../devices/:deviceId`

Супер-админ видит **любого** пользователя платформы (`activateSuperUser`, `fetchSuperUserProgress`, …).

### 3.1. Школьные администраторы (`/admin/school-admins` и список по школе)

Префикс: `/api/v1`, **`Authorization: Bearer`**, роль **`super_admin`**.

**Объект в ответах:** `id`, `email`, `firstName`, `lastName`, `patronymic`, `iin`, `role: "school_admin"`, `schoolId`, `school: { id, name, number }`, `isActive`, `createdAt`, `updatedAt`.

| Метод | Путь | Вход | Ответ |
|-------|------|------|--------|
| GET | `/admin/schools/:schoolId/admins` | Query: `page`, `limit`, `search`, `isActive` (`schoolId` только в пути) | **200:** `{ items, total, page, limit, totalPages }` — фронт также принимает массив в корне или поле `data` / `schoolAdmins` вместо `items` (и `meta` для пагинации). **404** — школы с таким `schoolId` нет. |
| POST | `/admin/school-admins` | `schoolId`, `email`, `password` (≥8), `firstName`, `lastName`; опц. `patronymic`, `iin` (12 цифр) | **201** — объект. **404** — нет школы. **409** — email или ИИН занят |
| GET | `/admin/school-admins/:id` | — | **200** / **404** |
| PATCH | `/admin/school-admins/:id` | Частично: `schoolId`, `email`, `password`, ФИО, `iin`, `isActive` | **200** / **409** при конфликте email/ИИН |
| DELETE | `/admin/school-admins/:id` | — | **204** — мягкое отключение (`isActive: false`) |

Клиент: `lib/api/super-admin/school-admins.ts` · панель `/super-admin/school-admins`.

**Удобный выбор школы без UUID:** на фронте используются уже существующие эндпоинты гео — `GET /admin/cities`, `GET /admin/districts?cityId=`, `GET /admin/schools?districtId=` (и при необходимости `GET /admin/schools/:id` для подстановки каскада из `?schoolId=`). Отдельный API «список школ для селекта» не обязателен.

---

## 4. Курсы и доступы

Все маршруты (кроме помеченных TODO): **`Authorization: Bearer`**, роль **`super_admin`**.

### Объект курса в ответах

Один элемент списка, `GET :courseId`, `POST`, `PATCH` — одна схема:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | uuid | |
| `title` | string | |
| `description` | string \| null | |
| `level` | string | `beginner` \| `intermediate` \| `advanced` |
| `isPublished` | boolean | |
| `order` | number | сортировка в каталоге |
| `createdAt`, `updatedAt` | ISO datetime | |
| `thumbnailUrl` | string \| null | обложка |
| `ageGroup` | string \| null | возрастная метка |
| `moduleCount` | number | число модулей |
| `studentsCount` | number | уникальные студенты: активный доступ **или** любой прогресс по курсу |

### `GET /admin/courses`

**Query:** `page` (default 1), `limit` (default 20, max 100), `search` (по `title` ILIKE), `isPublished` (`true`/`false`), `level` (`beginner`…), `sort`:

| `sort` | Поведение |
|--------|-----------|
| `order_asc` | по умолчанию: `order` ↑, затем `title` |
| `order_desc` | `order` ↓ |
| `title_asc` / `title_desc` | по названию |
| `createdAt_asc` / `createdAt_desc` | по дате создания |

**Ответ `200`:** `{ items, total, page, limit, totalPages }`.

### `GET /admin/courses/:courseId`

**200** — объект курса. **404** — нет курса.

### `POST /admin/courses`

Как **`application/json`**, так и **`multipart/form-data`** с теми же полями + опциональный файл в поле **`thumbnail`**.

- **JSON:** обязательно `title`, `level`; опционально `description`, `isPublished` (default `false`), `order` (default `0`), `thumbnailUrl`, `ageGroup`.
- **Multipart:** те же имена полей; файл обложки — **`thumbnail`** (MIME как у `POST /admin/upload/image`: jpeg, png, gif, webp, svg). Сохранение в `uploads/images`, в БД — путь вида `/api/v1/files/images/<uuid>.<ext>`. Если в запросе есть файл `thumbnail`, значение **`thumbnailUrl` из тела не используется** (приоритет у загрузки).

**201** — созданный курс (`moduleCount: 0`, `studentsCount: 0`).

### `PATCH /admin/courses/:courseId`

- **`application/json`** — как раньше: можно передать **только нужные поля**, в т.ч. **`thumbnailUrl`** строкой.
- **`multipart/form-data`** — можно передать **только файл** в поле **`thumbnail`** (без остальных полей) **или** файл + любые поля (`title`, `description`, …). Если в запросе есть файл `thumbnail`, он сохраняется на диск, в **`thumbnailUrl`** пишется путь `/api/v1/files/images/...`; значение **`thumbnailUrl` из тела в этом случае перезаписывается** (на фронте при multipart с файлом поле `thumbnailUrl` в FormData не дублируют).

Пример **только смены обложки** (без других полей):

```ts
const form = new FormData();
form.append("thumbnail", file);

await fetch(`${base}/admin/courses/${courseId}`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
```

**200** — обновлённый курс.

### `DELETE /admin/courses/:courseId`

**204** — удалён (только без модулей и без студентов по метрике выше).

**409** — есть модули или студенты; текст про снятие с публикации / модули / доступ.

### Прочее (редактор)

- Список модулей курса: **`GET /admin/courses/:courseId/modules`** — те же query, что у `GET /admin/modules` (`page`, `limit`, `search`, `isPublished`, `sort`), но **`courseId` в пути**, не в query; ответ как у `GET /admin/modules?courseId=…` (см. §5). Альтернатива: `GET /admin/modules?courseId=…`.
- **`GET /admin/courses/:courseId/accesses`** — список выданных доступов. Клиент: `fetchSuperCourseAccesses`.
- **`POST /admin/courses/:courseId/access`** — выдача доступа **ученику** (`role: student`). Тело: `userId`, `accessType` (`permanent` \| `temporary`), опц. `expiresAt` (ISO).
- `DELETE /admin/courses/:courseId/access/:userId` → **204**.
- **`GET /admin/courses/:courseId/students`** — студенты с **активным доступом** или с **прогрессом** по курсу. Клиент: `fetchSuperCourseStudents` — `lib/api/super-admin/courses-modules.ts`.

Клиент: `lib/api/super-admin/courses-modules.ts` · панель `/super-admin/courses`.

---

## 5. Модули и контент

База: `/api/v1`, **`Authorization: Bearer`**, роль **`super_admin`**.

### Модуль в ответах

`id`, `courseId`, `title`, `description`, `order`, `isPublished`, `unlockAfterModuleId`, `createdAt`, `updatedAt`, `contentCount`, `progressCount`, `hasQuiz`, `quizId`.

| Метод | Путь | Принимает | Возвращает |
|-------|------|-----------|------------|
| GET | `/admin/modules` | Query: **обяз.** `courseId`; опц. `page`, `limit`, `search`, `isPublished`, `sort` (`order_asc` … `createdAt_desc`) | **200:** `{ items[], total, page, limit, totalPages }` |
| GET | `/admin/courses/:courseId/modules` | Те же query **без** `courseId` (он в пути): `page`, `limit`, `search`, `isPublished`, `sort` | **200:** то же, что `GET /admin/modules?courseId=…` |
| GET | `/admin/modules/:moduleId` | — | **200:** модуль. **404** |
| POST | `/admin/modules` | Body: обяз. `courseId`, `title`; опц. `description`, `order`, `isPublished`, `unlockAfterModuleId` | **201:** модуль (счётчики с нуля) |
| PATCH | `/admin/modules/:moduleId` | Любое из: `title`, `description`, `order`, `isPublished`, `unlockAfterModuleId` (`null` — снять условие) | **200:** модуль |
| DELETE | `/admin/modules/:moduleId` | — | **204.** **409** — есть прогресс по модулю или попытки теста |

### Блоки контента

| Метод | Путь | Принимает | Возвращает |
|-------|------|-----------|------------|
| GET | `/admin/modules/:moduleId/contents` | — | **200:** массив: `id`, `moduleId`, `type`, `title`, `content`, `fileUrl`, `duration`, `order`, `livestreamUrl`, `livestreamStartsAt`, `createdAt`, `updatedAt` |
| POST | `/admin/modules/:moduleId/contents` | Обяз. `type` (`image` \| `video` \| `file` \| `text` \| `livestream` \| `link`); опц. `title`, `content`, `fileUrl`, `duration`, `order`, `livestreamUrl`, `livestreamStartsAt` | **201:** блок |
| POST | `/admin/modules/:moduleId/content` | То же, что POST `…/contents` | **201:** блок |
| POST | `/admin/modules/:moduleId/contents/from-file` | **multipart/form-data**: обяз. `file`, `type` (`image` \| `video` \| `file`); опц. `title`, `order`, `content`. Файл как в `/admin/upload/*`, в блок — `fileUrl` вида `/api/v1/files/...` | **201:** блок |
| PATCH | `/admin/modules/:moduleId/contents/:contentId` | Частично поля блока | **200:** блок. **404** |

**Правила для типа `image` (JSON):** внешние ссылки `http://` / `https://` для `fileUrl` **запрещены**. Допустим только путь на этот бэкенд: `/api/v1/files/images/...` (например после `POST /admin/upload/image` или через `…/contents/from-file`). Если `fileUrl` нет — ошибка с подсказкой использовать `from-file` или сначала upload. **PATCH** блока `image`: после правок `fileUrl` должен оставаться путём `/api/v1/files/images/...`, не внешний URL.

| DELETE | `/admin/modules/:moduleId/contents/:contentId` | — | **204.** **404** |

**Ошибки:** **400** (напр. `unlockAfterModuleId` не из этого курса), **401** / **403**, **404** (курс / модуль / контент), **409** только на DELETE модуля.

Клиент: `lib/api/super-admin/courses-modules.ts` (`listAdminModules`, `getAdminModule`, `createSuperModule`, `updateAdminModule`, `deleteAdminModule`, `listModuleContents`, `createModuleContent`, …).

### 5.1. Тесты (квизы) модуля

Префикс **`/api/v1/admin`**, **`Authorization: Bearer`**, роль **`super_admin`**.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/admin/modules/:moduleId/quiz` | Полное дерево теста с вопросами и ответами или `null` |
| POST | `/admin/modules/:moduleId/quiz/import-generated` | Импорт вопросов из ИИ (тело по бэку; см. `importGeneratedModuleQuiz`) |
| POST | `/admin/modules/:moduleId/quiz` | Создать тест (один на модуль): `title`, `passingScore`, опц. `maxAttempts`, `timeLimitMinutes`, `shuffleQuestions` |
| PATCH | `/admin/quizzes/:quizId` | Настройки теста |
| DELETE | `/admin/quizzes/:quizId` | **204**; **409** если есть `quiz_attempts` |
| POST | `/admin/quizzes/:quizId/questions` | Вопрос: `text`, `type` (`single` \| `multiple` \| `text`), `order`, `imageUrl`, `answers[]` `{ text, isCorrect }` |
| PATCH | `/admin/questions/:questionId` | Частичное обновление вопроса |
| DELETE | `/admin/questions/:questionId` | **204** |
| POST | `/admin/questions/:questionId/answers` | Добавить вариант: `{ text, isCorrect }` |
| PATCH | `/admin/answers/:answerId` | |
| DELETE | `/admin/answers/:answerId` | **204** |

Клиент: `lib/api/super-admin/quizzes.ts`.

---

## 6. Загрузки

| Метод | Путь | Описание |
|--------|------|----------|
| POST | `/admin/upload/image` | Изображение (`multipart`), клиент: `uploadSuperImage` |
| POST | `/admin/upload/video` | Видео — `uploadSuperVideo` |
| POST | `/admin/upload/file` | Файл — `uploadSuperFile` |

Клиент: `lib/api/super-admin/upload.ts`.

---

## 7. ИИ (админ)

Префикс `/admin/ai/*`. На бэкенде: **JwtAuthGuard** + **RolesGuard**, доступ только **`super_admin`**.

| Метод | Путь | Описание |
|--------|------|----------|
| POST | `/admin/ai/quiz/generate` | Генерация вопросов по тексту модуля |
| POST | `/admin/ai/summarize` | Краткое содержание |
| POST | `/admin/ai/transcribe` | Транскрибация файла (`multipart`) |

Тела: `quiz/generate` — `moduleId` \| `moduleText`, `questionCount`, `difficulty?`; `summarize` — `moduleId` \| `text`; `transcribe` — поле `file`.

Клиент: `lib/api/super-admin/ai.ts`.

---

## 8. Устройства и уведомления

Роли: **`super_admin`** \| **`school_admin`** (см. контроллер).

| Метод | Путь | Описание |
|--------|------|----------|
| GET | `/admin/device-violations` | Нарушения лимита устройств |
| GET | `/admin/notifications` | Уведомления (`?unreadOnly`) |
| PATCH | `/admin/notifications/:id/read` | Прочитано |
| GET | `/admin/users/:userId/devices` | Устройства ученика |
| DELETE | `/admin/users/:userId/devices/:deviceId` | Снять устройство |

**Авторизация:** **`Authorization: Bearer`** (не `x-user-id`). Супер-админ: данные **по всей платформе**; школьный админ — в рамках школы.

Клиенты: `lib/api/super-admin/notifications.ts`, школьный — `lib/api/school-admin/*`.

---

## 9. Только супер-админ

Гео: CRUD `/admin/cities`, `districts`, `schools`. Также: `courses`, `modules`, `…/contents`, квизы (`/admin/modules/…/quiz`, `/admin/quizzes`, `/admin/questions`, `/admin/answers`), upload, `/admin/ai/*`.

---

## 10. Ошибки

См. также **«Коды ответов (кратко)»** в начале документа. Дополнительно: **400** (валидация), **503** (например OpenAI).

---

Код фронта: `lib/api/super-admin/*` (в т.ч. `users.ts`, `stats.ts`, `certificates.ts`, `school-admins.ts`, `courses-modules.ts`, `quizzes.ts`), панель `/super-admin/*`.

---

## 11. Соответствие бэкенду (Nest)

| Область | Бэкенд (ориентир) | Фронт (super-admin) |
|--------|-------------------|---------------------|
| Пользователи | `admin-users` + DTO, `PUT` с ролью/школой | `users.ts`: **`fetchSuperAdminMe`**, `fetchSuperUsers`, `fetchSuperUser`, **`updateSuperUser` (PUT)**, **`deleteSuperUser`**, `activateSuperUser`, progress/certificates/devices |
| Сводка / сертификаты | `stats`, `certificates` | `stats.ts`, `certificates.ts` |
| Курс: модули, доступ, студенты | `admin-course-access`, модули по пути `:courseId` | `courses-modules.ts`: `listAdminModules` → `GET .../courses/:id/modules`, **`fetchSuperCourseAccesses`**, **`grantSuperCourseAccess`**, `revokeSuperCourseAccess`, **`fetchSuperCourseStudents`** |
| Квизы | `admin-quiz` + DTO | `quizzes.ts` (в т.ч. **`importGeneratedModuleQuiz`**) |
| Загрузки | `upload/image`, `video`, `file` | `upload.ts` (`uploadSuperImage`, …) |
| ИИ | `AiModule` + Auth | `ai.ts` |
| Устройства | `DeviceModule` + `AuthModule` (forwardRef), Bearer | `notifications.ts`, токен супер-админа |
