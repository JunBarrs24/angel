// Historia con palabras TOCABLES. Cada palabra tiene un índice; al tocar una,
// marcamos "hasta aquí leí". Las palabras leídas quedan resaltadas para poder
// CONTINUAR desde donde se quedó al reabrir.
//
// Componente controlado: `readCount` = número de palabras ya leídas (0..N).
// Tocar la palabra en la posición `i` avisa con onWordTap(i + 1).

import { useMemo } from "react";

import { splitWords } from "../lib/words";

interface StoryReaderProps {
  story: string;
  readCount: number;
  onWordTap?: (readCount: number) => void;
  // En modo solo lectura (repaso de un adulto) las palabras no son tocables.
  readOnly?: boolean;
}

export function StoryReader({ story, readCount, onWordTap, readOnly = false }: StoryReaderProps) {
  const words = useMemo(() => splitWords(story), [story]);

  return (
    <div
      style={{
        fontSize: "clamp(1.3rem, 3.2vw, 1.7rem)",
        lineHeight: 1.9,
        textAlign: "left",
      }}
    >
      {words.map((word, i) => {
        const isRead = i < readCount;
        const isLast = i === readCount - 1;
        const sharedStyle = {
          background: isRead ? "var(--amarillo)" : "transparent",
          color: "var(--tinta)",
          borderRadius: 8,
          padding: "2px 6px",
          margin: "0 1px",
          font: "inherit",
          fontWeight: isRead ? 800 : 500,
          boxShadow: isLast ? "0 0 0 3px var(--naranja)" : "none",
        } as const;

        if (readOnly) {
          return (
            <span key={i} data-testid={`word-${i}`} style={sharedStyle}>
              {word}{" "}
            </span>
          );
        }

        return (
          <button
            key={i}
            type="button"
            data-testid={`word-${i}`}
            onClick={() => onWordTap?.(i + 1)}
            aria-label={`Marcar hasta la palabra ${i + 1}: ${word}`}
            aria-pressed={isRead}
            className="palabra"
            style={{ border: "none", cursor: "pointer", ...sharedStyle }}
          >
            {word}
          </button>
        );
      })}
    </div>
  );
}
