import { useEffect, useRef, useState } from "react";
import { createEvent } from "@/api/events.ts";
import {
  createScheduleSuggestion,
  createScheduleSuggestionFromImage,
  validateScheduleImage,
} from "@/api/scheduleSuggestions.ts";
import type {
  ChatMessage,
  ChatRole,
  ScheduleConfirmationMessage,
  TextChatMessage,
} from "@/types/chat.ts";
import type {
  ScheduleSuggestion,
  ScheduleSuggestionEvent,
} from "@/types/scheduleSuggestion.ts";
import { formatScheduleSuggestionHeader } from "@/utils/formatScheduleSuggestion.ts";

export type PendingImage = {
  file: File;
  url: string;
};

function createMessage(
  role: ChatRole,
  text: string,
  imageUrl?: string,
): TextChatMessage {
  return {
    id: crypto.randomUUID(),
    type: "text",
    role,
    text,
    createdAt: new Date().toISOString(),
    imageUrl,
  };
}

type UseChatOptions = {
  onEventCreated?: () => void;
};

export function useChat({ onEventCreated }: UseChatOptions = {}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const imageUrlsRef = useRef<string[]>([]);
  const pendingUrlRef = useRef<string | null>(null);
  const approvingIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const imageUrls = imageUrlsRef.current;
    return () => {
      if (pendingUrlRef.current) {
        URL.revokeObjectURL(pendingUrlRef.current);
      }
      for (const url of imageUrls) {
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

  const appendSuggestion = (suggestion: ScheduleSuggestion) => {
    const events = Array.isArray(suggestion.events) ? suggestion.events : [];
    const readyCount = events.filter((event) => event.status === "ready").length;
    const responseText = formatScheduleSuggestionHeader(events.length, readyCount);

    if (events.length > 0) {
      const confirmation: ScheduleConfirmationMessage = {
        id: crypto.randomUUID(),
        type: "schedule_confirmation",
        role: "assistant",
        text: responseText,
        suggestion,
        confirmationState: "pending",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmation]);
      return;
    }

    setMessages((prev) => [...prev, createMessage("assistant", responseText)]);
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
      appendSuggestion(suggestion);
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
      appendSuggestion(suggestion);
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

  const approveSuggestion = async (
    messageId: string,
    events: ScheduleSuggestionEvent[],
  ) => {
    if (approvingIdsRef.current.has(messageId)) return;

    const confirmation = messages.find(
      (item): item is ScheduleConfirmationMessage =>
        item.id === messageId && item.type === "schedule_confirmation",
    );
    if (!confirmation || !["pending", "failed"].includes(confirmation.confirmationState)) return;

    const selectedEvents = events.flatMap((event) => {
      if (event.status !== "ready") return [];
      const { start_at, end_at } = event;
      if (start_at === null || end_at === null) return [];
      return [{ event, start_at, end_at }];
    });

    if (selectedEvents.length === 0) return;

    approvingIdsRef.current.add(messageId);
    setMessages((prev) => prev.map((item) =>
      item.id === messageId && item.type === "schedule_confirmation"
        ? { ...item, confirmationState: "saving" }
        : item,
    ));

    try {
      await Promise.all(selectedEvents.map(({ event, start_at, end_at }) =>
        createEvent({
          title: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          start_at,
          end_at,
          all_day: event.all_day,
        }),
      ));
      setMessages((prev) => prev.map((item) =>
        item.id === messageId && item.type === "schedule_confirmation"
          ? { ...item, confirmationState: "approved" }
          : item,
      ));
      onEventCreated?.();
    } catch {
      setMessages((prev) => prev.map((item) =>
        item.id === messageId && item.type === "schedule_confirmation"
          ? { ...item, confirmationState: "failed" }
          : item,
      ));
    } finally {
      approvingIdsRef.current.delete(messageId);
    }
  };

  const cancelSuggestion = (messageId: string) => {
    if (approvingIdsRef.current.has(messageId)) return;
    setMessages((prev) => prev.map((item) =>
      item.id === messageId && item.type === "schedule_confirmation" &&
      ["pending", "failed"].includes(item.confirmationState)
        ? { ...item, confirmationState: "cancelled" }
        : item,
    ));
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
    approveSuggestion,
    cancelSuggestion,
    isSending,
  };
}
