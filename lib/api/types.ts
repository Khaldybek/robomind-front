/** Ученик: email + deviceId (лимит устройств на бэке) */
export type LoginRequest = {
  email: string;
  password: string;
  deviceId: string;
};

export type TokensPayload = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  access_token?: string;
  refresh_token?: string;
};

export type GeoItem = {
  id: string;
  name: string;
};

export type CourseSummary = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  /** Обложка курса: путь `/api/v1/files/images/...` или полный URL */
  thumbnailUrl?: string;
  /** Например `beginner` | `intermediate` | `advanced` */
  level?: string;
  /** Возрастная группа с бэка */
  ageGroup?: string;
  [key: string]: unknown;
};

export type StudentProfile = {
  id?: string;
  firstName?: string;
  lastName?: string;
  iin?: string;
  /** UUID школы — для рейтинга и лидерборда внутри школы */
  schoolId?: string;
  [key: string]: unknown;
};

/** Элемент списка модулей курса — поля уточнить по ответу бэка */
export type CourseModuleSummary = {
  id: string;
  title?: string;
  name?: string;
  order?: number;
  [key: string]: unknown;
};

/** Контент модуля (видео, текст, файлы) — структура с бэка */
export type ModuleContent = Record<string, unknown>;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}
