/**
 * Web Speech API wrappers for SYSTEM voice I/O.
 *
 * - `speak(text)` — TTS via SpeechSynthesis. Prefers a Turkish voice.
 * - `createRecognizer()` — STT via SpeechRecognition (webkit prefix on
 *   Chrome / WebView). Returns a start/stop/onResult contract.
 *
 * Everything is guarded so importing this file is safe during SSR.
 * The Capacitor Android WebView (Chromium) exposes both APIs; on
 * unsupported environments the helpers become no-ops and report
 * `supported: false` so the UI can degrade gracefully.
 */

type SRConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: any) => void) | null;
  onerror: ((this: SpeechRecognition, ev: any) => void) | null;
  onend: ((this: SpeechRecognition, ev: any) => void) | null;
}

function getSRCtor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) ?? null;
}

export function isSttSupported() {
  return getSRCtor() !== null;
}

export function isTtsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// ---------------------------------------------------------------------------
// TTS
// ---------------------------------------------------------------------------

function pickTurkishVoice(): SpeechSynthesisVoice | null {
  if (!isTtsSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith("tr")) ??
    voices.find((v) => v.default) ??
    voices[0] ??
    null
  );
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (!isTtsSupported() || !text) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "tr-TR";
    utter.rate = opts.rate ?? 1;
    utter.pitch = opts.pitch ?? 1;
    const voice = pickTurkishVoice();
    if (voice) utter.voice = voice;
    synth.speak(utter);
  } catch {
    /* noop */
  }
}

export function stopSpeaking() {
  if (isTtsSupported()) window.speechSynthesis.cancel();
}

// ---------------------------------------------------------------------------
// STT
// ---------------------------------------------------------------------------

export type Recognizer = {
  start: () => void;
  stop: () => void;
  supported: boolean;
};

export function createRecognizer(handlers: {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
  continuous?: boolean;
}): Recognizer {
  const Ctor = getSRCtor();
  if (!Ctor) {
    return { start: () => {}, stop: () => {}, supported: false };
  }
  const rec = new Ctor();
  rec.lang = "tr-TR";
  rec.continuous = handlers.continuous ?? false;
  rec.interimResults = true;

  rec.onresult = (ev: any) => {
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      handlers.onResult(r[0].transcript, !!r.isFinal);
    }
  };
  rec.onerror = (ev: any) => handlers.onError?.(String(ev.error ?? "error"));
  rec.onend = () => handlers.onEnd?.();

  return {
    supported: true,
    start: () => {
      try { rec.start(); } catch { /* already running */ }
    },
    stop: () => {
      try { rec.stop(); } catch { /* not running */ }
    },
  };
}

// ---------------------------------------------------------------------------
// Wake-word infrastructure (placeholder).
//
// True always-on wake-word ("Hey Jarvis") requires a native model
// (Porcupine, Snowboy) — not implementable in a WebView without a
// Capacitor plugin. This helper exposes the contract so a future
// plugin can plug in without touching call sites.
// ---------------------------------------------------------------------------

export type WakeWordEngine = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  supported: boolean;
};

export function createWakeWordEngine(_phrase = "hey jarvis"): WakeWordEngine {
  return {
    supported: false,
    start: async () => {},
    stop: async () => {},
  };
}
