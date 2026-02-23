export type GuideStep = {
  id: string;
  title: string;
  pageHint?: string; // ex: "/community"
  bullets: string[];
  warning?: string;
  cta?: { label: string; href?: string };
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "safety",
    title: "Avant de commencer (sécurité)",
    bullets: [
      "Un wallet = ton coffre-fort. Tu ne donnes JAMAIS ta phrase secrète (seed).",
      "Connexion au site = signature d’un message (pas une transaction).",
      "Swap / Achat / Vente = transaction (normal : Phantom te le montrera).",
      "Si une fenêtre te demande une transaction alors que tu voulais juste te connecter : STOP.",
    ],
    warning: "Règle d’or : aucune “seed phrase” n’est demandée par un site légitime.",
  },
  {
    id: "wallet",
    title: "Créer un wallet (Phantom)",
    bullets: [
      "Installe Phantom (extension navigateur).",
      "Crée un nouveau wallet.",
      "Sauvegarde la phrase secrète hors-ligne (papier / coffre).",
      "Active un code / biométrie sur ton appareil.",
    ],
    warning: "Perdre ta seed = perdre l’accès à tes fonds. Personne ne peut “récupérer” à ta place.",
  },
  {
    id: "connect",
    title: "Se connecter au site",
    pageHint: "/community",
    bullets: [
      "Clique sur le bouton wallet (en haut à droite).",
      "Choisis Phantom, puis “Connect”.",
      "Ton adresse apparaît (format 7x…9k).",
    ],
  },
  {
    id: "secure-login",
    title: "Activer la connexion sécurisée (V2)",
    pageHint: "/community",
    bullets: [
      "Clique “Activer la connexion sécurisée”.",
      "Tu signes un message lisible (PAS une transaction).",
      "Le site crée une session serveur (cookie httpOnly).",
      "Le statut passe à “Session OK”.",
    ],
    warning: "Si Phantom affiche une transaction ici : c’est anormal → n’accepte pas.",
  },
  {
    id: "buy",
    title: "Acheter / Swap SHUI (débutant)",
    pageHint: "/community",
    bullets: [
      "Le swap intégré (Jupiter) te permet d’échanger SOL → SHUI.",
      "Un swap = transaction : Phantom te demandera de signer.",
      "Commence petit pour tester (ex: 0.01 SOL).",
      "Vérifie toujours le token (mint) avant de confirmer.",
    ],
    cta: { label: "Ouvrir Jupiter (site)", href: "https://jup.ag/" },
  },
  {
    id: "lp",
    title: "Comprendre la liquidité (LP)",
    pageHint: "/community",
    bullets: [
      "LP = tu déposes 2 tokens (ex: SOL + SHUI) dans une “pool”.",
      "Tu reçois un token LP qui représente ta part.",
      "Ajouter/Retirer LP = transaction Raydium (normal).",
      "À connaître : l’impermanent loss (ça peut bouger).",
    ],
    warning: "LP n’est pas un “placement garanti”. Fais-le seulement si tu comprends le principe.",
  },
  {
    id: "dashboard",
    title: "Dashboard & Quêtes (récompenses)",
    pageHint: "/dashboard",
    bullets: [
      "Les quêtes donnent des points off-chain (pour récompenser l’activité).",
      "Certaines actions sont “claim” (pas forcément on-chain).",
      "Le site protège les endpoints (session + allowlist).",
    ],
  },
  {
    id: "next",
    title: "Ce qui arrive ensuite (vision grand public)",
    bullets: [
      "Plus tard : échanges simplifiés (SOL/SHUI, USDC/SHUI, etc.) via pools plus liquides.",
      "On ajoutera un parcours débutant plus guidé (étapes + images + mini-coach).",
      "Objectif : rendre SHUI utilisable aussi par les néophytes.",
    ],
  },
];

// Petit glossaire simple (affiché dans le guide)
export const GLOSSARY: { k: string; v: string }[] = [
  { k: "Wallet", v: "Application qui garde tes clés et te permet de signer." },
  { k: "Seed phrase", v: "Phrase secrète de récupération. À ne jamais partager." },
  { k: "Mint", v: "Adresse du token (son identifiant sur Solana)." },
  { k: "Swap", v: "Échange d’un token contre un autre (transaction)." },
  { k: "LP / Pool", v: "Réserve de 2 tokens permettant les échanges. Ajouter LP = déposer les 2." },
  { k: "Transaction", v: "Action on-chain signée (envoi, swap, LP, etc.)." },
  { k: "Signature message", v: "Preuve d’identité sans transaction." },
];
