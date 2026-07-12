import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/player-store";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { sfx } from "@/lib/sfx";


export const Route = createFileRoute("/odak")({
  head: () => ({ meta: [{ title: "Odak Modu — Shadow Monarch" }, { name: "description", content: "Pomodoro tekniğiyle derin çalışma seansı başlat." }] }),
  component: Focus,
});

type Mode = "focus" | "short" | "long";
const durations: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const labels: Record<Mode, string> = { focus: "Derin Odak", short: "Kısa Mola", long: "Uzun Mola" };

function Focus() {
  const { logFocus } = usePlayer();
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(durations.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const modeAtStartRef = useRef<Mode>("focus");

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          if (modeAtStartRef.current === "focus") {
            const mins = Math.round(durations.focus / 60);
            logFocus(mins);
            setSessions((s) => s + 1);
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, logFocus]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setRemaining(durations[m]);
    setRunning(false);
  };

  const start = () => {
    if (remaining === 0) setRemaining(durations[mode]);
    modeAtStartRef.current = mode;
    startedAtRef.current = Date.now();
    if (mode === "focus") sfx.bossAlert(); else sfx.confirm();
    setRunning(true);
  };


  const reset = () => { setRunning(false); setRemaining(durations[mode]); };

  const total = durations[mode];
  const pct = ((total - remaining) / total) * 100;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const size = 280;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <AppShell>
      <div className="mb-6">
        <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">Zindan Modu</div>
        <h1 className="font-display text-3xl md:text-4xl mt-1">Odak Portalı</h1>
        <p className="text-sm text-muted-foreground mt-1">Portalı aç, dikkatini topla. Her seans +50 XP.</p>
      </div>

      <div className="panel-glow corner-frame p-6 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative flex justify-center gap-2 mb-8 flex-wrap">
          {(Object.keys(durations) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 rounded-md text-xs font-display tracking-widest uppercase border transition-all flex items-center gap-2 ${
                mode === m
                  ? "border-primary text-primary bg-primary/10 shadow-[0_0_16px_oklch(0.75_0.18_220/40%)]"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "focus" ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
              {labels[m]}
            </button>
          ))}
        </div>

        <div className="relative grid place-items-center">
          <svg width={size} height={size} className={running ? "animate-glow-pulse rounded-full" : ""}>
            <defs>
              <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.75 0.18 220)" />
                <stop offset="100%" stopColor="oklch(0.65 0.22 300)" />
              </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(0.25 0.05 262)" strokeWidth={stroke} fill="none" />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              stroke="url(#ring)" strokeWidth={stroke} fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - (pct / 100) * c}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase mb-1">{labels[mode]}</div>
              <div className="font-display text-6xl md:text-7xl tabular-nums" style={{ textShadow: "0 0 30px oklch(0.75 0.18 220 / 50%)" }}>
                {mm}:{ss}
              </div>
              <div className="text-[10px] font-display tracking-widest text-muted-foreground uppercase mt-2">
                {sessions} seans tamamlandı
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center gap-3 mt-8">
          <button
            onClick={running ? () => setRunning(false) : start}
            className="btn-arcane px-8 py-3 text-sm flex items-center gap-2"
          >
            {running ? <><Pause className="w-4 h-4" /> Duraklat</> : <><Play className="w-4 h-4" /> Başlat</>}
          </button>
          <button
            onClick={reset}
            className="px-5 py-3 border border-border rounded-md font-display text-xs tracking-widest uppercase hover:border-primary/60 hover:text-primary transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Sıfırla
          </button>
        </div>
      </div>
    </AppShell>
  );
}
