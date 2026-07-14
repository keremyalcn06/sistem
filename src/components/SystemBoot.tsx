import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/lib/player-store";
import { sfx, unlockAudio } from "@/lib/sfx";
import { Onboarding } from "./Onboarding";
import type { PlayerProfile } from "@/lib/profile";

type Phase = "booting" | "linking" | "prompt" | "rejected" | "onboarding" | "accepting" | "done";

const BOOT_LINES = [
  "> SYSTEM INITIALIZING...",
  "> Çekirdek modülleri yükleniyor...",
  "> Veri katmanı hazırlanıyor...",
  "> Player bağlantısı kuruluyor...",
];

export function SystemBoot() {
  const { state, hydrated, acceptSystem } = usePlayer();
  const [phase, setPhase] = useState<Phase>("booting");
  const [lineIdx, setLineIdx] = useState(0);
  const [name, setName] = useState("");
  const bootedRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    // Already-onboarded players never see this flow again — not on updates,
    // not after a re-hydrate. `initialized` is the single source of truth.
    if (state.initialized) { setPhase("done"); return; }
    if (bootedRef.current) return;
    bootedRef.current = true;
    unlockAudio();
    sfx.boot();
  }, [hydrated, state.initialized]);

  useEffect(() => {
    if (phase !== "booting") return;
    if (lineIdx >= BOOT_LINES.length - 1) {
      const t = setTimeout(() => setPhase("linking"), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLineIdx((i) => i + 1), 550);
    return () => clearTimeout(t);
  }, [phase, lineIdx]);

  useEffect(() => {
    if (phase !== "linking") return;
    const t = setTimeout(() => setPhase("prompt"), 900);
    return () => clearTimeout(t);
  }, [phase]);

  if (!hydrated || phase === "done") return null;

  const accept = () => {
    sfx.confirm();
    // Instead of finalising here, open the extended Player Analysis wizard.
    setPhase("onboarding");
  };

  const reject = () => {
    sfx.reject();
    setPhase("rejected");
  };

  const finishOnboarding = (profile: PlayerProfile) => {
    setPhase("accepting");
    setTimeout(() => acceptSystem(profile.realName, profile), 600);
  };

  if (phase === "onboarding") {
    return <Onboarding onDone={finishOnboarding} />;
  }


  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/95 backdrop-blur-md animate-fade-in px-4">
      <div className="panel-glow corner-frame w-full max-w-lg p-6 md:p-10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-primary/10 blur-3xl animate-rune-spin" />
        <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative">
          <div className="font-display text-[10px] tracking-[0.4em] text-primary uppercase mb-2">SYSTEM</div>

          {phase === "booting" && (
            <div className="font-mono text-sm md:text-base space-y-1.5 min-h-[9rem]">
              {BOOT_LINES.slice(0, lineIdx + 1).map((l, i) => (
                <div key={i} className="text-foreground/90 animate-fade-in">{l}</div>
              ))}
              <div className="inline-block w-2 h-4 align-middle bg-primary animate-pulse" />
            </div>
          )}

          {phase === "linking" && (
            <div className="font-mono text-sm md:text-base space-y-1.5 min-h-[9rem]">
              <div className="text-foreground/70">&gt; Player bağlantısı kuruluyor...</div>
              <div className="mt-4 h-1.5 bg-input rounded-full overflow-hidden">
                <div className="xp-bar-fill h-full" style={{ width: "100%", transition: "width 0.8s linear" }} />
              </div>
              <div className="text-primary mt-3">&gt; LINK ESTABLISHED.</div>
            </div>
          )}

          {phase === "prompt" && (
            <div className="animate-fade-in">
              <div className="font-mono text-xs md:text-sm text-foreground/70 space-y-1 mb-6">
                <div>&gt; LINK ESTABLISHED.</div>
                <div>&gt; Yetkilendirme bekleniyor.</div>
              </div>
              <h2 className="font-display text-2xl md:text-3xl leading-tight">
                PLAYER olmaya hazır mısınız?
              </h2>
              <p className="text-xs text-muted-foreground font-display tracking-widest uppercase mt-2">
                Bu karar geri alınamaz. Sistem seni izlemeye başlayacak.
              </p>

              <div className="mt-5">
                <label className="block text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-2">
                  Player Kod Adı (opsiyonel)
                </label>
                <input
                  autoFocus
                  className="bg-input rounded-md px-3 py-2.5 text-sm w-full outline-none focus:ring-2 focus:ring-primary/60 font-mono"
                  placeholder="Player"
                  value={name}
                  maxLength={24}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={accept} className="btn-arcane px-5 py-3 text-xs md:text-sm">
                  KABUL ET
                </button>
                <button
                  onClick={reject}
                  className="px-5 py-3 border border-border rounded-md font-display text-xs md:text-sm tracking-widest uppercase hover:border-danger/60 hover:text-danger transition-all"
                >
                  REDDET
                </button>
              </div>
            </div>
          )}

          {phase === "rejected" && (
            <div className="font-mono text-sm space-y-2 animate-fade-in min-h-[9rem]">
              <div className="text-danger">&gt; BAĞLANTI REDDEDİLDİ.</div>
              <div className="text-foreground/70">&gt; Sistem beklemede.</div>
              <div className="text-foreground/70">&gt; Yeniden değerlendirme her zaman mümkün.</div>
              <button
                onClick={() => setPhase("prompt")}
                className="mt-4 btn-arcane px-5 py-2.5 text-xs"
              >
                YENİDEN DEĞERLENDİR
              </button>
            </div>
          )}

          {phase === "accepting" && (
            <div className="font-mono text-sm space-y-2 animate-fade-in min-h-[9rem]">
              <div className="text-primary">&gt; PLAYER KAYDI OLUŞTURULDU.</div>
              <div className="text-foreground/80">&gt; LEVEL: 1 · RANK: F · XP: 0</div>
              <div className="text-foreground/80">&gt; TITLE: Beginner</div>
              <div className="text-primary mt-2">&gt; SYSTEM ONLINE.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
