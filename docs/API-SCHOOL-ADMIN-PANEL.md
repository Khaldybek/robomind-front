# API администратора школы (`school_admin`) — контракт бэкенда

База: **`{ORIGIN}/api/v1`**

**Авторизация:** `Authorization: Bearer <access_token>` (JWT после `POST /auth/login` **без** `deviceId`).

В JWT у пользователя с ролью `school_admin` в payload/профиле есть **`schoolId`** — все данные ограничены этой школой.

---

## Общие правила

| Код | Когда |
|-----|--------|
| **401** | Нет/просрочен токен |
| **403** | Роль не подходит; ученик не из вашей школы; запрещённое действие |
| **404** | Сущность не найдена или **скрыта** (например, неопубликованный курс для школьного админа) |

- Список пользователей `GET /admin/users` — **только ученики (`student`) своей школы**; в списке **ИИН маскируется** строкой `••••••••••••`.
- В карточке ученика `GET /admin/users/:id` ИИН возвращается **полностью** (для работы администратора).
- **Курсы:** видны **только опубликованные** (`isPublished: true`). Создание/редактирование/удаление курсов — **только у супер-админа** (у школьного — `403`).
- **Модули курса:** в `GET /admin/courses/:courseId/modules` возвращаются **только опубликованные** модули опубликованного курса.
- В списке и карточке курса поле **`studentsCount`** для `school_admin` считается **только по ученикам вашей школы** (доступ или прогресс по курсу). У супер-админа — по всей платформе.

---

## Область ответственности (продукт)

- Ученики **своей** школы: список, активация, просмотр, выдача/отзыв доступа к курсам.
- Уведомления (лимит устройств и др.) **по своим** ученикам.
- Управление **устройствами** учеников своей школы.
- **Нет:** создание городов/районов/школ, курсов/модулей, загрузка контента, ИИ-редактор — **супер-админ** (`API-SUPER-ADMIN-PANEL.md`).

---

## 1. Вход

### `POST /auth/login`

**Тело (JSON):**

| Поле | Тип | Обязательно |
|------|-----|---------------|
| `email` | string | да |
| `password` | string | да |

`deviceId` **не** передаётся.

**Ответ `200`:**

| Поле | Описание |
|------|----------|
| `accessToken` | JWT |
| `refreshToken` | строка |
| `expiresIn` | секунды access |
| `tokenType` | `"Bearer"` |
| `user` | объект пользователя: ожидается `role: "school_admin"`, `schoolId: "<uuid>"` |

Клиент: `lib/api/school-admin/auth.ts` — парсинг через `parseLoginResponse` (`accessToken` / snake_case); после входа фронт проверяет роль **`school_admin`**, если `user` пришёл в ответе.

---

## 2. Своя школа

### `GET /admin/my-school`

**Роль:** только `school_admin`.

**Запрос:** без тела.

**Ответ `200`:** объект с вложенными `school`, `district`, `city` (район и город — `null`, если нет связи в БД). Поля см. контракт бэка (`districtId`, `name`, `number`, `address`, `isActive`, даты).

**403** — у пользователя нет `schoolId`.

Клиент: `fetchMySchool()` — `lib/api/school-admin/my-school.ts`.

---

## 2b. Сводка по школе

### `GET /admin/school/stats`

**Роль:** только `school_admin`.

**Запрос:** без тела.

**Ответ `200`:** JSON со полями:

| Поле | Смысл |
|------|--------|
| `schoolId` | uuid школы |
| `students.total` / `active` / `inactive` | ученики школы |
| `courseAccess.activeRows` | число активных строк в `course_accesses` у учеников школы |
| `courseAccess.coursesWithAccess` | сколько **разных курсов** имеют хотя бы одного ученика школы с активным доступом |
| `deviceViolationsTotal` | нарушения лимита устройств (по школе) |
| `unreadNotificationsForCurrentAdmin` | непрочитанные уведомления **текущего** админа |
| `generatedAt` | ISO-8601 |

**403** — нет `schoolId` у пользователя.

Клиент: `fetchSchoolStats()` — `lib/api/school-admin/school-stats.ts`. Дашборд `/school-admin/dashboard` использует сводку; при ошибке запроса — запасной вариант через отдельные эндпоинты.

