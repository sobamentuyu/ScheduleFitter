import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat.ts";

export function useChatScroll(messages: ChatMessage[], isSending: boolean, isVisible: boolean) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !isVisible) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isSending, isVisible]);

  return listRef;
}
