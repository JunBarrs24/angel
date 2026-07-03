import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api/client";
import type { StoreData } from "../api/types";
import { renderWithProviders } from "../test-utils";
import { StoreScreen } from "./StoreScreen";

const STORE: StoreData = {
  items: [
    {
      key: "snack",
      emoji: "🍿",
      title: "Doritos o galletas",
      description: "Un antojito",
      cost: 5,
      color: "amarillo",
    },
    {
      key: "toy_big",
      emoji: "🎁",
      title: "Juguete grande",
      description: "El gran premio",
      cost: 80,
      color: "verde",
    },
  ],
  stars_earned: 6,
  stars_spent: 0,
  stars_available: 6,
  redemptions: [],
};

vi.mock("../api/client", () => ({
  api: {
    getStore: vi.fn(async () => STORE),
    purchase: vi.fn(async () => ({
      redemption: {
        id: 1,
        item_key: "snack",
        title: "Doritos o galletas",
        emoji: "🍿",
        cost: 5,
        fulfilled: false,
        created_at: "2026-07-08T10:00:00",
      },
      stars_earned: 6,
      stars_spent: 5,
      stars_available: 1,
    })),
  },
}));

beforeEach(() => {
  window.localStorage.setItem("misiondino.child_id", "1");
});

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("StoreScreen", () => {
  it("muestra los boletos y bloquea lo que no se puede pagar", async () => {
    renderWithProviders(<StoreScreen />);
    expect(await screen.findByText("Doritos o galletas")).toBeInTheDocument();
    expect(screen.getByText("Juguete grande")).toBeInTheDocument();
    // Con 6 estrellas no alcanza el juguete grande (80).
    expect(screen.getByText(/Te faltan 74/i)).toBeInTheDocument();
  });

  it("canjear pide confirmación y luego llama a la compra", async () => {
    renderWithProviders(<StoreScreen />);
    await screen.findByText("Doritos o galletas");

    // Solo el snack es pagable, así que hay un único botón "Canjear".
    fireEvent.click(screen.getByRole("button", { name: /Canjear/i }));

    // Aparece la confirmación.
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Sí, gastar 5/i }));

    await waitFor(() => expect(api.purchase).toHaveBeenCalledWith(1, "snack"));
  });
});
