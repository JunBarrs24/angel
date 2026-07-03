// Formatea segundos como reloj m:ss (p. ej. 75 -> "1:15").

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
