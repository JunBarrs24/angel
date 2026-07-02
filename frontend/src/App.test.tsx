import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("muestra el título de la misión", () => {
    render(<App />);
    expect(screen.getByText(/Misión Dino/i)).toBeInTheDocument();
  });

  it("saluda al capitán Ángel Eduardo", () => {
    render(<App />);
    expect(screen.getByText(/Ángel Eduardo/i)).toBeInTheDocument();
  });
});
