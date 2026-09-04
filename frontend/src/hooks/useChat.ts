import { useRef, useState } from "react";
import { createScheduleSuggestion } from "@/api/scheduleSuggestions.ts";
import type { ChatMessage, ChatRole } from "@/types/chat.ts";
import { formatScheduleSuggestion } from "@/utils/formatScheduleSuggestion.ts";

function createMessage(role: ChatRole, text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

export function useChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const sendMessage = async () => {
    const text = message.trim();
    if (text === "" || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);
    setMessages((prev) => [...prev, createMessage("user", text)]);
    setMessage("");

    try {
      const suggestion = await createScheduleSuggestion(text);
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", formatScheduleSuggestion(suggestion)),
      ]);
    } catch (error) {
      const fallback =
        error instanceof Error && error.message.trim() !== ""
          ? error.message
          : "予定を読み取れませんでした。もう一度送ってみてください。";
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", fallback),
      ]);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  return {
    isChatOpen,
    setIsChatOpen,
    messages,
    message,
    setMessage,
    sendMessage,
    isSending,
  };
}
