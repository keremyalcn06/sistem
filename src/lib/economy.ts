/**
 * SYSTEM economy — deterministic XP and progression math.
 *
 * The player never sets XP directly. XP is computed from four objective
 * signals on the quest itself: duration, difficulty, priority, category.
 * All formulas live here so they can be tuned without touching UI code.
 */

export type Difficulty = "trivial" | "easy" | "normal" | "hard" | "epic";
export type Priority = "low" | "normal" | "high";
export type Category = "body" | "mind" | "soul" | "custom";

export const DIFFICULTY_ORDER: Difficulty[] = ["trivial", "easy", "normal", "hard", "epic"];
export const PRIORITY_ORDER: Priority[] = ["low", "normal", "high"];

const DIFFICULTY_MULT: Record<Difficulty, number> = {
  trivial: 0.5,
  easy: 0.8,
  normal: 1.0,
  hard: 1.6,
  epic: 2.4,
};

const PRIORITY_MULT: Record<Priority, number> = {
  low: 0.9,
  normal: 1.0,
  high: 1.25,
};

const CATEGORY_MULT: Record<Category, number> = {
  body: 1.05,
  mind: 1.1,
  soul: 1.0,
  custom: 1.0,
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  trivial: "Önemsiz",
  easy: "Kolay",
  normal: "Normal",
  hard: "Zor",
  epic: "Epik",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
};

export interface XpInputs {
  durationMin: number;    // estimated minutes to complete
  difficulty: Difficulty;
  priority: Priority;
  category: Category;
}

/**
 * Compute XP reward for a quest. Deterministic, monotonic in every input.
 * Minimum floor of 5 XP so trivial 1-minute tasks still register.
 */
export function computeQuestXp({ durationMin, difficulty, priority, category }: XpInputs): number {
  const duration = Math.max(1, Math.min(240, Math.round(durationMin)));
  // Sub-linear duration curve so a 4-hour task isn't 240 * multipliers.
  const base = 6 + Math.pow(duration, 0.85);
  const xp = base * DIFFICULTY_MULT[difficulty] * PRIORITY_MULT[priority] * CATEGORY_MULT[category];
  return Math.max(5, Math.round(xp));
}

/**
 * Level curve: super-linear so late levels take real work.
 * xpForLevel(L) is the XP needed to go from L → L+1.
 *
 *   L1: 100     L2: 303    L5: 1_379    L10: 3_981
 *   L20: 12_102 L30: 23_744 L50: 50_000
 */
export function xpForLevel(level: number): number {
  const l = Math.max(1, level);
  return Math.round(100 * Math.pow(l, 1.6));
}

/** Total XP required to reach a given level from zero (for stats display). */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

export type Rank = "F" | "E" | "D" | "C" | "B" | "A" | "S";

export function rankForLevel(level: number): Rank {
  if (level >= 80) return "S";
  if (level >= 55) return "A";
  if (level >= 35) return "B";
  if (level >= 20) return "C";
  if (level >= 10) return "D";
  if (level >= 5) return "E";
  return "F";
}

/**
 * Discipline score — objective behavioural signal that rewards consistency
 * and punishes failed quests. Used as an input to the title system so a
 * high-level but sloppy player is not called "Elite Hunter".
 *
 *   +2 per completed quest
 *   +3 per streak day
 *   +1 per weekly streak
 *   -3 per failed quest
 *
 * Clamped to [0, ∞).
 */
export interface DisciplineInputs {
  completedCount: number;
  failedCount: number;
  streak: number;
  weeklyStreak: number;
}

export function computeDiscipline(i: DisciplineInputs): number {
  const raw = i.completedCount * 2 + i.streak * 3 + i.weeklyStreak - i.failedCount * 3;
  return Math.max(0, Math.round(raw));
}

/**
 * Title tiers — evaluated against a composite score, NOT raw level.
 * Ordered from highest to lowest; first match wins.
 */
export interface TitleInputs {
  level: number;
  completedCount: number;
  streak: number;
  achievements: number;
  discipline: number;
}

interface TitleTier {
  title: string;
  min: (i: TitleInputs) => boolean;
}

const TITLE_TIERS: TitleTier[] = [
  { title: "Shadow Monarch", min: (i) => i.level >= 80 && i.discipline >= 800 && i.achievements >= 15 },
  { title: "Sovereign",      min: (i) => i.level >= 60 && i.discipline >= 500 && i.achievements >= 12 },
  { title: "Elite Hunter",   min: (i) => i.level >= 40 && i.discipline >= 300 && i.streak >= 14 },
  { title: "Veteran",        min: (i) => i.level >= 25 && i.completedCount >= 150 && i.achievements >= 8 },
  { title: "Ascendant",      min: (i) => i.level >= 15 && i.completedCount >= 60 && i.streak >= 7 },
  { title: "Awakened",       min: (i) => i.level >= 10 && i.completedCount >= 30 },
  { title: "Rookie Hunter",  min: (i) => i.level >= 5 && i.completedCount >= 10 },
  { title: "Trainee",        min: (i) => i.completedCount >= 3 },
  { title: "Beginner",       min: () => true },
];

export function computeTitle(i: TitleInputs): string {
  for (const tier of TITLE_TIERS) if (tier.min(i)) return tier.title;
  return "Beginner";
}