---

## 3. Текущий пользователь (JWT)

### `GET /admin/me`

**Роли:** `school_admin` | `super_admin`.

**Запрос:** без тела.

**Ответ `200`:** полный профиль из БД (без пароля):

| Поле | Описание |
|------|----------|
| `id`, `email`, `firstName`, `lastName`, `patronymic`, `iin` | |
| `role` | `school_admin` или `super_admin` |
| `isActive` | boolean |
| `schoolId` | uuid \| null |
| `school` | `{ id, name, number, districtId }` \| null |
| `avatarUrl` | string \| null |
| `createdAt`, `updatedAt` | ISO |

Клиент: `fetchSchoolAdminMe()` / `fetchSuperAdminMe()` — `lib/api/school-admin/my-school.ts`, `lib/api/super-admin/users.ts`.

---

## 4. Пользователи (ученики школы)

### `GET /admin/users`

**Query:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `page` | number | по умолчанию 1 |
| `limit` | number | по умолчанию 20, макс. 100 |
| `search` | string | email, ФИО, ИИН (частичное совпадение) |
| `isActive` | boolean | фильтр по активности |

Поля `schoolId` и `role` в query **игнорируются** — всегда подставляются школа из JWT и роль `student`.

**Ответ `200`:** `{ items, total, page, limit, totalPages }`. Элементы `items`: `id`, `iin` (в списке маскирован как `••••••••••••`), `email`, `firstName`, `lastName`, `patronymic`, `role: "student"`, `isActive`, `schoolId`, `school: { id, name, number }`, `avatarUrl`, `createdAt`, `updatedAt`.

Фронт также принимает массив в корне ответа. Клиент: `fetchSchoolUsers` — `lib/api/school-admin/users.ts`.

### `GET /admin/users/export`

**Роль:** только `school_admin`.

**Запрос:** без тела.

**Ответ `200`:** файл **`text/csv; charset=utf-8`**, заголовок `Content-Disposition: attachment; filename="students.csv"`. Первая строка — BOM (`\uFEFF`) для Excel.

**Колонки:** `email`, `firstName`, `lastName`, `iin`, `isActive`, `createdAt` (ISO).

**403** — не `school_admin`.

Клиент: `fetchSchoolUsersExportCsv` / `downloadSchoolUsersCsv` — `lib/api/school-admin/users.ts`.

### `GET /admin/users/:userId`

**Ответ `200`:** тот же объект пользователя, что и в списке, но **`iin` без маски** (12 цифр).

**403** — пользователь не ученик или не вашей школы.

Клиент: `fetchSchoolUser`.

### `PUT /admin/users/:userId`

Частичное обновление. **Разрешённые поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| `firstName` | string | опционально |
| `lastName` | string | опционально |
| `patronymic` | string \| null | опционально |
| `isActive` | boolean | опционально |
| `avatarUrl` | string \| null | опционально |
| `password` | string | опционально, мин. 8 символов — смена пароля ученика |

**Запрещено** (иначе **403**): `email`, `iin`, `role`, `schoolId`.

**Ответ `200`:** обновлённый пользователь (ИИН полный).

Клиент: `updateSchoolUser` — тип `UpdateSchoolUserBody`.

### `PATCH /admin/users/:userId/activate`

Выставляет `isActive: true`.

**Ответ `200`:** объект пользователя.

**403** — нет доступа к ученику.

Клиент: `activateSchoolUser`.

### `DELETE /admin/users/:userId`

**403** для администратора школы (удаление только у супер-админа).

Клиент: `deleteSchoolUser` (ожидаемо 403).

### `GET /admin/users/:userId/progress`

**Ответ `200`:** массив объектов:

| Поле | Тип |
|------|-----|
| `id` | uuid |
| `courseId` | uuid |
| `courseTitle` | string \| null |
| `moduleId` | uuid |
| `moduleTitle` | string \| null |
| `status` | enum прогресса |
| `completedAt` | ISO \| null |
| `watchedSeconds` | number |
| `createdAt`, `updatedAt` | ISO |

