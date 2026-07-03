// Paso C — MATEMÁTICAS. Para sum/sub, teclado numérico grande; para compare,
// botones < = >. Feedback inmediato con POST /api/answers/math.

import { useState } from "react";

import { api } from "../../api/client";
import type { MathProblem } from "../../api/types";
import { FeedbackDino } from "../../components/FeedbackDino";
import { NumberPad } from "../../components/NumberPad";

// Pista/leyenda de lo que se espera según el tipo de ejercicio.
function legendFor(kind: string): string {
  if (kind === "compare") {
    return "¿Qué signo va aquí? Toca menor (<), igual (=) o mayor (>).";
  }
  return "¿Cuál es el resultado de esta operación?";
}

interface MathStepProps {
  childId: number;
  dayNumber: number;
  problems: MathProblem[];
  onFinish: (answers: string[]) => void;
}

export function MathStep({ childId, dayNumber, problems, onFinish }: MathStepProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [entry, setEntry] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const problem = problems[current];
  const isLast = current === problems.length - 1;
  const isCompare = problem.kind === "compare";
  const promptText = isCompare ? problem.prompt.replace("?", "  ?  ") : `${problem.prompt} = ?`;
  const legend = legendFor(problem.kind);

  async function submit(answer: string) {
    if (checking || correct || answer.length === 0) return;
    setPicked(answer);
    setChecking(true);
    const upto = [...answers.slice(0, current), answer];
    try {
      const result = await api.checkMath({
        child_id: childId,
        day_number: dayNumber,
        answers: upto,
      });
      const ok = result.per_item[current];
      setCorrect(ok);
      if (ok) setAnswers(upto);
    } catch {
      setCorrect(true);
      setAnswers(upto);
    } finally {
      setChecking(false);
    }
  }

  function next() {
    const finalAnswers = [...answers.slice(0, current), picked ?? entry];
    if (isLast) {
      onFinish(finalAnswers);
      return;
    }
    setAnswers(finalAnswers);
    setCurrent((c) => c + 1);
    setEntry("");
    setPicked(null);
    setCorrect(null);
  }

  function retry() {
    setEntry("");
    setPicked(null);
    setCorrect(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>🔢 Matemáticas</h2>
        <span className="pastilla">
          {current + 1} / {problems.length}
        </span>
      </div>

      <div
        className="card centro"
        style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}
      >
        <p className="texto-suave" style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>
          {legend}
        </p>
        <p style={{ fontSize: "3rem", fontWeight: 900, margin: 0 }}>{promptText}</p>
      </div>

      {/* Izquierda: entrada (teclado o signos). Derecha: dino + mensaje + botón,
          siempre visible al lado para que "Siguiente" no quede fuera de pantalla. */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", minWidth: 260 }}>
          {isCompare ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {problem.options.map((option) => {
                const isPicked = picked === option;
                let cls = "btn btn--fantasma";
                if (isPicked && correct === true) cls = "btn btn--verde";
                else if (isPicked && correct === false) cls = "btn btn--naranja";
                const labels: Record<string, string> = {
                  "<": "menor que",
                  "=": "igual que",
                  ">": "mayor que",
                };
                return (
                  <button
                    key={option}
                    type="button"
                    className={cls}
                    onClick={() => submit(option)}
                    disabled={checking || correct === true}
                    aria-label={labels[option] ?? option}
                    style={{ fontSize: "3rem", minHeight: 110 }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <NumberPad
              value={entry}
              onChange={setEntry}
              onSubmit={() => submit(entry)}
              disabled={checking || correct === true}
            />
          )}
        </div>

        <div
          style={{
            flex: "1 1 240px",
            minWidth: 220,
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 10,
          }}
        >
          {correct === null && (
            <p className="texto-suave" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              {isCompare ? "👉 Toca el signo correcto" : "👉 Escribe el resultado y toca ✓"}
            </p>
          )}
          {correct === true && (
            <>
              <FeedbackDino correct={true} />
              <p style={{ color: "var(--verde-oscuro)", fontWeight: 800, fontSize: "1.3rem" }}>
                ¡Correcto! 🌟
              </p>
              <button type="button" className="btn btn--verde btn--grande" onClick={next}>
                {isLast ? "¡Terminar el reto! 🏁" : "Siguiente ➜"}
              </button>
            </>
          )}
          {correct === false && (
            <>
              <FeedbackDino correct={false} />
              <p style={{ color: "var(--naranja)", fontWeight: 800, fontSize: "1.2rem" }}>
                Uy, ese no era. ¡Cuenta con calma y prueba otra vez! 🦕
              </p>
              <button type="button" className="btn btn--amarillo" onClick={retry}>
                Intentar de nuevo 🔁
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
