// Fila de estrellas ganadas (llenas) sobre el total posible.

interface StarRowProps {
  count: number;
  total?: number;
  size?: number;
}

export function StarRow({ count, total = 3, size = 1.6 }: StarRowProps) {
  return (
    <span
      className="estrellas"
      style={{ fontSize: `${size}rem` }}
      aria-label={`${count} de ${total} estrellas`}
      role="img"
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden="true">
          {i < count ? "⭐" : "☆"}
        </span>
      ))}
    </span>
  );
}
