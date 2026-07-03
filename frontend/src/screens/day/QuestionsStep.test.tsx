import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ComprehensionRequest } from "../../api/types";
import { renderWithProviders } from "../../test-utils";
import { QuestionsStep } from "./QuestionsStep";

vi.mock("../../api/client", () => ({
  api: {
    // Correcto = índice 1. per_item refleja la respuesta de la pregunta actual.
    checkComprehension: vi.fn(async (payload: ComprehensionRequest) => ({
      correct: 0,
      total: payload.answers.length,
      per_item: payload.answers.map((a) => a === 1),
      correct_indices: [1],
    })),
  },
}));

const QUESTIONS = [
  {
    id: 1,
    order: 0,
    prompt: "¿Qué comía el Rex?",
    options: ["Plantas", "Carne", "Frutas"],
  },
];

afterEach(() => vi.clearAllMocks());

describe("QuestionsStep", () => {
  it("al acertar felicita y envía la respuesta correcta", async () => {
    const onFinish = vi.fn();
    renderWithProviders(
      <QuestionsStep childId={1} dayNumber={1} questions={QUESTIONS} onFinish={onFinish} />,
    );

    fireEvent.click(screen.getByText("Carne"));
    expect(await screen.findByText(/¡Muy bien!/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Ir a las matemáticas/i));
    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([1]));
  });

  it("una sola oportunidad: al fallar bloquea, cuenta el primer intento y continúa", async () => {
    const onFinish = vi.fn();
    renderWithProviders(
      <QuestionsStep childId={1} dayNumber={1} questions={QUESTIONS} onFinish={onFinish} />,
    );

    // Elige mal (índice 0). Se revela la correcta y aparece el botón de continuar.
    fireEvent.click(screen.getByText("Plantas"));
    expect(await screen.findByText(/Ir a las matemáticas/i)).toBeInTheDocument();

    // Ya no puede cambiar de opción: todas quedan deshabilitadas.
    expect(screen.getByText("Plantas")).toBeDisabled();
    expect(screen.getByText("Carne")).toBeDisabled();

    // Continúa igual y se envía el PRIMER intento (fallido), no la correcta.
    fireEvent.click(screen.getByText(/Ir a las matemáticas/i));
    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([0]));
  });
});
