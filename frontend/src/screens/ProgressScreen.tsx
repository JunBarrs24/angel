// Pantalla 4 — Progreso: estrellas totales, racha, medallas y avance global.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useChildProfile, useProgress } from "../api/hooks";
import { ProgressBar } from "../components/ProgressBar";
import { useChild } from "../hooks/useChild";

export function ProgressScreen() {
  const navigate = useNavigate();
  const { childId } = useChild();
  const { data, isLoading, isError } = useProgress(childId);
  const { data: child } = useChildProfile(childId);

  if (childId == null) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="pantalla centro">
        <p style={{ fontSize: "3rem" }}>🏅</p>
        <p>Cargando tus logros…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="pantalla centro">
        <p style={{ fontSize: "3rem" }}>😴</p>
        <p>No pudimos cargar tu progreso.</p>
        <button className="btn" onClick={() => navigate("/mapa")}>
          🗺️ Volver al mapa
        </button>
      </div>
    );
  }

  return (
    <div className="pantalla">
      <header className="cabecera">
        <button
          type="button"
          className="btn btn--fantasma"
          style={{ padding: "10px 18px", minHeight: 48 }}
          onClick={() => navigate("/mapa")}
        >
          ← Mapa
        </button>
        <h1 style={{ margin: 0 }}>🏅 Mis logros</h1>
      </header>

      {child?.code && <ExplorerCode code={child.code} />}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <Stat emoji="⭐" value={data.stars_available} label="disponibles" />
        <Stat emoji="✨" value={data.total_stars} label="ganadas en total" />
        <Stat emoji="🛒" value={data.stars_spent} label="gastadas" />
        <Stat emoji="🔥" value={data.streak} label="racha actual" />
        <Stat emoji="🏆" value={data.best_streak} label="mejor racha" />
        <Stat emoji="📚" value={data.total_words} label="palabras leídas" />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <button type="button" className="btn btn--amarillo" onClick={() => navigate("/tienda")}>
          🛒 Ir a la tienda ({data.stars_available} ⭐)
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <ProgressBar
          value={data.days_completed}
          max={data.days_total}
          label="Días conquistados 🦖"
        />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Medallas</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 14,
          }}
        >
          {data.badges.map((badge) => (
            <div
              key={badge.key}
              style={{
                textAlign: "center",
                padding: 14,
                borderRadius: "var(--radio)",
                background: badge.earned ? "var(--crema)" : "#f1f3f9",
                boxShadow: badge.earned ? "0 0 0 3px var(--amarillo)" : "none",
                opacity: badge.earned ? 1 : 0.55,
                filter: badge.earned ? "none" : "grayscale(1)",
              }}
            >
              <div style={{ fontSize: "2.6rem" }} aria-hidden="true">
                {badge.earned ? badge.emoji : "🔒"}
              </div>
              <div style={{ fontWeight: 800 }}>{badge.title}</div>
              <div className="texto-suave" style={{ fontSize: "0.85rem" }}>
                {badge.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExplorerCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin portapapeles (o sin permiso): el niño puede leer el código a la vista.
    }
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        justifyContent: "space-between",
        background: "var(--crema)",
      }}
    >
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 800 }}>🦖 Tu código de explorador</div>
        <div className="texto-suave" style={{ fontSize: "0.9rem" }}>
          Úsalo en otro dispositivo para jugar la misma aventura.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontSize: "1.8rem",
            fontWeight: 900,
            letterSpacing: 4,
            background: "#fff",
            borderRadius: 12,
            padding: "6px 16px",
            boxShadow: "var(--sombra-suave)",
          }}
        >
          {code}
        </span>
        <button type="button" className="btn btn--morado" onClick={copy}>
          {copied ? "¡Copiado! ✓" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function Stat({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <div className="card centro" style={{ padding: 16 }}>
      <div style={{ fontSize: "2rem" }} aria-hidden="true">
        {emoji}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 900 }}>{value}</div>
      <div className="texto-suave">{label}</div>
    </div>
  );
}
