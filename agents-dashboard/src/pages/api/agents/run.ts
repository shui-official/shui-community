import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type AgentKey = 'dev' | 'security' | 'seo' | 'community';
type Finding = { severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; file: string; message: string; action: string };

const ALLOWED_AGENTS: AgentKey[] = ['dev', 'security', 'seo', 'community'];

const FILE_TARGETS: Record<AgentKey, string[]> = {
  dev: ['src/components', 'src/lib', 'src/pages', 'package.json', 'tsconfig.json'],
  security: ['src/pages/api', 'src/lib', 'middleware.ts', 'package.json', 'package-lock.json'],
  seo: ['src/pages/index.tsx', 'src/pages/404.tsx', 'src/pages/500.tsx', 'src/pages/_app.tsx', 'src/pages/_document.tsx', 'public', 'next.config.js'],
  community: ['src/lib/quests/catalog.ts', 'agents/rules/anti-abuse.md', 'agents/community/system-prompt.md'],
};

const BLOCKED_PATTERNS = ['.env', 'node_modules', '.next', '.git', 'private', 'secret', 'wallet.json', 'keypair'];

function repoRoot(): string {
  return path.join(process.cwd(), '..');
}

function isBlocked(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return BLOCKED_PATTERNS.some((p) => normalized.includes(p));
}

function safeRead(filePath: string, maxChars = 8000): string {
  if (isBlocked(filePath)) return '[BLOCKED]';
  try {
    return fs.readFileSync(filePath, 'utf8').slice(0, maxChars);
  } catch {
    return '';
  }
}

function isRelevantFile(agent: AgentKey, filePath: string): boolean {
  if (isBlocked(filePath)) return false;

  if (agent === 'seo' && filePath.includes('/api/')) return false;
  if (agent === 'seo' && !/\.(tsx|jsx|ts|js|md|json|xml|txt|ico|svg|png|jpg|jpeg|webp)$/.test(filePath)) return false;

  if (agent === 'dev' && !/\.(tsx|ts|jsx|js|json|css)$/.test(filePath)) return false;
  if (agent === 'security' && !/\.(ts|tsx|js|jsx|json|md)$/.test(filePath)) return false;
  if (agent === 'community' && !/\.(ts|md|json)$/.test(filePath)) return false;

  return true;
}

function listFiles(agent: AgentKey, target: string): string[] {
  const root = repoRoot();
  const full = path.join(root, target);
  if (!fs.existsSync(full) || isBlocked(full)) return [];

  const stat = fs.statSync(full);
  if (stat.isFile()) return isRelevantFile(agent, full) ? [full] : [];

  const results: string[] = [];

  function walk(dir: string) {
    if (results.length >= 30 || isBlocked(dir)) return;

    for (const item of fs.readdirSync(dir)) {
      if (results.length >= 30) return;
      const p = path.join(dir, item);
      if (isBlocked(p)) continue;
      const s = fs.statSync(p);

      if (s.isDirectory()) walk(p);
      else if (isRelevantFile(agent, p)) results.push(p);
    }
  }

  walk(full);
  return results;
}

function readSystemPrompt(agent: AgentKey): string {
  return safeRead(path.join(repoRoot(), 'agents', agent, 'system-prompt.md'), 14000);
}

function getAgentFiles(agent: AgentKey): { relative: string; content: string }[] {
  const root = repoRoot();
  const files = FILE_TARGETS[agent].flatMap((target) => listFiles(agent, target));
  const unique = Array.from(new Set(files)).slice(0, 16);

  return unique.map((file) => ({
    relative: path.relative(root, file),
    content: safeRead(file),
  }));
}

