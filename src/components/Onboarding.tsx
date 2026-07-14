/**
 * Onboarding wizard — first-run Player Analysis flow.
 *
 * Shown only once (when `state.initialized` is false). Collects the real
 * name and the core profile fields SYSTEM CORE needs to reason about the
 * user (time availability, goals, equipment, deadlines…).
 *
 * All fields except `realName` are optional. The user can skip any step
 * and complete the remaining fields later from `/profil-duzenle`.
 *
 * Design note: layout / colors reuse existing panel primitives — no new
 * theme tokens introduced.
 */
import { useMemo, useRef, useState } from "react";
import { usePlayer } from "@/lib/player-store";
import { sfx } from "@/lib/sfx";
import type { PlayerProfile, TimeBlock, Gender, Occupation, ImportantDate } from "@/lib/profile";
import { profileCompletion } from "@/lib/profile";
import { Camera, X, ChevronRight, ChevronLeft, Check, Plus, Trash2 } from "lucide-react";

type Draft = PlayerProfile;

const STEPS = [
  { id: "identity", label: "Kimlik" },
  { id: "body",     label: "Fiziksel" },
  { id: "life",     label: "Yaşam" },
  { id: "time",     label: "Zaman" },
  { id: "goals",    label: "Hedefler" },
  { id: "confirm",  label: "Onay" },
] as const;

