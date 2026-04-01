import {
  apiSuperAdminFetch,
  parseJsonSafe,
  throwIfNotOk,
} from "@/lib/api/super-admin/client";
import { SUPER_ADMIN_ROUTES } from "@/lib/api/super-admin/routes";

export async function aiGenerateQuiz(body: {
  moduleId?: string;
  moduleText?: string;
  questionCount: number;
  difficulty?: "easy" | "medium" | "hard";
}): Promise<unknown> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.AI_QUIZ_GENERATE, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export async function aiSummarize(body: {
  moduleId?: string;
  text?: string;
}): Promise<{ summary?: string } | unknown> {
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.AI_SUMMARIZE, {
    method: "POST",
    body: JSON.stringify(body),
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}

export async function aiTranscribe(
  file: File,
  language?: "ru" | "kk" | "auto",
): Promise<{ text?: string; vtt?: string; language?: string } | unknown> {
  const fd = new FormData();
  fd.append("file", file);
  if (language && language !== "auto") {
    fd.append("language", language);
  }
  const res = await apiSuperAdminFetch(SUPER_ADMIN_ROUTES.AI_TRANSCRIBE, {
    method: "POST",
    body: fd,
  });
  await throwIfNotOk(res);
  return parseJsonSafe(res);
}
