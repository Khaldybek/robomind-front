import {
  apiSchoolAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/school-admin/client";
import { SCHOOL_ADMIN_ROUTES } from "@/lib/api/school-admin/routes";
import { normalizeHomeworkSubmission } from "@/lib/api/admin/homework-normalize";

export type HomeworkSubmissionRow = {
  id: string;
  fileUrl?: string;
  userId?: string;
  student?: { id?: string; email?: string; firstName?: string; lastName?: string };
  points?: number | null;
  maxPoints?: number;
  feedback?: string | null;
  originalFileName?: string;
  fileName?: string;
} & Record<string, unknown>;

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.data)) return o.data as unknown[];
  if (Array.isArray(o.submissions)) return o.submissions as unknown[];
  return [];
}

/** GET /admin/homework-submissions?moduleId= */
export async function fetchSchoolHomeworkSubmissions(
  moduleId: string,
): Promise<HomeworkSubmissionRow[]> {
  const q = new URLSearchParams({ moduleId });
  const res = await apiSchoolAdminFetch(
    `${SCHOOL_ADMIN_ROUTES.HOMEWORK_SUBMISSIONS}?${q}`,
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

export type PatchHomeworkSubmissionBody = {
  points: number;
  maxPoints?: number;
  feedback?: string;
};

/** PATCH /admin/homework-submissions/:submissionId */
export async function patchSchoolHomeworkSubmission(
  submissionId: string,
  body: PatchHomeworkSubmissionBody,
): Promise<HomeworkSubmissionRow> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.HOMEWORK_SUBMISSION(submissionId),
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

/** GET /admin/modules/:moduleId/grade-overview */
export async function fetchSchoolModuleGradeOverview(
  moduleId: string,
): Promise<unknown> {
  const res = await apiSchoolAdminFetch(
    SCHOOL_ADMIN_ROUTES.MODULE_GRADE_OVERVIEW(moduleId),
  );
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}
