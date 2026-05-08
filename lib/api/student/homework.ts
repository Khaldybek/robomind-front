import { apiFetch, parseJsonSafe, throwIfNotOk } from "@/lib/api/client";
import { normalizeHomeworkSubmission } from "@/lib/api/admin/homework-normalize";
import { STUDENT_ROUTES } from "@/lib/api/routes";

export type ModuleHomeworkSubmission = {
  id: string;
  lessonId?: string;
  /** @deprecated */
  moduleId?: string;
  fileUrl: string;
  fileName?: string;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  studentComment?: string | null;
  maxPoints: number;
  points: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
  gradedByUserId?: string | null;
  [key: string]: unknown;
};

export type ModuleHomeworkGetResponse = {
  submission: ModuleHomeworkSubmission | null;
  homeworkAvailable: boolean;
};

function parseHomeworkGet(
  raw: unknown,
  homeworkAvailable: boolean,
): ModuleHomeworkGetResponse {
  if (!raw || typeof raw !== "object")
    return { submission: null, homeworkAvailable };
  const o = raw as Record<string, unknown>;
  const inner = (o.data && typeof o.data === "object" ? o.data : o) as Record<
    string,
    unknown
  >;
  const sub = inner.submission;
  if (sub === null || sub === undefined)
    return { submission: null, homeworkAvailable };
  if (typeof sub === "object" && sub !== null) {
    return {
      submission: normalizeHomeworkSubmission(
        sub as Record<string, unknown>,
      ) as ModuleHomeworkSubmission,
      homeworkAvailable,
    };
  }
  return { submission: null, homeworkAvailable };
}

/** GET /app/lessons/:lessonId/homework */
export async function fetchLessonHomework(
  lessonId: string,
): Promise<ModuleHomeworkGetResponse> {
  const res = await apiFetch(STUDENT_ROUTES.LESSON_HOMEWORK(lessonId));
  if (res.status === 404) {
    return { submission: null, homeworkAvailable: false };
  }
  await throwIfNotOk(res);
  const json = await parseJsonSafe<unknown>(res);
  return parseHomeworkGet(json, true);
}

/** @deprecated */
export const fetchModuleHomework = fetchLessonHomework;

/**
 * POST /app/lessons/:lessonId/homework — multipart: `file`, опционально `comment`.
 */
export async function postLessonHomework(
  lessonId: string,
  file: File,
  comment?: string,
): Promise<ModuleHomeworkGetResponse> {
  const body = new FormData();
  body.append("file", file, file.name);
  if (comment != null && comment.trim() !== "") {
    body.append("comment", comment.trim());
  }
  const res = await apiFetch(STUDENT_ROUTES.LESSON_HOMEWORK(lessonId), {
    method: "POST",
    body,
  });
  await throwIfNotOk(res);
  const json = await parseJsonSafe<unknown>(res);
  return parseHomeworkGet(json, true);
}

/** @deprecated */
export const postModuleHomework = postLessonHomework;
