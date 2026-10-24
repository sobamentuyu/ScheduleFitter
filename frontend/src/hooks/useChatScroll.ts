import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/model/chat.ts";

export function useChatScroll(messages: ChatMessage[], isSending: boolean) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isSending]);

  return listRef;
}
