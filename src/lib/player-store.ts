import { useEffect, useState, useCallback } from "react";

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

export type PlayerState = {
  name: string;
  level: number;
  xp: number;
  totalXp: number;
  streak: number;
  lastActiveDate: string | null; // yyyy-mm-dd
  quests: Quest[];
  questsDate: string; // yyyy-mm-dd
  completedCount: number;
  focusSessions: FocusSession[];
  createdAt: string;
};

const KEY = "shadow-monarch-v1";

const todayStr = () => new Date().toISOString().slice(0, 10);

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
  name: "Sung Jin-Woo",
  level: 1,
  xp: 0,
  totalXp: 0,
  streak: 0,
  lastActiveDate: null,
  quests: genQuests(),
  questsDate: todayStr(),
  completedCount: 0,
  focusSessions: [],
  createdAt: new Date().toISOString(),
});

export const xpForLevel = (level: number) => 100 + (level - 1) * 50;

const load = (): PlayerState => {
  if (typeof window === "undefined") return initial();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw) as PlayerState;
    // reset daily quests if new day
    if (parsed.questsDate !== todayStr()) {
      parsed.quests = genQuests();
      parsed.questsDate = todayStr();
    }
    return parsed;
  } catch {
    return initial();
  }
};

const save = (s: PlayerState) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
};

// simple event emitter for cross-component sync
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
      if (leveled && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("player:levelup", { detail: { level } }));
      }
      return { ...s, xp, level, totalXp: s.totalXp + amount };
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

  const reset = useCallback(() => {
    set(() => initial());
  }, []);

  return {
    state,
    hydrated,
    addXp,
    toggleQuest,
    addCustomQuest,
    removeQuest,
    logFocus,
    setName,
    reset,
    xpNeeded: xpForLevel(state.level),
  };
}
