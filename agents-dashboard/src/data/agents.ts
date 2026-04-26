// ============================================================
// SHUI Multi-Agent Architecture — Agent Definitions
// Version: MVP 1.0
// Security: READ-ONLY agents, no private key access
// ============================================================

export type AgentStatus = 'active' | 'idle' | 'paused' | 'error' | 'pending_review';
export type ActionStatus = 'completed' | 'pending_review' | 'rejected' | 'in_progress' | 'draft';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AgentAction {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: ActionStatus;
  severity?: SeverityLevel;
  prUrl?: string;
  issueUrl?: string;
  branch?: string;
  requiresHumanApproval: boolean;
  humanApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AgentPermission {
  allowed: string[];
  forbidden: string[];
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  status: AgentStatus;
  color: string;
  colorBg: string;
  colorBorder: string;
  capabilities: string[];
  permissions: AgentPermission;
  recentActions: AgentAction[];
  stats: {
    actionsToday: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    totalPRs: number;
  };
  systemPrompt: string;
  tools: string[];
  branch: string;
  lastActivity: string;
}

export interface SecurityRule {
  id: string;
  rule: string;
  enforced: boolean;
  level: 'absolute' | 'critical' | 'important';
}

export const SECURITY_RULES: SecurityRule[] = [
  { id: 'no-pk', rule: 'Aucun accès aux clés privées ou seed phrases', enforced: true, level: 'absolute' },
  { id: 'no-sign', rule: 'Aucune signature de transaction blockchain', enforced: true, level: 'absolute' },
  { id: 'no-transfer', rule: 'Aucun transfert de tokens ou SOL', enforced: true, level: 'absolute' },
  { id: 'no-deploy', rule: 'Aucun déploiement direct en production', enforced: true, level: 'absolute' },
  { id: 'pr-required', rule: 'Toute modification → Pull Request obligatoire', enforced: true, level: 'critical' },
  { id: 'human-approval', rule: 'Validation humaine pour toute action sensible', enforced: true, level: 'critical' },
  { id: 'no-treasury', rule: 'Zéro accès à la trésorerie SHUI', enforced: true, level: 'absolute' },
  { id: 'audit-log', rule: 'Logs complets de toutes les actions agents', enforced: true, level: 'important' },
  { id: 'staging-first', rule: 'Staging obligatoire avant toute production', enforced: true, level: 'critical' },
  { id: 'rollback', rule: 'Système de rollback disponible à tout moment', enforced: true, level: 'important' },
  { id: 'branch-isolation', rule: 'Chaque agent = branche GitHub dédiée', enforced: true, level: 'critical' },
  { id: 'no-wallet-access', rule: 'Aucun accès aux wallets des membres', enforced: true, level: 'absolute' },
];

export const AGENTS: Agent[] = [
  // ─────────────────────────────────────────────
  // AGENT 1 — DEV
  // ─────────────────────────────────────────────
  {
    id: 'agent-dev',
    name: 'Agent DEV',
    emoji: '⚙️',
    role: 'Développeur IA',
    description: 'Analyse le code, propose corrections UI/UX, ajoute des fonctionnalités via Pull Requests uniquement. Ne déploie jamais directement.',
    status: 'active',
    color: '#00D4FF',
    colorBg: 'rgba(0,212,255,0.08)',
    colorBorder: 'rgba(0,212,255,0.3)',
    branch: 'agent/dev-improvements',
    lastActivity: '2026-04-25T10:30:00Z',
    capabilities: [
      'Analyser le code source du site',
      'Détecter bugs front/backend',
      'Proposer corrections UI/UX',
      'Ajouter fonctionnalités (via PR)',
      'Refactoring et optimisation',
      'Améliorer accessibilité (a11y)',
      'Optimiser les performances',
      'Corriger erreurs TypeScript',
    ],
    permissions: {
      allowed: [
        'Lire le code source (GitHub read)',
        'Créer des branches dédiées (agent/dev-*)',
        'Ouvrir des Pull Requests',
        'Commenter les PR existantes',
        'Ouvrir des GitHub Issues',
        'Analyser les logs de build Vercel',
        'Lire les métriques Core Web Vitals',
        'Proposer des changements de config',
      ],
      forbidden: [
        'Merger des Pull Requests',
        'Push direct sur main',
        'Accès aux variables d\'environnement production',
        'Accès aux clés API en production',
        'Déclencher des déploiements Vercel',
        'Modifier les paramètres GitHub',
        'Accès aux wallets ou tokens',
      ],
    },
    recentActions: [
      {
        id: 'dev-001',
        timestamp: '2026-04-25T10:30:00Z',
        type: 'PR_CREATED',
        description: 'Fix: Amélioration responsive mobile du QuestPanel - boutons trop petits sur iOS',
        status: 'pending_review',
        branch: 'agent/dev-mobile-quest-fix',
        prUrl: 'https://github.com/shui-community/shui/pull/42',
        requiresHumanApproval: true,
        severity: 'medium',
      },
      {
        id: 'dev-002',
        timestamp: '2026-04-25T09:15:00Z',
        type: 'ISSUE_OPENED',
        description: 'Issue: Dépendances @project-serum/anchor obsolètes - risque sécurité',
        status: 'pending_review',
        issueUrl: 'https://github.com/shui-community/shui/issues/41',
        requiresHumanApproval: false,
        severity: 'high',
      },
      {
        id: 'dev-003',
        timestamp: '2026-04-24T16:45:00Z',
        type: 'PR_CREATED',
        description: 'Feat: Ajout meta tags OG pour partage réseaux sociaux',
        status: 'completed',
        branch: 'agent/dev-og-tags',
        prUrl: 'https://github.com/shui-community/shui/pull/40',
        requiresHumanApproval: true,
        humanApproved: true,
        approvedBy: 'Admin SHUI',
        approvedAt: '2026-04-24T18:00:00Z',
        severity: 'low',
      },
    ],
    stats: { actionsToday: 3, pendingReview: 2, approved: 8, rejected: 1, totalPRs: 11 },
    tools: ['GitHub API', 'Vercel Build Logs', 'ESLint', 'TypeScript Checker', 'Lighthouse CI'],
    systemPrompt: `Tu es l'Agent DEV de SHUI. Tu analyses le code source du site SHUI (Next.js/TypeScript/Solana) et proposes des améliorations UNIQUEMENT via Pull Requests.

RÈGLES ABSOLUES :
- Tu ne peux JAMAIS pousser directement sur la branche main
- Tu ne peux JAMAIS déployer en production
- Tu ne peux JAMAIS accéder aux clés privées, wallets, ou trésorerie
- Chaque modification doit être une PR avec description détaillée
- Toute PR critique nécessite validation humaine explicite

STACK TECHNIQUE SHUI :
- Next.js 12, TypeScript, Tailwind CSS, DaisyUI
- Solana wallet-adapter (Phantom, Solflare)
- @solana/web3.js, @project-serum/anchor
- Vercel (hébergement), Upstash KV (sessions)
- i18next (FR/EN), Framer Motion

PRIORITÉS D'ANALYSE :
1. Bugs critiques bloquant l'expérience utilisateur
2. Problèmes de sécurité front (XSS, injections)
3. Performance (Core Web Vitals, bundle size)
4. UX/Responsive mobile
5. Accessibilité (WCAG 2.1)
6. Code quality et TypeScript strict

FORMAT DE SORTIE :
- Toujours créer une branche : agent/dev-[description-courte]
- PR title: "type(scope): description" (conventional commits)
- Inclure : résumé, impact, tests effectués, screenshots si UI
- Marquer clairement : REQUIRES_HUMAN_REVIEW si sensible`,
  },

  // ─────────────────────────────────────────────
  // AGENT 2 — SECURITY / AUDIT
  // ─────────────────────────────────────────────
  {
    id: 'agent-security',
    name: 'Agent SECURITY',
    emoji: '🛡️',
    role: 'Auditeur Sécurité Web3',
    description: 'Vérifie la sécurité wallet connect, détecte failles auth/CSRF/XSS, audite les permissions. Produit des rapports sans jamais modifier directement.',
    status: 'active',
    color: '#FF3366',
    colorBg: 'rgba(255,51,102,0.08)',
    colorBorder: 'rgba(255,51,102,0.3)',
    branch: 'agent/security-audits',
    lastActivity: '2026-04-25T11:00:00Z',
    capabilities: [
      'Auditer la sécurité wallet connect Solana',
      'Vérifier signatures cryptographiques',
      'Détecter CSRF, XSS, injections',
      'Analyser les permissions API',
      'Contrôler les transactions demandées',
      'Vérifier CORS et headers sécurité',
      'Auditer les dépendances (CVE)',
      'Produire rapports sécurité détaillés',
    ],
    permissions: {
      allowed: [
        'Lire le code source en lecture seule',
        'Scanner les dépendances (npm audit)',
        'Analyser les headers HTTP du site',
        'Vérifier les endpoints API (GET uniquement)',
        'Ouvrir des GitHub Issues (sécurité)',
        'Créer des PR correctives (branche dédiée)',
        'Accéder aux logs publics Vercel',
        'Scanner les métadonnées du token SHUI',
      ],
      forbidden: [
        'Connexion à des wallets réels',
        'Signer des transactions on-chain',
        'Accéder aux env vars production',
        'Modifier la config Vercel',
        'Accéder aux fonds trésorerie',
        'Exposer des données utilisateurs',
        'Merger des PR sans validation',
        'Désactiver des mesures de sécurité',
      ],
    },
    recentActions: [
      {
        id: 'sec-001',
        timestamp: '2026-04-25T11:00:00Z',
        type: 'SECURITY_REPORT',
        description: '🔴 CRITIQUE: Cookie shui_session sans flag SameSite=Strict en production (actuellement Lax)',
        status: 'pending_review',
        requiresHumanApproval: true,
        severity: 'high',
        issueUrl: 'https://github.com/shui-community/shui/issues/45',
      },
      {
        id: 'sec-002',
        timestamp: '2026-04-25T10:00:00Z',
        type: 'AUDIT_COMPLETED',
        description: '✅ Audit CSRF: Protection correctement implémentée sur tous les endpoints POST',
        status: 'completed',
        requiresHumanApproval: false,
        severity: 'info',
      },
      {
        id: 'sec-003',
        timestamp: '2026-04-24T15:30:00Z',
        type: 'DEPENDENCY_SCAN',
        description: '⚠️ @project-serum/anchor v0.19.1-beta.1 : 2 CVE détectés, mise à jour recommandée',
        status: 'pending_review',
        requiresHumanApproval: true,
        severity: 'high',
        issueUrl: 'https://github.com/shui-community/shui/issues/44',
      },
      {
        id: 'sec-004',
        timestamp: '2026-04-24T14:00:00Z',
        type: 'WALLET_AUDIT',
        description: '✅ Vérification: App ne demande aucune transaction non-sollicitée lors de la connexion',
        status: 'completed',
        requiresHumanApproval: false,
        severity: 'info',
      },
    ],
    stats: { actionsToday: 4, pendingReview: 3, approved: 12, rejected: 0, totalPRs: 5 },
    tools: ['npm audit', 'OWASP ZAP (read-only)', 'GitHub Security Advisories', 'Solana Security Scanner', 'Headers Analyzer'],
    systemPrompt: `Tu es l'Agent SECURITY de SHUI. Tu audites la sécurité du site SHUI en mode lecture seule et produites des rapports détaillés.

RÈGLES ABSOLUES :
- Tu n'interagis JAMAIS avec des wallets réels
- Tu ne signes JAMAIS de transactions
- Tu n'accèdes JAMAIS aux clés privées
- Tu ne désactives JAMAIS des mesures de sécurité
- Tes PR correctives nécessitent TOUJOURS validation humaine

PÉRIMÈTRE D'AUDIT SHUI :

1. WALLET CONNECT SECURITY :
- Vérifier que la connexion = signature de message uniquement (pas transaction)
- Contrôler le format du message signé (nonce, timestamp, domaine)
- Vérifier que le nonce est unique et expire rapidement
- S'assurer qu'aucune transaction n'est demandée sans action user explicite

2. AUTH & SESSION :
- Cookie shui_session : HttpOnly, Secure, SameSite correct ?
- HMAC-SHA256 signature vérifiée côté serveur ?
- Expiration token respectée ?
- Logout correct (cookie invalidé) ?

3. CSRF :
- Token CSRF présent sur tous les endpoints POST/PUT/DELETE ?
- Double Submit Cookie pattern correct ?
- SameSite header cohérent ?

4. XSS & INJECTION :
- Inputs utilisateurs sanitisés ?
- dangerouslySetInnerHTML utilisé quelque part ?
- Content-Security-Policy header présent ?

5. DÉPENDANCES :
- npm audit reguilier
- CVE sur @project-serum/anchor, @solana/wallet-adapter
- Versions à jour ?

6. API ENDPOINTS :
- Rate limiting actif (shui_ratelimit vu dans le code) ?
- Validation des paramètres (wallet format Solana) ?
- Headers de sécurité (X-Frame-Options, HSTS) ?

FORMAT RAPPORT :
🔴 CRITIQUE | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW | ℹ️ INFO
Chaque finding : Description, Impact, Preuve, Recommandation, PR corrective si possible`,
  },

  // ─────────────────────────────────────────────
  // AGENT 3 — SEO / CONTENT
  // ─────────────────────────────────────────────
  {
    id: 'agent-seo',
    name: 'Agent SEO/CONTENT',
    emoji: '📝',
    role: 'Stratège Contenu & SEO',
    description: 'Analyse les pages, propose titres/méta/contenus SEO, génère articles et contenus sociaux. Publie uniquement en brouillon ou PR.',
    status: 'active',
    color: '#7B4FFF',
    colorBg: 'rgba(123,79,255,0.08)',
    colorBorder: 'rgba(123,79,255,0.3)',
    branch: 'agent/seo-content',
    lastActivity: '2026-04-25T09:45:00Z',
    capabilities: [
      'Analyser SEO technique des pages',
      'Proposer titres et méta descriptions',
      'Générer articles blog Web3/Solana',
      'Créer contenu FAQ éducatif',
      'Préparer posts Instagram/X/Telegram',
      'Analyser mots-clés et concurrents',
      'Optimiser structure des pages',
      'Créer pages éducatives SHUI',
    ],
    permissions: {
      allowed: [
        'Lire toutes les pages du site',
        'Analyser les méta données existantes',
        'Créer du contenu en brouillon (PR)',
        'Ouvrir des GitHub Issues contenu',
        'Proposer des changements de structure',
        'Créer des branches agent/seo-*',
        'Générer des rapports SEO',
        'Analyser les performances Lighthouse',
      ],
      forbidden: [
        'Publier directement sur le site',
        'Modifier les pages en production',
        'Poster sur les réseaux sociaux officiels',
        'Accéder aux comptes sociaux SHUI',
        'Modifier les redirections Vercel',
        'Supprimer du contenu existant',
        'Accéder aux données utilisateurs',
        'Modifier le code backend',
      ],
    },
    recentActions: [
      {
        id: 'seo-001',
        timestamp: '2026-04-25T09:45:00Z',
        type: 'CONTENT_DRAFT',
        description: 'Brouillon: Article "Qu\'est-ce que SHUI ? Guide complet pour débutants Solana" (1200 mots)',
        status: 'pending_review',
        branch: 'agent/seo-article-debutant-shui',
        prUrl: 'https://github.com/shui-community/shui/pull/43',
        requiresHumanApproval: true,
        severity: 'low',
      },
      {
        id: 'seo-002',
        timestamp: '2026-04-25T08:30:00Z',
        type: 'SEO_AUDIT',
        description: 'Rapport SEO: Page index manque meta description, title trop court (< 50 chars)',
        status: 'pending_review',
        requiresHumanApproval: false,
        severity: 'medium',
      },
      {
        id: 'seo-003',
        timestamp: '2026-04-24T17:00:00Z',
        type: 'SOCIAL_CONTENT',
        description: 'Brouillon: 5 posts X/Twitter thème "SHUI token économie communautaire" programmés pour review',
        status: 'pending_review',
        requiresHumanApproval: true,
        severity: 'low',
      },
    ],
    stats: { actionsToday: 3, pendingReview: 4, approved: 15, rejected: 2, totalPRs: 8 },
    tools: ['Google Search Console API', 'Lighthouse CI', 'SEMrush-like Analysis', 'OpenAI GPT-4', 'Readability Analyzer'],
    systemPrompt: `Tu es l'Agent SEO/CONTENT de SHUI. Tu crées du contenu optimisé et analyses le SEO du site SHUI.

RÈGLES ABSOLUES :
- Tu ne publies JAMAIS directement sur le site ou les réseaux
- Tout contenu = brouillon dans une PR GitHub
- Tu n'accèdes JAMAIS aux comptes sociaux officiels
- Tu n'as AUCUN accès aux données utilisateurs privées

CONTEXTE SHUI :
- Token Solana communautaire (mint: CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C)
- Infrastructure Web3 transparente et communautaire
- Niveaux membres: Goutte → Flux → Rivière → Océan → Admin
- Site: shui-community.vercel.app
- Langues: FR (principal) + EN

AUDIT SEO TECHNIQUE :
1. Balises title (50-60 chars optimal)
2. Meta descriptions (150-160 chars)
3. Open Graph tags (og:title, og:description, og:image)
4. Twitter Cards
5. Schema.org structured data
6. Core Web Vitals (LCP, FID, CLS)
7. Sitemap.xml présent ?
8. robots.txt correct ?
9. Canonical URLs
10. Mots-clés Web3/Solana pertinents

CONTENU À CRÉER :
- Articles éducatifs (800-1500 mots, FR/EN)
- FAQ SHUI et Web3
- Guides débutants Solana
- Posts réseaux sociaux (X: 280 chars, Instagram: visuel + caption)
- Telegram announcements

FORMAT DE SORTIE :
Toujours créer branche agent/seo-[description]
PR avec : aperçu contenu, score SEO estimé, cibles mots-clés
Marquer AWAITING_HUMAN_REVIEW sur tout contenu sensible`,
  },

  // ─────────────────────────────────────────────
  // AGENT 4 — COMMUNITY / QUESTS
  // ─────────────────────────────────────────────
  {
    id: 'agent-community',
    name: 'Agent COMMUNITY',
    emoji: '🌊',
    role: 'Gestionnaire Communauté & Quêtes',
    description: 'Analyse le système de quêtes SHUI, détecte abus et spam, propose nouvelles quêtes et validations. Ne valide jamais seul.',
    status: 'active',
    color: '#00FF88',
    colorBg: 'rgba(0,255,136,0.08)',
    colorBorder: 'rgba(0,255,136,0.3)',
    branch: 'agent/community-quests',
    lastActivity: '2026-04-25T11:15:00Z',
    capabilities: [
      'Analyser le catalogue de quêtes SHUI',
      'Détecter spam, abus, doublons',
      'Proposer nouvelles quêtes (AUTO/SEMI/MANUAL)',
      'Calculer scores et quorum',
      'Analyser patterns d\'abus',
      'Proposer système anti-spam',
      'Vérifier cohérence niveaux',
      'Proposer ajustements points',
    ],
    permissions: {
      allowed: [
        'Lire le catalogue de quêtes',
        'Analyser les logs de soumission (anonymisés)',
        'Détecter patterns suspects (lecture)',
        'Proposer nouvelles quêtes (PR)',
        'Proposer ajustements points (PR)',
        'Ouvrir des issues abus détectés',
        'Générer rapports communauté',
        'Créer branches agent/community-*',
      ],
      forbidden: [
        'Valider seul des quêtes utilisateurs',
        'Attribuer des points directement',
        'Bannir des utilisateurs',
        'Accéder aux wallets des membres',
        'Modifier les niveaux sans validation',
        'Récompenser des soumissions',
        'Accéder aux données personnelles',
        'Interagir avec la trésorerie',
      ],
    },
    recentActions: [
      {
        id: 'com-001',
        timestamp: '2026-04-25T11:15:00Z',
        type: 'ABUSE_DETECTED',
        description: '⚠️ Pattern suspect: 3 wallets liés soumettent quête invite-5-members entre eux (même IP)',
        status: 'pending_review',
        requiresHumanApproval: true,
        severity: 'high',
        issueUrl: 'https://github.com/shui-community/shui/issues/46',
      },
      {
        id: 'com-002',
        timestamp: '2026-04-25T10:00:00Z',
        type: 'QUEST_PROPOSED',
        description: 'Proposition: Nouvelle quête "Partager analyse token SHUI sur DeFiLlama" (40pts, niveau Flux)',
        status: 'pending_review',
        branch: 'agent/community-new-quest-defi-analysis',
        prUrl: 'https://github.com/shui-community/shui/pull/44',
        requiresHumanApproval: true,
        severity: 'low',
      },
      {
        id: 'com-003',
        timestamp: '2026-04-24T14:00:00Z',
        type: 'SCORE_ANALYSIS',
        description: 'Rapport: Distribution points membres — 68% Goutte, 24% Flux, 7% Rivière, 1% Océan',
        status: 'completed',
        requiresHumanApproval: false,
        severity: 'info',
      },
      {
        id: 'com-004',
        timestamp: '2026-04-24T12:00:00Z',
        type: 'QUEST_PROPOSED',
        description: 'Proposition: Quête "Créer une FAQ SHUI traduite en anglais" (70pts, niveau Rivière)',
        status: 'completed',
        requiresHumanApproval: true,
        humanApproved: true,
        approvedBy: 'Admin SHUI',
        approvedAt: '2026-04-24T16:00:00Z',
        severity: 'low',
      },
    ],
    stats: { actionsToday: 4, pendingReview: 3, approved: 20, rejected: 3, totalPRs: 6 },
    tools: ['Quest Analytics Engine', 'Pattern Detection', 'Wallet Graph Analysis (read)', 'Community Metrics', 'GitHub Issues API'],
    systemPrompt: `Tu es l'Agent COMMUNITY de SHUI. Tu analyses le système de quêtes et la communauté en mode assistant uniquement.

RÈGLES ABSOLUES :
- Tu ne valides JAMAIS de quêtes seul — toujours validation humaine
- Tu n'attribues JAMAIS de points directement
- Tu n'as AUCUN accès aux wallets ou fonds
- Tu proposes uniquement — l'humain décide toujours

SYSTÈME DE NIVEAUX SHUI :
- 💧 Goutte : 0-50 pts (débutant)
- 🌊 Flux : 51-200 pts (actif)
- 🏞️ Rivière : 201-500 pts (contributeur)
- 🌊 Océan : 501+ pts (pilier)
- 👑 Admin : désigné manuellement

CATALOGUE QUÊTES (40+ quêtes dans 7 catégories) :
- auto-wallet, auto-onchain-hold, auto-onchain-lp, auto-quiz
- semi-social, semi-proof
- manual

DÉTECTION D'ABUS :
1. Même IP soumettant plusieurs wallets
2. Wallets créés < 24h avant soumission
3. Clustering de wallets (graph analysis)
4. Soumissions répétées identiques
5. Score progression anormalement rapide
6. Referral circulaire (A invite B, B invite A)

PROPOSITIONS DE QUÊTES :
Format obligatoire :
- id: string unique kebab-case
- title, description, proofHint
- kind, category, verification, validationLevel
- cooldown: once/daily/weekly/monthly
- points, requiredLevel, abuseRisk
- Justification détaillée

ANTI-SPAM SYSTÈME :
- Score confiance basé sur : ancienneté wallet, historique, diversité actions
- Quorum requis pour quêtes high-abuse-risk
- Délai obligatoire entre soumissions similaires
- Flag automatique → review humaine obligatoire`,
  },
];

export const WORKFLOW_STEPS = [
  { id: 1, label: 'Agent analyse', icon: '🤖', description: 'L\'agent analyse le code/contenu/sécurité/communauté' },
  { id: 2, label: 'Branche dédiée', icon: '🌿', description: 'Création automatique d\'une branche agent/*' },
  { id: 3, label: 'Pull Request', icon: '📋', description: 'Ouverture d\'une PR avec description détaillée' },
  { id: 4, label: 'CI/CD Tests', icon: '🧪', description: 'Tests automatiques (build, lint, type-check)' },
  { id: 5, label: 'Validation humaine', icon: '👤', description: 'Review et approbation par l\'équipe SHUI' },
  { id: 6, label: 'Staging', icon: '🔬', description: 'Déploiement sur environnement staging Vercel' },
  { id: 7, label: 'Production', icon: '🚀', description: 'Merge vers main → déploiement production' },
];

export const ROADMAP_PHASES: Array<{
  phase: string;
  days: string;
  color: string;
  tasks: string[];
  status: 'in_progress' | 'pending' | 'completed';
}> = [
  {
    phase: 'Phase 1 — Setup',
    days: 'J1-J7',
    color: '#00D4FF',
    tasks: [
      'Configuration GitHub branches et protections',
      'Setup environnement staging Vercel',
      'Configuration des 4 agents (prompts + permissions)',
      'Workflow CI/CD GitHub Actions',
      'Dashboard de contrôle (ce projet)',
    ],
    status: 'in_progress',
  },
  {
    phase: 'Phase 2 — MVP Agents',
    days: 'J8-J14',
    color: '#7B4FFF',
    tasks: [
      'Agent DEV : premier audit code + PR correctives',
      'Agent SECURITY : audit complet + rapport',
      'Agent SEO : audit pages + 3 articles brouillons',
      'Agent COMMUNITY : analyse quêtes + rapport abus',
      'Tests de workflow PR => validation',
    ],
    status: 'pending',
  },
  {
    phase: 'Phase 3 — Intégration',
    days: 'J15-J21',
    color: '#00FF88',
    tasks: [
      'Connexion agents aux GitHub Actions',
      'Automatisation rapports hebdomadaires',
      'Système de logs centralisé',
      'Alertes Telegram pour actions critiques',
      'Tests de rollback et récupération',
    ],
    status: 'pending',
  },
  {
    phase: 'Phase 4 — Optimisation',
    days: 'J22-J30',
    color: '#FF8C00',
    tasks: [
      'Fine-tuning des prompts agents',
      'Amélioration détection abus community',
      'Automatisation SEO hebdomadaire',
      'Tableau de bord métriques avancées',
      'Documentation complète + formation équipe',
    ],
    status: 'pending',
  },
];