function sevIcon(severity: Finding['severity']) {
  return { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', info: 'ℹ️' }[severity];
}

function confidenceScore(findings: Finding[]): number {
  const penalty = findings.reduce((acc, f) => {
    const weight = { critical: 30, high: 22, medium: 12, low: 6, info: 2 }[f.severity];
    return acc + weight;
  }, 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function analyzeDev(files: { relative: string; content: string }[]): Finding[] {
  const findings: Finding[] = [];

  for (const f of files) {
    if (/:\s*any\b|as\s+any\b|<any>/.test(f.content)) {
      findings.push({ severity: 'medium', file: f.relative, message: 'Type `any` explicite détecté.', action: 'Remplacer par un type précis ou `unknown` avec narrowing.' });
    }
    if (/\bconsole\.(log|debug)\(/.test(f.content)) {
      findings.push({ severity: 'low', file: f.relative, message: '`console.log/debug` détecté.', action: 'Supprimer ou remplacer par un logger contrôlé si nécessaire.' });
    }
    if (f.content.includes('useEffect') && /useEffect\s*\([^,]+,\s*\[\s*\]\s*\)/s.test(f.content)) {
      findings.push({ severity: 'info', file: f.relative, message: '`useEffect` avec dépendances vides détecté.', action: 'Vérifier que l’effet ne dépend pas de props/state externes.' });
    }
    if (/className="[^"]*(px-1|py-1|text-xs)[^"]*"/.test(f.content) && f.relative.toLowerCase().includes('quest')) {
      findings.push({ severity: 'low', file: f.relative, message: 'UI potentiellement petite dans un composant Quest.', action: 'Vérifier accessibilité mobile et taille tactile minimale.' });
    }
  }

  return findings;
}

function analyzeSecurity(files: { relative: string; content: string }[]): Finding[] {
  const findings: Finding[] = [];

  for (const f of files) {
    if (f.content.includes('dangerouslySetInnerHTML')) {
      findings.push({ severity: 'high', file: f.relative, message: '`dangerouslySetInnerHTML` détecté.', action: 'Auditer la source HTML et ajouter sanitization stricte.' });
    }
    if (/\b(localStorage|sessionStorage)\b/.test(f.content)) {
      findings.push({ severity: 'medium', file: f.relative, message: 'Stockage navigateur détecté.', action: 'Vérifier qu’aucune session, nonce ou donnée sensible n’y est stockée.' });
    }
    if (/req\.method\s*===\s*['"]POST['"]|method\s*:\s*['"]POST['"]/.test(f.content) && !/csrf/i.test(f.content)) {
      findings.push({ severity: 'medium', file: f.relative, message: 'POST détecté sans mention CSRF visible.', action: 'Vérifier protection CSRF ou justification API.' });
    }
    if (/Set-Cookie|serialize\(/.test(f.content) && !/HttpOnly/i.test(f.content)) {
      findings.push({ severity: 'high', file: f.relative, message: 'Cookie potentiel sans HttpOnly visible.', action: 'Vérifier flags HttpOnly, Secure, SameSite et expiration.' });
    }
    if (/process\.env\.NEXT_PUBLIC_/.test(f.content)) {
      findings.push({ severity: 'info', file: f.relative, message: 'Variable NEXT_PUBLIC détectée.', action: 'Confirmer qu’elle ne contient aucun secret.' });
    }
  }

  return findings;
}

function analyzeSeo(files: { relative: string; content: string }[]): Finding[] {
  const findings: Finding[] = [];

  for (const f of files) {
    const isPage = /^src\/pages\/(?!api\/).*\.(tsx|jsx)$/.test(f.relative) || /^pages\/(?!api\/).*\.(tsx|jsx)$/.test(f.relative);
    const isPublicSeoFile = /^public\/(robots\.txt|sitemap\.xml|.*\.(svg|png|jpg|jpeg|webp))$/.test(f.relative);

    if (isPage) {
      if (!/<Head[\s>]/.test(f.content) && !/next\/head/.test(f.content)) {
        findings.push({ severity: 'medium', file: f.relative, message: 'Page publique sans `next/head` visible.', action: 'Vérifier title, meta description, canonical et OG tags.' });
      }
      if (!/og:title|og:description|twitter:card/.test(f.content)) {
        findings.push({ severity: 'low', file: f.relative, message: 'Open Graph/Twitter Card non visible.', action: 'Ajouter ou centraliser les balises sociales si page indexable.' });
      }
      if (!/<h1[\s>]/i.test(f.content) && !f.relative.includes('_app') && !f.relative.includes('_document')) {
        findings.push({ severity: 'info', file: f.relative, message: 'H1 non visible dans l’extrait.', action: 'Vérifier structure H1/H2 pour SEO et accessibilité.' });
      }
    }

    if (isPublicSeoFile && f.relative.endsWith('robots.txt') && !/sitemap/i.test(f.content)) {
      findings.push({ severity: 'low', file: f.relative, message: '`robots.txt` sans référence sitemap visible.', action: 'Ajouter `Sitemap:` si sitemap disponible.' });
    }
  }

  return findings;
}

function analyzeCommunity(files: { relative: string; content: string }[]): Finding[] {
  const findings: Finding[] = [];

  for (const f of files) {
    if (!f.relative.endsWith('catalog.ts')) continue;

    if (f.content.includes('auto-onchain-hold') || f.content.includes('auto-onchain-lp')) {
      findings.push({ severity: 'high', file: f.relative, message: 'Quêtes on-chain automatiques avec cooldown daily détectées.', action: 'Ajouter plafonds, anti-sybil et détection hold/LP temporaire.' });
    }
    if (/verification:\s*"semi-social"[\s\S]{0,300}abuseRisk:\s*"low"/.test(f.content)) {
      findings.push({ severity: 'medium', file: f.relative, message: 'Quête sociale semi-auto classée low.', action: 'Reclasser en medium ou imposer preuve plus robuste.' });
    }
    if (/points:\s*\{\s*mode:\s*"fixed",\s*points:\s*500/.test(f.content)) {
      findings.push({ severity: 'medium', file: f.relative, message: 'Quête à 500 points détectée.', action: 'Maintenir validation manual + niveau Océan + review humaine.' });
    }
    if (f.content.includes('pointsToShui(points): number')) {
      findings.push({ severity: 'info', file: f.relative, message: 'Conversion points → SHUI détectée.', action: 'Documenter l’impact économique dans chaque PR de points.' });
    }
  }

  return findings;
}

function buildFindings(agent: AgentKey, files: { relative: string; content: string }[]): Finding[] {
  const map = { dev: analyzeDev, security: analyzeSecurity, seo: analyzeSeo, community: analyzeCommunity };
  const findings = map[agent](files);
  return findings.length ? findings : [{ severity: 'info', file: 'scope', message: 'Aucun finding évident détecté dans les fichiers analysés.', action: 'Élargir le scope ou lancer une revue manuelle ciblée.' }];
}

function recommendedAction(agent: AgentKey, findings: Finding[]): string {
  const highest = findings.some((f) => ['critical', 'high'].includes(f.severity))
    ? 'review humaine prioritaire avant correction'
    : findings.some((f) => f.severity === 'medium')
      ? 'proposer une PR corrective minimale'
      : 'documenter ou surveiller';

  const map: Record<AgentKey, string> = {
    dev: `Action DEV recommandée : ${highest}, en privilégiant un fix TypeScript/UI limité.`,
    security: `Action SECURITY recommandée : ${highest}, sans désactiver aucune protection.`,
    seo: `Action SEO recommandée : ${highest}, en ciblant uniquement les pages publiques indexables.`,
    community: `Action COMMUNITY recommandée : ${highest}, avec analyse impact points/SHUI.`,
  };

  return map[agent];
}

function buildResponse(agent: AgentKey, userPrompt: string, systemPrompt: string, files: { relative: string; content: string }[]): string {
  const branchPrefix: Record<AgentKey, string> = {
    dev: 'agent/dev-readonly-diagnostic',
    security: 'agent/security-readonly-audit',
    seo: 'agent/seo-readonly-draft',
    community: 'agent/community-readonly-review',
  };

  const findings = buildFindings(agent, files);
  const score = confidenceScore(findings);

  return [
    `# Agent ${agent.toUpperCase()} — Analyse V2.1 lecture seule`,
    ``,
    `## Mission reçue`,
    userPrompt,
    ``,
    `## Garanties de sécurité`,
    `- Aucune modification fichier`,
    `- Aucun push GitHub`,
    `- Aucune PR automatique`,
    `- Aucun accès .env*, wallet, clé privée, treasury ou production`,
    `- Lecture limitée à une whitelist de fichiers`,
    ``,
    `## Score de confiance`,
    `${score}/100`,
    ``,
    `## Prompt système`,
    `Prompt chargé correctement (${systemPrompt.length} caractères).`,
    ``,
    `## Fichiers analysés`,
    ...files.map((f) => `- \`${f.relative}\``),
    ``,
    `## Findings`,
    ...findings.map((f) => `- ${sevIcon(f.severity)} **${f.severity.toUpperCase()}** — \`${f.file}\`: ${f.message} Action: ${f.action}`),
    ``,
    `## Recommandation`,
    recommendedAction(agent, findings),
    ``,
    `## Branche recommandée si action validée`,
    `\`${branchPrefix[agent]}\``,
    ``,
    `## Prochaine étape proposée`,
    `1. Validation humaine du diagnostic`,
    `2. Si pertinent : créer une branche \`agent/*\``,
    `3. Appliquer un correctif minimal`,
    `4. Lancer \`npm run tsc\`, \`npm run lint\`, \`npm run build\``,
    `5. Ouvrir une PR vers \`staging\``,
    ``,
    `REQUIRES_HUMAN_REVIEW`,
  ].join('\n');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { agent, prompt } = req.body || {};

  if (!ALLOWED_AGENTS.includes(agent)) return res.status(400).json({ error: 'Agent invalide' });
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) return res.status(400).json({ error: 'Prompt trop court' });

  try {
    const systemPrompt = readSystemPrompt(agent);
    const files = getAgentFiles(agent);

    return res.status(200).json({
      ok: true,
      agent,
      mode: 'readonly-analysis-v2.1',
      result: buildResponse(agent, prompt.trim(), systemPrompt, files),
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
}
