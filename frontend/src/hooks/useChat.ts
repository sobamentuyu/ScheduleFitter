import { useState } from "react";
import type { ChatMessage } from "@/types/chat.ts";

export function useChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    const text = message.trim();
    if (text === "") return;

    setMessages((prev) => [
      ...prev,
      {
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setMessage("");
  };

  return {
    isChatOpen,
    setIsChatOpen,
    messages,
    message,
    setMessage,
    sendMessage,
  };
}
