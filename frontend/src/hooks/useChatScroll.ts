import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat.ts";

export function useChatScroll(messages: ChatMessage[]) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return listRef;
}
