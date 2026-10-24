import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ClockIcon,
  MapPinIcon,
  NoteIcon,
  PencilSimpleIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { formatEventDateTime } from "@/utils/formatEventDateTime.ts";
import { useEventDetailPopup } from "@/hooks/useEventDetailPopup.ts";
import { Text } from "@/ui/common/Text.tsx";
import type { EventDetail } from "@/types/event.ts";
import { EditableInput } from "@/ui/container/edit.tsx";
import { Trash } from "@/ui/container/trash";
const toLocalInput = (d?: Date | null) =>
  d
    ? new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16)
    : "";
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
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
  const [draft, setDraft] = useState({
    title: "",
    location: "",
    category: "",
    description: "",
    startDate: "",
    endDate: event
      ? toLocalInput(
          event.allDay && event.end ? addDays(event.end, -1) : event.end,
        )
      : "",
    allDay: false,
  });
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const update = (patch: Partial<typeof draft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (!event) return;
    console.log(
      "allDay:",
      event.allDay,
      "end:",
      event.end,
      "start:",
      event.start,
    );
    setDraft({
      title: event.title.trim() || "",
      location: event.location || "",
      category: event.category || "",
      description: event.description || "",
      startDate: toLocalInput(event.start),
      endDate: toLocalInput(
        event.allDay && event.end ? addDays(event.end, -1) : event.end,
      ),
      allDay: event.allDay,
    });
    setError("");
    setEditing(false);
  }, [event]);

  const start = new Date(draft.startDate);
  const end = draft.endDate ? new Date(draft.endDate) : null;
  const isDateValid =
    !Number.isNaN(start.getTime()) &&
    (draft.allDay
      ? end === null || (!Number.isNaN(end.getTime()) && start <= end)
      : end !== null && !Number.isNaN(end.getTime()) && start < end);
  const isTitleValid = draft.title.trim() !== "";
  const handleSave = async () => {
    if (!event || !isDateValid || !isTitleValid) return;
    setError("");
    setEditing(false);
    try {
      await onSave({
        ...event,
        title: draft.title,
        location: draft.location,
        category: draft.category,
        description: draft.description,
        start,
        end: draft.allDay
          ? addDays(new Date(draft.endDate || draft.startDate), 1)
          : draft.endDate
            ? new Date(draft.endDate)
            : null,
        allDay: draft.allDay,
      });
      setError("");
      setEditing(false);
    } catch {
      setEditing(true);
      setError("保存に失敗しました。もう一度試してください。");
    }
  };
  const handleCancel = () => {
    if (!event) return;
    setDraft({
      title: event.title.trim() || "",
      location: event.location || "",
      category: event.category || "",
      description: event.description || "",
      startDate: toLocalInput(event.start),
      endDate: toLocalInput(
        event.allDay && event.end ? addDays(event.end, -1) : event.end,
      ),
      allDay: event.allDay,
    });
    setError("");
    setEditing(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="event-detail-title"
      onClose={onClose}
      onCancel={(e) => {
        if (editing) {
          e.preventDefault();
          handleCancel();
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
                    onChange={(e) => {
                      if (e.target.checked) {
                        update({
                          allDay: true,
                          endDate: draft.endDate || draft.startDate,
                        });
                      } else {
                        const s = new Date(draft.startDate);
                        update({
                          allDay: false,
                          endDate:
                            draft.endDate ||
                            (Number.isNaN(s.getTime())
                              ? ""
                              : toLocalInput(
                                  new Date(s.getTime() + 60 * 60 * 1000),
                                )),
                        });
                      }
                    }}
                  />
                  終日
                </label>
              )}
              {!editing && draft.allDay && (
                <span>
                  {formatEventDateTime(event.start, event.end, event.allDay)}
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
                    onChange={(e) =>
                      update({
                        startDate: draft.allDay
                          ? `${e.target.value}T00:00`
                          : e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      update({
                        endDate: draft.allDay
                          ? `${e.target.value}T00:00`
                          : e.target.value,
                      })
                    }
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
                onClick={() => setEditing((v) => !v)}
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
                onClick={handleCancel}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn bg-[var(--color-chat)] h-10 w-30"
                onClick={handleSave}
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
            handleCancel();
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
