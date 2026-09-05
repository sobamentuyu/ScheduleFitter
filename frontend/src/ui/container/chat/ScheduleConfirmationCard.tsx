import type { ConfirmationState } from "@/types/chat.ts";

type ScheduleConfirmationCardProps = {
  state: ConfirmationState;
  onApprove: () => void;
  onCancel: () => void;
};

export function ScheduleConfirmationCard({
  state,
  onApprove,
  onCancel,
}: ScheduleConfirmationCardProps) {
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

  const isSaving = state === "saving";

  return (
    <div className="mt-3 border-t border-base-300 pt-3">
      <p className="mb-3 text-sm font-medium">この予定を追加しますか？</p>

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
          disabled={isSaving}
          onClick={onApprove}
        >
          {isSaving ? "追加中…" : "追加する"}
        </button>
      </div>
    </div>
  );
}
