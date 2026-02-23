export type Quest = {
  id: string;
  title: string;
  description: string;
  points: number;
  kind: "social" | "learn" | "community";
  // V1: validation simple (manual/attestation UI). V2+: on branchera de la vraie preuve.
  verification: "manual";
};

export const QUESTS: Quest[] = [
  {
    id: "join-telegram",
    title: "Rejoindre Telegram",
    description: "Rejoins le groupe Telegram officiel SHUI.",
    points: 10,
    kind: "community",
    verification: "manual",
  },
  {
    id: "follow-x",
    title: "Suivre X (Shui Labs)",
    description: "Suis le compte X officiel et active les notifications.",
    points: 10,
    kind: "social",
    verification: "manual",
  },
  {
    id: "read-safety",
    title: "Lire les règles de sécurité",
    description: "Comprendre : Connexion = message signé, Swap = transaction.",
    points: 5,
    kind: "learn",
    verification: "manual",
  },
];

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}
