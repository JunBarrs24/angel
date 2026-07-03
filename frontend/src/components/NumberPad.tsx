// Teclado numérico grande para sumas y restas (respuesta escrita).

interface NumberPadProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "borrar", "0", "ok"];

export function NumberPad({ value, onChange, onSubmit, disabled }: NumberPadProps) {
  function press(key: string) {
    if (disabled) return;
    if (key === "borrar") {
      onChange(value.slice(0, -1));
    } else if (key === "ok") {
      if (value.length > 0) onSubmit();
    } else if (value.length < 4) {
      onChange(value + key);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 420, margin: "0 auto", width: "100%" }}>
      <div
        aria-live="polite"
        style={{
          textAlign: "center",
          fontSize: "3rem",
          fontWeight: 900,
          minHeight: "3.6rem",
          background: "#fff",
          borderRadius: "var(--radio)",
          boxShadow: "var(--sombra-suave)",
          padding: "8px 16px",
        }}
      >
        {value || <span className="texto-suave">?</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {KEYS.map((key) => {
          const isOk = key === "ok";
          const isDel = key === "borrar";
          return (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              disabled={disabled || (isOk && value.length === 0)}
              className={`btn ${isOk ? "btn--verde" : isDel ? "btn--naranja" : "btn--fantasma"}`}
              style={{ fontSize: "1.8rem", minHeight: 72, padding: 0 }}
              aria-label={isOk ? "Comprobar" : isDel ? "Borrar" : key}
            >
              {isDel ? "⌫" : isOk ? "✓" : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
