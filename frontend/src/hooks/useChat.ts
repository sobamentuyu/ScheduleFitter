import { useRef, useState } from "react";
import { createEvent } from "@/api/events.ts";
import { createScheduleSuggestion } from "@/api/scheduleSuggestions.ts";
import type {
  ChatMessage,
  ChatRole,
  ScheduleConfirmationMessage,
  TextChatMessage,
} from "@/types/chat.ts";
import { formatScheduleSuggestion } from "@/utils/formatScheduleSuggestion.ts";

function createMessage(role: ChatRole, text: string): TextChatMessage {
  return {
    id: crypto.randomUUID(),
    type: "text",
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

type UseChatOptions = {
  onEventCreated?: () => void;
};

export function useChat({ onEventCreated }: UseChatOptions = {}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const approvingIdsRef = useRef(new Set<string>());

  const sendMessage = async () => {
    const text = message.trim();
    if (text === "" || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);
    setMessages((prev) => [...prev, createMessage("user", text)]);
    setMessage("");

    try {
      const suggestion = await createScheduleSuggestion(text);
      const responseText = formatScheduleSuggestion(suggestion);

      if (suggestion.status === "ready") {
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
      } else {
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", responseText),
        ]);
      }
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

  const approveSuggestion = async (messageId: string) => {
    if (approvingIdsRef.current.has(messageId)) return;

    const confirmation = messages.find(
      (item): item is ScheduleConfirmationMessage =>
        item.id === messageId && item.type === "schedule_confirmation",
    );
    if (
      !confirmation ||
      !["pending", "failed"].includes(confirmation.confirmationState)
    ) {
      return;
    }

    const { event } = confirmation.suggestion;
    if (!event.title.trim() || !event.start_at || !event.end_at) return;

    approvingIdsRef.current.add(messageId);
    setMessages((prev) =>
      prev.map((item) =>
        item.id === messageId && item.type === "schedule_confirmation"
          ? { ...item, confirmationState: "saving" }
          : item,
      ),
    );

    try {
      await createEvent({
        title: event.title,
        description: event.description,
        location: event.location,
        category: event.category,
        start_at: event.start_at,
        end_at: event.end_at,
        all_day: event.all_day,
      });
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId && item.type === "schedule_confirmation"
            ? { ...item, confirmationState: "approved" }
            : item,
        ),
      );
      onEventCreated?.();
    } catch {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId && item.type === "schedule_confirmation"
            ? { ...item, confirmationState: "failed" }
            : item,
        ),
      );
    } finally {
      approvingIdsRef.current.delete(messageId);
    }
  };

  const cancelSuggestion = (messageId: string) => {
    if (approvingIdsRef.current.has(messageId)) return;

    setMessages((prev) =>
      prev.map((item) =>
        item.id === messageId &&
        item.type === "schedule_confirmation" &&
        ["pending", "failed"].includes(item.confirmationState)
          ? { ...item, confirmationState: "cancelled" }
          : item,
      ),
    );
  };

  return {
    isChatOpen,
    setIsChatOpen,
    messages,
    message,
    setMessage,
    sendMessage,
    approveSuggestion,
    cancelSuggestion,
    isSending,
  };
}
