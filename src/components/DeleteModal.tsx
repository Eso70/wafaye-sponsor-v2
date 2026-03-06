"use client";

import { useEffect, useRef, useState } from "react";
import { FaTrash, FaXmark } from "react-icons/fa6";

export type DeleteModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
};

export function DeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Delete",
  message = "This action cannot be undone.",
  itemName,
  confirmLabel = "Delete",
}: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", onEscape);
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [onClose, open, loading]);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
      <div
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#d7e2f8] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#d7e2f8] bg-[linear-gradient(90deg,#fff5f5_0%,#fef2f2_100%)] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2
              id="delete-modal-title"
              className="flex items-center gap-3 text-lg font-bold text-slate-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <FaTrash className="text-base" />
              </span>
              {title}
            </h2>
            <button
              type="button"
              onClick={() => !loading && onClose()}
              aria-label="Close"
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaXmark className="text-lg" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {itemName ? (
            <p className="mb-2 text-base font-semibold text-slate-800">
              &ldquo;{itemName}&rdquo;
            </p>
          ) : null}
          <p className="text-sm text-slate-600">{message}</p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 rounded-full border border-rose-200 bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
