import type { ReactNode } from "react";
import {
  ClockIcon,
  MapPinIcon,
  NoteIcon,
  PencilSimpleIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { formatEventDateTime } from "@/utils/formatEventDateTime.ts";
import { useEventDetailForm } from "@/hooks/useEventDetailForm.ts";
import { useEventDetailPopup } from "@/hooks/useEventDetailPopup.ts";
import { Text } from "@/ui/common/Text.tsx";
import type { EventDetail } from "@/types/event.ts";
import { EditableInput } from "@/ui/container/edit.tsx";
import { Trash } from "@/ui/container/trash";
const FIELDS = [
  {
    key: "location",
    icon: <MapPinIcon size={20} />,
    label: "場所",
    maxLength: 255,
  },
  {
    key: "category",
    icon: <TagIcon size={20} />,
    label: "カテゴリ",
    maxLength: 50,
  },
  {
    key: "description",
    icon: <NoteIcon size={20} />,
    label: "詳細",
    maxLength: undefined,
  },
] as const;

export function EventDetailPopup({
  event,
  onClose,
  onSave,
  onDelete,
}: {
  event: EventDetail | null;
  onClose: () => void;
  onSave: (updated: EventDetail) => void | Promise<void>;
  onDelete: (event: EventDetail) => void | Promise<void>;
}) {
  const { dialogRef, closeDialog } = useEventDetailPopup(event);
  const {
    draft,
    editing,
    error,
    isDateValid,
    isTitleValid,
    displayStart,
    displayEnd,
    startEditing,
    update,
    setAllDay,
    setDateInput,
    save,
    cancel,
  } = useEventDetailForm(event, onSave);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="event-detail-title"
      onClose={onClose}
      onCancel={(e) => {
        if (editing) {
          e.preventDefault();
          cancel();
        }
      }}
    >
      {event && (
        <div className="modal-box bg-base-100">
          {editing && !isTitleValid && (
            <p className="mb-1 text-xs text-error">タイトルは必須です</p>
          )}
          <div id="event-detail-title">
            <Text as="h3" size="lg" weight="medium">
              <EditableInput
                value={draft.title}
                onChange={(v) => update({ title: v })}
                editing={editing}
              />
            </Text>
          </div>
          <dl className="mt-4 flex flex-col gap-2">
            <DetailRow
              icon={<ClockIcon size={20} />}
              label="日時"
              editing={editing}
            >
              {editing && (
                <label className="mb-1 flex  gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={draft.allDay}
                    disabled={!editing}
                    onChange={(e) => setAllDay(e.target.checked)}
                  />
                  終日
                </label>
              )}
              {!editing && (
                <span>
                  {formatEventDateTime(
                    displayStart,
                    displayEnd,
                    draft.allDay,
                  )}
                </span>
              )}

              {editing && (
                <div className="w-full flex flex-row ">
                  <input
                    type={draft.allDay ? "date" : "datetime-local"}
                    value={
                      draft.allDay
                        ? draft.startDate.slice(0, 10)
                        : draft.startDate
                    }
                    disabled={!editing}
                    onChange={(e) => setDateInput("startDate", e.target.value)}
                    className="rounded-lg input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-chat)]"
                  />
                  <span className="flex items-center px-3 border-transparent text-sm">
                    〜
                  </span>
                  <input
                    type={draft.allDay ? "date" : "datetime-local"}
                    value={
                      draft.allDay ? draft.endDate.slice(0, 10) : draft.endDate
                    }
                    disabled={!editing}
                    onChange={(e) => setDateInput("endDate", e.target.value)}
                    className="rounded-lg input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-chat)]"
                  />
                </div>
              )}
              {editing && !isDateValid && (
                <p className="mt-1 text-xs text-error">
                  開始と終了を正しく入力してください(終了は開始より後)
                </p>
              )}
            </DetailRow>

            {FIELDS.map(({ key, icon, label, maxLength }) => (
              <DetailRow
                key={key}
                icon={icon}
                label={label}
                editing={editing}
                contentClassName="break-words whitespace-pre-wrap"
              >
                <EditableInput
                  value={draft[key]}
                  onChange={(v) => update({ [key]: v })}
                  editing={editing}
                  multiline
                  maxLength={maxLength}
                />
              </DetailRow>
            ))}
          </dl>
          <div className="flex justify-end gap-2">
            {!editing && (
              <button
                type="button"
                className={`btn bg-[var(--color-chat)] shadow-sm ${editing ? "btn-active" : ""}`}
                onClick={startEditing}
              >
                <PencilSimpleIcon
                  size={24}
                  weight="light"
                  color="var(--color-primary-content)"
                />
              </button>
            )}
            {!editing && (
              <Trash
                event={event}
                onDelete={(deleteEvent) => {
                  onDelete(deleteEvent);
                  closeDialog();
                }}
              />
            )}
          </div>
          {error && <p className="mt-2 text-xs text-error">{error}</p>}{" "}
          {editing && (
            <div className="modal-action">
              <button
                type="button"
                className="btn h-10 w-30"
                onClick={cancel}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn bg-[var(--color-chat)] h-10 w-30"
                onClick={save}
                disabled={!isTitleValid || !isDateValid}
              >
                予定を上書き
              </button>
            </div>
          )}
        </div>
      )}
      <form
        method="dialog"
        className="modal-backdrop"
        onSubmit={(e) => {
          if (editing) {
            e.preventDefault();
            cancel();
          }
        }}
      >
        <button type="submit">閉じる</button>
      </form>
    </dialog>
  );
}

function DetailRow({
  icon,
  label,
  children,
  editing,
  contentClassName,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  editing: boolean;
  contentClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {editing ? (
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center gap-2">
            <span className="mt-0.7 text-base-content/60" aria-hidden>
              {icon}
            </span>
            <div className="min-w-0 flex-1 ">
              <Text as="span" size="sm" color="muted" className="block">
                {label}
              </Text>
            </div>
          </div>
          <div className={`text-sm ${contentClassName ?? ""}`}>{children}</div>
        </div>
      ) : (
        <>
          <span className="mt-0.5 text-base-content/60" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0 flex-1 ">
            <Text as="span" size="xs" color="muted" className="block">
              {label}
            </Text>
            <div className="text-sm">{children}</div>
          </div>
        </>
      )}
    </div>
  );
}
