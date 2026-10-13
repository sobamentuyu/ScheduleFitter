import { useRef } from "react";
export function useTrash<T>(onDelete: (event: T) => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const targetRef = useRef<T | null>(null);

  const requestDelete = (event: T) => {
    targetRef.current = event;
    dialogRef.current?.showModal();
  };

  const confirmDelete = () => {
    if (targetRef.current) {
      onDelete(targetRef.current);
      targetRef.current = null;
    }
  };

  return { dialogRef, requestDelete, confirmDelete };
}
