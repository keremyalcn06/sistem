/**
 * Storage adapters.
 *
 * - LocalStorageAdapter: default web adapter, synchronous under the hood but
 *   exposed as async to match the interface.
 * - PreferencesAdapter: Capacitor Preferences plugin — durable Android
 *   storage that survives app upgrades and is not evicted by the WebView.
 * - CompositeAdapter: writes to every backend, reads from the first that
 *   returns a value. Used on Android to keep localStorage as a fast synchronous
 *   read-through cache while Preferences owns the durable copy. This is also
 *   the seam where a future cloud/Supabase adapter plugs in.
 */
import { isNative } from "../native/platform";
import type { KeyValueRepository } from "./repository";

export class LocalStorageAdapter implements KeyValueRepository {
  readonly name = "localStorage";
  async get(key: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  }
  async set(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(key, value); } catch { /* quota / privacy mode */ }
  }
  async remove(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    try { window.localStorage.removeItem(key); } catch { /* noop */ }
  }
  subscribe(key: string, cb: (value: string | null) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (e: StorageEvent) => { if (e.key === key) cb(e.newValue); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}

export class PreferencesAdapter implements KeyValueRepository {
  readonly name = "capacitor-preferences";
  private pluginPromise: Promise<typeof import("@capacitor/preferences") | null> | null = null;
  private async plugin() {
    if (!this.pluginPromise) {
      this.pluginPromise = import("@capacitor/preferences").catch(() => null);
    }
    return this.pluginPromise;
  }
  async get(key: string): Promise<string | null> {
    const mod = await this.plugin();
    if (!mod) return null;
    try {
      const { value } = await mod.Preferences.get({ key });
      return value ?? null;
    } catch { return null; }
  }
  async set(key: string, value: string): Promise<void> {
    const mod = await this.plugin();
    if (!mod) return;
    try { await mod.Preferences.set({ key, value }); } catch { /* noop */ }
  }
  async remove(key: string): Promise<void> {
    const mod = await this.plugin();
    if (!mod) return;
    try { await mod.Preferences.remove({ key }); } catch { /* noop */ }
  }
}

/**
 * Writes to every backend, reads from the primary and falls back to secondaries
 * if the primary has no value (useful right after an app upgrade migrated from
 * localStorage into Preferences).
 */
export class CompositeAdapter implements KeyValueRepository {
  readonly name: string;
  constructor(private readonly backends: KeyValueRepository[]) {
    this.name = `composite[${backends.map((b) => b.name).join("+")}]`;
  }
  async get(key: string): Promise<string | null> {
    for (const b of this.backends) {
      const v = await b.get(key);
      if (v != null) return v;
    }
    return null;
  }
  async set(key: string, value: string): Promise<void> {
    await Promise.allSettled(this.backends.map((b) => b.set(key, value)));
  }
  async remove(key: string): Promise<void> {
    await Promise.allSettled(this.backends.map((b) => b.remove(key)));
  }
  subscribe(key: string, cb: (value: string | null) => void): () => void {
    const unsubs = this.backends
      .map((b) => b.subscribe?.(key, cb))
      .filter((u): u is () => void => typeof u === "function");
    return () => { for (const u of unsubs) u(); };
  }
}

let cached: KeyValueRepository | null = null;

/** Returns the process-wide repository singleton. */
export function getRepository(): KeyValueRepository {
  if (cached) return cached;
  const local = new LocalStorageAdapter();
  if (isNative()) {
    // Preferences primary (durable, survives updates), localStorage mirror
    // for fast synchronous reads during hydration.
    cached = new CompositeAdapter([new PreferencesAdapter(), local]);
  } else {
    cached = local;
  }
  return cached;
}
