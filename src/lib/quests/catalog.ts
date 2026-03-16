// ============================================================
// SHUI Quest Catalog — v2 Complete
// Architecture: auto / semi-auto / manual validation
// 7 categories × 40+ quests — production-ready
// ============================================================

export type QuestKind =
  | "onboarding"
  | "education"
  | "community"
  | "content"
  | "product"
  | "development"
  | "strategic";

export type QuestVerification =
  | "auto-wallet"       // wallet connecté → automatique
  | "auto-onchain-hold" // holder SHUI → automatique via RPC
  | "auto-onchain-lp"   // LP Raydium → automatique via RPC
  | "auto-quiz"         // quiz validé côté serveur → automatique
  | "semi-social"       // preuve social déposée → pré-analyse + review rapide
  | "semi-proof"        // preuve fichier/lien → file de review
  | "manual";           // validation humaine obligatoire

export type QuestCooldown = "once" | "daily" | "weekly" | "monthly";

export type ValidationLevel = "auto" | "semi" | "manual";

export type PointsMode =
  | { mode: "fixed"; points: number }
  | { mode: "range"; min: number; max: number }
  | { mode: "holder-mult"; multiplier: number }
  | { mode: "lp-mult"; multiplier: number };

export type Quest = {
  id: string;

  // i18n
  titleKey: string;
  descriptionKey: string;
  proofHintKey?: string; // hint explaining what proof is needed

  // Classification
  kind: QuestKind;
  category: string; // human-readable category key for grouping
  verification: QuestVerification;
  validationLevel: ValidationLevel;
  cooldown: QuestCooldown;

  // Points
  points: PointsMode;

  // Metadata
  requiredLevel?: "goutte" | "flux" | "riviere" | "ocean"; // min level to unlock
  abuseRisk: "low" | "medium" | "high"; // informs auto vs manual
  mobileSyncable: boolean; // can be triggered from mobile app
  tags?: string[];
};

// ============================================================
// FULL QUEST CATALOG
// ============================================================

