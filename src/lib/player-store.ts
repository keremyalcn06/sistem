import { useEffect, useState, useCallback } from "react";
import { sfx } from "./sfx";

export type Quest = {
  id: string;
  title: string;
  xp: number;
  category: "body" | "mind" | "soul" | "custom";
  done: boolean;
};

export type FocusSession = {
  date: string; // ISO
  minutes: number;
};

export type Rank = "F" | "E" | "D" | "C" | "B" | "A" | "S";

export type PlayerState = {
  initialized: boolean;
  name: string;
  level: number;
  xp: number;
  totalXp: number;
  streak: number;
  weeklyStreak: number;
  lastActiveDate: string | null; // yyyy-mm-dd
  lastWeekIso: string | null; // yyyy-Www
  quests: Quest[];
  questsDate: string; // yyyy-mm-dd
  completedCount: number;
  failedCount: number;
  focusSessions: FocusSession[];
  createdAt: string;
  title: string;
};

const KEY = "shadow-monarch-v1";

const todayStr = () => new Date().toISOString().slice(0, 10);

const weekKey = (d = new Date()) => {
  // ISO week (yyyy-Www)
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const DEFAULT_QUESTS: Omit<Quest, "id" | "done">[] = [
  { title: "50 şınav çek", xp: 30, category: "body" },
  { title: "20 dakika yürüyüş", xp: 25, category: "body" },
  { title: "2 litre su iç", xp: 20, category: "body" },
  { title: "30 dakika kitap oku", xp: 35, category: "mind" },
  { title: "10 dakika meditasyon", xp: 25, category: "soul" },
  { title: "Yeni bir şey öğren", xp: 40, category: "mind" },
];

const genQuests = (): Quest[] =>
  DEFAULT_QUESTS.map((q, i) => ({ ...q, id: `q-${Date.now()}-${i}`, done: false }));

const initial = (): PlayerState => ({
  initialized: false,
  name: "Player",
  level: 1,
  xp: 0,
  totalXp: 0,
  streak: 0,
  weeklyStreak: 0,
  lastActiveDate: null,
  lastWeekIso: null,
  quests: genQuests(),
  questsDate: todayStr(),
  completedCount: 0,
  failedCount: 0,
  focusSessions: [],
  createdAt: new Date().toISOString(),
  title: "Beginner",
});

export const xpForLevel = (level: number) => 100 + (level - 1) * 50;

export const rankForLevel = (level: number): Rank => {
  if (level >= 80) return "S";
  if (level >= 55) return "A";
  if (level >= 35) return "B";
  if (level >= 20) return "C";
  if (level >= 10) return "D";
  if (level >= 5) return "E";
  return "F";
};

export const titleForLevel = (level: number): string => {
  if (level >= 80) return "Shadow Monarch";
  if (level >= 55) return "Elite Hunter";
  if (level >= 35) return "Veteran";
  if (level >= 20) return "Awakened";
  if (level >= 10) return "Rookie Hunter";
  if (level >= 5) return "Trainee";
  return "Beginner";
};

const load = (): PlayerState => {
  if (typeof window === "undefined") return initial();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = { ...initial(), ...(JSON.parse(raw) as Partial<PlayerState>) } as PlayerState;
    // Daily rollover: any unfinished quests become failures.
    if (parsed.questsDate !== todayStr()) {
      const unfinished = parsed.quests.filter((q) => !q.done).length;
      parsed.failedCount = (parsed.failedCount ?? 0) + unfinished;
      // Streak decay if user missed a day
      if (parsed.lastActiveDate) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        const yStr = y.toISOString().slice(0, 10);
        if (parsed.lastActiveDate !== yStr && parsed.lastActiveDate !== todayStr()) {
          parsed.streak = 0;
        }
      }
      parsed.quests = genQuests();
      parsed.questsDate = todayStr();
    }
    // Weekly rollover
    const wk = weekKey();
    if (parsed.lastWeekIso !== wk) {
      // If they had any activity in the previous week, increment weeklyStreak; otherwise reset.
      if (parsed.lastWeekIso && parsed.completedCount > 0) {
        parsed.weeklyStreak = (parsed.weeklyStreak ?? 0) + 1;
      } else if (!parsed.lastWeekIso) {
        parsed.weeklyStreak = 0;
      }
      parsed.lastWeekIso = wk;
    }
    parsed.title = titleForLevel(parsed.level);
    return parsed;
  } catch {
    return initial();
  }
};

