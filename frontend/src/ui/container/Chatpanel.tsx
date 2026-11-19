import {
  ArrowUpIcon,
  ImageIcon,
  MicrophoneIcon,
  PlusIcon,
  StopIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useRef } from "react";
import { useChat } from "@/hooks/useChat.ts";
import { useChatScroll } from "@/hooks/useChatScroll.ts";
import { useMultilineInput } from "@/hooks/useMultilineInput.ts";
import { useVoiceInput } from "@/hooks/useVoiceInput.ts";
import { Text } from "@/ui/common/Text.tsx";
import { ScheduleConfirmationCard } from "@/ui/container/chat/ScheduleConfirmationCard.tsx";

type ChatpanelProps = {
  isMobile: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEventCreated?: () => void;
};

const readingSchedule = "予定を読み取っています…";

export function Chatpanel({ isMobile, isOpen, onOpenChange, onEventCreated }: ChatpanelProps) {
  const chat = useChat({ onEventCreated });
  const listRef = useChatScroll(chat.messages, chat.isSending, isOpen);
  const textareaHeight = isMobile
    ? chat.pendingImage ? "max-h-12" : "max-h-20"
    : "max-h-40";
  const openHeight = isMobile
    ? "h-[clamp(13rem,40svh,19rem)] group-data-[keyboard-open]:h-full"
    : "h-[45vh]";
  const { probeRef, isMultiline } = useMultilineInput(chat.message);
  const isComposerStacked = isMultiline || chat.pendingImage !== null;
  const voice = useVoiceInput(chat.message, chat.setMessage, isOpen);
  const imageInputRef = useRef<HTMLInputElement>(null);
  return (
		<>
			<aside aria-hidden={!isOpen} inert={!isOpen} className={`order-2 flex max-h-full min-h-0 min-w-0 flex-col overflow-hidden bg-secondary transition-all duration-300 ease-out motion-reduce:transition-none lg:order-1 ${isOpen ? `${openHeight} w-full shrink-0 opacity-100 lg:h-full lg:w-[30%] lg:min-w-64` : 'pointer-events-none h-0 w-full opacity-0 lg:h-full lg:w-0'}`}>
				<div className={`flex shrink-0 items-center justify-end ${isMobile ? 'h-8 px-2' : 'p-2'}`}>
					<button
						type="button"
						aria-label="チャットを閉じる"
						onClick={() => onOpenChange(false)}
						className={`btn btn-circle btn-ghost ${isMobile ? 'size-8' : 'btn-md'}`}
					>
						<XIcon size={isMobile ? 24 : 50} color="var(--color-primary-content)" weight="light" />
					</button>
				</div>

				<div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-4">
					<div className="flex flex-col gap-3" aria-busy={chat.isSending}>
						{chat.messages.map((msg, index) => {
							const imageUrl = msg.type === 'text' ? msg.imageUrl : undefined;
							const messageDate = new Date(msg.createdAt);
							const previous = index > 0 ? chat.messages[index - 1] : undefined;
							const previousDate = previous ? new Date(previous.createdAt) : null;
							const isNewDay = !previousDate || messageDate.toDateString() !== previousDate.toDateString();

							return (
								<div key={msg.id} className="w-full">
									{isNewDay && (
										<Text as="p" size="xs" color="muted" className="my-3 text-center">
											{messageDate.toLocaleDateString('ja-JP', {
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											})}
										</Text>
									)}
									<div className={`chat w-full ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
										<div className={`chat-bubble inline-block max-w-[80%] bg-base-100 ${imageUrl ? 'overflow-hidden p-1' : 'whitespace-pre-wrap break-words'}`}>
											{imageUrl && <img src={imageUrl} alt="送信した画像" className="block max-h-52 max-w-full rounded-[1.1rem] object-contain" />}
											{msg.type === 'schedule_confirmation' ? <ScheduleConfirmationCard state={msg.confirmationState} events={msg.suggestion.events} errorMessage={msg.errorMessage} onApprove={(selected, existingUpdates, existingDeletes) => void chat.approveSuggestion(msg.id, selected, existingUpdates, existingDeletes)} onCancel={() => chat.cancelSuggestion(msg.id)} /> : msg.text !== '' && <span className={imageUrl ? 'block px-3 py-2' : undefined}>{msg.text}</span>}
										</div>
									</div>
								</div>
							);
						})}
						{chat.isSending && (
							<div className="chat chat-start w-full">
								<div className="chat-bubble inline-block max-w-[80%] bg-base-100">{readingSchedule}</div>
							</div>
						)}
					</div>
				</div>

				<div className="flex shrink-0 items-end gap-2 border-t border-base-300 p-2">
					<div className={`relative flex min-w-0 flex-1 rounded-3xl bg-base-100 ${isComposerStacked ? 'flex-col' : 'items-end'}`}>
						<div ref={probeRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 w-[calc(100%-4.5rem)] whitespace-pre-wrap break-words px-4 py-2 text-base leading-6">
							{chat.message || ' '}
						</div>
						{chat.pendingImage && (
							<div className="relative w-fit px-3 pt-3">
								<img src={chat.pendingImage.url} alt="添付した画像" className={`block max-w-[12rem] rounded-2xl object-contain ${isMobile ? 'max-h-16' : 'max-h-28'}`} />
								<button type="button" aria-label="画像の添付をやめる" disabled={chat.isSending} onClick={chat.clearPendingImage} className="btn btn-circle btn-xs absolute -right-1 -top-0 bg-base-300">
									<XIcon size={14} weight="bold" />
								</button>
							</div>
						)}
						<div className={`grid min-w-0 ${isComposerStacked ? 'w-full' : 'flex-1'} content-center`}>
							<textarea
								aria-label="メッセージ"
								rows={1}
								className={`col-start-1 row-start-1 h-full ${textareaHeight} min-h-12 w-full resize-none overflow-y-auto bg-transparent px-4 py-3 text-base leading-6 caret-chat outline-none`}
								value={chat.message}
								onChange={(e) => chat.setMessage(e.target.value)}
								onKeyDown={(e) => {
									if (e.key !== 'Enter' || e.shiftKey) return;
									if (e.nativeEvent.isComposing) return;
									e.preventDefault();
									if ((chat.message.trim() === '' && chat.pendingImage === null) || chat.isSending || voice.listening) return;
									voice.endSession();
									void chat.sendMessage();
								}}
							/>
							<div aria-hidden className={`invisible col-start-1 row-start-1 ${textareaHeight} min-h-12 overflow-hidden whitespace-pre-wrap break-words px-4 py-3 text-base leading-6`}>
								{chat.message || ' '}
								{'\n'}
							</div>
						</div>
						<div className={`flex shrink-0 items-center justify-end gap-1 pr-2 ${isComposerStacked ? 'pb-1' : 'py-1'} `}>
							<button type="button" aria-label={voice.listening ? '音声入力を停止' : '音声入力'} aria-pressed={voice.listening} disabled={!voice.browserSupportsSpeechRecognition || !voice.isMicrophoneAvailable} onClick={voice.toggleListening} className="btn btn-circle btn-ghost btn-xs ">
								{voice.listening ? <StopIcon size={32} weight="fill" color="var(--color-primary-content)" /> : <MicrophoneIcon size={32} weight="light" color="var(--color-primary-content)" />}
							</button>
							<input
								ref={imageInputRef}
								type="file"
								accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
								className="hidden"
								onChange={(event) => {
									const file = event.target.files?.[0];
									event.target.value = '';
									if (file) chat.attachImage(file);
								}}
							/>
							<button type="button" aria-label="画像を添付" disabled={chat.isSending} onClick={() => imageInputRef.current?.click()} className="btn btn-circle btn-ghost btn-xs">
								<ImageIcon size={32} weight="light" color="var(--color-primary-content)" />
							</button>
						</div>
					</div>
					<button
						type="button"
						aria-label="送信"
						onClick={() => {
							voice.endSession();
							void chat.sendMessage();
						}}
						disabled={(chat.message.trim() === '' && chat.pendingImage === null) || chat.isSending || voice.listening}
						className={`btn btn-circle ${isMobile ? 'size-12' : 'btn-lg'} ${voice.listening ? 'bg-gray-400' : 'bg-[var(--color-chat)]'}`}
					>
						<ArrowUpIcon size={30} color="var(--color-primary-content)" weight="light" />
					</button>
				</div>
			</aside>

			{!isOpen && (
				<button type="button" aria-label="チャットを開く" onClick={() => onOpenChange(true)} className="btn btn-circle btn-lg absolute bottom-4 right-4 z-50 flex items-center justify-center bg-[var(--color-chat)] lg:right-auto lg:left-4">
					<PlusIcon size={32} color="var(--color-primary-content)" weight="light" />
				</button>
			)}
		</>
	);
}
