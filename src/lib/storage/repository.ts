/**
 * Repository interface for persistent SYSTEM data.
 *
 * Clean-architecture layer: this is the domain-facing port. Concrete adapters
 * (Capacitor Preferences on Android, localStorage on the web, an eventual
 * cloud-sync adapter) implement it. Feature code (player store, settings)
 * depends ONLY on this interface — swap the adapter, everything else keeps
 * working.
 *
 * All operations are async so the same contract fits localStorage,
 * Capacitor Preferences, IndexedDB, and a future HTTP/cloud backend.
 */
export interface KeyValueRepository {
  readonly name: string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  /** Optional listener for cross-tab / cross-context changes (may be a no-op). */
  subscribe?(key: string, cb: (value: string | null) => void): () => void;
}

/**
 * Versioned envelope so persisted data can be migrated safely across app
 * updates without wiping user progress.
 */
export interface StoredEnvelope<T> {
  v: number;
  updatedAt: string;
  data: T;
}

export const STORAGE_KEYS = {
  player: "system.player.v2",
  achievements: "system.achievements.v1",
  legacyPlayer: "shadow-monarch-v1", // pre-v2, used only for one-time migration
} as const;
