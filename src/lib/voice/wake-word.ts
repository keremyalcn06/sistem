/**
 * Wake-word engine abstraction.
 *
 * The goal of this module is to keep the rest of the app decoupled from any
 * particular native wake-word implementation. A future integration
 * (Porcupine, Picovoice, Vosk, Snowboy, or a Capacitor plugin wrapper) only
 * needs to implement `WakeWordEngine` and register itself via
 * `setWakeWordEngine()`. Consumers keep calling `getWakeWordEngine()` and
 * subscribe to the same events.
 *
 * Until a real engine is registered, the built-in `NoopWakeWordEngine`
 * satisfies the contract without doing any audio work — the mic button on the
 * VoiceAssistant remains the primary trigger. This ships the seam, not the
 * feature, exactly as requested.
 */
export type WakeWordEvent =
  | { type: "detected"; keyword: string; confidence?: number; at: number }
  | { type: "error"; message: string }
  | { type: "state"; state: WakeWordState };

export type WakeWordState = "idle" | "starting" | "listening" | "stopping" | "error";

export type WakeWordConfig = {
  /** Keywords the engine should react to. Default: ["hey jarvis"] */
  keywords?: string[];
  /** Detection threshold 0..1 — implementations may ignore. */
  sensitivity?: number;
  /** Access key / license token if the engine requires one. */
  accessKey?: string;
};

export type WakeWordListener = (event: WakeWordEvent) => void;

export interface WakeWordEngine {
  readonly id: string;
  readonly available: boolean;
  state(): WakeWordState;
  configure(config: WakeWordConfig): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: WakeWordListener): () => void;
}

/**
 * Default no-op engine. Exposes the full contract so consumers never crash
 * when no native engine is available (web, dev, or fresh Android APK without
 * a wake-word plugin bundled).
 */
export class NoopWakeWordEngine implements WakeWordEngine {
  readonly id = "noop";
  readonly available = false;
  private _state: WakeWordState = "idle";
  private listeners = new Set<WakeWordListener>();
  private config: WakeWordConfig = { keywords: ["hey jarvis"], sensitivity: 0.5 };

  state() { return this._state; }
  configure(config: WakeWordConfig) { this.config = { ...this.config, ...config }; }
  async start() { this.setState("idle"); /* nothing to do */ }
  async stop()  { this.setState("idle"); }

  subscribe(listener: WakeWordListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Test / manual hook: allow app code to simulate a detection. */
  simulate(keyword = this.config.keywords?.[0] ?? "hey jarvis") {
    this.emit({ type: "detected", keyword, at: Date.now() });
  }

  private setState(s: WakeWordState) {
    this._state = s;
    this.emit({ type: "state", state: s });
  }
  private emit(evt: WakeWordEvent) {
    for (const l of this.listeners) {
      try { l(evt); } catch { /* isolate listener errors */ }
    }
  }
}

let current: WakeWordEngine = new NoopWakeWordEngine();

/** Returns the currently registered engine (never null). */
export function getWakeWordEngine(): WakeWordEngine {
  return current;
}

/**
 * Swap the active wake-word engine. A future Porcupine/Picovoice adapter
 * calls this during app boot on Android; the rest of the codebase keeps
 * using `getWakeWordEngine()` unchanged.
 */
export function setWakeWordEngine(engine: WakeWordEngine): void {
  try { void current.stop(); } catch { /* noop */ }
  current = engine;
}

/** Convenience: shorthand for subscribe on the active engine. */
export function onWakeWord(listener: WakeWordListener): () => void {
  return getWakeWordEngine().subscribe(listener);
}
