import type { ConfirmationState } from "@/types/chat.ts";
import type { ScheduleSuggestionEvent } from "@/types/scheduleSuggestion.ts";
import { useScheduleConfirmation } from "@/hooks/useScheduleConfirmation.ts";
import {
  formatMissingFields,
  formatScheduleDateTime,
} from "@/utils/formatScheduleSuggestion.ts";

type ScheduleConfirmationCardProps = {
  state: ConfirmationState;
  events: ScheduleSuggestionEvent[];
  onApprove: (events: ScheduleSuggestionEvent[]) => void;
  onCancel: () => void;
};

export function ScheduleConfirmationCard({
  state,
  events,
  onApprove,
  onCancel,
}: ScheduleConfirmationCardProps) {
  const {
    selectedEvents,
    readyCount,
    allReadySelected,
    isSaving,
    isSelected,
    toggle,
    toggleSelectAll,
  } = useScheduleConfirmation(events, state);

  if (state === "approved") {
    return (
      <p className="mt-3 border-t border-base-300 pt-3 text-sm font-medium text-success">
        予定を追加しました
      </p>
    );
  }

  if (state === "cancelled") {
    return (
      <p className="mt-3 border-t border-base-300 pt-3 text-sm opacity-70">
        追加をキャンセルしました
      </p>
    );
  }

  return (
    <div className="mt-3 border-t border-base-300 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {readyCount > 0
            ? "追加する予定を選んでください"
            : "追加できる予定がまだありません"}
        </p>
        {readyCount > 1 && (
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            disabled={isSaving}
            onClick={toggleSelectAll}
          >
            {allReadySelected ? "選択を解除" : "すべて選択"}
          </button>
        )}
      </div>

      <ul className="mb-3 flex flex-col gap-2">
        {events.map((event, i) => {
          const ready = event.status === "ready";
          const checked = isSelected(i);
          const title = event.title.trim() || "タイトル未定";

          return (
            <li key={`${event.title}-${event.start_at ?? "none"}-${i}`}>
              <label
                className={`flex items-start gap-2 rounded-lg px-1 py-1 ${
                  ready ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mt-0.5"
                  checked={checked}
                  disabled={!ready || isSaving}
                  onChange={() => toggle(i)}
                />
                <span
                  aria-hidden
                  className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                    ready ? "bg-success" : "bg-error"
                  }`}
                />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="sr-only">
                    {ready ? "追加できます。" : "情報が不足しています。"}
                  </span>
                  <span className="block font-medium">{title}</span>
                  {event.location && (
                    <span className="mt-0.5 block text-xs opacity-80">
                      場所: {event.location}
                    </span>
                  )}
                  {event.description && (
                    <span className="mt-0.5 block text-xs opacity-80">
                      内容: {event.description}
                    </span>
                  )}
                  <span className="mt-0.5 block text-xs opacity-80">
                    開始: {formatScheduleDateTime(event.start_at, event.all_day)}
                  </span>
                  <span className="mt-0.5 block text-xs opacity-80">
                    終了: {formatScheduleDateTime(event.end_at, event.all_day)}
                  </span>
                  {!ready && event.missing_fields.length > 0 && (
                    <span className="mt-0.5 block text-xs text-error">
                      不足: {formatMissingFields(event.missing_fields)}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {state === "failed" && (
        <p role="alert" className="mb-3 text-sm text-error">
          予定を追加できませんでした。もう一度お試しください。
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={isSaving}
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={isSaving || selectedEvents.length === 0}
          onClick={() => onApprove(selectedEvents)}
        >
          {isSaving
            ? "追加中…"
            : selectedEvents.length > 1
              ? `${selectedEvents.length}件を追加する`
              : "追加する"}
        </button>
      </div>
    </div>
  );
}