Клиент: `fetchUserProgressAdmin` — тип `UserProgressRowAdmin[]`.

### `GET /admin/users/:userId/certificates`

**Ответ `200`:** массив:

| Поле | Тип |
|------|-----|
| `id` | uuid |
| `courseId` | uuid |
| `courseTitle` | string \| null |
| `issuedAt` | ISO |
| `pdfUrl` | string \| null |
| `uniqueCode` | string |
| `createdAt` | ISO |

Клиент: `fetchUserCertificatesAdmin` — тип `UserCertificateRowAdmin[]`.

### `GET /admin/users/:userId/quiz-attempts`

Попытки прохождения тестов ученика (метаданные и баллы; **тексты ответов не отдаются**).

**Ответ `200`:** массив объектов:

| Поле | Тип |
|------|-----|
| `id` | uuid попытки |
| `quizId` | uuid |
| `userId` | uuid |
| `score`, `maxScore` | number |
| `isPassed` | boolean |
| `startedAt`, `completedAt` | ISO \| null |
| `hasStoredAnswers` | boolean — есть ли сохранённые ответы после завершения |
| `courseId`, `courseTitle` | uuid \| string \| null |
| `moduleId`, `moduleTitle` | uuid \| string \| null |
| `quizTitle` | string \| null |
| `createdAt` | ISO |

**403** — ученик не из вашей школы (для `school_admin`).

Клиент: `fetchUserQuizAttemptsAdmin` — тип `UserQuizAttemptRowAdmin[]`.

---

## 5. Курсы (чтение + доступы)

Только **опубликованные** курсы в каталоге `GET /admin/courses`.

### `GET /admin/courses`

Список **только опубликованных** курсов.

**Query:** как у супер-админа (`page`, `limit`, `search`, `level`, `sort`). Фильтр `isPublished` не нужен — всегда опубликованные.

**Ответ `200`:** `{ items[], total, page, limit, totalPages }` — элементы как у админки курса (`id`, `title`, `description`, `level`, `isPublished`, `order`, `thumbnailUrl`, `ageGroup`, `moduleCount`, **`studentsCount` (только ученики школы)**, даты).

Клиент: `fetchSchoolAdminCourses` — `lib/api/school-admin/courses.ts` (алиас `fetchAdminCourses` без параметров).

### `GET /admin/courses/:courseId`

Один курс. Неопубликованный курс → **404**.

Клиент: `fetchSchoolAdminCourse`.

### `GET /admin/courses/:courseId/modules`

Список **опубликованных** модулей опубликованного курса.

**Query:** `page`, `limit`, `search`, `sort` (как в админке модулей). Фильтр `isPublished` с клиента не требуется.

**Ответ `200`:** `{ items[], total, page, limit, totalPages }` с полями модуля (`id`, `courseId`, `title`, `description`, `order`, `isPublished`, `unlockAfterModuleId`, `contentCount`, `progressCount`, `hasQuiz`, `quizId`, даты).

Клиент: `listSchoolAdminCourseModules`.

### `GET /admin/courses/:courseId/students`

Ученики **вашей школы**, у которых есть доступ к курсу или прогресс по курсу.

**Ответ `200`:** массив:

```json
[
  {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "schoolId": "uuid",
    "isActive": true
  }
]
```

Клиент: `fetchCourseStudents` — тип `CourseSchoolStudentRow[]`.

### `GET /admin/courses/:courseId/accesses`

Список выданных доступов к курсу (детали — бэкенд).

### `POST /admin/courses/:courseId/access`

Выдача доступа ученику **вашей школы** к **опубликованному** курсу.

**Тело:**

| Поле | Тип | Обязательно |
|------|-----|---------------|
| `userId` | uuid | да, роль `student`, та же школа |
| `accessType` | `permanent` \| `temporary` | да |
| `expiresAt` | ISO string | для `temporary` — логически нужен срок |

**Ответ `201`:** объект записи доступа (как элемент в `listAccesses`). В БД в `grantedBy` — **ваш** `userId`.

**403** — ученик не из школы. **404** — курс не найден / не опубликован.

Клиент: `grantCourseAccess` — `lib/api/school-admin/courses.ts`.

