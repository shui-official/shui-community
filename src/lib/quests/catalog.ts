export type QuestKind = "daily" | "social" | "learn" | "community" | "onchain";

export type QuestVerification =
  | "manual"          // V1: attestation UI / click
  | "social"          // V2+: preuves sociales (X/IG/TG)
  | "onchain-hold"    // automatique: holder SHUI
  | "onchain-lp";     // automatique: LP Raydium

export type QuestCooldown = "once" | "daily";

export type PointsMode =
  | { mode: "fixed"; points: number }
  | { mode: "holder-mult"; multiplier: number }
  | { mode: "lp-mult"; multiplier: number };

export type Quest = {
  id: string;

  // i18n keys
  titleKey: string;
  descriptionKey: string;

  kind: QuestKind;
  verification: QuestVerification;
  cooldown: QuestCooldown;

  points: PointsMode;
};

export const QUESTS: Quest[] = [
  // --- ONE SHOT (social) ---
  {
    id: "join-telegram",
    titleKey: "quests.items.join-telegram.title",
    descriptionKey: "quests.items.join-telegram.description",
    kind: "social",
    verification: "social",
    cooldown: "once",
    points: { mode: "fixed", points: 5 },
  },
  {
    id: "follow-x",
    titleKey: "quests.items.follow-x.title",
    descriptionKey: "quests.items.follow-x.description",
    kind: "social",
    verification: "social",
    cooldown: "once",
    points: { mode: "fixed", points: 5 },
  },
  {
    id: "follow-instagram",
    titleKey: "quests.items.follow-instagram.title",
    descriptionKey: "quests.items.follow-instagram.description",
    kind: "social",
    verification: "social",
    cooldown: "once",
    points: { mode: "fixed", points: 5 },
  },

  // --- LEARN ---
  {
    id: "read-safety",
    titleKey: "quests.items.read-safety.title",
    descriptionKey: "quests.items.read-safety.description",
    kind: "learn",
    verification: "manual",
    cooldown: "once",
    points: { mode: "fixed", points: 5 },
  },

  // --- DAILY ---
  {
    id: "daily-checkin",
    titleKey: "quests.items.daily-checkin.title",
    descriptionKey: "quests.items.daily-checkin.description",
    kind: "daily",
    verification: "manual",
    cooldown: "daily",
    points: { mode: "fixed", points: 1 },
  },
  {
    id: "daily-share",
    titleKey: "quests.items.daily-share.title",
    descriptionKey: "quests.items.daily-share.description",
    kind: "daily",
    verification: "manual",
    cooldown: "daily",
    points: { mode: "fixed", points: 2 },
  },

  // --- ON-CHAIN ---
  {
    id: "holder-shui",
    titleKey: "quests.items.holder-shui.title",
    descriptionKey: "quests.items.holder-shui.description",
    kind: "onchain",
    verification: "onchain-hold",
    cooldown: "daily",
    points: { mode: "holder-mult", multiplier: Number(process.env.QUEST_HOLDER_MULTIPLIER || 10) },
  },
  {
    id: "lp-raydium",
    titleKey: "quests.items.lp-raydium.title",
    descriptionKey: "quests.items.lp-raydium.description",
    kind: "onchain",
    verification: "onchain-lp",
    cooldown: "daily",
    points: { mode: "lp-mult", multiplier: Number(process.env.QUEST_LP_MULTIPLIER || 100) },
  },
];

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}
