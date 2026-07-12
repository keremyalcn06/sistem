// SYSTEM sound engine — minimal, tech-oriented tones synthesized via Web Audio.
// No external asset files. Silent on server; unlocked on first user interaction.

let ctx: AudioContext | null = null;
let unlocked = false;
let muted = false;

const KEY = "system-muted";

if (typeof window !== "undefined") {
  try { muted = localStorage.getItem(KEY) === "1"; } catch { /* noop */ }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    } catch { return null; }
  }
  return ctx;
}

export function unlockAudio() {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  unlocked = true;
}

export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* noop */ }
}
export function isMuted() { return muted; }

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
  delay?: number;
};

function play(tones: Tone[]) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const master = c.createGain();
  master.gain.value = 0.18;
  master.connect(c.destination);

  const now = c.currentTime;
  for (const t of tones) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = t.type ?? "sine";
    const startAt = now + (t.delay ?? 0);
    osc.frequency.setValueAtTime(t.freq, startAt);
    if (t.slideTo !== undefined) {
      osc.frequency.linearRampToValueAtTime(t.slideTo, startAt + t.dur);
    }
    const peak = t.gain ?? 0.6;
    g.gain.setValueAtTime(0, startAt);
    g.gain.linearRampToValueAtTime(peak, startAt + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + t.dur);
    osc.connect(g);
    g.connect(master);
    osc.start(startAt);
    osc.stop(startAt + t.dur + 0.02);
  }
}

export const sfx = {
  boot: () => play([
    { freq: 220, slideTo: 660, dur: 0.35, type: "sawtooth", gain: 0.35 },
    { freq: 880, dur: 0.12, type: "square", gain: 0.25, delay: 0.36 },
    { freq: 1320, dur: 0.18, type: "sine", gain: 0.3, delay: 0.5 },
  ]),
  click: () => play([
    { freq: 1400, dur: 0.05, type: "square", gain: 0.2 },
  ]),
  confirm: () => play([
    { freq: 660, dur: 0.08, type: "square", gain: 0.35 },
    { freq: 990, dur: 0.12, type: "square", gain: 0.35, delay: 0.06 },
  ]),
  xp: () => play([
    { freq: 880, slideTo: 1760, dur: 0.18, type: "sine", gain: 0.35 },
  ]),
  levelUp: () => play([
    { freq: 440, dur: 0.12, type: "sawtooth", gain: 0.3 },
    { freq: 660, dur: 0.12, type: "sawtooth", gain: 0.3, delay: 0.1 },
    { freq: 880, dur: 0.18, type: "sawtooth", gain: 0.35, delay: 0.2 },
    { freq: 1320, slideTo: 1760, dur: 0.5, type: "sine", gain: 0.4, delay: 0.38 },
  ]),
  bossAlert: () => play([
    { freq: 180, dur: 0.25, type: "square", gain: 0.4 },
    { freq: 180, dur: 0.25, type: "square", gain: 0.4, delay: 0.3 },
    { freq: 240, dur: 0.35, type: "square", gain: 0.4, delay: 0.6 },
  ]),
  reject: () => play([
    { freq: 220, slideTo: 110, dur: 0.35, type: "sawtooth", gain: 0.35 },
  ]),
};

// Global unlock on first user gesture.
if (typeof window !== "undefined") {
  const unlock = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}