### `POST /admin/courses/:courseId/access/bulk`

Массовая выдача тем же правилам, что одиночная.

**Тело:**

| Поле | Тип | Обязательно |
|------|-----|---------------|
| `userIds` | uuid[] | да, 1…200 уникальных id, без дубликатов в теле |
| `accessType` | `permanent` \| `temporary` | да |
| `expiresAt` | ISO string | опционально |

**Ответ `201`:** `{ grantedCount, granted[], errors[] }`. Коды в `errors`: `already_active`, `not_found` и др.

Клиент: `grantCourseAccessBulk` — `lib/api/school-admin/courses.ts`.

### `DELETE /admin/courses/:courseId/access/:userId`

Отзыв доступа (`revoked_at`). Ученик — вашей школы.

**Ответ `204`** без тела.

Клиент: `revokeCourseAccess`.

### Запрещённые для `school_admin` маршруты курсов

| Метод | Путь | Ответ |
|-------|------|--------|
| POST | `/admin/courses` | 403 |
| PATCH | `/admin/courses/:courseId` | 403 |
| DELETE | `/admin/courses/:courseId` | 403 |

---

## 6. Устройства и уведомления

Те же эндпоинты, что в общей админ-доке, с JWT. Заголовок **`x-user-id`** **не обязателен**, если используется Bearer.

| Метод | Путь |
|-------|------|
| GET | `/admin/device-violations` |
| GET | `/admin/notifications` |
| PATCH | `/admin/notifications/:id/read` |
| PATCH | `/admin/notifications/read-all` |
| GET | `/admin/users/:userId/devices` |
| DELETE | `/admin/users/:userId/devices/:deviceId` |

### `PATCH /admin/notifications/read-all`

Помечает **все** непрочитанные уведомления текущего админа как прочитанные.

**Ответ `200`:** `{ "updated": 12 }`.

Клиент: `markAllNotificationsRead` — `lib/api/school-admin/notifications.ts` (кнопка на панели уведомлений).

Для `school_admin` бэкенд ограничивает данные **своей школой** в списках нарушений и т.д.

---

## 7. Что недоступно школьному администратору

| Область | Роль / ответ |
|------|--------|
| Гео CRUD: `/admin/cities`, `/admin/districts`, `/admin/schools` | **403** (только `super_admin`) |
| Школьные админы: `/admin/school-admins` | **403** |
| Полный `/admin/users` как у супер-админа — чужие школы; удаление пользователей | **403** |
| Модули/контент/квизы: `/admin/modules/...` | **403** |
| Загрузки: `/admin/upload/*` | **403** |
| ИИ: `/admin/ai/*` | **403** |
| Статистика платформы: `/admin/stats/summary` | **403** |
| Глобальный реестр сертификатов: `/admin/certificates` | **403** |

---

## 8. Ошибки (сводка)

| Код | Когда |
|-----|--------|
| `401` | Нет/неверный токен |
| `403` | Роль; ученик не из школы; действие только для супер-админа |
| `404` | Не найдено или скрыто (например неопубликованный курс) |

---

## Код фронта

Панель: **`/school-admin/*`**.

| Раздел | Файлы |
|--------|--------|
| Вход | `lib/api/school-admin/auth.ts`, `components/school-admin/login-form.tsx` |
| Школа / профиль | `lib/api/school-admin/my-school.ts` (`fetchMySchool`, `fetchSchoolAdminMe`), шапка: `components/school-admin/admin-shell.tsx` |
| Сводка | `lib/api/school-admin/school-stats.ts` (`fetchSchoolStats`), дашборд: `app/school-admin/(panel)/dashboard/page.tsx` |
| Клиент HTTP | `lib/api/school-admin/client.ts` (Bearer + refresh) |
| Ученики | `lib/api/school-admin/users.ts` |
| Курсы | `lib/api/school-admin/courses.ts` |
| Уведомления / устройства | `lib/api/school-admin/notifications.ts` |

Супер-админ: `GET /admin/me` — `fetchSuperAdminMe()` в `lib/api/super-admin/users.ts`.

---

*Версия документа синхронизирована с реализацией guards и сервисов в `admin-api`.*
