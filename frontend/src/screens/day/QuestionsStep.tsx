// Paso B — PREGUNTAS de comprensión. Botones grandes, feedback inmediato con
// POST /api/answers/comprehension. UNA sola oportunidad por pregunta: al elegir
// se bloquea, se muestra si acertó o falló (revelando la correcta para aprender)
// y se continúa igual. Se cuenta el PRIMER intento, así las estrellas son honestas.

import { useState } from "react";

import { api } from "../../api/client";
import type { Question } from "../../api/types";
import { FeedbackDino } from "../../components/FeedbackDino";

interface QuestionsStepProps {
  childId: number;
  dayNumber: number;
  questions: Question[];
  onFinish: (answers: number[]) => void;
}

const LETTERS = ["A", "B", "C", "D"];

export function QuestionsStep({ childId, dayNumber, questions, onFinish }: QuestionsStepProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  const question = questions[current];
  const isLast = current === questions.length - 1;
  const locked = picked !== null;
  const gotItRight = picked !== null && picked === correctIndex;

  async function choose(optionIndex: number) {
    if (locked || checking) return;
    setPicked(optionIndex);
    setChecking(true);
    // Registramos el PRIMER intento (aunque falle) y lo enviamos para calificar.
    const upto = [...answers.slice(0, current), optionIndex];
    setAnswers(upto);
    try {
      const result = await api.checkComprehension({
        child_id: childId,
        day_number: dayNumber,
        answers: upto,
      });
      setCorrectIndex(result.correct_indices[current]);
    } catch {
      // Sin red: aceptamos la elección como correcta para no bloquear al niño.
      setCorrectIndex(optionIndex);
    } finally {
      setChecking(false);
    }
  }

  function next() {
    if (isLast) {
      onFinish(answers);
      return;
    }
    setCurrent((c) => c + 1);
    setPicked(null);
    setCorrectIndex(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>🤔 Preguntas</h2>
        <span className="pastilla">
          {current + 1} / {questions.length}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: 0 }}>{question.prompt}</p>
      </div>

      <div className="grid-opciones">
        {question.options.map((option, i) => {
          const revealed = correctIndex !== null;
          const isCorrectOption = revealed && i === correctIndex;
          const isWrongPick = revealed && i === picked && i !== correctIndex;

          let cls = "btn btn--fantasma";
          if (isCorrectOption) cls = "btn btn--verde";
          else if (isWrongPick) cls = "btn btn--naranja";

          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => choose(i)}
              disabled={locked || checking}
              style={{
                justifyContent: "flex-start",
                textAlign: "left",
                minHeight: 72,
                // Atenuamos las opciones no elegidas y no correctas tras revelar.
                opacity: revealed && !isCorrectOption && !isWrongPick ? 0.5 : 1,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontWeight: 900,
                  marginRight: 8,
                  background: "rgba(0,0,0,0.06)",
                  borderRadius: 8,
                  padding: "2px 12px",
                }}
              >
                {LETTERS[i]}
              </span>
              {option}
              {isCorrectOption && <span aria-hidden="true"> ✓</span>}
              {isWrongPick && <span aria-hidden="true"> ✗</span>}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 20, minHeight: 80 }}>
        {locked && correctIndex !== null && (
          <div style={{ textAlign: "center" }}>
            <FeedbackDino correct={gotItRight} />
            {gotItRight ? (
              <p style={{ color: "var(--verde-oscuro)", fontWeight: 800, fontSize: "1.3rem" }}>
                ¡Muy bien! 🎉
              </p>
            ) : (
              <p style={{ color: "var(--naranja)", fontWeight: 800, fontSize: "1.2rem" }}>
                ¡Casi! La respuesta correcta está en verde. La próxima te sale. 🦕
              </p>
            )}
            <button type="button" className="btn btn--verde btn--grande" onClick={next}>
              {isLast ? "Ir a las matemáticas ➜" : "Siguiente pregunta ➜"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
