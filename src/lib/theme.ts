/**
 * SYSTEM theme accent controller.
 *
 * Design tokens (background, panels, text, gradients) are intentionally left
 * intact — only the "arcane accent" color (--primary / --ring) is user
 * configurable. Persistence is routed through the shared KeyValueRepository so
 * the choice survives app upgrades on Android (Capacitor Preferences) and
 * plain browser reloads (localStorage) alike.
 */
import { getRepository } from "@/lib/storage";

export type ThemePreset = {
  id: string;
  label: string;
  /** oklch triplet used for --primary / --ring */
  primary: string;
  /** end-stop for the arcane gradient (usually a secondary hue). */
  accent: string;
  /** swatch hex for the UI dot */
  swatch: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: "arcane",   label: "Arcane Cyan", primary: "oklch(0.75 0.18 220)", accent: "oklch(0.65 0.22 280)", swatch: "#38bdf8" },
  { id: "violet",   label: "Violet",      primary: "oklch(0.70 0.22 285)", accent: "oklch(0.65 0.24 320)", swatch: "#a855f7" },
  { id: "magenta",  label: "Magenta",     primary: "oklch(0.68 0.24 320)", accent: "oklch(0.62 0.24 355)", swatch: "#ec4899" },
  { id: "emerald",  label: "Emerald",     primary: "oklch(0.75 0.18 155)", accent: "oklch(0.70 0.20 195)", swatch: "#10b981" },
  { id: "amber",    label: "Amber",       primary: "oklch(0.80 0.17 75)",  accent: "oklch(0.70 0.20 40)",  swatch: "#f59e0b" },
  { id: "crimson",  label: "Crimson",     primary: "oklch(0.66 0.24 25)",  accent: "oklch(0.60 0.24 355)", swatch: "#ef4444" },
];

export const DEFAULT_THEME_ID = "arcane";
const STORAGE_KEY = "system-theme-preset-v1";

export function getPreset(id: string | null | undefined): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

/** Apply a preset by writing CSS variables at :root. Safe on SSR (noop). */
export function applyTheme(preset: ThemePreset): void {
  if (typeof document === "undefined") return;
  const r = document.documentElement.style;
  r.setProperty("--primary", preset.primary);
  r.setProperty("--ring", preset.primary);
  r.setProperty(
    "--gradient-arcane",
    `linear-gradient(135deg, ${preset.primary} 0%, ${preset.accent} 60%, ${preset.accent} 100%)`,
  );
}

/** Fire-and-forget persist. */
export async function saveTheme(id: string): Promise<void> {
  try { await getRepository().set(STORAGE_KEY, id); } catch { /* noop */ }
}

/** Read persisted preset id (or null). */
export async function loadThemeId(): Promise<string | null> {
  try { return await getRepository().get(STORAGE_KEY); } catch { return null; }
}

/**
 * Restore the persisted theme as early as possible. Call once at app boot.
 * Falls back silently if no value is stored.
 */
export async function initTheme(): Promise<ThemePreset> {
  const id = await loadThemeId();
  const preset = getPreset(id);
  applyTheme(preset);
  return preset;
}
