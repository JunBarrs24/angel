// Repaso de un día YA completado (modo solo lectura, para que un adulto vea qué
// hizo el niño): hasta dónde leyó, qué respondió en cada pregunta y en cada
// ejercicio de mate. No se puede modificar nada.

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import type { DayChallenge } from "../../api/types";
import { StarRow } from "../../components/StarRow";
import { StoryReader } from "../../components/StoryReader";

const LETTERS = ["A", "B", "C", "D"];

interface DayReviewProps {
  childId: number;
  day: DayChallenge;
}

export function DayReview({ childId, day }: DayReviewProps) {
  const navigate = useNavigate();
  const completion = day.completion!;

  const comp = useQuery({
    queryKey: ["review-comp", day.day_number, childId, completion.comprehension_answers],
    queryFn: () =>
      api.checkComprehension({
        child_id: childId,
        day_number: day.day_number,
        answers: completion.comprehension_answers,
      }),
  });

  const math = useQuery({
    queryKey: ["review-math", day.day_number, childId, completion.math_answers],
    queryFn: () =>
      api.checkMath({
        child_id: childId,
        day_number: day.day_number,
        answers: completion.math_answers,
      }),
  });

  return (
    <div>
      <header className="cabecera">
        <button
          type="button"
          className="btn btn--fantasma"
          style={{ padding: "10px 18px", minHeight: 48 }}
          onClick={() => navigate("/mapa")}
        >
          ← Mapa
        </button>
        <span className="pastilla">Día {day.day_number} · repaso</span>
      </header>

      <div className="centro" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: "3.4rem", margin: 0 }} aria-hidden="true">
          {day.dino_emoji}
        </p>
        <h1 style={{ margin: 0 }}>¡Ya conquistaste este planeta!</h1>
        <p className="texto-suave" style={{ marginTop: 0 }}>
          Así le fue a tu explorador con {day.dino_name}. (Solo para ver, no se puede cambiar.)
        </p>
        <StarRow count={completion.stars} size={1.8} />
      </div>

      {/* ---- Lectura ---- */}
      <section className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>📖 Lectura</h2>
        <p className="texto-suave" style={{ marginTop: 0 }}>
          Leyó {day.reading.words_read} de {day.word_count} palabras
          {day.reading.finished ? " · terminó la lectura ✅" : ""}. Lo leído está resaltado.
        </p>
        <StoryReader story={day.story} readCount={day.reading.last_word_index} readOnly />
      </section>

      {/* ---- Preguntas ---- */}
      <section className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>
          🤔 Preguntas{" "}
          <span className="texto-suave" style={{ fontSize: "1rem" }}>
            ({completion.questions_correct}/{completion.questions_total} bien)
          </span>
        </h2>
        {comp.isLoading && <p className="texto-suave">Cargando respuestas…</p>}
        {comp.data &&
          day.questions.map((question, i) => {
            const childAnswer = completion.comprehension_answers[i];
            const correctIndex = comp.data.correct_indices[i];
            const ok = comp.data.per_item[i];
            return (
              <div key={question.id} style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 800, marginBottom: 8 }}>
                  {i + 1}. {question.prompt} {ok ? "✅" : "❌"}
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {question.options.map((option, j) => {
                    const isCorrect = j === correctIndex;
                    const isChildWrong = j === childAnswer && j !== correctIndex;
                    const bg = isCorrect ? "#d6ffe9" : isChildWrong ? "#ffe0d1" : "#f4f6fb";
                    return (
                      <div
                        key={j}
                        style={{
                          background: bg,
                          borderRadius: 12,
                          padding: "8px 14px",
                          opacity: isCorrect || isChildWrong ? 1 : 0.6,
                        }}
                      >
                        <strong>{LETTERS[j]}.</strong> {option}
                        {isCorrect && " ✓"}
                        {isChildWrong && " ← respondió esto ✗"}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </section>

      {/* ---- Matemáticas ---- */}
      <section className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>
          🔢 Matemáticas{" "}
          <span className="texto-suave" style={{ fontSize: "1rem" }}>
            ({completion.math_correct}/{completion.math_total} bien)
          </span>
        </h2>
        {math.isLoading && <p className="texto-suave">Cargando respuestas…</p>}
        {math.data && (
          <div style={{ display: "grid", gap: 10 }}>
            {day.math.map((problem, i) => {
              const childAns = completion.math_answers[i] ?? "—";
              const correctAns = math.data.correct_answers[i];
              const ok = math.data.per_item[i];
              const shownPrompt =
                problem.kind === "compare" ? problem.prompt : `${problem.prompt} =`;
              return (
                <div
                  key={problem.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    background: ok ? "#d6ffe9" : "#ffe0d1",
                    borderRadius: 12,
                    padding: "10px 14px",
                    flexWrap: "wrap",
                  }}
                >
                  <strong style={{ fontSize: "1.2rem" }}>{shownPrompt}</strong>
                  <span>
                    respondió <strong>{childAns}</strong> {ok ? "✅" : `❌ (era ${correctAns})`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <button type="button" className="btn btn--grande" onClick={() => navigate("/mapa")}>
          🗺️ Volver al mapa
        </button>
      </div>
    </div>
  );
}
