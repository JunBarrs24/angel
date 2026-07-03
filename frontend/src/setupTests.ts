import "@testing-library/jest-dom";

import { vi } from "vitest";

// canvas-confetti dibuja en un <canvas> real; en jsdom no existe y lanza errores
// asíncronos. Lo neutralizamos en tests (el confeti no es lo que probamos).
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
