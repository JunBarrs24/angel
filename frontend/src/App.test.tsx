import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import App from "./App";
import { renderWithProviders } from "./test-utils";

afterEach(() => {
  window.localStorage.clear();
});

describe("App", () => {
  it("muestra el onboarding con el título de la misión cuando no hay perfil", () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/Misión Dino/i)).toBeInTheDocument();
  });

  it("propone el nombre por defecto Ángel Eduardo", () => {
    renderWithProviders(<App />);
    expect(screen.getByLabelText(/¿Cómo te llamas\?/i)).toHaveValue("Ángel Eduardo");
  });
});
