/**
 * Achievement catalogue.
 *
 * Achievements are pure functions over PlayerState so they can be re-evaluated
 * at any time (on load, after every action) without stored intermediate flags.
 * The persisted layer only records `unlockedAt` timestamps.
 */
import type { PlayerState } from "./player-store";

export interface AchievementDef {
  id: string;
  label: string;
  desc: string;
  test: (s: PlayerState, ctx: { totalFocusMin: number; discipline: number }) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first",        label: "İlk Adım",    desc: "İlk görevi tamamla",              test: (s) => s.completedCount >= 1 },
  { id: "quest_10",     label: "10 Görev",    desc: "10 görev tamamla",                test: (s) => s.completedCount >= 10 },
  { id: "quest_50",     label: "50 Görev",    desc: "50 görev tamamla",                test: (s) => s.completedCount >= 50 },
  { id: "quest_200",    label: "200 Görev",   desc: "200 görev tamamla",               test: (s) => s.completedCount >= 200 },
  { id: "streak_3",     label: "3 Gün Seri",  desc: "3 gün üst üste aktif",            test: (s) => s.streak >= 3 },
  { id: "streak_7",     label: "7 Gün Seri",  desc: "1 hafta kesintisiz",              test: (s) => s.streak >= 7 },
  { id: "streak_30",    label: "30 Gün Seri", desc: "1 ay kesintisiz",                 test: (s) => s.streak >= 30 },
  { id: "focus_60",     label: "60 dk Odak",  desc: "Toplam 60 dk odak",               test: (_s, c) => c.totalFocusMin >= 60 },
  { id: "focus_600",    label: "10 Saat",     desc: "Toplam 600 dk odak",              test: (_s, c) => c.totalFocusMin >= 600 },
  { id: "focus_3000",   label: "50 Saat",     desc: "Toplam 3000 dk odak",             test: (_s, c) => c.totalFocusMin >= 3000 },
  { id: "level_5",      label: "Rank E",      desc: "5. seviyeye ulaş",                test: (s) => s.level >= 5 },
  { id: "level_10",     label: "Rank D",      desc: "10. seviyeye ulaş",               test: (s) => s.level >= 10 },
  { id: "level_25",     label: "Rank C",      desc: "25. seviyeye ulaş",               test: (s) => s.level >= 25 },
  { id: "level_50",     label: "Rank B+",     desc: "50. seviyeye ulaş",               test: (s) => s.level >= 50 },
  { id: "discipline_100", label: "Disiplin 100", desc: "Disiplin puanı 100'e ulaş",    test: (_s, c) => c.discipline >= 100 },
  { id: "discipline_500", label: "Disiplin 500", desc: "Disiplin puanı 500'e ulaş",    test: (_s, c) => c.discipline >= 500 },
  { id: "hard_boss",    label: "Zor Görev",   desc: "Bir 'zor' görev tamamla",         test: (s) => s.quests.some((q) => q.done && q.difficulty === "hard") },
  { id: "epic_boss",    label: "Epik Görev",  desc: "Bir 'epik' görev tamamla",        test: (s) => s.quests.some((q) => q.done && q.difficulty === "epic") },
];

export type UnlockedMap = Record<string, string>; // id -> ISO timestamp

/**
 * Evaluate every achievement. Only unlocked timestamps are stored — the
 * definitions themselves live in code so they can evolve across app updates.
 */
export function evaluateAchievements(
  state: PlayerState,
  ctx: { totalFocusMin: number; discipline: number },
  prev: UnlockedMap,
): { unlocked: UnlockedMap; newlyUnlocked: AchievementDef[] } {
  const unlocked: UnlockedMap = { ...prev };
  const newlyUnlocked: AchievementDef[] = [];
  const now = new Date().toISOString();
  for (const def of ACHIEVEMENTS) {
    if (unlocked[def.id]) continue;
    if (def.test(state, ctx)) {
      unlocked[def.id] = now;
      newlyUnlocked.push(def);
    }
  }
  return { unlocked, newlyUnlocked };
}
