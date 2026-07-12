import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { QuestList } from "@/components/QuestList";
import { useState } from "react";
import { Sword, CalendarDays, Skull, Lock } from "lucide-react";

export const Route = createFileRoute("/gorevler")({
  head: () => ({
    meta: [
      { title: "Görevler — SYSTEM" },
      { name: "description", content: "Günlük, haftalık ve boss görevlerini takip et." },
    ],
  }),
  component: Quests,
});

type Tab = "daily" | "weekly" | "boss";

function Quests() {
  const [tab, setTab] = useState<Tab>("daily");

  return (
    <AppShell>
      <div className="mb-5">
        <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">SYSTEM // ZORUNLU</div>
        <h1 className="font-display text-2xl md:text-4xl mt-1">Görevler</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Sistem izliyor. Tamamlanmayan görev = ceza.</p>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 panel mb-5">
        <TabBtn active={tab === "daily"} onClick={() => setTab("daily")} icon={Sword} label="Günlük" />
        <TabBtn active={tab === "weekly"} onClick={() => setTab("weekly")} icon={CalendarDays} label="Haftalık" />
        <TabBtn active={tab === "boss"} onClick={() => setTab("boss")} icon={Skull} label="Boss" />
      </div>

      {tab === "daily" && <QuestList />}
      {tab === "weekly" && <LockedPanel title="Haftalık Görevler" desc="Haftalık görev modülü sonraki güncellemede aktif olacak." />}
      {tab === "boss" && <LockedPanel title="Boss Görevleri" desc="Boss modülü henüz açık değil. Rank D'ye ulaşınca aktif olur." />}
    </AppShell>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-[11px] font-display tracking-widest uppercase transition-all active:scale-95 ${
        active
          ? "bg-primary/15 text-primary border border-primary/50 shadow-[0_0_16px_oklch(0.75_0.18_220/25%)]"
          : "text-muted-foreground border border-transparent"
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

function LockedPanel({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="panel p-8 text-center">
      <div className="w-14 h-14 mx-auto grid place-items-center rounded-md panel-glow mb-4">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase mb-1">SYSTEM // KİLİTLİ</div>
      <h2 className="font-display text-xl mb-2">{title}</h2>
      <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto">{desc}</p>
    </div>
  );
}
