// Modal de confirmación animado (tarjeta con rebote). Se usa antes de canjear en
// la tienda, para evitar compras accidentales.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface ConfirmModalProps {
  open: boolean;
  emoji?: string;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  emoji,
  title,
  children,
  confirmLabel,
  cancelLabel = "Mejor no",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(38, 50, 77, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 100,
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.6, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.6, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ maxWidth: 420, width: "100%", textAlign: "center" }}
          >
            {emoji && (
              <div style={{ fontSize: "3.6rem" }} aria-hidden="true">
                {emoji}
              </div>
            )}
            <h2 style={{ marginBottom: 8 }}>{title}</h2>
            {children}
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: 16,
              }}
            >
              <button type="button" className="btn btn--fantasma" onClick={onCancel}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className="btn btn--verde btn--grande"
                onClick={onConfirm}
                disabled={confirmDisabled}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
