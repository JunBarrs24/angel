// Medidor de "combustible lector": el tiempo de lectura sube hasta la meta
// elegida y lo mostramos como un tanque que se llena. Nada de presión: es un
// premio por leer. Va pegado arriba (sticky) para verse siempre.

import { formatClock } from "../lib/time";

interface OxygenGaugeProps {
  seconds: number;
  max: number;
}

export function OxygenGauge({ seconds, max }: OxygenGaugeProps) {
  const capped = Math.min(seconds, max);
  const pct = max > 0 ? Math.round((capped / max) * 100) : 0;
  const reached = seconds >= max;

  return (
    <div
      className="pastilla"
      style={{ gap: 12, width: "100%", justifyContent: "flex-start" }}
      aria-label={`Combustible lector: ${formatClock(capped)} de ${formatClock(max)}`}
    >
      <span aria-hidden="true" style={{ fontSize: "1.4rem" }}>
        {reached ? "⭐" : "⛽"}
      </span>
      <div style={{ flex: 1 }}>
        <div
          className="barra"
          style={{ height: 18 }}
          role="progressbar"
          aria-valuenow={capped}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className="barra__relleno"
            style={{
              width: `${pct}%`,
              background: reached
                ? "linear-gradient(90deg, var(--verde), var(--amarillo))"
                : "linear-gradient(90deg, var(--azul), var(--verde))",
            }}
          />
        </div>
      </div>
      <span
        style={{
          fontVariantNumeric: "tabular-nums",
          minWidth: 88,
          textAlign: "right",
          fontWeight: 800,
        }}
      >
        {reached ? "¡Meta! 🎉" : `${formatClock(capped)} / ${formatClock(max)}`}
      </span>
    </div>
  );
}
