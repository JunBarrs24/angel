// Avatares de dino para elegir en el onboarding. La `key` es lo que se guarda
// en el backend (Child.avatar); el emoji es lo que se muestra en la app.

export interface DinoAvatar {
  key: string;
  emoji: string;
  name: string;
  color: string;
}

export const AVATARS: DinoAvatar[] = [
  { key: "rex", emoji: "🦖", name: "Rex", color: "var(--verde)" },
  { key: "tricera", emoji: "🦕", name: "Cuernitos", color: "var(--azul)" },
  { key: "ptero", emoji: "🦅", name: "Alas", color: "var(--morado)" },
  { key: "dino-huevo", emoji: "🥚", name: "Cascarón", color: "var(--amarillo)" },
  { key: "croc", emoji: "🐊", name: "Coco", color: "var(--verde-oscuro)" },
  { key: "dragon", emoji: "🐲", name: "Chispas", color: "var(--naranja)" },
];

export function avatarEmoji(key: string | undefined): string {
  return AVATARS.find((a) => a.key === key)?.emoji ?? "🦖";
}
