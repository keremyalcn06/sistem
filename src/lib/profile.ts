/**
 * Player profile — extended personal data collected during the first-run
 * onboarding and later editable from the profile screen.
 *
 * All fields are optional so future systems can request only the ones they
 * need. `profileCompletion()` returns a 0-100 percentage used by the UI and
 * by SYSTEM CORE to gate feature quality.
 *
 * Clean-architecture note: this module is a pure domain type + helpers. No
 * storage, no React. It's consumed by `player-store` (persistence) and by
 * `system-core` (decision engine).
 */

export type Gender = "male" | "female" | "other" | "unspecified";
export type Occupation = "student" | "employed" | "self-employed" | "unemployed" | "other";

/** A recurring or one-off block of unavailability (school, work, sleep, etc). */
export type TimeBlock = {
  /** Free-form label ("İş", "Okul", "Uyku"). */
  label: string;
  /** 24h "HH:mm". */
  start: string;
  end: string;
};

/** A user-defined deadline that SYSTEM CORE treats as a priority pressure. */
export type ImportantDate = {
  id: string;
  label: string;
  /** ISO yyyy-mm-dd. */
  date: string;
  /** free text: "sınav", "yarışma"… */
  kind?: string;
};

export type PlayerProfile = {
  /** Real, legal name the SYSTEM will address the user by. Required. */
  realName: string;
  /** Data URL or blob URL of the avatar image; empty string = removed. */
  avatarDataUrl: string;

  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  gender: Gender;

  occupation: Occupation | null;
  occupationDetail: string;

  /** Recurring busy blocks (work / school). */
  busyBlocks: TimeBlock[];
  /** Recurring free blocks. */
  freeBlocks: TimeBlock[];
  /** Recurring sleep window. */
  sleep: TimeBlock | null;

  /** Minutes/day the user can realistically dedicate. */
  dailyMinutes: number | null;

  importantDates: ImportantDate[];
  /** Priority goals — short strings. */
  priorityGoals: string[];
  /** Interests / hobbies. */
  interests: string[];
  /** Sports equipment the user owns ("kettlebell", "koşu bandı"…). */
  equipment: string[];
  /** Areas the user wants to improve ("kardiyo", "odaklanma"…). */
  growthAreas: string[];

  /** When the onboarding wizard was first completed. */
  onboardedAt: string | null;
  /** Last time any profile field was edited. */
  updatedAt: string | null;
};

export const emptyProfile = (): PlayerProfile => ({
  realName: "",
  avatarDataUrl: "",
  age: null,
  heightCm: null,
  weightKg: null,
  gender: "unspecified",
  occupation: null,
  occupationDetail: "",
  busyBlocks: [],
  freeBlocks: [],
  sleep: null,
  dailyMinutes: null,
  importantDates: [],
  priorityGoals: [],
  interests: [],
  equipment: [],
  growthAreas: [],
  onboardedAt: null,
  updatedAt: null,
});

/**
 * All fields SYSTEM CORE knows about, weighted by usefulness for future AI
 * systems (task generation, scheduling, coaching).
 */
const FIELD_WEIGHTS: Array<{
  key: keyof PlayerProfile;
  weight: number;
  filled: (p: PlayerProfile) => boolean;
}> = [
  { key: "realName",       weight: 3, filled: (p) => p.realName.trim().length > 1 },
  { key: "age",            weight: 2, filled: (p) => typeof p.age === "number" && p.age > 0 },
  { key: "heightCm",       weight: 1, filled: (p) => typeof p.heightCm === "number" && p.heightCm > 0 },
  { key: "weightKg",       weight: 1, filled: (p) => typeof p.weightKg === "number" && p.weightKg > 0 },
  { key: "gender",         weight: 1, filled: (p) => p.gender !== "unspecified" },
  { key: "occupation",     weight: 2, filled: (p) => p.occupation !== null },
  { key: "busyBlocks",     weight: 2, filled: (p) => p.busyBlocks.length > 0 },
  { key: "freeBlocks",     weight: 2, filled: (p) => p.freeBlocks.length > 0 },
  { key: "sleep",          weight: 2, filled: (p) => p.sleep !== null },
  { key: "dailyMinutes",   weight: 2, filled: (p) => typeof p.dailyMinutes === "number" && p.dailyMinutes > 0 },
  { key: "importantDates", weight: 1, filled: (p) => p.importantDates.length > 0 },
  { key: "priorityGoals",  weight: 3, filled: (p) => p.priorityGoals.length > 0 },
  { key: "interests",      weight: 1, filled: (p) => p.interests.length > 0 },
  { key: "equipment",      weight: 1, filled: (p) => p.equipment.length > 0 },
  { key: "growthAreas",    weight: 2, filled: (p) => p.growthAreas.length > 0 },
  { key: "avatarDataUrl",  weight: 1, filled: (p) => p.avatarDataUrl.length > 0 },
];

/** Returns 0-100 completion percentage weighted by field usefulness. */
export function profileCompletion(p: PlayerProfile): number {
  const total = FIELD_WEIGHTS.reduce((a, f) => a + f.weight, 0);
  const done = FIELD_WEIGHTS.reduce((a, f) => a + (f.filled(p) ? f.weight : 0), 0);
  return Math.round((done / total) * 100);
}

/** Lists field-keys that are not yet filled. Future systems ask for these. */
export function missingProfileFields(p: PlayerProfile): (keyof PlayerProfile)[] {
  return FIELD_WEIGHTS.filter((f) => !f.filled(p)).map((f) => f.key);
}

/** Merge a partial profile into an existing one, refreshing `updatedAt`. */
export function mergeProfile(current: PlayerProfile, patch: Partial<PlayerProfile>): PlayerProfile {
  return {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}
