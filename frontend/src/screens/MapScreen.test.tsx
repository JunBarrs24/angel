import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MapData } from "../api/types";
import { renderWithProviders } from "../test-utils";
import { MapScreen } from "./MapScreen";

const MAP: MapData = {
  game_start: "2026-07-07",
  game_end: "2026-08-15",
  today: "2026-07-07",
  days: [
    {
      day_number: 1,
      date: "2026-07-07",
      dino_name: "Tiranosaurio Rex",
      dino_emoji: "🦖",
      title: "El gran Rex saluda al sol",
      status: "today",
      stars: 0,
    },
    {
      day_number: 2,
      date: "2026-07-08",
      dino_name: "Triceratops",
      dino_emoji: "🦕",
      title: "Los tres cuernos amigos",
      status: "locked",
      stars: 0,
    },
  ],
};

vi.mock("../api/client", () => ({
  api: { getMap: vi.fn(async () => MAP) },
}));

beforeEach(() => {
  window.localStorage.setItem("misiondino.child_id", "1");
});

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("MapScreen", () => {
  it("dibuja el camino de dinosaurios con sus nombres", async () => {
    renderWithProviders(<MapScreen />);
    expect(await screen.findByText("Tiranosaurio Rex")).toBeInTheDocument();
    expect(screen.getByText("Triceratops")).toBeInTheDocument();
  });

  it("marca el día de hoy y, al tocar uno bloqueado, muestra un aviso", async () => {
    renderWithProviders(<MapScreen />);
    // El dino de hoy muestra la etiqueta ¡HOY!
    expect(await screen.findByText("¡HOY!")).toBeInTheDocument();

    // Al tocar el día bloqueado aparece el modal pidiendo completar los anteriores.
    const locked = screen.getByRole("button", { name: /Día 2: Triceratops, bloqueado/i });
    fireEvent.click(locked);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Todavía no/i)).toBeInTheDocument();
  });
});
