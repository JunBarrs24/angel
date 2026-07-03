// Paso A — LECTURA.
//
//  1. Primero una pantalla "¿Estás listo?" con un botón grande naranja y un
//     ajuste del tiempo de lectura (por defecto 1 min, de 10 en 10 segundos).
//  2. Al empezar, aparecen la historia y el temporizador. El temporizador sube
//     con el tiempo (tipo "combustible") y queda pegado arriba (sticky) para
//     verse siempre, aunque se haga scroll.
//  3. Palabras tocables que guardan/retoman el avance de lectura.

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "../../api/client";
import type { ReadingState } from "../../api/types";
import { OxygenGauge } from "../../components/OxygenGauge";
import { StoryReader } from "../../components/StoryReader";
import { formatClock } from "../../lib/time";

interface ReadingStepProps {
  childId: number;
  dayNumber: number;
  dinoEmoji: string;
  title: string;
  story: string;
  wordCount: number;
  initialReading: ReadingState;
  onFinish: () => void;
}

const AUTOSAVE_MS = 20_000;
const DEFAULT_GOAL = 60; // 1 minuto
const GOAL_STEP = 10;
const GOAL_MIN = 10;
const GOAL_MAX = 30 * 60;

export function ReadingStep({
  childId,
  dayNumber,
  dinoEmoji,
  title,
  story,
  initialReading,
  onFinish,
}: ReadingStepProps) {
  const [phase, setPhase] = useState<"ready" | "reading">("ready");
  const [goalSeconds, setGoalSeconds] = useState(DEFAULT_GOAL);
  const [readCount, setReadCount] = useState(initialReading.last_word_index);
  const [seconds, setSeconds] = useState(initialReading.seconds_elapsed);
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const readRef = useRef(readCount);
  readRef.current = readCount;

  const resuming = initialReading.last_word_index > 0 && !initialReading.finished;
  const reachedGoal = seconds >= goalSeconds;

  const save = useCallback(
    (extra: { finished?: boolean } = {}) => {
      void api
        .saveReading({
          child_id: childId,
          day_number: dayNumber,
          seconds_elapsed: secondsRef.current,
          last_word_index: readRef.current,
          words_read: readRef.current,
          finished: extra.finished ?? false,
        })
        .catch(() => {
          // Guardado best-effort: si falla, se reintenta en el siguiente evento.
        });
    },
    [childId, dayNumber],
  );

  // El temporizador sube 1 segundo por segundo mientras se lee, hasta la meta.
  useEffect(() => {
    if (phase !== "reading" || reachedGoal) return;
    const id = window.setInterval(() => {
      setSeconds((s) => Math.min(s + 1, GOAL_MAX));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, reachedGoal]);

  // Autoguardado periódico y al salir del paso (solo cuando ya se está leyendo).
  useEffect(() => {
    if (phase !== "reading") return;
    const id = window.setInterval(() => save(), AUTOSAVE_MS);
    return () => {
      window.clearInterval(id);
      save();
    };
  }, [phase, save]);

  function handleWordTap(newCount: number) {
    setReadCount(newCount);
    readRef.current = newCount;
    save();
  }

  function finish() {
    // Guardamos "terminado" sin tocar readCount: conservamos hasta dónde fue
    // marcando el niño para que el repaso muestre su avance real.
    save({ finished: true });
    onFinish();
  }

  // ---------- Pantalla "¿Estás listo?" ----------
  if (phase === "ready") {
    return (
      <div className="centro" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <p style={{ fontSize: "4rem", margin: 0 }} aria-hidden="true">
          {dinoEmoji}
        </p>
        <h1 style={{ margin: 0 }}>¿Estás listo para empezar a leer?</h1>
        <p className="texto-suave" style={{ marginTop: 0 }}>
          Hoy leeremos «{title}». Cuando toques el botón empieza tu tiempo de lectura.
        </p>

        <div className="card" style={{ width: "100%", maxWidth: 420 }}>
          <p style={{ fontWeight: 800, marginTop: 0 }}>⏱️ Tiempo de lectura</p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
            }}
          >
            <button
              type="button"
              className="btn btn--fantasma"
              onClick={() => setGoalSeconds((g) => Math.max(GOAL_MIN, g - GOAL_STEP))}
              disabled={goalSeconds <= GOAL_MIN}
              aria-label="Quitar 10 segundos"
              style={{ fontSize: "2rem", width: 72, minHeight: 72 }}
            >
              −
            </button>
            <span aria-live="polite" style={{ fontSize: "2.6rem", fontWeight: 900, minWidth: 110 }}>
              {formatClock(goalSeconds)}
            </span>
            <button
              type="button"
              className="btn btn--fantasma"
              onClick={() => setGoalSeconds((g) => Math.min(GOAL_MAX, g + GOAL_STEP))}
              disabled={goalSeconds >= GOAL_MAX}
              aria-label="Agregar 10 segundos"
              style={{ fontSize: "2rem", width: 72, minHeight: 72 }}
            >
              +
            </button>
          </div>
          <p className="texto-suave" style={{ marginBottom: 0, fontSize: "0.95rem" }}>
            Ajústalo de 10 en 10 segundos.
          </p>
        </div>

        <button
          type="button"
          className="btn btn--naranja btn--grande"
          onClick={() => setPhase("reading")}
        >
          ¡Sí, a leer! 📖
        </button>
      </div>
    );
  }

  // ---------- Pantalla de lectura ----------
  return (
    <div>
      {/* Temporizador pegado arriba: siempre visible aunque se haga scroll. */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "10px 0 12px",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(4px)",
            borderRadius: "var(--radio)",
            boxShadow: "var(--sombra-suave)",
            padding: "10px 14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span aria-hidden="true" style={{ fontSize: "1.5rem" }}>
              {dinoEmoji}
            </span>
            <strong style={{ fontSize: "1.1rem" }}>{title}</strong>
          </div>
          <OxygenGauge seconds={seconds} max={goalSeconds} />
        </div>
      </div>

      <p className="texto-suave" style={{ marginTop: 0 }}>
        {resuming
          ? "👉 Toca la palabra donde te quedaste. ¡Sigue desde ahí!"
          : "Lee en voz alta. Toca la palabra donde vayas para guardar tu avance."}
      </p>

      <div className="card">
        <StoryReader story={story} readCount={readCount} onWordTap={handleWordTap} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <button type="button" className="btn btn--verde btn--grande" onClick={finish}>
          ✅ Terminé de leer
        </button>
      </div>
    </div>
  );
}
