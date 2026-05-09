export const SUPER_ADMIN_ROUTES = {
  STATS_SUMMARY: "/admin/stats/summary",
  CERTIFICATES: "/admin/certificates",
  CERTIFICATE: (id: string) =>
    `/admin/certificates/${encodeURIComponent(id)}`,

  CITIES: "/admin/cities",
  CITY: (id: string) => `/admin/cities/${encodeURIComponent(id)}`,
  DISTRICTS: "/admin/districts",
  DISTRICT: (id: string) => `/admin/districts/${encodeURIComponent(id)}`,
  SCHOOLS: "/admin/schools",
  SCHOOL: (id: string) => `/admin/schools/${encodeURIComponent(id)}`,
  SCHOOL_ADMINS_BY_SCHOOL: (schoolId: string) =>
    `/admin/schools/${encodeURIComponent(schoolId)}/admins`,

  SCHOOL_ADMINS: "/admin/school-admins",
  SCHOOL_ADMIN: (id: string) =>
    `/admin/school-admins/${encodeURIComponent(id)}`,

  FORM_OPTIONS_SCHOOLS: "/admin/form-options/schools",
  FORM_OPTIONS_LESSONS: "/admin/form-options/lessons",

  USERS: "/admin/users",
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
  USER_QUIZ_ATTEMPTS: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/quiz-attempts`,
  USER_QUIZ_ATTEMPT_LIMITS: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/quiz-attempt-limits`,

  COURSES: "/admin/courses",
  COURSE: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}`,
  COURSE_MODULES: (courseId: string) =>
    `/admin/courses/${encodeURIComponent(courseId)}/modules`,
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

  /** Секция курса (модуль курса) */
  COURSE_MODULE: (courseModuleId: string) =>
    `/admin/course-modules/${encodeURIComponent(courseModuleId)}`,

  LESSONS: "/admin/lessons",
  LESSON: (lessonId: string) =>
    `/admin/lessons/${encodeURIComponent(lessonId)}`,
  LESSON_CONTENTS: (lessonId: string) =>
    `/admin/lessons/${encodeURIComponent(lessonId)}/contents`,
  LESSON_CONTENT: (lessonId: string) =>
    `/admin/lessons/${encodeURIComponent(lessonId)}/content`,
  LESSON_CONTENT_ITEM: (lessonId: string, contentId: string) =>
    `/admin/lessons/${encodeURIComponent(lessonId)}/contents/${encodeURIComponent(contentId)}`,
  LESSON_CONTENT_FROM_FILE: (lessonId: string) =>
    `/admin/lessons/${encodeURIComponent(lessonId)}/contents/from-file`,
  LESSON_QUIZ: (lessonId: string) =>
    `/admin/lessons/${encodeURIComponent(lessonId)}/quiz`,
  LESSON_GRADE_OVERVIEW: (lessonId: string) =>
    `/admin/lessons/${encodeURIComponent(lessonId)}/grade-overview`,
  LESSON_QUIZ_IMPORT_GENERATED: (lessonId: string) =>
    `/admin/lessons/${encodeURIComponent(lessonId)}/quiz/import-generated`,

  HOMEWORK_SUBMISSIONS: "/admin/homework-submissions",
  HOMEWORK_SUBMISSION: (submissionId: string) =>
    `/admin/homework-submissions/${encodeURIComponent(submissionId)}`,

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
