// Estado del explorador (child_id) persistido en localStorage.
// No hay login: el id se guarda tras crear el perfil en el onboarding.

import { useCallback, useSyncExternalStore } from "react";

const CHILD_KEY = "misiondino.child_id";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readChildId(): number | null {
  const raw = window.localStorage.getItem(CHILD_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useChild(): {
  childId: number | null;
  setChildId: (id: number) => void;
  clearChild: () => void;
} {
  const childId = useSyncExternalStore(subscribe, readChildId, () => null);

  const setChildId = useCallback((id: number) => {
    window.localStorage.setItem(CHILD_KEY, String(id));
    emit();
  }, []);

  const clearChild = useCallback(() => {
    window.localStorage.removeItem(CHILD_KEY);
    emit();
  }, []);

  return { childId, setChildId, clearChild };
}
