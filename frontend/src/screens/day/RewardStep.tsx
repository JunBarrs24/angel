// Paso D — RECOMPENSA. Estrellas ganadas, racha y medallas nuevas.
// El confeti/animaciones ricos son Fase 4; aquí dejamos los ganchos listos.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { CompleteResult } from "../../api/types";
import { StarRow } from "../../components/StarRow";
import { celebrate } from "../../lib/celebrate";

interface RewardStepProps {
  result: CompleteResult;
  dinoEmoji: string;
  dinoName: string;
}

export function RewardStep({ result, dinoEmoji, dinoName }: RewardStepProps) {
  const navigate = useNavigate();

  // Gancho de celebración (Fase 4 lo enriquece).
  useEffect(() => {
    celebrate(result.stars >= 3 ? "big" : "small");
  }, [result.stars]);

  return (
    <div className="centro" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ fontSize: "4rem", margin: 0 }} aria-hidden="true">
        {dinoEmoji}
      </p>
      <h1 style={{ margin: 0 }}>
        {result.already_completed ? "¡Ya conquistaste este planeta!" : "¡Reto completado!"}
      </h1>
      <p className="texto-suave" style={{ marginTop: 0 }}>
        Domaste al {dinoName}. ¡Gran trabajo, explorador!
      </p>

      <div className="card" style={{ width: "100%", maxWidth: 480 }}>
        <p style={{ fontWeight: 800, marginTop: 0 }}>Estrellas de hoy</p>
        <StarRow count={result.stars} size={2.4} />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "2rem", fontWeight: 900 }}>⭐ {result.total_stars}</div>
            <div className="texto-suave">estrellas totales</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: 900 }}>🔥 {result.streak}</div>
            <div className="texto-suave">días de racha</div>
          </div>
        </div>
      </div>

      {result.newly_earned_badges.length > 0 && (
        <div className="card" style={{ width: "100%", maxWidth: 480 }}>
          <p style={{ fontWeight: 800, marginTop: 0 }}>¡Medallas nuevas!</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {result.newly_earned_badges.map((badge) => (
              <div
                key={badge.key}
                style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
              >
                <span style={{ fontSize: "2.4rem" }} aria-hidden="true">
                  {badge.emoji}
                </span>
                <div>
                  <div style={{ fontWeight: 800 }}>{badge.title}</div>
                  <div className="texto-suave" style={{ fontSize: "0.95rem" }}>
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" className="btn btn--grande" onClick={() => navigate("/mapa")}>
          🗺️ Volver al mapa
        </button>
        <button
          type="button"
          className="btn btn--morado btn--grande"
          onClick={() => navigate("/progreso")}
        >
          🏅 Ver mis logros
        </button>
      </div>
    </div>
  );
}
