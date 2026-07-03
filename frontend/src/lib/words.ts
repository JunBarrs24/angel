// Separa una historia en palabras (índice = posición). Compartido entre el
// lector y quien necesite contar/ubicar palabras.

export function splitWords(story: string): string[] {
  return story.split(/\s+/).filter((w) => w.length > 0);
}
