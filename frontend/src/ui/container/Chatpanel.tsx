import {
  ArrowUpIcon,
  ImageIcon,
  MicrophoneIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useChat } from "@/hooks/useChat.ts";
import { useChatScroll } from "@/hooks/useChatScroll.ts";
import { useMultilineInput } from "@/hooks/useMultilineInput.ts";
import { Text } from "@/ui/common/Text.tsx";

export function Chatpanel() {
  const chat = useChat();
  const listRef = useChatScroll(chat.messages, chat.isSending);
  const { probeRef, isMultiline } = useMultilineInput(chat.message);

  return (
    <>
      <aside
        aria-hidden={!chat.isChatOpen}
        className={`order-2 flex min-h-0 min-w-0 flex-col overflow-hidden bg-secondary transition-all duration-300 ease-out lg:order-1 ${
          chat.isChatOpen
            ? "h-[45vh] w-full shrink-0 opacity-100 lg:h-full lg:w-[30%] lg:min-w-64"
            : "pointer-events-none h-0 w-full opacity-0 lg:h-full lg:w-0"
        }`}
      >
        <div className="flex shrink-0 items-center justify-end p-2">
          <button
            type="button"
            aria-label="チャットを閉じる"
            onClick={() => chat.setIsChatOpen(false)}
            className="btn btn-circle btn-ghost btn-xs"
          >
            <XIcon
              size={32}
              color="var(--color-primary-content)"
              weight="light"
            />
          </button>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3" aria-busy={chat.isSending}>
            {chat.messages.map((msg, index) => {
              const messageDate = new Date(msg.createdAt);
              const previous = index > 0 ? chat.messages[index - 1] : undefined;
              const previousDate = previous
                ? new Date(previous.createdAt)
                : null;
              const isNewDay =
                !previousDate ||
                messageDate.toDateString() !== previousDate.toDateString();

              return (
                <div key={msg.id} className="w-full">
                  {isNewDay && (
                    <Text
                      as="p"
                      size="xs"
                      color="muted"
                      className="my-3 text-center"
                    >
                      {messageDate.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  )}
                  <div
                    className={`chat w-full ${
                      msg.role === "user" ? "chat-end" : "chat-start"
                    }`}
                  >
                    <div className="chat-bubble inline-block max-w-[80%] whitespace-pre-wrap break-words bg-base-100">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {chat.isSending && (
              <div className="chat chat-start w-full">
                <div className="chat-bubble inline-block max-w-[80%] bg-base-100">
                  予定を読み取っています…
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-end gap-2 border-t border-base-300 p-2">
          <div
            className={`relative flex min-w-0 flex-1 rounded-3xl bg-base-100 ${
              isMultiline ? "flex-col" : "items-end"
            }`}
          >
            <div
              ref={probeRef}
              aria-hidden
              className="pointer-events-none invisible absolute left-0 top-0 w-[calc(100%-4.5rem)] whitespace-pre-wrap break-words px-4 py-2 text-base leading-6"
            >
              {chat.message || " "}
            </div>
            <div
              className={`grid min-w-0 ${isMultiline ? "w-full" : "flex-1"}`}
            >
              <textarea
                aria-label="メッセージ"
                rows={1}
                className="col-start-1 row-start-1 h-full max-h-40 min-h-10 w-full resize-none overflow-y-auto bg-transparent px-4 py-2 text-base leading-6 caret-chat outline-none"
                value={chat.message}
                onChange={(e) => chat.setMessage(e.target.value)}
              />
              <div
                aria-hidden
                className="invisible col-start-1 row-start-1 max-h-40 min-h-10 overflow-hidden whitespace-pre-wrap break-words px-4 py-2 text-base leading-6"
              >
                {chat.message || " "}
                {"\n"}
              </div>
            </div>
            <div
              className={`flex shrink-0 items-center justify-end gap-1 pr-2 ${
                isMultiline ? "pb-1" : "py-1"
              }`}
            >
              <button
                type="button"
                aria-label="音声入力"
                className="btn btn-circle btn-ghost btn-xs"
              >
                <MicrophoneIcon
                  size={18}
                  weight="light"
                  color="var(--color-primary-content)"
                />
              </button>
              <button
                type="button"
                aria-label="画像を添付"
                className="btn btn-circle btn-ghost btn-xs"
              >
                <ImageIcon
                  size={18}
                  weight="light"
                  color="var(--color-primary-content)"
                />
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label="送信"
            onClick={() => void chat.sendMessage()}
            disabled={chat.message.trim() === "" || chat.isSending}
            className="btn btn-circle btn-lg bg-[var(--color-chat)]"
          >
            <ArrowUpIcon
              size={30}
              color="var(--color-primary-content)"
              weight="light"
            />
          </button>
        </div>
      </aside>

      {!chat.isChatOpen && (
        <button
          type="button"
          aria-label="チャットを開く"
          onClick={() => chat.setIsChatOpen(true)}
          className="btn btn-circle btn-lg absolute bottom-4 right-4 z-50 flex items-center justify-center bg-[var(--color-chat)] lg:right-auto lg:left-4"
        >
          <PlusIcon
            size={32}
            color="var(--color-primary-content)"
            weight="light"
          />
        </button>
      )}
    </>
  );
}
