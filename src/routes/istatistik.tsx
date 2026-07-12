import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { usePlayer } from "@/lib/player-store";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/istatistik")({
  head: () => ({ meta: [{ title: "İstatistik — Shadow Monarch" }, { name: "description", content: "İlerlemeni, XP toplamını ve odak seansı geçmişini gör." }] }),
  component: Stats,
});

function Stats() {
  const { state, hydrated, xpNeeded, reset, setName, rank } = usePlayer();
  if (!hydrated) return <AppShell><div className="panel p-6 h-64 animate-pulse" /></AppShell>;

  const totalFocusMin = state.focusSessions.reduce((a, s) => a + s.minutes, 0);
  const focusSessions = state.focusSessions.length;

  // last 7 days
  const days: { date: string; label: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("tr-TR", { weekday: "short" });
    const minutes = state.focusSessions
      .filter((s) => s.date.slice(0, 10) === iso)
      .reduce((a, s) => a + s.minutes, 0);
    days.push({ date: iso, label, minutes });
  }
  const maxMin = Math.max(60, ...days.map((d) => d.minutes));

  const totalAttempts = state.completedCount + state.failedCount;
  const successRate = totalAttempts > 0 ? Math.round((state.completedCount / totalAttempts) * 100) : 0;

  return (
    <AppShell>
      <div className="mb-6">
        <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">SYSTEM // KAYIT</div>
        <h1 className="font-display text-3xl md:text-4xl mt-1">İstatistikler</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Kpi label="Rank" value={rank} />
        <Kpi label="Seviye" value={state.level} />
        <Kpi label="Toplam XP" value={state.totalXp.toLocaleString("tr-TR")} />
        <Kpi label="Odak Süresi" value={`${totalFocusMin} dk`} />
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Kpi label="Günlük Seri" value={`${state.streak} gün`} />
        <Kpi label="Haftalık Seri" value={`${state.weeklyStreak}`} />
        <Kpi label="Tamamlanan" value={state.completedCount} />
        <Kpi label="Başarısız" value={state.failedCount} />
      </div>

      <div className="panel p-5 md:p-6 mb-6">
        <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase mb-3">SYSTEM // ANALİZ</div>
        <ul className="space-y-1.5 font-mono text-sm text-foreground/90">
          <li>&gt; Görev başarı oranı: %{successRate} ({state.completedCount}/{totalAttempts || 0}).</li>
          <li>&gt; Ortalama seans süresi: {focusSessions > 0 ? Math.round(totalFocusMin / focusSessions) : 0} dk.</li>
          <li>&gt; Title: {state.title}.</li>
        </ul>
      </div>


      <div className="panel p-5 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display text-[10px] tracking-widest text-primary uppercase">Son 7 Gün</div>
            <h2 className="font-display text-xl">Odak Grafiği</h2>
          </div>
          <div className="text-xs text-muted-foreground font-display tracking-widest uppercase">{focusSessions} seans</div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {days.map((d) => {
            const h = (d.minutes / maxMin) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-[image:var(--gradient-xp)] transition-all"
                    style={{ height: `${h}%`, minHeight: d.minutes > 0 ? "8px" : "2px", boxShadow: d.minutes > 0 ? "0 0 12px oklch(0.75 0.18 220 / 50%)" : "none" }}
                    title={`${d.minutes} dk`}
                  />
                </div>
                <div className="text-[10px] font-display tracking-widest text-muted-foreground uppercase">{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel p-5 md:p-6 mb-6">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-1">İlerleme</div>
        <h2 className="font-display text-xl mb-4">Sonraki Seviye</h2>
        <div className="flex justify-between text-xs font-display tracking-widest uppercase text-muted-foreground mb-2">
          <span>LV.{state.level}</span>
          <span>{state.xp} / {xpNeeded} XP</span>
          <span>LV.{state.level + 1}</span>
        </div>
        <div className="h-3 bg-input rounded-full overflow-hidden border border-border">
          <div className="xp-bar-fill" style={{ width: `${(state.xp / xpNeeded) * 100}%` }} />
        </div>
      </div>

      <div className="panel p-5 md:p-6">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-1">Avcı Profili</div>
        <h2 className="font-display text-xl mb-4">Ayarlar</h2>
        <label className="block text-xs font-display tracking-widest text-muted-foreground uppercase mb-2">Avcı Adı</label>
        <input
          className="bg-input rounded-md px-3 py-2 text-sm w-full max-w-sm outline-none focus:ring-2 focus:ring-primary/60"
          value={state.name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={() => {
              if (confirm("Tüm ilerlemen silinecek. Emin misin?")) reset();
            }}
            className="flex items-center gap-2 text-xs font-display tracking-widest uppercase text-danger hover:text-destructive-foreground hover:bg-danger/20 px-3 py-2 rounded-md border border-danger/40 transition-all"
          >
            <Trash2 className="w-4 h-4" /> İlerlemeyi Sıfırla
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel p-4">
      <div className="font-display text-[10px] tracking-widest text-muted-foreground uppercase">{label}</div>
      <div className="font-display text-2xl md:text-3xl mt-1 text-transparent bg-clip-text bg-[image:var(--gradient-arcane)]">{value}</div>
    </div>
  );
}
