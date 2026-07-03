// Fecha simulada para previsualizar la aventura antes del 7 de julio.
//
// Se lee de ?as_of=YYYY-MM-DD en la URL y se guarda en localStorage para que
// sobreviva a la navegación entre rutas. Devuelve undefined en el día real.

const AS_OF_KEY = "misiondino.as_of";
const AS_OF_RE = /^\d{4}-\d{2}-\d{2}$/;

// Al arrancar la app, si la URL trae ?as_of=, lo persistimos.
export function initAsOfFromUrl(): void {
  const fromUrl = new URLSearchParams(window.location.search).get("as_of");
  if (fromUrl && AS_OF_RE.test(fromUrl)) {
    window.localStorage.setItem(AS_OF_KEY, fromUrl);
  }
}

export function useAsOf(): string | undefined {
  const stored = window.localStorage.getItem(AS_OF_KEY);
  return stored && AS_OF_RE.test(stored) ? stored : undefined;
}

export function getAsOf(): string | undefined {
  const stored = window.localStorage.getItem(AS_OF_KEY);
  return stored && AS_OF_RE.test(stored) ? stored : undefined;
}
