/** Пути школьного админа относительно /api/v1 */
export const SCHOOL_ADMIN_ROUTES = {
  /** Только school_admin — школа + район + город */
  MY_SCHOOL: "/admin/my-school",
  /** Только school_admin — сводная статистика по школе */
  SCHOOL_STATS: "/admin/school/stats",
  /** school_admin | super_admin — профиль из БД */
  ME: "/admin/me",

  USERS: "/admin/users",
  /** POST multipart .xlsx — массовое создание учеников (только school_admin) */
  USERS_IMPORT: "/admin/users/import",
  /** GET — CSV экспорт учеников (только school_admin) */
  USERS_EXPORT: "/admin/users/export",
  USER: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}`,
  USER_ACTIVATE: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/activate`,
  USER_PROGRESS: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/progress`,
  USER_CERTIFICATES: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/certificates`,
  USER_QUIZ_ATTEMPTS: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/quiz-attempts`,
  USER_DEVICES: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/devices`,
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
  COURSE_ACCESS: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/access`,
  COURSE_ACCESS_BULK: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/access/bulk`,
  COURSE_ACCESS_REVOKE: (courseId: string, userId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/access/${encodeURIComponent(userId)}`,
  COURSE_STUDENTS: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/students`,

  /** GET ?moduleId= — сдачи ДЗ по модулю (school_admin; super_admin + schoolId) */
  HOMEWORK_SUBMISSIONS: "/admin/homework-submissions",
  HOMEWORK_SUBMISSION: (submissionId: string) =>
    `/admin/homework-submissions/${encodeURIComponent(submissionId)}`,
  /** GET — журнал: тест + ДЗ по ученикам школы */
  MODULE_GRADE_OVERVIEW: (moduleId: string) =>
    `/admin/modules/${encodeURIComponent(moduleId)}/grade-overview`,

  DEVICE_VIOLATIONS: "/admin/device-violations",
  NOTIFICATIONS: "/admin/notifications",
  NOTIFICATION_READ: (id: string) =>
    `/admin/notifications/${encodeURIComponent(id)}/read`,
  NOTIFICATIONS_READ_ALL: "/admin/notifications/read-all",
} as const;