export const QUESTS: Quest[] = [

  // ──────────────────────────────────────────────────────────
  // A. ONBOARDING
  // ──────────────────────────────────────────────────────────

  {
    id: "join-telegram",
    titleKey: "quests.items.join-telegram.title",
    descriptionKey: "quests.items.join-telegram.description",
    proofHintKey: "quests.items.join-telegram.proofHint",
    kind: "onboarding",
    category: "onboarding",
    verification: "semi-social",
    validationLevel: "semi",
    cooldown: "once",
    points: { mode: "fixed", points: 5 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["social", "first-steps"],
  },
  {
    id: "follow-x",
    titleKey: "quests.items.follow-x.title",
    descriptionKey: "quests.items.follow-x.description",
    proofHintKey: "quests.items.follow-x.proofHint",
    kind: "onboarding",
    category: "onboarding",
    verification: "semi-social",
    validationLevel: "semi",
    cooldown: "once",
    points: { mode: "fixed", points: 5 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["social", "first-steps"],
  },
  {
    id: "follow-instagram",
    titleKey: "quests.items.follow-instagram.title",
    descriptionKey: "quests.items.follow-instagram.description",
    proofHintKey: "quests.items.follow-instagram.proofHint",
    kind: "onboarding",
    category: "onboarding",
    verification: "semi-social",
    validationLevel: "semi",
    cooldown: "once",
    points: { mode: "fixed", points: 5 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["social", "first-steps"],
  },
  {
    id: "connect-wallet",
    titleKey: "quests.items.connect-wallet.title",
    descriptionKey: "quests.items.connect-wallet.description",
    kind: "onboarding",
    category: "onboarding",
    verification: "auto-wallet",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 10 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "first-steps"],
  },
  {
    id: "read-guide",
    titleKey: "quests.items.read-guide.title",
    descriptionKey: "quests.items.read-guide.description",
    kind: "onboarding",
    category: "onboarding",
    verification: "auto-quiz",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 10 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "education"],
  },
  {
    id: "complete-beginner-quiz",
    titleKey: "quests.items.complete-beginner-quiz.title",
    descriptionKey: "quests.items.complete-beginner-quiz.description",
    kind: "onboarding",
    category: "onboarding",
    verification: "auto-quiz",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 15 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "education"],
  },
  {
    id: "complete-profile",
    titleKey: "quests.items.complete-profile.title",
    descriptionKey: "quests.items.complete-profile.description",
    kind: "onboarding",
    category: "onboarding",
    verification: "auto-wallet",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 10 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto"],
  },

  // ──────────────────────────────────────────────────────────
  // B. ÉDUCATION
  // ──────────────────────────────────────────────────────────

  {
    id: "learn-mint-vs-wallet",
    titleKey: "quests.items.learn-mint-vs-wallet.title",
    descriptionKey: "quests.items.learn-mint-vs-wallet.description",
    kind: "education",
    category: "education",
    verification: "auto-quiz",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 10 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "education"],
  },
  {
    id: "learn-wallet-allocation",
    titleKey: "quests.items.learn-wallet-allocation.title",
    descriptionKey: "quests.items.learn-wallet-allocation.description",
    kind: "education",
    category: "education",
    verification: "auto-quiz",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 10 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "education"],
  },
  {
    id: "learn-liquidity-slippage",
    titleKey: "quests.items.learn-liquidity-slippage.title",
    descriptionKey: "quests.items.learn-liquidity-slippage.description",
    kind: "education",
    category: "education",
    verification: "auto-quiz",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 15 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "education", "defi"],
  },
  {
    id: "learn-treasury-role",
    titleKey: "quests.items.learn-treasury-role.title",
    descriptionKey: "quests.items.learn-treasury-role.description",
    kind: "education",
    category: "education",
    verification: "auto-quiz",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 15 },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "education", "governance"],
  },
  {
    id: "read-litepaper-quiz",
    titleKey: "quests.items.read-litepaper-quiz.title",
    descriptionKey: "quests.items.read-litepaper-quiz.description",
    kind: "education",
    category: "education",
    verification: "auto-quiz",
    validationLevel: "auto",
    cooldown: "once",
    points: { mode: "fixed", points: 20 },
    requiredLevel: "flux",
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "education", "litepaper"],
  },
  {
    id: "report-scam",
    titleKey: "quests.items.report-scam.title",
    descriptionKey: "quests.items.report-scam.description",
    proofHintKey: "quests.items.report-scam.proofHint",
    kind: "education",
    category: "education",
    verification: "semi-proof",
    validationLevel: "semi",
    cooldown: "once",
    points: { mode: "fixed", points: 15 },
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["security", "community"],
  },

  // ──────────────────────────────────────────────────────────
  // C. TRACTION COMMUNAUTAIRE
  // ──────────────────────────────────────────────────────────

  {
    id: "invite-1-member",
    titleKey: "quests.items.invite-1-member.title",
    descriptionKey: "quests.items.invite-1-member.description",
    proofHintKey: "quests.items.invite-1-member.proofHint",
    kind: "community",
    category: "community",
    verification: "semi-proof",
    validationLevel: "semi",
    cooldown: "monthly",
    points: { mode: "fixed", points: 5 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["referral", "growth"],
  },
  {
    id: "invite-5-members",
    titleKey: "quests.items.invite-5-members.title",
    descriptionKey: "quests.items.invite-5-members.description",
    proofHintKey: "quests.items.invite-5-members.proofHint",
    kind: "community",
    category: "community",
    verification: "semi-proof",
    validationLevel: "semi",
    cooldown: "once",
    points: { mode: "fixed", points: 20 },
    requiredLevel: "flux",
    abuseRisk: "high",
    mobileSyncable: true,
    tags: ["referral", "growth"],
  },
  {
    id: "welcome-3-members",
    titleKey: "quests.items.welcome-3-members.title",
    descriptionKey: "quests.items.welcome-3-members.description",
    proofHintKey: "quests.items.welcome-3-members.proofHint",
    kind: "community",
    category: "community",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 15 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: false,
    tags: ["support", "onboarding"],
  },
  {
    id: "help-10-members",
    titleKey: "quests.items.help-10-members.title",
    descriptionKey: "quests.items.help-10-members.description",
    proofHintKey: "quests.items.help-10-members.proofHint",
    kind: "community",
    category: "community",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 50 },
    requiredLevel: "riviere",
    abuseRisk: "medium",
    mobileSyncable: false,
    tags: ["support", "mentoring"],
  },
  {
    id: "open-local-group",
    titleKey: "quests.items.open-local-group.title",
    descriptionKey: "quests.items.open-local-group.description",
    proofHintKey: "quests.items.open-local-group.proofHint",
    kind: "community",
    category: "community",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "fixed", points: 30 },
    requiredLevel: "riviere",
    abuseRisk: "medium",
    mobileSyncable: false,
    tags: ["ambassador", "local"],
  },

  // ──────────────────────────────────────────────────────────
  // D. CONTENU
  // ──────────────────────────────────────────────────────────

  {
    id: "instagram-story",
    titleKey: "quests.items.instagram-story.title",
    descriptionKey: "quests.items.instagram-story.description",
    proofHintKey: "quests.items.instagram-story.proofHint",
    kind: "content",
    category: "content",
    verification: "semi-proof",
    validationLevel: "semi",
    cooldown: "weekly",
    points: { mode: "fixed", points: 10 },
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["instagram", "social"],
  },
  {
    id: "instagram-post",
    titleKey: "quests.items.instagram-post.title",
    descriptionKey: "quests.items.instagram-post.description",
    proofHintKey: "quests.items.instagram-post.proofHint",
    kind: "content",
    category: "content",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "weekly",
    points: { mode: "fixed", points: 30 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["instagram", "content"],
  },
  {
    id: "x-thread",
    titleKey: "quests.items.x-thread.title",
    descriptionKey: "quests.items.x-thread.description",
    proofHintKey: "quests.items.x-thread.proofHint",
    kind: "content",
    category: "content",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "weekly",
    points: { mode: "fixed", points: 50 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["x", "thread", "content"],
  },
  {
    id: "mini-video",
    titleKey: "quests.items.mini-video.title",
    descriptionKey: "quests.items.mini-video.description",
    proofHintKey: "quests.items.mini-video.proofHint",
    kind: "content",
    category: "content",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 80 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["video", "content"],
  },
  {
    id: "educational-carousel",
    titleKey: "quests.items.educational-carousel.title",
    descriptionKey: "quests.items.educational-carousel.description",
    proofHintKey: "quests.items.educational-carousel.proofHint",
    kind: "content",
    category: "content",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 40 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["carousel", "education", "content"],
  },
  {
    id: "translate-post",
    titleKey: "quests.items.translate-post.title",
    descriptionKey: "quests.items.translate-post.description",
    proofHintKey: "quests.items.translate-post.proofHint",
    kind: "content",
    category: "content",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "weekly",
    points: { mode: "fixed", points: 20 },
    requiredLevel: "flux",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["translation"],
  },
  {
    id: "translate-document",
    titleKey: "quests.items.translate-document.title",
    descriptionKey: "quests.items.translate-document.description",
    proofHintKey: "quests.items.translate-document.proofHint",
    kind: "content",
    category: "content",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "fixed", points: 70 },
    requiredLevel: "riviere",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["translation", "docs"],
  },

  // ──────────────────────────────────────────────────────────
  // E. TESTS / PRODUIT
  // ──────────────────────────────────────────────────────────

  {
    id: "report-minor-bug",
    titleKey: "quests.items.report-minor-bug.title",
    descriptionKey: "quests.items.report-minor-bug.description",
    proofHintKey: "quests.items.report-minor-bug.proofHint",
    kind: "product",
    category: "product",
    verification: "semi-proof",
    validationLevel: "semi",
    cooldown: "monthly",
    points: { mode: "fixed", points: 10 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["bug", "qa"],
  },
  {
    id: "report-critical-bug",
    titleKey: "quests.items.report-critical-bug.title",
    descriptionKey: "quests.items.report-critical-bug.description",
    proofHintKey: "quests.items.report-critical-bug.proofHint",
    kind: "product",
    category: "product",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "range", min: 25, max: 50 },
    requiredLevel: "flux",
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["bug", "security", "qa"],
  },
  {
    id: "ux-test-capture",
    titleKey: "quests.items.ux-test-capture.title",
    descriptionKey: "quests.items.ux-test-capture.description",
    proofHintKey: "quests.items.ux-test-capture.proofHint",
    kind: "product",
    category: "product",
    verification: "semi-proof",
    validationLevel: "semi",
    cooldown: "monthly",
    points: { mode: "fixed", points: 30 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["ux", "test"],
  },
  {
    id: "release-test-report",
    titleKey: "quests.items.release-test-report.title",
    descriptionKey: "quests.items.release-test-report.description",
    proofHintKey: "quests.items.release-test-report.proofHint",
    kind: "product",
    category: "product",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 30 },
    requiredLevel: "riviere",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["test", "qa"],
  },
  {
    id: "ux-proposal",
    titleKey: "quests.items.ux-proposal.title",
    descriptionKey: "quests.items.ux-proposal.description",
    proofHintKey: "quests.items.ux-proposal.proofHint",
    kind: "product",
    category: "product",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 40 },
    requiredLevel: "riviere",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["ux", "proposal"],
  },
  {
    id: "test-campaign-15d",
    titleKey: "quests.items.test-campaign-15d.title",
    descriptionKey: "quests.items.test-campaign-15d.description",
    kind: "product",
    category: "product",
    verification: "semi-proof",
    validationLevel: "semi",
    cooldown: "monthly",
    points: { mode: "fixed", points: 20 },
    requiredLevel: "flux",
    abuseRisk: "medium",
    mobileSyncable: true,
    tags: ["test", "campaign"],
  },

  // ──────────────────────────────────────────────────────────
  // F. DÉVELOPPEMENT / OPS
  // ──────────────────────────────────────────────────────────

  {
    id: "fix-front-bug",
    titleKey: "quests.items.fix-front-bug.title",
    descriptionKey: "quests.items.fix-front-bug.description",
    proofHintKey: "quests.items.fix-front-bug.proofHint",
    kind: "development",
    category: "development",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 50 },
    requiredLevel: "riviere",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["dev", "frontend"],
  },
  {
    id: "add-minor-feature",
    titleKey: "quests.items.add-minor-feature.title",
    descriptionKey: "quests.items.add-minor-feature.description",
    proofHintKey: "quests.items.add-minor-feature.proofHint",
    kind: "development",
    category: "development",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 80 },
    requiredLevel: "riviere",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["dev"],
  },
  {
    id: "develop-full-module",
    titleKey: "quests.items.develop-full-module.title",
    descriptionKey: "quests.items.develop-full-module.description",
    proofHintKey: "quests.items.develop-full-module.proofHint",
    kind: "development",
    category: "development",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "range", min: 150, max: 300 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["dev", "module"],
  },
  {
    id: "community-tool",
    titleKey: "quests.items.community-tool.title",
    descriptionKey: "quests.items.community-tool.description",
    proofHintKey: "quests.items.community-tool.proofHint",
    kind: "development",
    category: "development",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "fixed", points: 500 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["dev", "tool", "community"],
  },
  {
    id: "onchain-dashboard",
    titleKey: "quests.items.onchain-dashboard.title",
    descriptionKey: "quests.items.onchain-dashboard.description",
    proofHintKey: "quests.items.onchain-dashboard.proofHint",
    kind: "development",
    category: "development",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "fixed", points: 200 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["dev", "onchain", "reporting"],
  },
  {
    id: "document-tech-process",
    titleKey: "quests.items.document-tech-process.title",
    descriptionKey: "quests.items.document-tech-process.description",
    proofHintKey: "quests.items.document-tech-process.proofHint",
    kind: "development",
    category: "development",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 100 },
    requiredLevel: "riviere",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["docs", "technical"],
  },

  // ──────────────────────────────────────────────────────────
  // G. STRATÉGIQUE / CRÉDIBILITÉ / CONFORMITÉ
  // ──────────────────────────────────────────────────────────

  {
    id: "jupiter-verification",
    titleKey: "quests.items.jupiter-verification.title",
    descriptionKey: "quests.items.jupiter-verification.description",
    proofHintKey: "quests.items.jupiter-verification.proofHint",
    kind: "strategic",
    category: "strategic",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "fixed", points: 80 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["jupiter", "credibility", "listing"],
  },
  {
    id: "metadata-official",
    titleKey: "quests.items.metadata-official.title",
    descriptionKey: "quests.items.metadata-official.description",
    proofHintKey: "quests.items.metadata-official.proofHint",
    kind: "strategic",
    category: "strategic",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "fixed", points: 40 },
    requiredLevel: "riviere",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["metadata", "listing"],
  },
  {
    id: "audit-links-consistency",
    titleKey: "quests.items.audit-links-consistency.title",
    descriptionKey: "quests.items.audit-links-consistency.description",
    proofHintKey: "quests.items.audit-links-consistency.proofHint",
    kind: "strategic",
    category: "strategic",
    verification: "semi-proof",
    validationLevel: "semi",
    cooldown: "monthly",
    points: { mode: "fixed", points: 30 },
    requiredLevel: "riviere",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["audit", "credibility"],
  },
  {
    id: "monthly-reporting",
    titleKey: "quests.items.monthly-reporting.title",
    descriptionKey: "quests.items.monthly-reporting.description",
    proofHintKey: "quests.items.monthly-reporting.proofHint",
    kind: "strategic",
    category: "strategic",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 50 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["reporting", "transparency"],
  },
  {
    id: "public-decisions-journal",
    titleKey: "quests.items.public-decisions-journal.title",
    descriptionKey: "quests.items.public-decisions-journal.description",
    proofHintKey: "quests.items.public-decisions-journal.proofHint",
    kind: "strategic",
    category: "strategic",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "fixed", points: 60 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["governance", "transparency"],
  },
  {
    id: "cmc-coingecko-dossier",
    titleKey: "quests.items.cmc-coingecko-dossier.title",
    descriptionKey: "quests.items.cmc-coingecko-dossier.description",
    proofHintKey: "quests.items.cmc-coingecko-dossier.proofHint",
    kind: "strategic",
    category: "strategic",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "range", min: 80, max: 120 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["listing", "cmc", "coingecko"],
  },
  {
    id: "document-wallets-onchain",
    titleKey: "quests.items.document-wallets-onchain.title",
    descriptionKey: "quests.items.document-wallets-onchain.description",
    proofHintKey: "quests.items.document-wallets-onchain.proofHint",
    kind: "strategic",
    category: "strategic",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "monthly",
    points: { mode: "fixed", points: 40 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["wallets", "onchain", "transparency"],
  },
  {
    id: "security-audit-checklist",
    titleKey: "quests.items.security-audit-checklist.title",
    descriptionKey: "quests.items.security-audit-checklist.description",
    proofHintKey: "quests.items.security-audit-checklist.proofHint",
    kind: "strategic",
    category: "strategic",
    verification: "manual",
    validationLevel: "manual",
    cooldown: "once",
    points: { mode: "range", min: 100, max: 150 },
    requiredLevel: "ocean",
    abuseRisk: "low",
    mobileSyncable: false,
    tags: ["security", "audit"],
  },

  // ──────────────────────────────────────────────────────────
  // ON-CHAIN (automatiques)
  // ──────────────────────────────────────────────────────────

  {
    id: "holder-shui",
    titleKey: "quests.items.holder-shui.title",
    descriptionKey: "quests.items.holder-shui.description",
    kind: "onboarding",
    category: "onchain",
    verification: "auto-onchain-hold",
    validationLevel: "auto",
    cooldown: "daily",
    points: { mode: "holder-mult", multiplier: Number(process.env.QUEST_HOLDER_MULTIPLIER || 10) },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "onchain", "holder"],
  },
  {
    id: "lp-raydium",
    titleKey: "quests.items.lp-raydium.title",
    descriptionKey: "quests.items.lp-raydium.description",
    kind: "onboarding",
    category: "onchain",
    verification: "auto-onchain-lp",
    validationLevel: "auto",
    cooldown: "daily",
    points: { mode: "lp-mult", multiplier: Number(process.env.QUEST_LP_MULTIPLIER || 100) },
    abuseRisk: "low",
    mobileSyncable: true,
    tags: ["auto", "onchain", "lp", "raydium"],
  },
];

