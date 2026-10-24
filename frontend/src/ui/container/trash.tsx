import { TrashIcon } from "@phosphor-icons/react";
import { useTrash } from "@/hooks/useTrash";
interface TrashProps<T extends { id: string }> {
  event: T;
  onDelete: (event: T) => void;
}

export function Trash<T extends { id: string }>({
  event,
  onDelete,
}: TrashProps<T>) {
  const { dialogRef, requestDelete, confirmDelete } = useTrash(onDelete);

  return (
    <>
      <div className="flex justify-end">
        <button
          aria-label="削除"
          onClick={() => requestDelete(event)}
          className="btn bg-[var(--color-chat)] shadow-sm"
        >
          <TrashIcon
            size={20}
            weight="light"
            color="var(--color-primary-content)"
          />
        </button>
      </div>
      <dialog
        ref={dialogRef}
        className="modal transition-none"
        onClose={(e) => e.stopPropagation()}
        onCancel={(e) => e.stopPropagation()}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="modal-box max-w-100 max-h-50 flex justify-center items-center">
          <div className="flex flex-col justify-center items-center">
            <h1>本当に削除しますか？</h1>
            <div className="flex">
              <button
                type="button"
                className="btn mx-5 my-7 w-30 h-10"
                onClick={() => dialogRef.current?.close()}
              >
                キャンセル
              </button>
              <form method="dialog">
                <button
                  className="btn bg-[var(--color-chat)] mx-5 my-7 w-30 h-10"
                  onClick={confirmDelete}
                >
                  削除
                </button>
              </form>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
