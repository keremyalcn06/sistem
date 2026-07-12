import { usePlayer } from "@/lib/player-store";
import { Flame, Zap, Trophy, Target } from "lucide-react";


export function PlayerCard() {
  const { state, hydrated, xpNeeded } = usePlayer();
  if (!hydrated) return <div className="panel p-6 h-48 animate-pulse" />;

  const pct = Math.min(100, (state.xp / xpNeeded) * 100);
  const completedToday = state.quests.filter((q) => q.done).length;
  const totalToday = state.quests.length;

  return (
    <div className="panel-glow corner-frame p-5 md:p-7 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-primary/10 blur-3xl animate-rune-spin" />
      <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">Gölge Askeri</div>
          <h1 className="font-display text-2xl md:text-4xl mt-1 truncate">{state.name}</h1>
          <div className="text-xs text-muted-foreground mt-1 font-display tracking-widest uppercase">
            E-Rank Avcı · Sistem Aktif
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-[10px] tracking-widest text-muted-foreground uppercase">Seviye</div>
          <div className="font-display text-4xl md:text-5xl text-transparent bg-clip-text bg-[image:var(--gradient-arcane)] animate-glow-pulse rounded-full">
            {state.level}
          </div>
        </div>
      </div>

      <div className="relative mt-6 space-y-2">
        <div className="flex justify-between text-[10px] font-display tracking-widest uppercase">
          <span className="text-primary">Deneyim</span>
          <span className="text-muted-foreground">{state.xp} / {xpNeeded}</span>
        </div>
        <div className="h-2.5 bg-input rounded-full overflow-hidden border border-border">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Flame} label="Seri" value={`${state.streak} gün`} tint="text-danger" />
        <Stat icon={Zap} label="Toplam XP" value={state.totalXp.toLocaleString("tr-TR")} tint="text-xp" />
        <Stat icon={Target} label="Bugün" value={`${completedToday}/${totalToday}`} tint="text-primary" />
        <Stat icon={Trophy} label="Görev" value={state.completedCount.toString()} tint="text-accent" />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tint: string }) {
  return (
    <div className="panel p-3 flex items-center gap-3">
      <div className={`w-9 h-9 grid place-items-center rounded-md bg-background/60 border border-border ${tint}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[9px] tracking-widest text-muted-foreground uppercase truncate">{label}</div>
        <div className="font-display text-base truncate">{value}</div>
      </div>
    </div>
  );
}
