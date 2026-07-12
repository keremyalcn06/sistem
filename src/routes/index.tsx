import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PlayerCard } from "@/components/PlayerCard";
import { QuestList } from "@/components/QuestList";
import { ArrowRight, Timer, BarChart3, Sword } from "lucide-react";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { state, hydrated } = usePlayer();

  const completedToday = state.quests.filter((q) => q.done).length;
  const totalToday = state.quests.length;
  const rate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Last 7 days focus minutes
  const now = new Date();
  const last7 = state.focusSessions.filter((s) => {
    const d = new Date(s.date);
    return (now.getTime() - d.getTime()) / 86400000 <= 7;
  });
  const last7Min = last7.reduce((a, s) => a + s.minutes, 0);
  const prev7 = state.focusSessions.filter((s) => {
    const d = new Date(s.date);
    const diff = (now.getTime() - d.getTime()) / 86400000;
    return diff > 7 && diff <= 14;
  }).reduce((a, s) => a + s.minutes, 0);
  const trend = prev7 > 0 ? Math.round(((last7Min - prev7) / prev7) * 100) : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <PlayerCard />

        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <QuestList compact />

          <div className="space-y-4">
            <QuickCard to="/gorevler" icon={Sword} title="Görev Listesi" desc="Bugünkü tüm görevleri gör" />
            <QuickCard to="/odak" icon={Timer} title="Odak Modu" desc="Pomodoro ile derin çalışma" />
            <QuickCard to="/istatistik" icon={BarChart3} title="İstatistikler" desc="İlerlemeni analiz et" />
          </div>
        </div>

        <div className="panel p-5 md:p-6 relative">
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase mb-3">SYSTEM // ANALİZ</div>
          {hydrated ? (
            <ul className="space-y-1.5 font-mono text-sm md:text-[15px] text-foreground/90">
              <li>&gt; Bugün planlanan {totalToday} görevden {completedToday} tanesi tamamlandı. (Oran: %{rate})</li>
              <li>&gt; Son 7 gün toplam odak süresi: {last7Min} dk.</li>
              {trend !== null && (
                <li>
                  &gt; Odak süresi önceki haftaya göre {trend >= 0 ? `%${trend} arttı` : `%${Math.abs(trend)} azaldı`}.
                </li>
              )}
              <li>&gt; Aktif seri: {state.streak} gün · Başarısız görev: {state.failedCount}.</li>
            </ul>
          ) : (
            <div className="h-16 animate-pulse" />
          )}
        </div>

      </div>
    </AppShell>
  );
}

function QuickCard({ to, icon: Icon, title, desc }: { to: "/gorevler" | "/odak" | "/istatistik"; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="panel p-5 flex items-center gap-4 hover:border-primary/60 hover:shadow-[0_0_24px_oklch(0.75_0.18_220/25%)] transition-all group"
    >
      <div className="w-12 h-12 grid place-items-center rounded-md bg-primary/10 border border-primary/40 text-primary group-hover:animate-glow-pulse">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-sm tracking-widest uppercase">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
