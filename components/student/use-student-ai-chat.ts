"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  postAiChat,
  postAiChatCourse,
  postAiChatProfile,
  type AiChatResponse,
} from "@/lib/api/student/ai";
import { ApiRequestError } from "@/lib/api/types";
import { isApiConfigured } from "@/lib/env";

function extractReply(res: AiChatResponse | null): string {
  if (res == null) return "";
  if (
    typeof res === "object" &&
    "reply" in res &&
    typeof res.reply === "string"
  ) {
    return res.reply;
  }
  if (
    typeof res === "object" &&
    "message" in res &&
    typeof (res as { message: unknown }).message === "string"
  ) {
    return (res as { message: string }).message;
  }
  if (typeof res === "string") return res;
  return JSON.stringify(res);
}

export type StudentAiChatMessage = { role: string; text: string };

export function useStudentAiChat(opts: {
  moduleId?: string;
  courseId?: string | null;
  /** `profile` — `/app/ai/chat-profile`; `course` — `/app/ai/chat-course`; иначе `/app/ai/chat` */
  mode?: "module" | "profile" | "course";
  /** Для `profile` и `course` — подсказка языка ответа (`ru` | `kk`) */
  language?: "ru" | "kk";
}) {
  const { moduleId, courseId, mode = "module", language } = opts;
  const t = useTranslations("StudentAiChat");
  const [messages, setMessages] = useState<StudentAiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput("");
  }, [moduleId, courseId, mode]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !isApiConfigured()) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setPending(true);
    setError(null);
    try {
      const transcript = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.text,
        }));
      let res: AiChatResponse | null;
      if (mode === "profile") {
        res = await postAiChatProfile({
          messages: transcript,
          ...(language ? { language } : {}),
        });
      } else if (mode === "course") {
        if (!courseId?.trim()) {
          setError(t("error"));
          setMessages((m) => m.slice(0, -1));
          setInput(text);
          return;
        }
        res = await postAiChatCourse({
          courseId: courseId.trim(),
          messages: transcript,
          ...(language ? { language } : {}),
        });
      } else {
        res = await postAiChat({
          messages: transcript,
          moduleId,
          ...(courseId ? { courseId } : {}),
        });
      }
      const reply = extractReply(res);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      if (e instanceof ApiRequestError) setError(e.message);
      else setError(t("error"));
    } finally {
      setPending(false);
    }
  }, [messages, input, moduleId, courseId, mode, language, t]);

  return {
    messages,
    input,
    setInput,
    pending,
    error,
    send,
  };
}
