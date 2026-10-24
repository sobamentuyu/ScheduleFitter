import { useLayoutEffect, useRef } from "react";

const editClass =
  "rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-chat)]";

const clamp = (v: string, max?: number) =>
  max ? Array.from(v).slice(0, max).join("") : v;

function AutoTextarea({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const border = el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.max(40, el.scrollHeight + border)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      maxLength={maxLength}
      className={`textarea textarea-bordered min-h-10 max-h-none py-[9px] leading-[22px] resize-none overflow-hidden ${editClass}`}
      onChange={(e) => onChange(clamp(e.target.value, maxLength))}
    />
  );
}

export function EditableInput({
  value,
  onChange,
  editing,
  multiline = false,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  multiline?: boolean;
  maxLength?: number;
}) {
  if (multiline) {
    return editing ? (
      <AutoTextarea value={value} onChange={onChange} maxLength={maxLength} />
    ) : (
      <div className="w-full break-words whitespace-pre-wrap">{value}</div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      readOnly={!editing}
      maxLength={maxLength}
      className={
        editing
          ? `input input-bordered ${editClass}`
          : "rounded-lg w-full cursor-default bg-transparent outline-none focus:outline-none"
      }
      onChange={(e) => onChange(clamp(e.target.value, maxLength))}
    />
  );
}
