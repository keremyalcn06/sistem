import { Link } from "@tanstack/react-router";
import { Home, Sword, Timer, BarChart3, User } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { useEffect, useState } from "react";

const items = [
  { to: "/", label: "Ana", icon: Home },
  { to: "/gorevler", label: "Görev", icon: Sword },
  { to: "/odak", label: "Odak", icon: Timer },
  { to: "/istatistik", label: "Stat", icon: BarChart3 },
  { to: "/profil", label: "Profil", icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, hydrated, xpNeeded } = usePlayer();
  const [levelUp, setLevelUp] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLevelUp(detail.level);
      setTimeout(() => setLevelUp(null), 2400);
    };
    window.addEventListener("player:levelup", handler);
    return () => window.removeEventListener("player:levelup", handler);
  }, []);

  const pct = hydrated ? Math.min(100, (state.xp / xpNeeded) * 100) : 0;

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8 md:pl-64 select-none">
      {/* Mobile top status bar */}
      <header className="md:hidden sticky top-0 z-30 backdrop-blur-lg bg-background/80 border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 grid place-items-center rounded-md panel-glow">
              <span className="font-display text-primary text-xs">S</span>
            </div>
            <span className="font-display text-[11px] tracking-[0.3em] text-primary uppercase">SYSTEM</span>
          </div>
          {hydrated && (
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] tracking-widest text-muted-foreground uppercase">LV.{state.level}</span>
              <div className="w-16 h-1.5 bg-input rounded-full overflow-hidden border border-border">
                <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar (desktop) / Bottom nav (mobile) */}
      <nav className="fixed z-40 bottom-0 left-0 right-0 md:top-0 md:right-auto md:h-screen md:w-64 md:border-r border-t md:border-t-0 border-border backdrop-blur-lg bg-background/90 pb-[env(safe-area-inset-bottom)] md:pb-0">
        <div className="hidden md:flex flex-col h-full p-6 gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 grid place-items-center rounded-md panel-glow">
              <span className="font-display text-primary text-lg">S</span>
            </div>
            <div>
              <div className="font-display text-sm tracking-widest text-primary">SHADOW</div>
              <div className="font-display text-xs tracking-widest text-muted-foreground">MONARCH SYSTEM</div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                activeOptions={{ exact: it.to === "/" }}
                activeProps={{ className: "bg-primary/15 text-primary border-primary/50 shadow-[0_0_20px_oklch(0.75_0.18_220/30%)]" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent" }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md border transition-all font-display tracking-widest text-xs uppercase"
              >
                <it.icon className="w-4 h-4" />
                {it.label}
              </Link>
            ))}
          </div>
          {hydrated && (
            <div className="panel p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-display tracking-widest text-muted-foreground uppercase">
                <span>{state.name}</span>
                <span className="text-primary">LV.{state.level}</span>
              </div>
              <div className="h-1.5 bg-input rounded-full overflow-hidden">
                <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-muted-foreground text-right">{state.xp} / {xpNeeded} XP</div>
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden grid grid-cols-5">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 py-2.5 font-display text-[9px] tracking-widest uppercase active:scale-95 transition-transform"
            >
              <it.icon className="w-5 h-5" />
              {it.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 md:px-8 py-5 md:py-10 animate-fade-in">
        {children}
      </main>

      {levelUp !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center pointer-events-none">
          <div className="animate-level-up text-center">
            <div className="font-display text-xs tracking-[0.4em] text-primary mb-2">SYSTEM // LEVEL UP</div>
            <div className="font-display text-7xl md:text-8xl text-transparent bg-clip-text bg-[image:var(--gradient-arcane)]" style={{ textShadow: "0 0 40px oklch(0.75 0.18 220 / 60%)" }}>
              LV. {levelUp}
            </div>
            <div className="font-display text-xs tracking-[0.3em] text-muted-foreground mt-2">Yeni seviye kaydedildi</div>
          </div>
        </div>
      )}

    </div>
  );
}
