import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PlayerCard } from "@/components/PlayerCard";
import { QuestList } from "@/components/QuestList";
import { ArrowRight, Timer, BarChart3, Sword } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
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

        <blockquote className="panel p-5 md:p-6 relative">
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase mb-2">Sistem Mesajı</div>
          <p className="font-display text-lg md:text-xl italic text-foreground/90">
            "Zayıflığını kabul et. Ancak o zaman güçlenebilirsin."
          </p>
          <div className="text-xs text-muted-foreground mt-2">— Sung Jin-Woo</div>
        </blockquote>
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
