import { useEffect, useRef, useState } from "react";
import {
  createScheduleSuggestion,
  createScheduleSuggestionFromImage,
  validateScheduleImage,
} from "@/api/scheduleSuggestions.ts";
import type { ChatMessage, ChatRole } from "@/types/chat.ts";
import { formatScheduleSuggestion } from "@/utils/formatScheduleSuggestion.ts";

export type PendingImage = {
  file: File;
  url: string;
};

function createMessage(
  role: ChatRole,
  text: string,
  imageUrl?: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    createdAt: new Date().toISOString(),
    imageUrl,
  };
}

export function useChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const imageUrlsRef = useRef<string[]>([]);
  const pendingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingUrlRef.current) {
        URL.revokeObjectURL(pendingUrlRef.current);
      }
      for (const url of imageUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const showError = (error: unknown) => {
    const fallback =
      error instanceof Error && error.message.trim() !== ""
        ? error.message
        : "予定を読み取れませんでした。もう一度送ってみてください。";
    setMessages((prev) => [...prev, createMessage("assistant", fallback)]);
  };

  const clearPendingImage = () => {
    if (pendingUrlRef.current) {
      URL.revokeObjectURL(pendingUrlRef.current);
      pendingUrlRef.current = null;
    }
    setPendingImage(null);
  };

  const attachImage = (file: File) => {
    if (sendingRef.current) return;

    const validationError = validateScheduleImage(file);
    if (validationError !== null) {
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", validationError),
      ]);
      return;
    }

    if (pendingUrlRef.current) {
      URL.revokeObjectURL(pendingUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    pendingUrlRef.current = url;
    setPendingImage({ file, url });
  };

  const sendText = async (text: string) => {
    setMessages((prev) => [...prev, createMessage("user", text)]);
    setMessage("");

    try {
      const suggestion = await createScheduleSuggestion(text);
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", formatScheduleSuggestion(suggestion)),
      ]);
    } catch (error) {
      showError(error);
    }
  };

  const sendPendingImage = async (pending: PendingImage, text: string) => {
    imageUrlsRef.current.push(pending.url);
    pendingUrlRef.current = null;
    setPendingImage(null);
    setMessage("");
    setMessages((prev) => [...prev, createMessage("user", text, pending.url)]);

    try {
      const suggestion = await createScheduleSuggestionFromImage(
        pending.file,
        text,
      );
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", formatScheduleSuggestion(suggestion)),
      ]);
    } catch (error) {
      showError(error);
    }
  };

  const sendMessage = async () => {
    const text = message.trim();
    const pending = pendingImage;
    if (sendingRef.current || (text === "" && pending === null)) return;

    sendingRef.current = true;
    setIsSending(true);

    try {
      if (pending !== null) {
        await sendPendingImage(pending, text);
        return;
      }

      await sendText(text);
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
    pendingImage,
    attachImage,
    clearPendingImage,
    sendMessage,
    isSending,
  };
}
