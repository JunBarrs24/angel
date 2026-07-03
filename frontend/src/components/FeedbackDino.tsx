// Dino que reacciona a la respuesta: ríe al acertar, llora al fallar.
// Se usa en preguntas y en matemáticas.

interface FeedbackDinoProps {
  correct: boolean;
}

export function FeedbackDino({ correct }: FeedbackDinoProps) {
  return (
    <div
      role="img"
      aria-label={correct ? "Dinosaurio feliz, ¡acertaste!" : "Dinosaurio triste, fallaste"}
      style={{
        fontSize: "3.6rem",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "flex-end",
        gap: 2,
        animation: correct ? "dino-feliz 0.6s ease infinite" : "dino-triste 0.6s ease 1",
      }}
    >
      <span>{correct ? "🦖" : "🦕"}</span>
      <span style={{ fontSize: "2.4rem" }}>{correct ? "😄" : "😢"}</span>
    </div>
  );
}
