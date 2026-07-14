import { useEffect, useState, useCallback } from "react";
import { sfx } from "./sfx";
import {
  computeQuestXp,
  computeDiscipline,
  computeTitle,
  rankForLevel,
  xpForLevel,
  type Category,
  type Difficulty,
  type Priority,
} from "./economy";
import { getRepository } from "./storage/adapters";
import { STORAGE_KEYS, type StoredEnvelope } from "./storage/repository";
import { ACHIEVEMENTS, evaluateAchievements, type UnlockedMap } from "./achievements";
import {
  emptyProfile,
  mergeProfile,
  profileCompletion,
  type PlayerProfile,
} from "./profile";

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type Quest = {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  priority: Priority;
  durationMin: number;
  /** SYSTEM-computed at creation from the four objective inputs above. */
  xp: number;
  done: boolean;
};

export type FocusSession = {
  date: string; // ISO
  minutes: number;
};

export type PlayerState = {
  initialized: boolean;
  name: string;
  level: number;
  xp: number;
  totalXp: number;
  streak: number;
  weeklyStreak: number;
  lastActiveDate: string | null; // yyyy-mm-dd
  lastWeekIso: string | null;
  quests: Quest[];
  questsDate: string; // yyyy-mm-dd
  completedCount: number;
  failedCount: number;
  focusSessions: FocusSession[];
  createdAt: string;
  title: string;
  /** Unlocked achievement id → ISO timestamp. */
  achievements: UnlockedMap;
  /** Extended personal profile collected during first-run onboarding. */
  profile: PlayerProfile;
};

export type { PlayerProfile } from "./profile";

export type { Category, Difficulty, Priority } from "./economy";
export { rankForLevel, xpForLevel, type Rank } from "./economy";

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const SCHEMA_VERSION = 2;
const repo = getRepository();

const todayStr = () => new Date().toISOString().slice(0, 10);

const weekKey = (d = new Date()) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const DEFAULT_QUESTS: Omit<Quest, "id" | "done" | "xp">[] = [
  { title: "50 şınav çek",         category: "body", difficulty: "normal", priority: "normal", durationMin: 15 },
  { title: "20 dakika yürüyüş",    category: "body", difficulty: "easy",   priority: "normal", durationMin: 20 },
  { title: "2 litre su iç",        category: "body", difficulty: "trivial",priority: "high",   durationMin: 5 },
  { title: "30 dakika kitap oku",  category: "mind", difficulty: "normal", priority: "normal", durationMin: 30 },
  { title: "10 dakika meditasyon", category: "soul", difficulty: "easy",   priority: "normal", durationMin: 10 },
  { title: "Yeni bir şey öğren",   category: "mind", difficulty: "hard",   priority: "high",   durationMin: 45 },
];

const genQuests = (): Quest[] =>
  DEFAULT_QUESTS.map((q, i) => ({
    ...q,
    id: `q-${Date.now()}-${i}`,
    done: false,
    xp: computeQuestXp(q),
  }));

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
  achievements: {},
  profile: emptyProfile(),
});

/**
 * Migrate any legacy stored quest shape (pre-v2: had `xp` but no difficulty)
 * into the current schema. Idempotent.
 */
function migrateQuest(raw: Partial<Quest> & { xp?: number }): Quest {
  const difficulty: Difficulty = raw.difficulty ?? "normal";
  const priority: Priority = raw.priority ?? "normal";
  const category: Category = raw.category ?? "custom";
  const durationMin = raw.durationMin ?? Math.max(5, Math.round((raw.xp ?? 20) / 2));
  const inputs = { difficulty, priority, category, durationMin };
  return {
    id: raw.id ?? `q-${Date.now()}`,
    title: raw.title ?? "",
    category,
    difficulty,
    priority,
    durationMin,
    xp: computeQuestXp(inputs),
    done: !!raw.done,
  };
}

function migrate(anyState: Partial<PlayerState> & Record<string, unknown>): PlayerState {
  const base = initial();
  const merged: PlayerState = { ...base, ...(anyState as Partial<PlayerState>) };
  merged.quests = Array.isArray(anyState.quests)
    ? (anyState.quests as Partial<Quest>[]).map(migrateQuest)
    : base.quests;
  merged.achievements = (anyState.achievements as UnlockedMap) ?? {};
  // Merge profile so schema additions get filled with defaults instead of
  // wiping user-entered fields. Old saves without `profile` get an empty one.
  merged.profile = { ...emptyProfile(), ...(anyState.profile as Partial<PlayerProfile> | undefined ?? {}) };
  return merged;
}

function applyRollovers(s: PlayerState): PlayerState {
  const today = todayStr();
  let next = s;
  if (next.questsDate !== today) {
    const unfinished = next.quests.filter((q) => !q.done).length;
    let streak = next.streak;
    if (next.lastActiveDate) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      if (next.lastActiveDate !== yStr && next.lastActiveDate !== today) streak = 0;
    }
    next = {
      ...next,
      failedCount: next.failedCount + unfinished,
      streak,
      quests: genQuests(),
      questsDate: today,
    };
  }
  const wk = weekKey();
  if (next.lastWeekIso !== wk) {
    let weeklyStreak = next.weeklyStreak;
    if (next.lastWeekIso && next.completedCount > 0) weeklyStreak = weeklyStreak + 1;
    else if (!next.lastWeekIso) weeklyStreak = 0;
    next = { ...next, weeklyStreak, lastWeekIso: wk };
  }
  return recomputeDerived(next);
}

