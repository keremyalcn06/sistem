import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { QuestList } from "@/components/QuestList";

export const Route = createFileRoute("/gorevler")({
  head: () => ({ meta: [{ title: "Görevler — Shadow Monarch" }, { name: "description", content: "Bugünkü görevlerini tamamla ve XP kazan." }] }),
  component: () => (
    <AppShell>
      <div className="mb-6">
        <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">Zorunlu Görevler</div>
        <h1 className="font-display text-3xl md:text-4xl mt-1">Günün Görevleri</h1>
        <p className="text-sm text-muted-foreground mt-1">Tamamlamazsan ceza uygulanır. Sistem izliyor.</p>
      </div>
      <QuestList />
    </AppShell>
  ),
});
