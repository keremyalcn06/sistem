import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { usePlayer } from "@/lib/player-store";
import { isMuted, setMuted, sfx } from "@/lib/sfx";
import { useEffect, useRef, useState } from "react";
import { Bell, Volume2, VolumeX, Trash2, Download, Upload, Vibrate } from "lucide-react";

export const Route = createFileRoute("/ayarlar")({
  head: () => ({
    meta: [
      { title: "Ayarlar — SYSTEM" },
      { name: "description", content: "Ses, bildirim ve veri yönetimi ayarları." },
    ],
  }),
  component: Settings,
});

const HAPTIC_KEY = "system-haptic";
const NOTIF_KEY = "system-notif";

function Settings() {
  const { state, hydrated, setName, reset } = usePlayer();
  const [muted, setMutedState] = useState(false);
  const [haptic, setHaptic] = useState(true);
  const [notif, setNotif] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMutedState(isMuted());
    try { setHaptic(localStorage.getItem(HAPTIC_KEY) !== "0"); } catch { /* noop */ }
    if (typeof Notification === "undefined") setNotif("unsupported");
    else setNotif(Notification.permission as typeof notif);
  }, []);

  if (!hydrated) return <AppShell><div className="panel p-6 h-64 animate-pulse" /></AppShell>;

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.confirm();
  };

  const toggleHaptic = () => {
    const next = !haptic;
    setHaptic(next);
    try { localStorage.setItem(HAPTIC_KEY, next ? "1" : "0"); } catch { /* noop */ }
    if (next && "vibrate" in navigator) navigator.vibrate?.(20);
  };

  const requestNotif = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotif(perm as typeof notif);
    try { localStorage.setItem(NOTIF_KEY, perm); } catch { /* noop */ }
    if (perm === "granted") {
      new Notification("SYSTEM", { body: "Bildirim protokolü aktif." });
    }
  };

  const exportData = () => {
    try {
      const raw = localStorage.getItem("shadow-monarch-v1") ?? "{}";
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `system-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* noop */ }
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        JSON.parse(text);
        localStorage.setItem("shadow-monarch-v1", text);
        location.reload();
      } catch {
        alert("Geçersiz veri dosyası.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase">SYSTEM // KONFİG</div>
        <h1 className="font-display text-3xl md:text-4xl mt-1">Ayarlar</h1>
      </div>

      {/* Player */}
      <div className="panel p-5 mb-4">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-2">Player</div>
        <label className="block text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-2">
          Kod Adı
        </label>
        <input
          className="bg-input rounded-md px-3 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-primary/60 font-mono"
          value={state.name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Toggles */}
      <div className="panel p-2 mb-4 divide-y divide-border/60">
        <Toggle
          icon={muted ? VolumeX : Volume2}
          label="Ses Efektleri"
          desc="SYSTEM ses geri bildirimi"
          on={!muted}
          onChange={toggleMute}
        />
        <Toggle
          icon={Vibrate}
          label="Titreşim"
          desc="Dokunmatik geri bildirim"
          on={haptic}
          onChange={toggleHaptic}
        />
        <div className="flex items-center gap-3 p-3">
          <div className="w-9 h-9 grid place-items-center rounded-md bg-background/60 border border-border text-primary shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm tracking-widest uppercase">Bildirimler</div>
            <div className="text-[11px] text-muted-foreground">
              {notif === "granted" ? "Aktif" :
                notif === "denied" ? "Reddedildi — tarayıcı ayarlarından aç" :
                notif === "unsupported" ? "Bu cihazda desteklenmiyor" : "İzin verilmedi"}
            </div>
          </div>
          <button
            onClick={requestNotif}
            disabled={notif === "granted" || notif === "denied" || notif === "unsupported"}
            className="btn-arcane px-3 py-2 text-[10px] disabled:opacity-40"
          >
            {notif === "granted" ? "AKTİF" : "İZİN VER"}
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="panel p-5 mb-4">
        <div className="font-display text-[10px] tracking-widest text-primary uppercase mb-3">Veri Yönetimi</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportData} className="flex items-center justify-center gap-2 py-3 rounded-md border border-border hover:border-primary/60 transition-all text-xs font-display tracking-widest uppercase">
            <Download className="w-4 h-4" /> Dışa Aktar
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 py-3 rounded-md border border-border hover:border-primary/60 transition-all text-xs font-display tracking-widest uppercase">
            <Upload className="w-4 h-4" /> İçe Aktar
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
        />
      </div>

      {/* Danger */}
      <div className="panel p-5">
        <div className="font-display text-[10px] tracking-widest text-danger uppercase mb-3">Tehlikeli Bölge</div>
        <button
          onClick={() => {
            if (confirm("Tüm SYSTEM kayıtları silinecek. Onaylıyor musunuz?")) reset();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-md border border-danger/40 text-danger hover:bg-danger/10 transition-all text-xs font-display tracking-widest uppercase"
        >
          <Trash2 className="w-4 h-4" /> İlerlemeyi Sıfırla
        </button>
      </div>

      <div className="mt-8 text-center text-[10px] font-display tracking-widest text-muted-foreground uppercase">
        SYSTEM v1.0 · Offline Ready
      </div>
    </AppShell>
  );
}

function Toggle({
  icon: Icon, label, desc, on, onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; desc: string; on: boolean; onChange: () => void;
}) {
  return (
    <button onClick={onChange} className="w-full flex items-center gap-3 p-3 text-left">
      <div className="w-9 h-9 grid place-items-center rounded-md bg-background/60 border border-border text-primary shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm tracking-widest uppercase">{label}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <div className={`shrink-0 w-11 h-6 rounded-full border transition-all relative ${on ? "bg-primary/30 border-primary" : "bg-input border-border"}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${on ? "left-5 bg-primary shadow-[0_0_10px_oklch(0.75_0.18_220/70%)]" : "left-0.5 bg-muted-foreground"}`} />
      </div>
    </button>
  );
}
