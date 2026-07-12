import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { usePlayer } from "@/lib/player-store";
import { Settings, Trophy, Flame, Target, Zap, Calendar } from "lucide-react";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Player Profili — SYSTEM" },
      { name: "description", content: "Player kaydı, rank, başarılar ve istatistik özeti." },
    ],
  }),
  component: Profile,
});

type Achievement = { id: string; label: string; desc: string; unlocked: boolean };

function Profile() {
  const { state, hydrated, xpNeeded, rank } = usePlayer();
  if (!hydrated) return <AppShell><div className="panel p-6 h-64 animate-pulse" /></AppShell>;

  const totalFocusMin = state.focusSessions.reduce((a, s) => a + s.minutes, 0);
  const pct = Math.min(100, (state.xp / xpNeeded) * 100);

  const achievements: Achievement[] = [
    { id: "first", label: "İlk Adım", desc: "İlk görevi tamamla", unlocked: state.completedCount >= 1 },
    { id: "streak3", label: "3 Gün Seri", desc: "3 gün üst üste aktif", unlocked: state.streak >= 3 },
    { id: "streak7", label: "7 Gün Seri", desc: "1 hafta kesintisiz", unlocked: state.streak >= 7 },
    { id: "focus60", label: "60 dk Odak", desc: "Toplam 60 dk odak", unlocked: totalFocusMin >= 60 },
    { id: "focus300", label: "5 Saat Derin", desc: "Toplam 300 dk odak", unlocked: totalFocusMin >= 300 },
    { id: "lv5", label: "Rank E", desc: "5. seviyeye ulaş", unlocked: state.level >= 5 },
    { id: "lv10", label: "Rank D", desc: "10. seviyeye ulaş", unlocked: state.level >= 10 },
    { id: "q50", label: "50 Görev", desc: "50 görev tamamla", unlocked: state.completedCount >= 50 },
  ];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const memberSince = new Date(state.createdAt).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">SYSTEM // PROFIL</div>
          <h1 className="font-display text-3xl md:text-4xl mt-1 truncate">{state.name}</h1>
          <div className="text-xs text-muted-foreground font-display tracking-widest uppercase mt-1">
            {rank}-Rank · {state.title}
          </div>
        </div>
        <Link
          to="/ayarlar"
          className="shrink-0 w-11 h-11 grid place-items-center rounded-md panel hover:border-primary/60 transition-all"
          aria-label="Ayarlar"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Avatar / identity card */}
      <div className="panel-glow corner-frame p-6 relative overflow-hidden mb-6">
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-primary/10 blur-3xl animate-rune-spin" />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 shrink-0 rounded-lg grid place-items-center panel-glow">
            <span className="font-display text-4xl text-transparent bg-clip-text bg-[image:var(--gradient-arcane)]">
              {rank}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[10px] tracking-widest text-muted-foreground uppercase">Seviye</div>
            <div className="font-display text-4xl">{state.level}</div>
            <div className="mt-2 h-2 bg-input rounded-full overflow-hidden border border-border">
              <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-display tracking-widest text-muted-foreground uppercase">
              <span>{state.xp} / {xpNeeded} XP</span>
              <span>LV.{state.level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MiniStat icon={Flame} label="Seri" value={`${state.streak} gün`} />
        <MiniStat icon={Target} label="Tamamlanan" value={state.completedCount} />
        <MiniStat icon={Zap} label="Toplam XP" value={state.totalXp.toLocaleString("tr-TR")} />
        <MiniStat icon={Calendar} label="Kayıt" value={memberSince} />
      </div>

      {/* Achievements */}
      <div className="panel p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">SYSTEM // KİLİTLİ</div>
            <h2 className="font-display text-xl">Başarımlar</h2>
          </div>
          <div className="text-xs text-muted-foreground font-display tracking-widest uppercase">
            {unlockedCount}/{achievements.length}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded-md border text-center transition-all ${
                a.unlocked
                  ? "border-primary/50 bg-primary/5 shadow-[0_0_16px_oklch(0.75_0.18_220/25%)]"
                  : "border-border bg-background/30 opacity-50"
              }`}
            >
              <Trophy className={`w-5 h-5 mx-auto mb-1 ${a.unlocked ? "text-primary" : "text-muted-foreground"}`} />
              <div className="font-display text-[11px] tracking-widest uppercase truncate">{a.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="panel p-3 flex items-center gap-3">
      <div className="w-9 h-9 grid place-items-center rounded-md bg-background/60 border border-border text-primary shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[9px] tracking-widest text-muted-foreground uppercase truncate">{label}</div>
        <div className="font-display text-sm truncate">{value}</div>
      </div>
    </div>
  );
}
