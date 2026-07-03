// Tipos que reflejan los schemas Pydantic del backend (backend/app/schemas.py).
// Mantener sincronizados con el contrato de la API.

export interface Child {
  id: number;
  name: string;
  avatar: string;
}

export interface ChildCreate {
  name?: string;
  avatar?: string;
}

export interface Question {
  id: number;
  order: number;
  prompt: string;
  options: string[];
}

export type MathKind = "sum" | "sub" | "compare";

export interface MathProblem {
  id: string;
  kind: MathKind;
  a: number;
  b: number;
  prompt: string;
  options: string[]; // para "compare": ["<", "=", ">"]; vacío para sum/sub
}

export interface ReadingState {
  seconds_elapsed: number;
  last_word_index: number;
  words_read: number;
  finished: boolean;
}

export interface Completion {
  stars: number;
  questions_correct: number;
  questions_total: number;
  math_correct: number;
  math_total: number;
  comprehension_answers: number[];
  math_answers: string[];
}

export interface DayChallenge {
  day_number: number;
  date: string;
  dino_name: string;
  dino_emoji: string;
  title: string;
  story: string;
  word_count: number;
  questions: Question[];
  math: MathProblem[];
  reading: ReadingState;
  completion: Completion | null;
  is_today: boolean;
  is_locked: boolean;
}

export type DayStatus = "locked" | "available" | "completed" | "today";

export interface MapItem {
  day_number: number;
  date: string;
  dino_name: string;
  dino_emoji: string;
  title: string;
  status: DayStatus;
  stars: number;
}

export interface MapData {
  game_start: string;
  game_end: string;
  today: string;
  days: MapItem[];
}

export interface ReadingUpdate {
  child_id: number;
  day_number: number;
  seconds_elapsed?: number;
  last_word_index?: number;
  words_read?: number;
  finished?: boolean;
}

export interface ComprehensionRequest {
  child_id: number;
  day_number: number;
  answers: number[];
}

export interface ComprehensionResult {
  correct: number;
  total: number;
  per_item: boolean[];
  correct_indices: number[];
}

export interface MathRequest {
  child_id: number;
  day_number: number;
  answers: string[];
}

export interface MathResult {
  correct: number;
  total: number;
  per_item: boolean[];
  correct_answers: string[];
}

export interface CompleteRequest {
  child_id: number;
  day_number: number;
  comprehension_answers: number[];
  math_answers: string[];
}

export interface Badge {
  key: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
}

export interface CompleteResult {
  stars: number;
  total_stars: number;
  streak: number;
  already_completed: boolean;
  newly_earned_badges: Badge[];
}

export interface Progress {
  total_stars: number; // ganadas (histórico)
  stars_spent: number;
  stars_available: number;
  streak: number;
  best_streak: number;
  days_completed: number;
  days_total: number;
  total_words: number;
  badges: Badge[];
  game_start: string;
  game_end: string;
}

// ----- Tienda -----
export interface StoreItem {
  key: string;
  emoji: string;
  title: string;
  description: string;
  cost: number;
  color: string;
}

export interface Redemption {
  id: number;
  item_key: string;
  title: string;
  emoji: string;
  cost: number;
  fulfilled: boolean;
  created_at: string;
}

export interface StoreData {
  items: StoreItem[];
  stars_earned: number;
  stars_spent: number;
  stars_available: number;
  redemptions: Redemption[];
}

export interface PurchaseResult {
  redemption: Redemption;
  stars_earned: number;
  stars_spent: number;
  stars_available: number;
}