export function Onboarding({ onDone }: { onDone: (p: Draft) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => ({
    realName: "",
    avatarDataUrl: "",
    age: null,
    heightCm: null,
    weightKg: null,
    gender: "unspecified",
    occupation: null,
    occupationDetail: "",
    busyBlocks: [],
    freeBlocks: [],
    sleep: { label: "Uyku", start: "23:00", end: "07:00" },
    dailyMinutes: 60,
    importantDates: [],
    priorityGoals: [],
    interests: [],
    equipment: [],
    growthAreas: [],
    onboardedAt: null,
    updatedAt: null,
  }));

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const pct = useMemo(() => profileCompletion(draft), [draft]);
  const canAdvance = step === 0 ? draft.realName.trim().length > 1 : true;

  const next = () => {
    if (!canAdvance) return;
    sfx.confirm();
    if (step < STEPS.length - 1) setStep(step + 1);
    else onDone(draft);
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-lg px-4 py-6 md:py-10">
        <div className="mb-4">
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">SYSTEM // ANALİZ</div>
          <h1 className="font-display text-2xl md:text-3xl mt-1">Player Analiz Protokolü</h1>
          <p className="text-xs text-muted-foreground mt-1">
            SYSTEM sizi tanımadan görev üretmez. Bu ekran yalnızca bir kez açılır.
          </p>
        </div>

        {/* Stepper */}
        <div className="panel p-3 mb-4">
          <div className="flex items-center justify-between mb-2 text-[10px] font-display tracking-widest uppercase text-muted-foreground">
            <span>Adım {step + 1} / {STEPS.length} — {STEPS[step].label}</span>
            <span className="text-primary">%{pct}</span>
          </div>
          <div className="h-1.5 bg-input rounded-full overflow-hidden">
            <div
              className="xp-bar-fill h-full transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="panel-glow corner-frame p-5 md:p-6">
          {step === 0 && <StepIdentity draft={draft} patch={patch} />}
          {step === 1 && <StepBody draft={draft} patch={patch} />}
          {step === 2 && <StepLife draft={draft} patch={patch} />}
          {step === 3 && <StepTime draft={draft} patch={patch} />}
          {step === 4 && <StepGoals draft={draft} patch={patch} />}
          {step === 5 && <StepConfirm draft={draft} />}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="px-4 py-3 border border-border rounded-md font-display text-xs tracking-widest uppercase hover:bg-muted/40 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Geri
          </button>
          <button
            onClick={next}
            disabled={!canAdvance}
            className="btn-arcane px-4 py-3 text-xs disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {step === STEPS.length - 1 ? "Kaydı Başlat" : "Devam"}
            {step === STEPS.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-center text-[10px] font-display tracking-widest text-muted-foreground uppercase mt-4">
          İsim dışındaki alanları sonra da doldurabilirsiniz
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function StepIdentity({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => patch({ avatarDataUrl: String(r.result) });
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-4">
      <Header title="Kimlik" desc="SYSTEM sizi bu bilgilerle kaydedecek." />
      <div className="flex items-center gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 rounded-lg border-2 border-dashed border-border grid place-items-center bg-input/40 overflow-hidden"
          type="button"
        >
          {draft.avatarDataUrl ? (
            <img src={draft.avatarDataUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-muted-foreground" />
          )}
        </button>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            type="button"
            className="text-[11px] font-display tracking-widest uppercase px-3 py-2 rounded-md border border-border hover:border-primary/60"
          >
            Fotoğraf Ekle
          </button>
          {draft.avatarDataUrl && (
            <button
              onClick={() => patch({ avatarDataUrl: "" })}
              type="button"
              className="text-[11px] font-display tracking-widest uppercase px-3 py-2 rounded-md text-danger hover:bg-danger/10 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Kaldır
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>
      <Field label="Gerçek Ad *" hint="SYSTEM size bu isimle hitap edecek.">
        <input
          className="input"
          value={draft.realName}
          maxLength={32}
          placeholder="Adınız"
          onChange={(e) => patch({ realName: e.target.value })}
          autoFocus
        />
      </Field>
    </div>
  );
}

function StepBody({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <div className="space-y-4">
      <Header title="Fiziksel Veri" desc="Spor ve beslenme sistemlerinde kullanılacaktır." />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Yaş">
          <input type="number" className="input" min={1} max={120} value={draft.age ?? ""} onChange={(e) => patch({ age: e.target.value ? +e.target.value : null })} />
        </Field>
        <Field label="Boy (cm)">
          <input type="number" className="input" min={50} max={260} value={draft.heightCm ?? ""} onChange={(e) => patch({ heightCm: e.target.value ? +e.target.value : null })} />
        </Field>
        <Field label="Kilo (kg)">
          <input type="number" className="input" min={20} max={400} value={draft.weightKg ?? ""} onChange={(e) => patch({ weightKg: e.target.value ? +e.target.value : null })} />
        </Field>
      </div>
      <Field label="Cinsiyet (isteğe bağlı)">
        <div className="grid grid-cols-4 gap-2">
          {(["male", "female", "other", "unspecified"] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => patch({ gender: g })}
              className={`py-2 rounded-md border text-[10px] font-display tracking-widest uppercase ${draft.gender === g ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
            >
              {g === "male" ? "Erkek" : g === "female" ? "Kadın" : g === "other" ? "Diğer" : "Belirtme"}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepLife({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  const opts: { value: Occupation; label: string }[] = [
    { value: "student", label: "Öğrenci" },
    { value: "employed", label: "Çalışan" },
    { value: "self-employed", label: "Serbest" },
    { value: "unemployed", label: "İşsiz" },
    { value: "other", label: "Diğer" },
  ];
  return (
    <div className="space-y-4">
      <Header title="Yaşam" desc="Meslek durumu görev yoğunluğunu belirler." />
      <Field label="Durum">
        <div className="grid grid-cols-2 gap-2">
          {opts.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => patch({ occupation: o.value })}
              className={`py-2.5 rounded-md border text-xs font-display tracking-widest uppercase ${draft.occupation === o.value ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Detay (opsiyonel)" hint="Örn: Yazılım Mühendisi, 3. Sınıf">
        <input className="input" value={draft.occupationDetail} onChange={(e) => patch({ occupationDetail: e.target.value })} />
      </Field>
    </div>
  );
}

function StepTime({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <div className="space-y-4">
      <Header title="Zaman" desc="SYSTEM görevleri müsait saatlerinize dağıtır." />

      <TimeBlockEditor
        label="Meşgul Saatler"
        hint="İş / okul / rutin blokları"
        blocks={draft.busyBlocks}
        onChange={(busyBlocks) => patch({ busyBlocks })}
      />
      <TimeBlockEditor
        label="Boş Saatler"
        hint="Sistemin görev verebileceği aralıklar"
        blocks={draft.freeBlocks}
        onChange={(freeBlocks) => patch({ freeBlocks })}
      />

      <Field label="Uyku">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="time"
            className="input"
            value={draft.sleep?.start ?? "23:00"}
            onChange={(e) => patch({ sleep: { label: "Uyku", start: e.target.value, end: draft.sleep?.end ?? "07:00" } })}
          />
          <input
            type="time"
            className="input"
            value={draft.sleep?.end ?? "07:00"}
            onChange={(e) => patch({ sleep: { label: "Uyku", start: draft.sleep?.start ?? "23:00", end: e.target.value } })}
          />
        </div>
      </Field>

      <Field label="Günlük Ayırabileceğim Süre (dakika)">
        <input
          type="number"
          min={10}
          max={720}
          step={10}
          className="input"
          value={draft.dailyMinutes ?? ""}
          onChange={(e) => patch({ dailyMinutes: e.target.value ? +e.target.value : null })}
        />
      </Field>
    </div>
  );
}

function StepGoals({ draft, patch }: { draft: Draft; patch: (p: Partial<Draft>) => void }) {
  return (
    <div className="space-y-4">
      <Header title="Hedefler" desc="Sistem bunlara göre öncelik verir." />
      <TagEditor label="Öncelikli Hedefler" placeholder="ör. Sınavı geçmek" values={draft.priorityGoals} onChange={(priorityGoals) => patch({ priorityGoals })} />
      <ImportantDateEditor values={draft.importantDates} onChange={(importantDates) => patch({ importantDates })} />
      <TagEditor label="İlgi Alanları" placeholder="ör. Yazılım, Piyano" values={draft.interests} onChange={(interests) => patch({ interests })} />
      <TagEditor label="Spor Ekipmanları" placeholder="ör. Kettlebell" values={draft.equipment} onChange={(equipment) => patch({ equipment })} />
      <TagEditor label="Gelişmek İstediğim Alanlar" placeholder="ör. Odaklanma" values={draft.growthAreas} onChange={(growthAreas) => patch({ growthAreas })} />
    </div>
  );
}

function StepConfirm({ draft }: { draft: Draft }) {
  const pct = profileCompletion(draft);
  return (
    <div className="space-y-4 font-mono text-sm">
      <Header title="Onay" desc="Bilgiler cihazınızda saklanır. Sistem yalnızca bunları kullanır." />
      <div className="space-y-1 text-foreground/80">
        <div>&gt; PLAYER: <span className="text-primary">{draft.realName || "—"}</span></div>
        <div>&gt; YAŞ / BOY / KİLO: {draft.age ?? "—"} / {draft.heightCm ?? "—"} / {draft.weightKg ?? "—"}</div>
        <div>&gt; DURUM: {draft.occupation ?? "—"}</div>
        <div>&gt; GÜNLÜK KAPASİTE: {draft.dailyMinutes ?? "—"} dk</div>
        <div>&gt; HEDEF: {draft.priorityGoals.length} · TARIH: {draft.importantDates.length}</div>
        <div>&gt; PROFİL TAMAMLANMA: <span className="text-primary">%{pct}</span></div>
        <div className="text-primary mt-3">&gt; ANALİZ HAZIR. SYSTEM DEVREDE.</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function Header({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-2">
      <div className="font-display text-lg">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] font-display tracking-widest uppercase text-muted-foreground mb-1">
        {label}
      </div>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}

export function TimeBlockEditor({
  label, hint, blocks, onChange,
}: {
  label: string; hint?: string; blocks: TimeBlock[]; onChange: (b: TimeBlock[]) => void;
}) {
  const add = () => onChange([...blocks, { label: "Blok", start: "09:00", end: "17:00" }]);
  const update = (i: number, patch: Partial<TimeBlock>) =>
    onChange(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const remove = (i: number) => onChange(blocks.filter((_, idx) => idx !== i));
  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {blocks.map((b, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input className="input flex-1" value={b.label} onChange={(e) => update(i, { label: e.target.value })} />
            <input type="time" className="input w-24" value={b.start} onChange={(e) => update(i, { start: e.target.value })} />
            <input type="time" className="input w-24" value={b.end} onChange={(e) => update(i, { end: e.target.value })} />
            <button type="button" onClick={() => remove(i)} className="p-2 text-danger hover:bg-danger/10 rounded-md">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={add} className="w-full py-2 border border-dashed border-border rounded-md text-[11px] font-display tracking-widest uppercase text-muted-foreground hover:border-primary/60 hover:text-primary flex items-center justify-center gap-1">
          <Plus className="w-3 h-3" /> Ekle
        </button>
      </div>
    </Field>
  );
}

export function TagEditor({
  label, placeholder, values, onChange,
}: {
  label: string; placeholder: string; values: string[]; onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setInput("");
  };
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
          }}
        />
        <button type="button" onClick={add} className="px-3 py-2 rounded-md border border-border hover:border-primary/60">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/40 text-[11px] font-mono">
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-muted-foreground hover:text-danger">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}

export function ImportantDateEditor({
  values, onChange,
}: {
  values: ImportantDate[]; onChange: (v: ImportantDate[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const add = () => {
    if (!label.trim() || !date) return;
    onChange([...values, { id: `d-${Date.now()}`, label: label.trim(), date }]);
    setLabel(""); setDate("");
  };
  return (
    <Field label="Yaklaşan Önemli Tarihler" hint="Sınav, yarışma, teslim…">
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Etiket" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input className="input w-40" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="button" onClick={add} className="px-3 py-2 rounded-md border border-border hover:border-primary/60">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 space-y-1">
          {values.map((v) => (
            <div key={v.id} className="flex items-center justify-between text-xs font-mono panel p-2">
              <span className="truncate">{v.label} — <span className="text-muted-foreground">{v.date}</span></span>
              <button type="button" onClick={() => onChange(values.filter((x) => x.id !== v.id))} className="text-danger hover:bg-danger/10 rounded-md p-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Field>
  );
}
