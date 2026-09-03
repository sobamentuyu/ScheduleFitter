import { XIcon } from "@phosphor-icons/react";
import { ArrowUpIcon } from "@phosphor-icons/react";
import { useRef, useEffect } from "react";
import { Calendar } from "@/ui/container/calendar/Calendar.tsx";
import { PlusIcon } from "@phosphor-icons/react";
import { MicrophoneIcon } from "@phosphor-icons/react";
import { ImageIcon } from "@phosphor-icons/react";
import type { ChatMessage } from "@/src/types/chat";

type Props = {
  isChatOpen: boolean;
  setIsChatOpen: (v: boolean) => void;

  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
};
export function Chatpanel1({
  isChatOpen,
  setIsChatOpen,
  messages,
  setMessages,
  message,
  setMessage,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const handleSend = () => {
    if (message.trim() === "") return;
    setMessages((prev) => [
      ...prev,
      { text: message, date: new Date().toISOString() },
    ]); // 既存の配列に新しいメッセージを追加
    setMessage(""); // 入力欄を空にする
  };
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-base-200 relative">
      <div
        className={`h-full flex flex-col bg-secondary relative overflow-hidden transition-all duration-300 ease-out ${
          isChatOpen
            ? "w-[30%] min-w-0 opacity-100 translate-x-0"
            : "w-0 min-w-0 opacity-0 -translate-x-4"
        }`}
      >
        <button
          onClick={() => setIsChatOpen(false)}
          className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost"
        >
          <XIcon
            size={32}
            color="var(--color-primary-content)"
            weight="light"
          />
        </button>
        <div className="flex-1 overflow-y-auto p-4 color-secondary">
          <div className="flex flex-col item-end gap-3">
            {messages.map((msg, index) => {
              const messageDate = new Date(msg.date);

              const previousDate =
                index > 0 ? new Date(messages[index - 1].date) : null;

              const isNewDay =
                !previousDate ||
                messageDate.toDateString() !== previousDate.toDateString();

              return (
                <div key={index}>
                  {/* 日付が変わったときだけ表示 */}
                  {isNewDay && (
                    <div className="text-center text-xs opacity-60 my-3">
                      {messageDate.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}
                  <div className="chat chat-end">
                    <div className="chat-bubble bg-base-100 w-fit max-w-[80%] whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>
        <div className="p-2 border-t border-base-300 flex items-center gap-2">
          <div className="relative flex-1">
            <textarea
              className="badge badge-xl w-full outline-none caret-chat min-w-0 pr-16"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button type="button" className="btn btn-xs btn-circle btn-ghost">
                <MicrophoneIcon
                  size={18}
                  weight="light"
                  color="var(--color-primary-content)"
                />
              </button>
              <button type="button" className="btn btn-xs btn-circle btn-ghost">
                <ImageIcon
                  size={18}
                  weight="light"
                  color="var(--color-primary-content)"
                />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            className="btn btn-16 btn-circle bg-[var(--color-chat)]"
          >
            <ArrowUpIcon
              size={30}
              color="var(--color-primary-content)"
              weight="light"
            />
          </button>
        </div>
      </div>
      {/* カレンダー*/}
      <div className="flex-1 min-w-0">
        <Calendar />
      </div>
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="z-50 absolute bottom-4 left-4 btn btn-lg btn-circle bg-[var(--color-chat)] flex items-center justify-center"
        >
          <PlusIcon
            size={32}
            color="var(--color-primary-content)"
            weight="light"
          />
        </button>
      )}
    </div>
  );
}
