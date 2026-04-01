export const SUPER_ADMIN_ROUTES = {
  /** Агрегированная статистика */
  STATS_SUMMARY: "/admin/stats/summary",
  /** Сертификаты (платформа): список / создание */
  CERTIFICATES: "/admin/certificates",
  CERTIFICATE: (id: string) =>
    `/admin/certificates/${encodeURIComponent(id)}`,

  CITIES: "/admin/cities",
  CITY: (id: string) => `/admin/cities/${encodeURIComponent(id)}`,
  DISTRICTS: "/admin/districts",
  DISTRICT: (id: string) => `/admin/districts/${encodeURIComponent(id)}`,
  SCHOOLS: "/admin/schools",
  SCHOOL: (id: string) => `/admin/schools/${encodeURIComponent(id)}`,
  /** GET — список админов школы: query `page`, `limit`, `search`, `isActive` (без schoolId в query) */
  SCHOOL_ADMINS_BY_SCHOOL: (schoolId: string) =>
    `/admin/schools/${encodeURIComponent(schoolId)}/admins`,

  SCHOOL_ADMINS: "/admin/school-admins",
  SCHOOL_ADMIN: (id: string) =>
    `/admin/school-admins/${encodeURIComponent(id)}`,

  USERS: "/admin/users",
  /** school_admin | super_admin — текущий пользователь (профиль без пароля) */
  ME: "/admin/me",
  USER: (id: string) => `/admin/users/${encodeURIComponent(id)}`,
  USER_ACTIVATE: (id: string) =>
    `/admin/users/${encodeURIComponent(id)}/activate`,
  USER_PROGRESS: (id: string) =>
    `/admin/users/${encodeURIComponent(id)}/progress`,
  USER_CERTIFICATES: (id: string) =>
    `/admin/users/${encodeURIComponent(id)}/certificates`,
  USER_DEVICES: (id: string) =>
    `/admin/users/${encodeURIComponent(id)}/devices`,
  USER_DEVICE_DELETE: (userId: string, deviceId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/devices/${encodeURIComponent(deviceId)}`,

  COURSES: "/admin/courses",
  COURSE: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}`,
  COURSE_MODULES: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/modules`,
  /** GET — список выданных доступов к курсу */
  COURSE_ACCESSES: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/accesses`,
  /** POST — выдать доступ */
  COURSE_ACCESS: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/access`,
  COURSE_ACCESS_BULK: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/access/bulk`,
  COURSE_ACCESS_REVOKE: (courseId: string, userId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/access/${encodeURIComponent(userId)}`,
  COURSE_STUDENTS: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/students`,

  MODULES: "/admin/modules",
  MODULE: (moduleId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}`,
  MODULE_CONTENTS: (moduleId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}/contents`,
  /** POST — то же, что MODULE_CONTENTS */
  MODULE_CONTENT: (moduleId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}/content`,
  MODULE_CONTENT_ITEM: (moduleId: string, contentId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}/contents/${encodeURIComponent(contentId)}`,
  /** multipart: file + type (image|video|file) */
  MODULE_CONTENT_FROM_FILE: (moduleId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}/contents/from-file`,

  MODULE_QUIZ: (moduleId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}/quiz`,
  /** GET — журнал оценок по модулю (обязателен query schoolId для super_admin) */
  MODULE_GRADE_OVERVIEW: (moduleId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}/grade-overview`,

  HOMEWORK_SUBMISSIONS: "/admin/homework-submissions",
  HOMEWORK_SUBMISSION: (submissionId: string) =>
    `/admin/homework-submissions/${encodeURIComponent(submissionId)}`,
  /** POST — импорт вопросов из ИИ в тест модуля */
  MODULE_QUIZ_IMPORT_GENERATED: (moduleId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}/quiz/import-generated`,
  QUIZ: (quizId: string) =>
    `/admin/quizzes/${encodeURIComponent(quizId)}`,
  QUIZ_QUESTIONS: (quizId: string) =>
    `/admin/quizzes/${encodeURIComponent(quizId)}/questions`,
  QUESTION: (questionId: string) =>
    `/admin/questions/${encodeURIComponent(questionId)}`,
  QUESTION_ANSWERS: (questionId: string) =>
    `/admin/questions/${encodeURIComponent(questionId)}/answers`,
  ANSWER: (answerId: string) =>
    `/admin/answers/${encodeURIComponent(answerId)}`,

  UPLOAD_IMAGE: "/admin/upload/image",
  UPLOAD_VIDEO: "/admin/upload/video",
  UPLOAD_FILE: "/admin/upload/file",

  AI_QUIZ_GENERATE: "/admin/ai/quiz/generate",
  AI_SUMMARIZE: "/admin/ai/summarize",
  AI_TRANSCRIBE: "/admin/ai/transcribe",

  DEVICE_VIOLATIONS: "/admin/device-violations",
  NOTIFICATIONS: "/admin/notifications",
  NOTIFICATION_READ: (id: string) =>
    `/admin/notifications/${encodeURIComponent(id)}/read`,
  NOTIFICATIONS_READ_ALL: "/admin/notifications/read-all",
} as const;