// ============================================================
// HELPERS
// ============================================================

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function getQuestsByCategory(category: string): Quest[] {
  return QUESTS.filter((q) => q.category === category);
}

export function getQuestsByValidationLevel(level: ValidationLevel): Quest[] {
  return QUESTS.filter((q) => q.validationLevel === level);
}

export function getQuestsByRequiredLevel(userLevel: string): Quest[] {
  const hierarchy = ["goutte", "flux", "riviere", "ocean"];
  const userIdx = hierarchy.indexOf(userLevel);
  return QUESTS.filter((q) => {
    if (!q.requiredLevel) return true;
    return hierarchy.indexOf(q.requiredLevel) <= userIdx;
  });
}

export function pointsLabel(p: PointsMode): string {
  switch (p.mode) {
    case "fixed":
      return `+${p.points}`;
    case "range":
      return `+${p.min}–${p.max}`;
    case "holder-mult":
      return `×${p.multiplier}/SHUI`;
    case "lp-mult":
      return `×${p.multiplier}/LP`;
    default:
      return "+?";
  }
}

export function pointsToShui(points: number): number {
  return points * 100;
}

export const QUEST_CATEGORIES = [
  "onboarding",
  "education",
  "community",
  "content",
  "product",
  "development",
  "strategic",
  "onchain",
] as const;

