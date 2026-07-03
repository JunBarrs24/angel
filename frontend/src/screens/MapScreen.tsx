// Pantalla 2 — Mapa: camino de 40 dinosaurios con estado y estrellas.
// El dino de hoy va resaltado. Barra de progreso hacia el premio final (día 40).

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMap } from "../api/hooks";
import type { MapItem } from "../api/types";
import { LockedModal } from "../components/LockedModal";
import { ProgressBar } from "../components/ProgressBar";
import { StarRow } from "../components/StarRow";
import { useAsOf } from "../hooks/useAsOf";
import { useChild } from "../hooks/useChild";

export function MapScreen() {
  const navigate = useNavigate();
  const { childId } = useChild();
  const asOf = useAsOf();
  const { data, isLoading, isError } = useMap(childId);
  const [lockedDay, setLockedDay] = useState<MapItem | null>(null);

  if (childId == null) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="pantalla centro">
        <p style={{ fontSize: "3rem" }}>🦕</p>
        <p>Cargando el mapa de la aventura…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="pantalla centro">
        <p style={{ fontSize: "3rem" }}>😴</p>
        <p>No pudimos cargar el mapa. ¿El servidor está encendido?</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  const completed = data.days.filter((d) => d.status === "completed").length;

  return (
    <div className="pantalla">
      <header className="cabecera">
        <h1 style={{ margin: 0 }}>🗺️ El camino dino</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn--amarillo"
            style={{ padding: "12px 20px", minHeight: 52 }}
            onClick={() => navigate("/tienda")}
          >
            🛒 Tienda
          </button>
          <button
            type="button"
            className="btn btn--morado"
            style={{ padding: "12px 20px", minHeight: 52 }}
            onClick={() => navigate("/progreso")}
          >
            🏅 Mis logros
          </button>
        </div>
      </header>

      {asOf && (
        <p className="pastilla" style={{ marginBottom: 16, background: "var(--crema)" }}>
          👀 Modo vista previa · día simulado {asOf}
        </p>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <ProgressBar value={completed} max={data.days.length} label="Rumbo al gran tesoro 🏆" />
      </div>

      <ol
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 14,
        }}
      >
        {data.days.map((day) => (
          <DinoStop
            key={day.day_number}
            day={day}
            onOpen={() => navigate(`/dia/${day.day_number}`)}
            onLocked={() => setLockedDay(day)}
          />
        ))}
      </ol>

      <LockedModal day={lockedDay} onClose={() => setLockedDay(null)} />
    </div>
  );
}

function DinoStop({
  day,
  onOpen,
  onLocked,
}: {
  day: MapItem;
  onOpen: () => void;
  onLocked: () => void;
}) {
  const locked = day.status === "locked";
  const isToday = day.status === "today";
  const completed = day.status === "completed";

  const bg = completed
    ? "linear-gradient(160deg, #d6ffe9, #b6f5cf)"
    : isToday
      ? "linear-gradient(160deg, #fff2cc, #ffe08a)"
      : locked
        ? "#eef1f8"
        : "#fff";

  return (
    <li>
      <button
        type="button"
        onClick={locked ? onLocked : onOpen}
        aria-label={`Día ${day.day_number}: ${day.dino_name}${
          isToday ? ", ¡es hoy!" : locked ? ", bloqueado" : ""
        }`}
        style={{
          width: "100%",
          border: "none",
          cursor: "pointer",
          borderRadius: "var(--radio)",
          background: bg,
          boxShadow: isToday
            ? "0 0 0 4px var(--naranja), var(--sombra-suave)"
            : "var(--sombra-suave)",
          padding: "14px 8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          opacity: locked ? 0.65 : 1,
          minHeight: 130,
        }}
      >
        <span style={{ fontWeight: 800, color: "var(--tinta-suave)" }}>Día {day.day_number}</span>
        <span style={{ fontSize: "2.4rem" }} aria-hidden="true">
          {locked ? "🔒" : day.dino_emoji}
        </span>
        <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{day.dino_name}</span>
        {completed ? (
          <StarRow count={day.stars} size={1} />
        ) : isToday ? (
          <span className="pastilla" style={{ padding: "4px 12px", fontSize: "0.85rem" }}>
            ¡HOY!
          </span>
        ) : (
          <span aria-hidden="true" style={{ height: "1.2rem" }} />
        )}
      </button>
    </li>
  );
}