const save = (s: PlayerState) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
};

const listeners = new Set<() => void>();
let cached: PlayerState | null = null;
const get = () => (cached ??= load());
const set = (updater: (s: PlayerState) => PlayerState) => {
  cached = updater(get());
  save(cached);
  listeners.forEach((l) => l());
};

export function usePlayer() {
  const [, force] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    cached = load();
    setHydrated(true);
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const state = hydrated ? get() : initial();

  const addXp = useCallback((amount: number) => {
    set((s) => {
      let xp = s.xp + amount;
      let level = s.level;
      let leveled = false;
      while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level++;
        leveled = true;
      }
      if (amount > 0) sfx.xp();
      if (leveled) {
        sfx.levelUp();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("player:levelup", { detail: { level } }));
        }
      }
      return { ...s, xp, level, totalXp: s.totalXp + amount, title: titleForLevel(level) };
    });
  }, []);

  const toggleQuest = useCallback((id: string) => {
    let deltaXp = 0;
    let completedNow = false;
    set((s) => {
      const quests = s.quests.map((q) => {
        if (q.id !== id) return q;
        if (!q.done) { deltaXp = q.xp; completedNow = true; }
        else { deltaXp = -q.xp; }
        return { ...q, done: !q.done };
      });
      const completedCount = s.completedCount + (completedNow ? 1 : -1);
      let streak = s.streak;
      let lastActiveDate = s.lastActiveDate;
      if (completedNow && lastActiveDate !== todayStr()) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        const yStr = y.toISOString().slice(0, 10);
        streak = lastActiveDate === yStr ? s.streak + 1 : 1;
        lastActiveDate = todayStr();
      }
      return { ...s, quests, completedCount, streak, lastActiveDate };
    });
    if (completedNow) {
      sfx.confirm();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          const enabled = localStorage.getItem("system-haptic") !== "0";
          if (enabled) navigator.vibrate?.(30);
        } catch { /* noop */ }
      }
    }
    if (deltaXp !== 0) addXp(deltaXp);
  }, [addXp]);

  const addCustomQuest = useCallback((title: string, xp: number) => {
    set((s) => ({
      ...s,
      quests: [...s.quests, { id: `q-${Date.now()}`, title, xp, category: "custom", done: false }],
    }));
  }, []);

  const removeQuest = useCallback((id: string) => {
    set((s) => ({ ...s, quests: s.quests.filter((q) => q.id !== id) }));
  }, []);

  const logFocus = useCallback((minutes: number) => {
    set((s) => ({
      ...s,
      focusSessions: [...s.focusSessions, { date: new Date().toISOString(), minutes }],
    }));
    addXp(Math.round(minutes * 2));
  }, [addXp]);

  const setName = useCallback((name: string) => {
    set((s) => ({ ...s, name }));
  }, []);

  const acceptSystem = useCallback((name?: string) => {
    set((s) => ({
      ...s,
      initialized: true,
      name: name?.trim() || "Player",
      level: 1,
      xp: 0,
      totalXp: 0,
      streak: 0,
      completedCount: 0,
      failedCount: 0,
      title: "Beginner",
    }));
  }, []);

  const reset = useCallback(() => {
    set(() => initial());
  }, []);

  const rank = rankForLevel(state.level);
  return {
    state,
    hydrated,
    addXp,
    toggleQuest,
    addCustomQuest,
    removeQuest,
    logFocus,
    setName,
    acceptSystem,
    reset,
    xpNeeded: xpForLevel(state.level),
    rank,
  };
}
