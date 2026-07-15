import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { createRecognizer, speak, stopSpeaking, isSttSupported } from "@/lib/voice/speech";
import { getAgent } from "@/lib/voice/agent";
import { usePlayer } from "@/lib/player-store";

/**
 * Floating mic button that runs the SYSTEM voice assistant loop:
 *   press → listen (STT) → agent.respond() → speak (TTS).
 *
 * Zero design impact: renders a single fixed circle above the bottom nav.
 */
export function VoiceAssistant() {
  const { state, xpNeeded, hydrated } = usePlayer();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<ReturnType<typeof createRecognizer> | null>(null);

  useEffect(() => {
    setSupported(isSttSupported());
  }, []);

  const finish = useCallback(async (finalText: string) => {
    setListening(false);
    if (!finalText.trim() || !hydrated) return;
    const activeQuests = state.quests.filter((q) => !q.done).length;
    const doneToday = state.quests.filter((q) => q.done).length;
    const agent = getAgent();
    const res = await agent.respond(finalText, {
      player: {
        name: state.name,
        level: state.level,
        xp: state.xp,
        xpNeeded,
        streak: state.streak,
        weeklyStreak: state.weeklyStreak,
        completedCount: state.completedCount,
        failedCount: state.failedCount,
        activeQuests,
        doneQuestsToday: doneToday,
        title: state.title,
      },
    });
    setReply(res.text);
    speak(res.text);
    setTimeout(() => setReply(null), 6000);
  }, [state, xpNeeded, hydrated]);

  const start = useCallback(() => {
    if (!supported) {
      const msg = "Ses tanıma bu cihazda desteklenmiyor.";
      setReply(msg);
      speak(msg);
      setTimeout(() => setReply(null), 4000);
      return;
    }
    stopSpeaking();
    setTranscript("");
    setListening(true);
    let finalText = "";
    recRef.current = createRecognizer({
      onResult: (text, isFinal) => {
        setTranscript(text);
        if (isFinal) finalText = text;
      },
      onError: () => setListening(false),
      onEnd: () => {
        setListening(false);
        finish(finalText || transcript);
      },
    });
    recRef.current.start();
  }, [supported, finish, transcript]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return (
    <>
      {(transcript || reply) && (
        <div className="fixed z-50 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-6 md:left-[17rem] left-4 right-4 md:right-auto md:max-w-md pointer-events-none">
          <div className="panel-glow px-4 py-3 rounded-md text-xs space-y-1">
            {transcript && (
              <div className="text-muted-foreground">
                <span className="font-display text-[9px] tracking-widest text-primary uppercase mr-2">Sen</span>
                {transcript}
              </div>
            )}
            {reply && (
              <div className="text-foreground flex gap-2">
                <Volume2 className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                <span><span className="font-display text-[9px] tracking-widest text-primary uppercase mr-2">SYSTEM</span>{reply}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={listening ? "Dinlemeyi durdur" : "Sesli komut ver"}
        onClick={listening ? stop : start}
        className={`fixed z-50 right-4 md:right-6 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 w-14 h-14 rounded-full grid place-items-center panel-glow border border-primary/60 transition-transform active:scale-95 ${listening ? "animate-pulse bg-primary/20" : "bg-background/80"}`}
      >
        {listening ? <MicOff className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-primary" />}
      </button>
    </>
  );
}
