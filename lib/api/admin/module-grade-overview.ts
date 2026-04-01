/** GET /admin/modules/:moduleId/grade-overview — нормализованная форма ответа */

export type GradeOverviewUser = {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  patronymic?: string | null;
  iin?: string | null;
};

export type GradeOverviewQuizAttempt = {
  attemptId?: string | null;
  score?: number | null;
  maxScore?: number | null;
  isPassed?: boolean | null;
  completedAt?: string | null;
};

export type GradeOverviewHomework = {
  submissionId?: string | null;
  fileUrl?: string | null;
  originalFilename?: string | null;
  maxPoints?: number | null;
  points?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
  updatedAt?: string | null;
};

export type GradeOverviewRow = {
  user: GradeOverviewUser;
  quiz: GradeOverviewQuizAttempt | null;
  homework: GradeOverviewHomework | null;
};

export type ModuleGradeOverview = {
  module?: {
    id?: string;
    title?: string;
    courseId?: string;
    courseTitle?: string;
  };
  quiz?: {
    id?: string;
    title?: string;
    passingScore?: number | null;
  };
  rows: GradeOverviewRow[];
};

function s(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

function num(v: unknown): number | null | undefined {
  if (v == null) return v === null ? null : undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function bool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

function pickUser(raw: unknown): GradeOverviewUser {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    id: s(o.id),
    email: s(o.email),
    firstName: s(o.firstName ?? o.first_name),
    lastName: s(o.lastName ?? o.last_name),
    patronymic: s(o.patronymic ?? o.patronymic_name),
    iin: s(o.iin ?? o.IIN),
  };
}

function pickQuizAttempt(raw: unknown): GradeOverviewQuizAttempt | null {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    attemptId: s(o.attemptId ?? o.attempt_id),
    score: num(o.score) ?? null,
    maxScore: num(o.maxScore ?? o.max_score) ?? null,
    isPassed: bool(o.isPassed ?? o.is_passed) ?? null,
    completedAt: s(o.completedAt ?? o.completed_at),
  };
}

function pickHomework(raw: unknown): GradeOverviewHomework | null {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    submissionId: s(o.submissionId ?? o.submission_id),
    fileUrl: s(o.fileUrl ?? o.file_url),
    originalFilename: s(
      o.originalFilename ?? o.original_filename ?? o.originalFileName,
    ),
    maxPoints: num(o.maxPoints ?? o.max_points) ?? null,
    points: o.points === null ? null : (num(o.points) ?? null),
    feedback:
      o.feedback === null
        ? null
        : typeof o.feedback === "string"
          ? o.feedback
          : undefined,
    gradedAt: s(o.gradedAt ?? o.graded_at),
    updatedAt: s(o.updatedAt ?? o.updated_at),
  };
}

function pickRow(raw: unknown): GradeOverviewRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    user: pickUser(o.user),
    quiz: pickQuizAttempt(o.quiz),
    homework: pickHomework(o.homework),
  };
}

function pickModule(raw: unknown):
  | ModuleGradeOverview["module"]
  | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  return {
    id: s(o.id),
    title: s(o.title),
    courseId: s(o.courseId ?? o.course_id),
    courseTitle: s(o.courseTitle ?? o.course_title),
  };
}

function pickQuizMeta(raw: unknown): ModuleGradeOverview["quiz"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  return {
    id: s(o.id),
    title: s(o.title),
    passingScore: num(o.passingScore ?? o.passing_score) ?? null,
  };
}

/**
 * Разбирает тело ответа grade-overview (плоское или обёрнутое в `data`).
 */
export function parseModuleGradeOverview(raw: unknown): ModuleGradeOverview {
  const empty: ModuleGradeOverview = { rows: [] };
  if (raw == null) return empty;
  let root: Record<string, unknown>;
  if (typeof raw !== "object") return empty;
  const top = raw as Record<string, unknown>;
  if (top.data != null && typeof top.data === "object" && !Array.isArray(top.data)) {
    root = top.data as Record<string, unknown>;
  } else {
    root = top;
  }
  const rowsRaw = root.rows;
  const rows: GradeOverviewRow[] = [];
  if (Array.isArray(rowsRaw)) {
    for (const r of rowsRaw) {
      const row = pickRow(r);
      if (row) rows.push(row);
    }
  }
  return {
    module: pickModule(root.module),
    quiz: pickQuizMeta(root.quiz),
    rows,
  };
}

/** Подпись ученика: без дублирования email во всех полях ФИО */
export function gradeOverviewUserLabel(u: GradeOverviewUser): string {
  const email = (u.email ?? "").trim();
  const fn = (u.firstName ?? "").trim();
  const ln = (u.lastName ?? "").trim();
  const pat = (u.patronymic ?? "").trim();
  const parts = [ln, fn, pat].filter((p) => p.length > 0);
  if (parts.length === 0) return email || "—";
  const allSame =
    parts.length > 0 && parts.every((p) => p === parts[0]);
  if (allSame && email && parts[0] === email) return email;
  if (
    fn &&
    ln &&
    fn === ln &&
    (!pat || pat === fn) &&
    fn === email
  ) {
    return email;
  }
  return parts.join(" ") || email || "—";
}