function recomputeDerived(s: PlayerState): PlayerState {
  const totalFocusMin = s.focusSessions.reduce((a, x) => a + x.minutes, 0);
  const discipline = computeDiscipline(s);
  const { unlocked } = evaluateAchievements(s, { totalFocusMin, discipline }, s.achievements);
  const title = computeTitle({
    level: s.level,
    completedCount: s.completedCount,
    streak: s.streak,
    achievements: Object.keys(unlocked).length,
    discipline,
  });
  return { ...s, achievements: unlocked, title };
}

// ---------------------------------------------------------------------------
// In-memory cache + repository I/O
// ---------------------------------------------------------------------------

let cached: PlayerState = initial();
let hydratedGlobal = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const envelope: StoredEnvelope<PlayerState> = {
      v: SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      data: cached,
    };
    void repo.set(STORAGE_KEYS.player, JSON.stringify(envelope));
  }, 120);
}

async function hydrateOnce() {
  if (hydratedGlobal) return;
  try {
    let raw = await repo.get(STORAGE_KEYS.player);
    // One-time migration from the pre-v2 localStorage key.
    if (!raw) {
      const legacy = await repo.get(STORAGE_KEYS.legacyPlayer);
      if (legacy) {
        raw = JSON.stringify({ v: 1, updatedAt: new Date().toISOString(), data: JSON.parse(legacy) });
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw) as StoredEnvelope<PlayerState> | PlayerState;
      const data = (parsed as StoredEnvelope<PlayerState>).data ?? (parsed as PlayerState);
      cached = applyRollovers(migrate(data));
    } else {
      cached = applyRollovers(initial());
    }
  } catch {
    cached = applyRollovers(initial());
  }
  hydratedGlobal = true;
  scheduleSave();
  notify();
}

function commit(updater: (s: PlayerState) => PlayerState) {
  cached = recomputeDerived(updater(cached));
  scheduleSave();
  notify();
}

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

export function usePlayer() {
  const [, force] = useState(0);
  const [hydrated, setHydrated] = useState(hydratedGlobal);

  useEffect(() => {
    let mounted = true;
    void hydrateOnce().then(() => { if (mounted) setHydrated(true); });
    const l = () => {
      if (!mounted) return;
      force((n) => n + 1);
      if (hydratedGlobal) setHydrated(true);
    };
    listeners.add(l);
    return () => { mounted = false; listeners.delete(l); };
  }, []);

  const state = hydrated ? cached : initial();

  const addXp = useCallback((amount: number) => {
    commit((s) => {
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
      return { ...s, xp, level, totalXp: Math.max(0, s.totalXp + amount) };
    });
  }, []);

  const toggleQuest = useCallback((id: string) => {
    let deltaXp = 0;
    let completedNow = false;
    commit((s) => {
      const quests = s.quests.map((q) => {
        if (q.id !== id) return q;
        if (!q.done) { deltaXp = q.xp; completedNow = true; }
        else { deltaXp = -q.xp; }
        return { ...q, done: !q.done };
      });
      const completedCount = Math.max(0, s.completedCount + (completedNow ? 1 : -1));
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

  const addCustomQuest = useCallback((input: {
    title: string;
    category?: Category;
    difficulty?: Difficulty;
    priority?: Priority;
    durationMin?: number;
  }) => {
    const category = input.category ?? "custom";
    const difficulty = input.difficulty ?? "normal";
    const priority = input.priority ?? "normal";
    const durationMin = Math.max(1, Math.round(input.durationMin ?? 15));
    const xp = computeQuestXp({ category, difficulty, priority, durationMin });
    commit((s) => ({
      ...s,
      quests: [
        ...s.quests,
        {
          id: `q-${Date.now()}`,
          title: input.title,
          category,
          difficulty,
          priority,
          durationMin,
          xp,
          done: false,
        },
      ],
    }));
  }, []);

  const removeQuest = useCallback((id: string) => {
    commit((s) => ({ ...s, quests: s.quests.filter((q) => q.id !== id) }));
  }, []);

  const logFocus = useCallback((minutes: number) => {
    commit((s) => ({
      ...s,
      focusSessions: [...s.focusSessions, { date: new Date().toISOString(), minutes }],
    }));
    // Focus XP uses the same economy: treat as a "normal / soul" session.
    addXp(computeQuestXp({ durationMin: minutes, difficulty: "normal", priority: "normal", category: "soul" }));
  }, [addXp]);

  const setName = useCallback((name: string) => {
    commit((s) => ({ ...s, name }));
  }, []);

  const acceptSystem = useCallback((name?: string) => {
    commit((s) => ({
      ...s,
      initialized: true,
      name: name?.trim() || "Player",
    }));
  }, []);

  const reset = useCallback(() => {
    cached = applyRollovers(initial());
    scheduleSave();
    notify();
  }, []);

  const exportSnapshot = useCallback(async (): Promise<string> => {
    const envelope: StoredEnvelope<PlayerState> = {
      v: SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      data: cached,
    };
    return JSON.stringify(envelope, null, 2);
  }, []);

  const importSnapshot = useCallback(async (raw: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(raw) as StoredEnvelope<PlayerState> | PlayerState;
      const data = (parsed as StoredEnvelope<PlayerState>).data ?? (parsed as PlayerState);
      cached = applyRollovers(migrate(data));
      scheduleSave();
      notify();
      return true;
    } catch { return false; }
  }, []);

  const totalFocusMin = state.focusSessions.reduce((a, s) => a + s.minutes, 0);
  const discipline = computeDiscipline(state);
  const rank = rankForLevel(state.level);
  const achievementCount = Object.keys(state.achievements).length;

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
    exportSnapshot,
    importSnapshot,
    xpNeeded: xpForLevel(state.level),
    rank,
    discipline,
    totalFocusMin,
    achievementCount,
    totalAchievements: ACHIEVEMENTS.length,
  };
}
