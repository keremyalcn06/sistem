/**
 * SYSTEM Voice Assistant — modular AI agent contract.
 *
 * The assistant's "brain" is pluggable: today a rule-based local agent
 * handles Turkish command patterns against player data. Later, an
 * external agent (OpenClaw, Blurr, or a hosted LLM) can implement this
 * same interface and be swapped in via `setAgent()` without touching
 * STT/TTS or UI code.
 */

export type AgentContext = {
  /** Read-only snapshot of the current player state (see player-store). */
  player: {
    name: string;
    level: number;
    xp: number;
    xpNeeded: number;
    streak: number;
    weeklyStreak: number;
    completedCount: number;
    failedCount: number;
    activeQuests: number;
    doneQuestsToday: number;
    title: string;
  };
};

export type AgentReply = {
  /** Text response spoken back to the user. */
  text: string;
  /** Optional structured intent for future handlers (e.g. open route). */
  intent?: string;
};

export interface VoiceAgent {
  readonly id: string;
  respond(utterance: string, ctx: AgentContext): Promise<AgentReply>;
}

// ---------------------------------------------------------------------------
// Default: local, offline, deterministic SYSTEM agent
// ---------------------------------------------------------------------------

const localAgent: VoiceAgent = {
  id: "system.local.v1",
  async respond(utterance, ctx) {
    const q = utterance.toLowerCase().trim();
    const p = ctx.player;

    const has = (...keys: string[]) => keys.some((k) => q.includes(k));

    if (has("seviye", "level", "lv")) {
      return { text: `Seviye ${p.level}. XP ${p.xp} bölü ${p.xpNeeded}.`, intent: "stat.level" };
    }
    if (has("xp", "tecrübe")) {
      return { text: `Mevcut XP: ${p.xp}. Sonraki seviye için ${p.xpNeeded - p.xp} XP kaldı.`, intent: "stat.xp" };
    }
    if (has("seri", "streak")) {
      return { text: `Günlük seri ${p.streak}. Haftalık seri ${p.weeklyStreak}.`, intent: "stat.streak" };
    }
    if (has("görev", "gorev", "quest")) {
      return {
        text: `Bugün ${p.activeQuests} aktif görev var. Tamamlanan: ${p.doneQuestsToday}.`,
        intent: "quest.status",
      };
    }
    if (has("istatistik", "stat", "durum", "rapor")) {
      return {
        text: `SYSTEM raporu. Seviye ${p.level}, seri ${p.streak}, toplam tamamlanan ${p.completedCount}, başarısız ${p.failedCount}.`,
        intent: "stat.report",
      };
    }
    if (has("unvan", "rank", "title")) {
      return { text: `Mevcut unvan: ${p.title}.`, intent: "stat.title" };
    }
    if (has("merhaba", "selam", "jarvis", "sistem", "system")) {
      return { text: `SYSTEM aktif. ${p.name}, dinliyorum.`, intent: "greeting" };
    }
    if (has("yardım", "yardim", "komut", "ne yapabilirsin")) {
      return {
        text: `Komutlar: seviye, XP, seri, görevler, istatistik, unvan. Örnek: seviyem ne.`,
        intent: "help",
      };
    }

    return {
      text: `Komut tanınmadı. Şunları deneyin: seviye, XP, seri, görevler, istatistik.`,
      intent: "unknown",
    };
  },
};

let currentAgent: VoiceAgent = localAgent;

export function setAgent(agent: VoiceAgent) {
  currentAgent = agent;
}

export function getAgent(): VoiceAgent {
  return currentAgent;
}
