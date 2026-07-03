// Gancho de celebración. En Fase 4 aquí van el confeti rico y los sonidos;
// por ahora dispara un confeti sencillo que ya deja la app "festiva".

import confetti from "canvas-confetti";

export function celebrate(intensity: "small" | "big" = "small"): void {
  const count = intensity === "big" ? 160 : 70;
  try {
    confetti({
      particleCount: count,
      spread: intensity === "big" ? 100 : 70,
      origin: { y: 0.6 },
      scalar: 1.1,
    });
  } catch {
    // canvas-confetti necesita un canvas; en tests (jsdom) simplemente no hace nada.
  }
}
