import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { usePlayer } from "@/lib/player-store";
import { ACHIEVEMENTS } from "@/lib/achievements";
import {
  Settings, Trophy, Flame, Target, Zap, Calendar, ShieldCheck, User, Pencil,
} from "lucide-react";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Player Profili — SYSTEM" },
      { name: "description", content: "Player kaydı, rank, başarılar ve istatistik özeti." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { state, hydrated, xpNeeded, rank, discipline, totalFocusMin, profileCompletion } = usePlayer();
  if (!hydrated) return <AppShell><div className="panel p-6 h-64 animate-pulse" /></AppShell>;

  const pct = Math.min(100, (state.xp / xpNeeded) * 100);
  const totalAttempts = state.completedCount + state.failedCount;
  const successRate = totalAttempts > 0 ? Math.round((state.completedCount / totalAttempts) * 100) : 0;

  const achievements = ACHIEVEMENTS.map((a) => ({
    id: a.id, label: a.label, desc: a.desc, unlocked: !!state.achievements[a.id],
  }));
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const memberSince = new Date(state.createdAt).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const displayName = state.profile.realName || state.name;
  const avatar = state.profile.avatarDataUrl;

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">SYSTEM // PROFIL</div>
          <h1 className="font-display text-3xl md:text-4xl mt-1 truncate">{displayName}</h1>
          <div className="text-xs text-muted-foreground font-display tracking-widest uppercase mt-1">
            {rank}-Rank · {state.title}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to="/profil-duzenle"
            className="w-11 h-11 grid place-items-center rounded-md panel hover:border-primary/60 transition-all"
            aria-label="Profili Düzenle"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link
            to="/ayarlar"
            className="w-11 h-11 grid place-items-center rounded-md panel hover:border-primary/60 transition-all"
            aria-label="Ayarlar"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Avatar / identity card */}
      <div className="panel-glow corner-frame p-6 relative overflow-hidden mb-4">
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-primary/10 blur-3xl animate-rune-spin" />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden grid place-items-center panel-glow bg-input/40">
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary/60" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[10px] tracking-widest text-muted-foreground uppercase">Seviye · {rank}-Rank</div>
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

      {/* Profile completion */}
      <Link
        to="/profil-duzenle"
        className="panel p-4 mb-6 block hover:border-primary/60 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-display text-[10px] tracking-widest uppercase text-muted-foreground">Profil Tamamlanma</div>
          <div className="font-display text-sm text-primary">%{profileCompletion}</div>
        </div>
        <div className="h-1.5 bg-input rounded-full overflow-hidden">
          <div className="xp-bar-fill h-full" style={{ width: `${profileCompletion}%` }} />
        </div>
        {profileCompletion < 100 && (
          <div className="text-[11px] text-muted-foreground mt-2">
            Eksik alanları doldur — SYSTEM daha isabetli görev üretir.
          </div>
        )}
      </Link>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MiniStat icon={Flame} label="Seri" value={`${state.streak} gün`} />
        <MiniStat icon={Target} label="Tamamlanan" value={state.completedCount} />
        <MiniStat icon={ShieldCheck} label="Disiplin" value={discipline.toLocaleString("tr-TR")} />
        <MiniStat icon={Zap} label="Toplam XP" value={state.totalXp.toLocaleString("tr-TR")} />
        <MiniStat icon={Trophy} label="Odak" value={`${totalFocusMin} dk`} />
        <MiniStat icon={Calendar} label="Kayıt" value={memberSince} />
        <MiniStat icon={Target} label="Başarı" value={`%${successRate}`} />
        <MiniStat icon={Trophy} label="Başarım" value={`${unlockedCount}/${achievements.length}`} />
      </div>

      {/* Personal info summary */}
      {(state.profile.age || state.profile.occupation || state.profile.priorityGoals.length > 0) && (
        <div className="panel p-5 mb-6">
          <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-3">Player Verisi</div>
          <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            {state.profile.age && <Row label="Yaş" value={String(state.profile.age)} />}
            {state.profile.heightCm && <Row label="Boy" value={`${state.profile.heightCm} cm`} />}
            {state.profile.weightKg && <Row label="Kilo" value={`${state.profile.weightKg} kg`} />}
            {state.profile.occupation && <Row label="Durum" value={state.profile.occupation} />}
            {state.profile.dailyMinutes && <Row label="Günlük" value={`${state.profile.dailyMinutes} dk`} />}
            {state.profile.sleep && <Row label="Uyku" value={`${state.profile.sleep.start} – ${state.profile.sleep.end}`} />}
          </dl>
          {state.profile.priorityGoals.length > 0 && (
            <TagRow label="Hedefler" values={state.profile.priorityGoals} />
          )}
          {state.profile.interests.length > 0 && (
            <TagRow label="İlgi" values={state.profile.interests} />
          )}
          {state.profile.equipment.length > 0 && (
            <TagRow label="Ekipman" values={state.profile.equipment} />
          )}
        </div>
      )}

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[10px] font-display tracking-widest uppercase text-muted-foreground self-center">{label}</dt>
      <dd className="text-sm font-mono truncate">{value}</dd>
    </>
  );
}

function TagRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-3">
      <div className="text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30">{v}</span>
        ))}
      </div>
    </div>
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
