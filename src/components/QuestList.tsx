import { usePlayer, type Quest } from "@/lib/player-store";
import {
  DIFFICULTY_ORDER,
  PRIORITY_ORDER,
  DIFFICULTY_LABEL,
  PRIORITY_LABEL,
  computeQuestXp,
  type Category,
  type Difficulty,
  type Priority,
} from "@/lib/economy";
import { Check, X, Plus, Dumbbell, BookOpen, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";

const catMeta: Record<Quest["category"], { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  body: { icon: Dumbbell, label: "Beden", color: "text-danger" },
  mind: { icon: BookOpen, label: "Zihin", color: "text-primary" },
  soul: { icon: Sparkles, label: "Ruh", color: "text-accent" },
  custom: { icon: Star, label: "Özel", color: "text-xp" },
};

const CATEGORIES: Category[] = ["body", "mind", "soul", "custom"];

export function QuestList({ compact = false }: { compact?: boolean }) {
  const { state, hydrated, toggleQuest, addCustomQuest, removeQuest } = usePlayer();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("custom");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [priority, setPriority] = useState<Priority>("normal");
  const [durationMin, setDurationMin] = useState(15);
  const [adding, setAdding] = useState(false);

  const previewXp = useMemo(
    () => computeQuestXp({ category, difficulty, priority, durationMin }),
    [category, difficulty, priority, durationMin],
  );

  if (!hydrated) return <div className="panel p-6 h-64 animate-pulse" />;

  const shown = compact ? state.quests.slice(0, 4) : state.quests;

  const submit = () => {
    if (!title.trim()) return;
    addCustomQuest({ title: title.trim(), category, difficulty, priority, durationMin });
    setTitle("");
    setCategory("custom");
    setDifficulty("normal");
    setPriority("normal");
    setDurationMin(15);
    setAdding(false);
  };

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
        <div className="panel p-3 mb-4 space-y-3 animate-fade-in">
          <input
            className="bg-input rounded-md px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-primary/60"
            placeholder="Görev adı..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <div className="text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-1">Kategori</div>
            <div className="grid grid-cols-4 gap-1">
              {CATEGORIES.map((c) => {
                const meta = catMeta[c];
                const Icon = meta.icon;
                const on = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`flex items-center justify-center gap-1 py-2 rounded-md border text-[10px] font-display tracking-widest uppercase transition-all ${
                      on ? "bg-primary/15 border-primary/60 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-3 h-3" /> {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-1">Zorluk</div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="bg-input rounded-md px-2 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-primary/60"
              >
                {DIFFICULTY_ORDER.map((d) => (
                  <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-1">Öncelik</div>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="bg-input rounded-md px-2 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-primary/60"
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-display tracking-widest text-muted-foreground uppercase">Süre (dk)</div>
              <div className="text-[10px] font-display tracking-widest text-xp">≈ +{previewXp} XP</div>
            </div>
            <input
              type="number"
              min={1}
              max={240}
              value={durationMin}
              onChange={(e) => setDurationMin(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
              className="bg-input rounded-md px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>

          <div className="flex justify-end">
            <button className="btn-arcane px-4 py-2 text-xs" onClick={submit}>Onayla</button>
          </div>
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
                <div className="flex items-center gap-2 text-[10px] font-display tracking-widest uppercase mt-0.5 flex-wrap">
                  <span className={`flex items-center gap-1 ${meta.color}`}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </span>
                  <span className="text-muted-foreground">{DIFFICULTY_LABEL[q.difficulty]}</span>
                  <span className="text-muted-foreground">{q.durationMin}dk</span>
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
