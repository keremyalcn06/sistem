import { usePlayer, type Quest } from "@/lib/player-store";
import { Check, X, Plus, Dumbbell, BookOpen, Sparkles, Star } from "lucide-react";
import { useState } from "react";

const catMeta: Record<Quest["category"], { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  body: { icon: Dumbbell, label: "Beden", color: "text-danger" },
  mind: { icon: BookOpen, label: "Zihin", color: "text-primary" },
  soul: { icon: Sparkles, label: "Ruh", color: "text-accent" },
  custom: { icon: Star, label: "Özel", color: "text-xp" },
};

export function QuestList({ compact = false }: { compact?: boolean }) {
  const { state, hydrated, toggleQuest, addCustomQuest, removeQuest } = usePlayer();
  const [title, setTitle] = useState("");
  const [xp, setXp] = useState(20);
  const [adding, setAdding] = useState(false);

  if (!hydrated) return <div className="panel p-6 h-64 animate-pulse" />;

  const shown = compact ? state.quests.slice(0, 4) : state.quests;

  return (
    <div className="panel p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">Sistem Bildirimi</div>
          <h2 className="font-display text-xl md:text-2xl">Günlük Görevler</h2>
        </div>
        {!compact && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="btn-arcane px-3 py-2 text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ekle
          </button>
        )}
      </div>

      {adding && (
        <div className="panel p-3 mb-4 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 animate-fade-in">
          <input
            className="bg-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            placeholder="Görev adı..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="number"
            min={5}
            max={200}
            className="bg-input rounded-md px-3 py-2 text-sm w-20 outline-none focus:ring-2 focus:ring-primary/60"
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
          />
          <button
            className="btn-arcane px-4 py-2 text-xs"
            onClick={() => {
              if (!title.trim()) return;
              addCustomQuest(title.trim(), xp);
              setTitle("");
              setXp(20);
              setAdding(false);
            }}
          >Onayla</button>
        </div>
      )}

      <ul className="space-y-2">
        {shown.map((q) => {
          const meta = catMeta[q.category];
          const Icon = meta.icon;
          return (
            <li
              key={q.id}
              className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3 rounded-md border transition-all ${
                q.done
                  ? "bg-success/5 border-success/40 opacity-70"
                  : "bg-background/40 border-border hover:border-primary/60 hover:bg-primary/5"
              }`}
            >
              <button
                onClick={() => toggleQuest(q.id)}
                className={`w-8 h-8 shrink-0 rounded-md grid place-items-center border transition-all ${
                  q.done
                    ? "bg-success/20 border-success text-success"
                    : "border-border hover:border-primary hover:bg-primary/10 text-muted-foreground"
                }`}
                aria-label="Görevi tamamla"
              >
                {q.done && <Check className="w-4 h-4" />}
              </button>
              <div className="min-w-0">
                <div className={`font-display text-sm md:text-base truncate ${q.done ? "line-through" : ""}`}>
                  {q.title}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-display tracking-widest uppercase mt-0.5">
                  <span className={`flex items-center gap-1 ${meta.color}`}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </span>
                  <span className="text-xp">+{q.xp} XP</span>
                </div>
              </div>
              {q.category === "custom" && !compact && (
                <button
                  onClick={() => removeQuest(q.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger"
                  aria-label="Görevi sil"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
