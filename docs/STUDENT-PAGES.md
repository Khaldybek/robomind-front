# Страницы панели студента

| Маршрут | Статус | Примечание |
|---------|--------|------------|
| `/` | ✅ | Лендинг + «Войти» / «Регистрация» |
| `/login` | ✅ | Email (+ подсказка про ИИН), пароль, `deviceId` в localStorage |
| `/register` | ✅ | ИИН, ФИО+отчество, email, пароль, город→район→школа → `/pending-activation` |
| `/forgot-password` | ✅ | POST `/auth/forgot-password` |
| `/verify-email` | ✅ | `?token=` → GET `/auth/verify-email` |
| `/pending-activation` | ✅ | Текст «аккаунт на проверке» |
| `/403-device` | ✅ | Редирект при 403 логина (лимит устройств) |
| `/logout` | ✅ | Очистка токенов; `?full=1` — ещё сброс `deviceId` |
| `/dashboard` | ✅ | Курсы, прогресс-бары, блок ИИ (`GET /app/ai/recommendations`) |
| `/courses` | ✅ | Список курсов |
| `/courses/[courseId]` | ✅ | Описание/summary, модули, ссылка на ИИ |
| `/courses/.../modules/[moduleId]` | ✅ | Видео (HLS — заглушка), текст, файлы, эфир, «Тест», ссылка на чат |
| `/courses/.../quiz` | ✅ | Таймер, попытки, сдача (`POST .../submit`) |
| `/courses/.../quiz/review` | ✅ | Разбор из `sessionStorage` после сдачи |
| `/courses/[courseId]/chat` | ✅ | ИИ `POST /app/ai/chat`, опционально `?moduleId=` |
| `/progress` | ✅ | `GET /app/users/me/progress` |
| `/certificates` | ✅ | `GET /app/users/me/certificates`, скачивание по URL из ответа |
| `/profile` | ✅ | `GET/PATCH /app/users/me` |
| `/settings` | ✅ | Заглушки: пароль, уведомления; ссылки на forgot / logout |

**ИИ на странице модуля:** кнопка ведёт на `/courses/.../chat?moduleId=...` (аналог встроенного виджета).

Все защищённые маршруты кроме перечисленных публичных — под `AuthGuard` (наличие access token).
