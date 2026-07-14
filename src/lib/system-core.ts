/**
 * SYSTEM CORE — invisible decision layer.
 *
 * A pure, side-effect-free module that answers questions like:
 *  - Is the user available at time T?
 *  - How many quests should today have, given performance history?
 *  - Which difficulty is appropriate right now?
 *  - Which goal / important date should get priority pressure today?
 *
 * Everything here is deterministic input → output. UI never calls this
 * directly; feature modules (quest generator, planner, coach) route their
 * decisions through SYSTEM CORE so all future AI features share the same
 * ruleset. Adding a new feature = adding a new query here, never changing
 * how the raw data is stored.
 *
 * Clean-architecture: this is the domain "policy" layer. No storage, no
 * React, no Capacitor. Trivially unit-testable.
 */

import type { PlayerProfile, TimeBlock } from "./profile";
import type { Difficulty } from "./economy";

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function blockContains(b: TimeBlock, minuteOfDay: number): boolean {
  const s = toMinutes(b.start);
  const e = toMinutes(b.end);
  // Handle overnight (e.g. sleep 23:00–07:00).
  if (s === e) return false;
  return s < e
    ? minuteOfDay >= s && minuteOfDay < e
    : minuteOfDay >= s || minuteOfDay < e;
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export interface AvailabilityQuery {
  profile: PlayerProfile;
  /** Local minute-of-day, default = now. */
  minuteOfDay?: number;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: "sleep" | "busy" | "free";
  freeMinutesLeftToday: number;
}

/**
 * Is the user free right now? Returns why, and how many minutes of "free"
 * time remain in the day.
 */
export function checkAvailability(q: AvailabilityQuery): AvailabilityResult {
  const now = q.minuteOfDay ?? nowMinutes();
  const p = q.profile;

  if (p.sleep && blockContains(p.sleep, now)) {
    return { available: false, reason: "sleep", freeMinutesLeftToday: 0 };
  }
  if (p.busyBlocks.some((b) => blockContains(b, now))) {
    return { available: false, reason: "busy", freeMinutesLeftToday: freeRemainingToday(p, now) };
  }
  return { available: true, reason: "free", freeMinutesLeftToday: freeRemainingToday(p, now) };
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function freeRemainingToday(p: PlayerProfile, fromMinute: number): number {
  // Approximation: if the user gave explicit `freeBlocks`, use their union
  // from `fromMinute` to end of day. Otherwise fall back to `dailyMinutes`.
  if (p.freeBlocks.length === 0) return Math.max(0, p.dailyMinutes ?? 60);
  let total = 0;
  for (const b of p.freeBlocks) {
    const s = Math.max(fromMinute, toMinutes(b.start));
    const e = toMinutes(b.end);
    if (e > s) total += e - s;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Load balancing — how much to give today
// ---------------------------------------------------------------------------

export interface LoadQuery {
  profile: PlayerProfile;
  /** Number of quests already active today (any status). */
  activeToday: number;
  /** Recent completion ratio 0–1. */
  recentSuccessRate: number;
}

export interface LoadPlan {
  /** Recommended total quests for today (soft cap). */
  targetQuestCount: number;
  /** How many more can be safely added before the day is overloaded. */
  remainingSlots: number;
  /** Suggested difficulty ceiling for new quests. */
  difficultyCeiling: Difficulty;
}

/**
 * Given the profile's available minutes and recent success, decide how
 * loaded the day should be and which difficulties are safe.
 *
 * Rules:
 *  - Baseline: 4 quests. +1 for every 60 min of daily capacity above 60.
 *  - Cap at 8 quests / day to avoid overload.
 *  - Sub-40% recent success → strategy shift: drop count by 2 and lower ceiling.
 *  - >80% success → allow "hard" or "epic" ceiling, +1 quest.
 */
export function planDailyLoad(q: LoadQuery): LoadPlan {
  const daily = q.profile.dailyMinutes ?? 60;
  let target = 4 + Math.floor(Math.max(0, daily - 60) / 60);
  let ceiling: Difficulty = "normal";

  if (q.recentSuccessRate < 0.4) {
    target = Math.max(2, target - 2);
    ceiling = "easy";
  } else if (q.recentSuccessRate > 0.8) {
    target = target + 1;
    ceiling = "epic";
  } else if (q.recentSuccessRate > 0.6) {
    ceiling = "hard";
  }

  target = Math.min(8, Math.max(2, target));

  return {
    targetQuestCount: target,
    remainingSlots: Math.max(0, target - q.activeToday),
    difficultyCeiling: ceiling,
  };
}

// ---------------------------------------------------------------------------
// Priority pressure — upcoming important dates
// ---------------------------------------------------------------------------

export interface PriorityBoost {
  goal: string;
  daysLeft: number;
  /** 0–3, added to a quest's priority weighting. */
  weight: number;
}

/**
 * Turns the profile's important dates into priority weights. Anything within
 * 3 days gets weight 3, within 7 → 2, within 21 → 1.
 */
export function upcomingPriorities(profile: PlayerProfile, from = new Date()): PriorityBoost[] {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return profile.importantDates
    .map((d) => {
      const target = new Date(d.date + "T00:00:00").getTime();
      const daysLeft = Math.round((target - today) / 86_400_000);
      let weight = 0;
      if (daysLeft >= 0) {
        if (daysLeft <= 3) weight = 3;
        else if (daysLeft <= 7) weight = 2;
        else if (daysLeft <= 21) weight = 1;
      }
      return { goal: d.label, daysLeft, weight };
    })
    .filter((b) => b.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

// ---------------------------------------------------------------------------
// Strategy adaptation
// ---------------------------------------------------------------------------

export type StrategyMode = "growth" | "hold" | "recovery";

/**
 * Long-horizon adaptation: after N days of low success, SYSTEM CORE
 * switches to "recovery" mode (fewer, easier quests, more sleep-hygiene
 * nudges). Consistent success promotes to "growth" (harder targets).
 */
export function pickStrategy(recentSuccessRate: number, streakDays: number): StrategyMode {
  if (recentSuccessRate < 0.35 || streakDays === 0) return "recovery";
  if (recentSuccessRate > 0.7 && streakDays >= 3) return "growth";
  return "hold";
}
