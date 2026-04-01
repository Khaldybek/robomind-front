function num(raw: unknown, d = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : d;
}

/** Общая нормализация сдачи ДЗ (student + admin списки). */
export function normalizeHomeworkSubmission(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: String(raw.id ?? ""),
    moduleId:
      raw.moduleId != null
        ? String(raw.moduleId)
        : raw.module_id != null
          ? String(raw.module_id)
          : undefined,
    fileUrl: String(raw.fileUrl ?? raw.file_url ?? ""),
    fileName:
      raw.fileName != null
        ? String(raw.fileName)
        : raw.file_name != null
          ? String(raw.file_name)
          : undefined,
    originalFileName:
      raw.originalFileName != null
        ? String(raw.originalFileName)
        : raw.original_file_name != null
          ? String(raw.original_file_name)
          : undefined,
    mimeType:
      raw.mimeType != null
        ? String(raw.mimeType)
        : raw.mime_type != null
          ? String(raw.mime_type)
          : undefined,
    sizeBytes: num(raw.sizeBytes ?? raw.size_bytes, 0) || undefined,
    studentComment:
      (raw.studentComment ?? raw.student_comment) as string | null | undefined,
    maxPoints: num(raw.maxPoints ?? raw.max_points, 100),
    points:
      raw.points === null || raw.points === undefined
        ? null
        : num(raw.points, 0),
    feedback: (raw.feedback ?? null) as string | null | undefined,
    gradedAt:
      raw.gradedAt != null
        ? String(raw.gradedAt)
        : raw.graded_at != null
          ? String(raw.graded_at)
          : undefined,
    gradedByUserId:
      raw.gradedByUserId != null
        ? String(raw.gradedByUserId)
        : raw.graded_by_user_id != null
          ? String(raw.graded_by_user_id)
          : undefined,
  };
  return { ...raw, ...base };
}
