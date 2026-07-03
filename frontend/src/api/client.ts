// Cliente HTTP tipado para el backend de Misión Dino.
// La URL base sale de VITE_API_URL (ver .env.example).

import type {
  Child,
  ChildCreate,
  CompleteRequest,
  CompleteResult,
  ComprehensionRequest,
  ComprehensionResult,
  DayChallenge,
  MapData,
  MathRequest,
  MathResult,
  Progress,
  PurchaseResult,
  ReadingState,
  ReadingUpdate,
  StoreData,
} from "./types";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

// Añade ?child_id= y opcionalmente &as_of= a una ruta.
function withParams(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export const api = {
  createChild(payload: ChildCreate): Promise<Child> {
    return request<Child>("/api/child", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getChild(childId: number): Promise<Child> {
    return request<Child>(`/api/child/${childId}`);
  },

  getChildByCode(code: string): Promise<Child> {
    return request<Child>(`/api/child/by-code/${encodeURIComponent(code)}`);
  },

  getMap(childId: number, asOf?: string): Promise<MapData> {
    return request<MapData>(withParams("/api/map", { child_id: childId, as_of: asOf }));
  },

  getToday(childId: number, asOf?: string): Promise<DayChallenge> {
    return request<DayChallenge>(withParams("/api/today", { child_id: childId, as_of: asOf }));
  },

  getDay(dayNumber: number, childId: number, asOf?: string): Promise<DayChallenge> {
    return request<DayChallenge>(
      withParams(`/api/day/${dayNumber}`, { child_id: childId, as_of: asOf }),
    );
  },

  saveReading(payload: ReadingUpdate): Promise<ReadingState> {
    return request<ReadingState>("/api/reading", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  checkComprehension(payload: ComprehensionRequest): Promise<ComprehensionResult> {
    return request<ComprehensionResult>("/api/answers/comprehension", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  checkMath(payload: MathRequest): Promise<MathResult> {
    return request<MathResult>("/api/answers/math", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  completeDay(payload: CompleteRequest): Promise<CompleteResult> {
    return request<CompleteResult>("/api/answers/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getProgress(childId: number, asOf?: string): Promise<Progress> {
    return request<Progress>(withParams("/api/progress", { child_id: childId, as_of: asOf }));
  },

  getStore(childId: number): Promise<StoreData> {
    return request<StoreData>(withParams("/api/store", { child_id: childId }));
  },

  purchase(childId: number, itemKey: string): Promise<PurchaseResult> {
    return request<PurchaseResult>("/api/store/purchase", {
      method: "POST",
      body: JSON.stringify({ child_id: childId, item_key: itemKey }),
    });
  },
};
