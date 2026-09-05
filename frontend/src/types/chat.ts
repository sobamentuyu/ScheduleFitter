import type { ScheduleSuggestion } from "@/types/scheduleSuggestion.ts";

export type ChatRole = "user" | "assistant";

export type ConfirmationState =
  | "pending"
  | "saving"
  | "approved"
  | "cancelled"
  | "failed";

export type TextChatMessage = {
  id: string;
  type: "text";
  role: ChatRole;
  text: string;
  createdAt: string;
};

export type ScheduleConfirmationMessage = {
  id: string;
  type: "schedule_confirmation";
  role: "assistant";
  text: string;
  suggestion: ScheduleSuggestion;
  confirmationState: ConfirmationState;
  createdAt: string;
};

export type ChatMessage = TextChatMessage | ScheduleConfirmationMessage;
