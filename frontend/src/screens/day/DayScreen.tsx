// Pantalla 3 — Flujo del día. Orquesta LECTURA → PREGUNTAS → MATEMÁTICAS →
// RECOMPENSA y hace el envío final a POST /api/answers/complete.

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useCompleteDay, useDay } from "../../api/hooks";
import type { CompleteResult } from "../../api/types";
import { useChild } from "../../hooks/useChild";
import { DayReview } from "./DayReview";
import { MathStep } from "./MathStep";
import { QuestionsStep } from "./QuestionsStep";
import { ReadingStep } from "./ReadingStep";
import { RewardStep } from "./RewardStep";

type Step = "reading" | "questions" | "math" | "reward";

export function DayScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const { childId } = useChild();
  const dayNumber = Number(params.dayNumber);
  const { data: day, isLoading, isError, error } = useDay(dayNumber, childId);
  const completeDay = useCompleteDay();

  const [step, setStep] = useState<Step>("reading");
  const [comprehensionAnswers, setComprehensionAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<CompleteResult | null>(null);

  if (childId == null) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="pantalla centro">
        <p style={{ fontSize: "3rem" }}>🦕</p>
        <p>Cargando el reto…</p>
      </div>
    );
  }

  if (isError || !day) {
    const locked = (error as { status?: number } | null)?.status === 403;
    return (
      <div className="pantalla centro">
        <p style={{ fontSize: "3rem" }}>{locked ? "🔒" : "😴"}</p>
        <p>
          {locked
            ? "Este planeta todavía está bloqueado. ¡Vuelve el día que le toca!"
            : "No pudimos cargar el reto."}
        </p>
        <button className="btn" onClick={() => navigate("/mapa")}>
          🗺️ Volver al mapa
        </button>
      </div>
    );
  }

  // Día ya completado: repaso en modo solo lectura (no se repite el flujo).
  if (day.completion && step !== "reward") {
    return (
      <div className="pantalla">
        <DayReview childId={childId} day={day} />
      </div>
    );
  }

  function goToMath(answers: number[]) {
    setComprehensionAnswers(answers);
    setStep("math");
  }

  function finishDay(mathAnswers: string[]) {
    completeDay.mutate(
      {
        child_id: childId as number,
        day_number: dayNumber,
        comprehension_answers: comprehensionAnswers,
        math_answers: mathAnswers,
      },
      {
        onSuccess: (res) => {
          setResult(res);
          setStep("reward");
        },
      },
    );
  }

  return (
    <div className="pantalla">
      {step !== "reward" && (
        <header className="cabecera">
          <button
            type="button"
            className="btn btn--fantasma"
            style={{ padding: "10px 18px", minHeight: 48 }}
            onClick={() => navigate("/mapa")}
          >
            ← Mapa
          </button>
          <span className="pastilla">Día {day.day_number}</span>
        </header>
      )}

      {step === "reading" && (
        <ReadingStep
          childId={childId}
          dayNumber={dayNumber}
          dinoEmoji={day.dino_emoji}
          title={day.title}
          story={day.story}
          wordCount={day.word_count}
          initialReading={day.reading}
          onFinish={() => setStep("questions")}
        />
      )}

      {step === "questions" && (
        <QuestionsStep
          childId={childId}
          dayNumber={dayNumber}
          questions={day.questions}
          onFinish={goToMath}
        />
      )}

      {step === "math" && (
        <>
          <MathStep
            childId={childId}
            dayNumber={dayNumber}
            problems={day.math}
            onFinish={finishDay}
          />
          {completeDay.isPending && (
            <p className="centro" style={{ marginTop: 16 }}>
              Guardando tu aventura… ✨
            </p>
          )}
          {completeDay.isError && (
            <p className="centro" style={{ color: "var(--rojo)", fontWeight: 700 }}>
              No pudimos guardar. Intenta terminar de nuevo.
            </p>
          )}
        </>
      )}

      {step === "reward" && result && (
        <RewardStep result={result} dinoEmoji={day.dino_emoji} dinoName={day.dino_name} />
      )}
    </div>
  );
}
