/**
 * Пути относительно NEXT_PUBLIC_API_BASE_URL (ожидается префикс `/api/v1` на бэке).
 * Сверяйте с `docs/API-STUDENT-PANEL.md`.
 */
export const STUDENT_ROUTES = {
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_LOGOUT_ALL: "/auth/logout-all",
  AUTH_FORGOT_PASSWORD: "/auth/forgot-password",
  AUTH_RESET_PASSWORD: "/auth/reset-password",
  /** Подтверждение почты: обычно GET ?token= */
  AUTH_VERIFY_EMAIL: "/auth/verify-email",

  /** Статика загрузок: `GET /api/v1/files/*` (каталог UPLOAD_DIR, по умолчанию `uploads`) */
  FILES_PREFIX: "/files",

  PROFILE: "/app/student/profile",
  PROFILE_ME: "/app/me",
  USER_ME: "/app/users/me",
  USER_ME_AVATAR: "/app/users/me/avatar",
  USER_ME_PROFILE: "/app/users/me/profile",
  USER_ME_DASHBOARD: "/app/users/me/dashboard",
  USER_ME_PROGRESS: "/app/users/me/progress",
  USER_ME_CERTIFICATES: "/app/users/me/certificates",

  COURSES: "/app/courses",
  COURSE_BY_ID: (courseId: string) =>
    `/app/courses/${encodeURIComponent(courseId)}`,
  /** Секции курса: в ответе поле `modules` — секции, не уроки */
  COURSE_MODULES: (courseId: string) =>
    `/app/courses/${encodeURIComponent(courseId)}/modules`,
  /** Уроки внутри секции */
  COURSE_MODULE_LESSONS: (courseModuleId: string) =>
    `/app/course-modules/${encodeURIComponent(courseModuleId)}/lessons`,
  LESSON_CONTENT: (lessonId: string) =>
    `/app/lessons/${encodeURIComponent(lessonId)}/content`,
  LESSON_QUIZ: (lessonId: string) =>
    `/app/lessons/${encodeURIComponent(lessonId)}/quiz`,
  LESSON_PROGRESS: (lessonId: string) =>
    `/app/lessons/${encodeURIComponent(lessonId)}/progress`,
  LESSON_HOMEWORK: (lessonId: string) =>
    `/app/lessons/${encodeURIComponent(lessonId)}/homework`,

  /** Начать / возобновить попытку */
  QUIZ_ATTEMPT: (quizId: string) =>
    `/app/quizzes/${encodeURIComponent(quizId)}/attempt`,
  /** Отправить ответы по попытке */
  ATTEMPT_SUBMIT: (attemptId: string) =>
    `/app/attempts/${encodeURIComponent(attemptId)}/submit`,

  /** Гео — без JWT */
  GEO_CITIES: "/app/cities",
  GEO_DISTRICTS: (cityId: string) =>
    `/app/cities/${encodeURIComponent(cityId)}/districts`,
  GEO_SCHOOLS: (districtId: string) =>
    `/app/districts/${encodeURIComponent(districtId)}/schools`,

  AI_CHAT: "/app/ai/chat",
  AI_CHAT_PROFILE: "/app/ai/chat-profile",
  AI_CHAT_COURSE: "/app/ai/chat-course",
  AI_RECOMMENDATIONS: "/app/ai/recommendations",
  AI_GRADE_TEXT: "/app/ai/grade-text",

  GAMIFICATION_ME: "/app/gamification/me",
  GAMIFICATION_MY_RANK: "/app/gamification/my-rank",
  GAMIFICATION_LEADERBOARD: "/app/gamification/leaderboard",
} as const;
