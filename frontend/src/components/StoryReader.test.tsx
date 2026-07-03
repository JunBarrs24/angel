import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { splitWords } from "../lib/words";
import { StoryReader } from "./StoryReader";

const STORY = "El Rex saluda al sol brillante";

describe("StoryReader", () => {
  it("separa la historia en palabras", () => {
    expect(splitWords(STORY)).toEqual(["El", "Rex", "saluda", "al", "sol", "brillante"]);
  });

  it("al tocar una palabra avisa con el índice (número de palabras leídas)", () => {
    const onWordTap = vi.fn();
    render(<StoryReader story={STORY} readCount={0} onWordTap={onWordTap} />);

    // Tocar la 3.ª palabra (índice 2) => 3 palabras leídas.
    fireEvent.click(screen.getByTestId("word-2"));
    expect(onWordTap).toHaveBeenCalledWith(3);
  });

  it("resalta las palabras leídas y permite continuar desde ahí", () => {
    // Envoltorio con estado para reflejar el nuevo readCount tras tocar.
    function Harness() {
      const [readCount, setReadCount] = useState(0);
      return <StoryReader story={STORY} readCount={readCount} onWordTap={setReadCount} />;
    }
    render(<Harness />);

    const third = screen.getByTestId("word-2");
    expect(third).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(third);

    // Tras tocar la 3.ª palabra, las primeras tres quedan marcadas como leídas.
    expect(screen.getByTestId("word-0")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("word-2")).toHaveAttribute("aria-pressed", "true");
    // La 4.ª sigue sin leer.
    expect(screen.getByTestId("word-3")).toHaveAttribute("aria-pressed", "false");
  });
});
