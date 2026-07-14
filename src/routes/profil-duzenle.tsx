import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { usePlayer } from "@/lib/player-store";
import { useState } from "react";
import type { PlayerProfile } from "@/lib/profile";
import { profileCompletion } from "@/lib/profile";
import { Camera, X, Save, ArrowLeft } from "lucide-react";
import { TimeBlockEditor, TagEditor, ImportantDateEditor } from "@/components/Onboarding";
import { sfx } from "@/lib/sfx";

export const Route = createFileRoute("/profil-duzenle")({
  head: () => ({
    meta: [
      { title: "Profili Düzenle — SYSTEM" },
      { name: "description", content: "Player analiz verilerini güncelle." },
    ],
  }),
  component: EditProfile,
});

function EditProfile() {
  const { state, hydrated, updateProfile } = usePlayer();
  const nav = useNavigate();
  const [draft, setDraft] = useState<PlayerProfile>(() => ({ ...state.profile }));

  if (!hydrated) return <AppShell><div className="panel p-6 h-64 animate-pulse" /></AppShell>;

  const patch = (p: Partial<PlayerProfile>) => setDraft((d) => ({ ...d, ...p }));
  const pct = profileCompletion(draft);

  const onFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => patch({ avatarDataUrl: String(r.result) });
    r.readAsDataURL(f);
  };

  const save = () => {
    updateProfile(draft);
    sfx.confirm();
    nav({ to: "/profil" });
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">SYSTEM // DÜZENLE</div>
          <h1 className="font-display text-3xl md:text-4xl mt-1">Profil</h1>
          <div className="text-xs text-muted-foreground mt-1">Tamamlanma: <span className="text-primary">%{pct}</span></div>
        </div>
        <button
          onClick={() => nav({ to: "/profil" })}
          className="w-11 h-11 grid place-items-center rounded-md panel hover:border-primary/60"
          aria-label="Geri"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="panel p-5 mb-4">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-3">Kimlik</div>
        <div className="flex items-center gap-4 mb-4">
          <label className="relative w-20 h-20 rounded-lg border-2 border-dashed border-border grid place-items-center bg-input/40 overflow-hidden cursor-pointer">
            {draft.avatarDataUrl
              ? <img src={draft.avatarDataUrl} alt="" className="w-full h-full object-cover" />
              : <Camera className="w-6 h-6 text-muted-foreground" />}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          {draft.avatarDataUrl && (
            <button onClick={() => patch({ avatarDataUrl: "" })} type="button" className="text-[11px] font-display tracking-widest uppercase px-3 py-2 rounded-md text-danger hover:bg-danger/10 flex items-center gap-1">
              <X className="w-3 h-3" /> Kaldır
            </button>
          )}
        </div>
        <Label text="Gerçek Ad">
          <input className="input" value={draft.realName} onChange={(e) => patch({ realName: e.target.value })} maxLength={32} />
        </Label>
      </div>

      <div className="panel p-5 mb-4">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-3">Fiziksel</div>
        <div className="grid grid-cols-3 gap-2">
          <Label text="Yaş">
            <input type="number" className="input" value={draft.age ?? ""} onChange={(e) => patch({ age: e.target.value ? +e.target.value : null })} />
          </Label>
          <Label text="Boy (cm)">
            <input type="number" className="input" value={draft.heightCm ?? ""} onChange={(e) => patch({ heightCm: e.target.value ? +e.target.value : null })} />
          </Label>
          <Label text="Kilo (kg)">
            <input type="number" className="input" value={draft.weightKg ?? ""} onChange={(e) => patch({ weightKg: e.target.value ? +e.target.value : null })} />
          </Label>
        </div>
        <div className="mt-3">
          <Label text="Cinsiyet">
            <div className="grid grid-cols-4 gap-2">
              {(["male","female","other","unspecified"] as const).map((g) => (
                <button key={g} type="button" onClick={() => patch({ gender: g })} className={`py-2 rounded-md border text-[10px] font-display tracking-widest uppercase ${draft.gender === g ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
                  {g === "male" ? "Erkek" : g === "female" ? "Kadın" : g === "other" ? "Diğer" : "Belirtme"}
                </button>
              ))}
            </div>
          </Label>
        </div>
      </div>

      <div className="panel p-5 mb-4">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-3">Yaşam</div>
        <Label text="Meslek / Durum">
          <input className="input" value={draft.occupationDetail} placeholder="Örn: Öğrenci - 3. sınıf" onChange={(e) => patch({ occupationDetail: e.target.value })} />
        </Label>
      </div>

      <div className="panel p-5 mb-4">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-3">Zaman</div>
        <TimeBlockEditor label="Meşgul Saatler" blocks={draft.busyBlocks} onChange={(busyBlocks) => patch({ busyBlocks })} />
        <div className="h-3" />
        <TimeBlockEditor label="Boş Saatler" blocks={draft.freeBlocks} onChange={(freeBlocks) => patch({ freeBlocks })} />
        <div className="h-3" />
        <Label text="Uyku">
          <div className="grid grid-cols-2 gap-2">
            <input type="time" className="input" value={draft.sleep?.start ?? "23:00"} onChange={(e) => patch({ sleep: { label: "Uyku", start: e.target.value, end: draft.sleep?.end ?? "07:00" } })} />
            <input type="time" className="input" value={draft.sleep?.end ?? "07:00"} onChange={(e) => patch({ sleep: { label: "Uyku", start: draft.sleep?.start ?? "23:00", end: e.target.value } })} />
          </div>
        </Label>
        <div className="h-3" />
        <Label text="Günlük Süre (dk)">
          <input type="number" className="input" value={draft.dailyMinutes ?? ""} onChange={(e) => patch({ dailyMinutes: e.target.value ? +e.target.value : null })} />
        </Label>
      </div>

      <div className="panel p-5 mb-4 space-y-3">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase">Hedefler & İlgi</div>
        <TagEditor label="Öncelikli Hedefler" placeholder="ör. Sınav" values={draft.priorityGoals} onChange={(priorityGoals) => patch({ priorityGoals })} />
        <ImportantDateEditor values={draft.importantDates} onChange={(importantDates) => patch({ importantDates })} />
        <TagEditor label="İlgi Alanları" placeholder="ör. Piyano" values={draft.interests} onChange={(interests) => patch({ interests })} />
        <TagEditor label="Ekipman" placeholder="ör. Kettlebell" values={draft.equipment} onChange={(equipment) => patch({ equipment })} />
        <TagEditor label="Gelişmek İstediğim Alanlar" placeholder="ör. Odaklanma" values={draft.growthAreas} onChange={(growthAreas) => patch({ growthAreas })} />
      </div>

      <div className="sticky bottom-4">
        <button onClick={save} className="btn-arcane w-full py-3 flex items-center justify-center gap-2 text-xs">
          <Save className="w-4 h-4" /> Kaydet
        </button>
      </div>
    </AppShell>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">{text}</div>
      {children}
    </label>
  );
}
