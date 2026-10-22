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
          className="btn btn-secondary shadow-sm"
        >
          <TrashIcon
            size={20}
            weight="light"
            color="var(--color-primary-content)"
          />
        </button>
      </div>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box max-w-100 max-h-50 flex justify-center items-center">
          <div className="flex flex-col">
            <h1>本当に削除しますか？</h1>
            <div className="flex">
              <form method="dialog">
                <button
                  className="btn btn-chat mx-5 my-7"
                  onClick={confirmDelete}
                >
                  削除
                </button>
              </form>
              <form method="dialog">
                <button className="btn btn-primary mx-5 my-7">
                  キャンセル
                </button>
              </form>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
