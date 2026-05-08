import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";
import { normalizeHomeworkSubmission } from "@/lib/api/admin/homework-normalize";
import type {
  HomeworkSubmissionRow,
  PatchHomeworkSubmissionBody,
} from "@/lib/api/school-admin/homework";

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.data)) return o.data as unknown[];
  if (Array.isArray(o.submissions)) return o.submissions as unknown[];
  return [];
}

/** GET /admin/homework-submissions?lessonId=&schoolId= */
export async function fetchSuperHomeworkSubmissions(
  lessonId: string,
  schoolId: string,
): Promise<HomeworkSubmissionRow[]> {
  const q = new URLSearchParams({ lessonId, schoolId });
  const res = await apiSuperAdminFetch(
    `${SUPER_ADMIN_ROUTES.HOMEWORK_SUBMISSIONS}?${q}`,
  );
  await throwIfNotOk(res);
  const json = await parseJsonSafe<unknown>(res);
  return unwrapList(json)
    .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
    .map((row) => {
      const n = normalizeHomeworkSubmission(row);
      return { ...n, id: String(n.id ?? row.id ?? "") } as HomeworkSubmissionRow;
    });
}

export async function patchSuperHomeworkSubmission(
  submissionId: string,
  body: PatchHomeworkSubmissionBody,
): Promise<HomeworkSubmissionRow> {
  const res = await apiSuperAdminFetch(
    SUPER_ADMIN_ROUTES.HOMEWORK_SUBMISSION(submissionId),
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  await throwIfNotOk(res);
  const data = await parseJsonSafe<unknown>(res);
  const row =
    data && typeof data === "object" && "data" in data
      ? (data as { data: unknown }).data
      : data;
  if (!row || typeof row !== "object") {
    throw new Error("Пустой ответ при сохранении оценки");
  }
  const n = normalizeHomeworkSubmission(row as Record<string, unknown>);
  return { ...n, id: String(n.id ?? "") } as HomeworkSubmissionRow;
}

/** GET /admin/lessons/:lessonId/grade-overview?schoolId= */
export async function fetchSuperLessonGradeOverview(
  lessonId: string,
  schoolId: string,
): Promise<unknown> {
  const q = new URLSearchParams({ schoolId });
  const res = await apiSuperAdminFetch(
    `${SUPER_ADMIN_ROUTES.LESSON_GRADE_OVERVIEW(lessonId)}?${q}`,
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

/** @deprecated */
export const fetchSuperModuleGradeOverview = fetchSuperLessonGradeOverview;
