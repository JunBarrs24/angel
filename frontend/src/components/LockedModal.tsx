// Modal animado que aparece al tocar un día bloqueado: avisa con cariño que
// primero hay que completar los días anteriores.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import type { MapItem } from "../api/types";

interface LockedModalProps {
  day: MapItem | null;
  onClose: () => void;
}

export function LockedModal({ day, onClose }: LockedModalProps) {
  useEffect(() => {
    if (!day) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [day, onClose]);

  return (
    <AnimatePresence>
      {day && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
            aria-label={`Día ${day.day_number} bloqueado`}
            initial={{ scale: 0.6, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.6, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ maxWidth: 420, textAlign: "center", width: "100%" }}
          >
            <motion.div
              animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
              transition={{ duration: 0.7, delay: 0.15 }}
              style={{ fontSize: "4rem" }}
              aria-hidden="true"
            >
              🔒
            </motion.div>
            <h2 style={{ marginBottom: 6 }}>¡Todavía no, explorador!</h2>
            <p style={{ marginTop: 0, fontSize: "1.15rem" }}>
              Para llegar al <strong>{day.dino_name}</strong> {day.dino_emoji} primero tienes que
              completar los días anteriores. ¡Ve uno por uno y lo lograrás! 💪
            </p>
            <button type="button" className="btn btn--naranja btn--grande" onClick={onClose}>
              ¡Entendido! 👍
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
