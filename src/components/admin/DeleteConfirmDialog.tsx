"use client";

import { useEffect, useRef } from "react";

type DeleteConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

// 削除確認モーダル。抹茶店 / 神社 / 口コミの破壊的操作で共有する。
export default function DeleteConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "削除する",
  loading = false,
  error,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // 開いたらキャンセルにフォーカスを移し、Esc で閉じられるようにする。
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
    >
      <div className="w-full max-w-sm border border-line bg-paper p-6">
        <h2 className="font-mincho text-lg tracking-[0.08em] text-ink">
          {title}
        </h2>
        <p className="mt-3 font-serif-jp text-sm leading-[1.9] text-muted">
          {message}
        </p>
        {error && (
          <p role="alert" className="mt-3 font-sans-jp text-xs text-bengara">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="border border-line bg-paper px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:bg-washi disabled:opacity-60"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="border border-bengara bg-bengara px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-paper transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "削除中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