export type QuestCategory = typeof QUEST_CATEGORIES[number];

// Level thresholds
export const LEVEL_THRESHOLDS = {
  goutte: { min: 0, max: 99 },
  flux: { min: 100, max: 399 },
  riviere: { min: 400, max: 1199 },
  ocean: { min: 1200, max: Infinity },
} as const;

export function getLevel(points: number): keyof typeof LEVEL_THRESHOLDS {
  if (points >= 1200) return "ocean";
  if (points >= 400) return "riviere";
  if (points >= 100) return "flux";
  return "goutte";
}

export function getLevelMultiplier(level: keyof typeof LEVEL_THRESHOLDS): number {
  const map = { goutte: 1.0, flux: 1.05, riviere: 1.1, ocean: 1.2 };
  return map[level];
}

export function getLevelProgress(points: number): {
  level: keyof typeof LEVEL_THRESHOLDS;
  currentMin: number;
  nextMin: number | null;
  progress: number; // 0-100
  pointsToNext: number | null;
} {
  const level = getLevel(points);
  const { min } = LEVEL_THRESHOLDS[level];
  const levels = Object.entries(LEVEL_THRESHOLDS) as [keyof typeof LEVEL_THRESHOLDS, { min: number; max: number }][];
  const idx = levels.findIndex(([k]) => k === level);
  const next = levels[idx + 1];

  if (!next) {
    return { level, currentMin: min, nextMin: null, progress: 100, pointsToNext: null };
  }

  const nextMin = next[1].min;
  const range = nextMin - min;
  const progress = Math.min(100, Math.floor(((points - min) / range) * 100));
  return { level, currentMin: min, nextMin, progress, pointsToNext: nextMin - points };
}
