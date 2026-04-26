import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type AgentKey = 'dev' | 'security' | 'seo' | 'community';
type Finding = { severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; file: string; message: string; action: string };

const ALLOWED_AGENTS: AgentKey[] = ['dev', 'security', 'seo', 'community'];

const SAFE_MODE_NOTICE = `
MODE: READ_ONLY / SAFE_MAINTENANCE
- No automatic file writes
- No commit
- No push
- No deployment
- No wallet, private key, treasury, transaction access
- Output must be diagnostic + proposed patch only
`;

const FILE_TARGETS: Record<AgentKey, string[]> = {
  dev: ['src/components', 'src/lib', 'src/pages', 'package.json', 'tsconfig.json'],
  security: ['src/pages/api', 'src/lib', 'middleware.ts', 'package.json', 'package-lock.json'],
  seo: ['src/pages/index.tsx', 'src/pages/404.tsx', 'src/pages/500.tsx', 'src/pages/_app.tsx', 'src/pages/_document.tsx', 'public', 'next.config.js'],
  community: ['src/lib/quests/catalog.ts', 'src/lib/quests/store.ts', 'src/pages/api/quest', 'src/components/QuestPanel.tsx', 'agents/rules/anti-abuse.md', 'agents/community/system-prompt.md'],
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

function readSystemPrompt(agent: AgentKey): string {
  return safeRead(path.join(repoRoot(), 'agents', agent, 'system-prompt.md'), 16000);
}

function readAgentConfig(agent: AgentKey): string {
  return safeRead(path.join(repoRoot(), 'agents', agent, 'config.json'), 8000);
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
    if (/:\s*any\b|as\s+any\b|<any>/.test(f.content)) findings.push({ severity: 'medium', file: f.relative, message: 'Type `any` explicite détecté.', action: 'Remplacer par un type précis ou `unknown` avec narrowing.' });
    if (/\bconsole\.(log|debug)\(/.test(f.content)) findings.push({ severity: 'low', file: f.relative, message: '`console.log/debug` détecté.', action: 'Supprimer ou remplacer par un logger contrôlé si nécessaire.' });
    if (f.content.includes('useEffect') && /useEffect\s*\([^,]+,\s*\[\s*\]\s*\)/s.test(f.content)) findings.push({ severity: 'info', file: f.relative, message: '`useEffect` avec dépendances vides détecté.', action: 'Vérifier que l’effet ne dépend pas de props/state externes.' });
  }
  return findings;
}

function analyzeSecurity(files: { relative: string; content: string }[]): Finding[] {
  const findings: Finding[] = [];
  for (const f of files) {
    if (f.content.includes('dangerouslySetInnerHTML')) findings.push({ severity: 'high', file: f.relative, message: '`dangerouslySetInnerHTML` détecté.', action: 'Auditer la source HTML et ajouter sanitization stricte.' });
    if (/\b(localStorage|sessionStorage)\b/.test(f.content)) findings.push({ severity: 'medium', file: f.relative, message: 'Stockage navigateur détecté.', action: 'Vérifier qu’aucune session, nonce ou donnée sensible n’y est stockée.' });
    if (/req\.method\s*===\s*['"]POST['"]|method\s*:\s*['"]POST['"]/.test(f.content) && !/csrf/i.test(f.content)) findings.push({ severity: 'medium', file: f.relative, message: 'POST détecté sans mention CSRF visible.', action: 'Vérifier protection CSRF ou justification API.' });
    if (/Set-Cookie|serialize\(/.test(f.content) && !/HttpOnly/i.test(f.content)) findings.push({ severity: 'high', file: f.relative, message: 'Cookie potentiel sans HttpOnly visible.', action: 'Vérifier flags HttpOnly, Secure, SameSite et expiration.' });
  }
  return findings;
}

function analyzeSeo(files: { relative: string; content: string }[]): Finding[] {
  const findings: Finding[] = [];
  for (const f of files) {
    const isPage = /^src\/pages\/(?!api\/).*\.(tsx|jsx)$/.test(f.relative);
    if (isPage && !/<Head[\s>]/.test(f.content) && !/next\/head/.test(f.content)) findings.push({ severity: 'medium', file: f.relative, message: 'Page publique sans `next/head` visible.', action: 'Vérifier title, meta description, canonical et OG tags.' });
    if (isPage && !/og:title|og:description|twitter:card/.test(f.content)) findings.push({ severity: 'low', file: f.relative, message: 'Open Graph/Twitter Card non visible.', action: 'Ajouter ou centraliser les balises sociales si page indexable.' });
  }
  return findings;
}

function analyzeCommunity(files: { relative: string; content: string }[]): Finding[] {
  const findings: Finding[] = [];
  for (const f of files) {
    if (!f.relative.endsWith('catalog.ts') && !f.relative.endsWith('store.ts') && !f.relative.endsWith('claim.ts') && !f.relative.endsWith('QuestPanel.tsx')) continue;
    if (f.relative.endsWith('catalog.ts') && /verification:\s*"semi-social"[\s\S]{0,300}abuseRisk:\s*"low"/.test(f.content)) findings.push({ severity: 'medium', file: f.relative, message: 'Quête sociale semi-auto classée low.', action: 'Reclasser en medium ou imposer preuve plus robuste.' });
    if (f.relative.endsWith('store.ts') && f.content.includes('if (quest.cooldown === "once") return true;') && !f.content.includes('weekly')) findings.push({ severity: 'medium', file: f.relative, message: 'Cooldown weekly/monthly typé mais logique store limitée visible.', action: 'Vérifier implémentation réelle de weekly/monthly avant nouvelles quêtes récurrentes.' });
    if (f.relative.endsWith('claim.ts') && f.content.includes('verif === "manual"')) findings.push({ severity: 'high', file: f.relative, message: 'Quêtes manual/semi acceptées côté API via click/proof.', action: 'Imposer review humaine réelle avant attribution points pour semi/manual.' });
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

  return `Action ${agent.toUpperCase()} recommandée : ${highest}.`;
}

function buildReadonlyResponse(agent: AgentKey, userPrompt: string, systemPrompt: string, files: { relative: string; content: string }[]): string {
  const findings = buildFindings(agent, files);
  const score = confidenceScore(findings);

  return [
    `# Agent ${agent.toUpperCase()} — Analyse lecture seule`,
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
    `REQUIRES_HUMAN_REVIEW`,
  ].join('\n');
}

async function callOpenAI(agent: AgentKey, userPrompt: string, systemPrompt: string, files: { relative: string; content: string }[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  const enabled = process.env.AGENTS_LLM_ENABLED === 'true';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!enabled || !apiKey) {
    return buildReadonlyResponse(agent, userPrompt, systemPrompt, files);
  }

  const config = readAgentConfig(agent);
  const fileContext = files.map((f) => `--- ${f.relative} ---\n${f.content}`).join('\n\n');

  const messages = [
    {
      role: 'system',
      content: `${systemPrompt}

${SAFE_MODE_NOTICE}

Agent config:
${config}

Files read-only context:
${fileContext}

Return only a diagnostic, risk level, analyzed files, proposed commands, and PR summary.
Never claim files were modified.
Never request or expose secrets.
Never suggest production deployment.
`,
    },
    { role: 'user', content: userPrompt },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 2200 }),
  });

  if (!response.ok) {
    const text = await response.text();
    return `# Agent ${agent.toUpperCase()} — erreur LLM

${SAFE_MODE_NOTICE}

OpenAI API error: ${response.status}

${text.slice(0, 1200)}

Fallback:
${buildReadonlyResponse(agent, userPrompt, systemPrompt, files)}
`;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || buildReadonlyResponse(agent, userPrompt, systemPrompt, files);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { agent, prompt } = req.body || {};

  if (!ALLOWED_AGENTS.includes(agent)) return res.status(400).json({ error: 'Agent invalide' });
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) return res.status(400).json({ error: 'Prompt trop court' });

  try {
    const systemPrompt = readSystemPrompt(agent);
    const files = getAgentFiles(agent);
    const result = await callOpenAI(agent, prompt.trim(), systemPrompt, files);

    return res.status(200).json({
      ok: true,
      agent,
      mode: process.env.AGENTS_LLM_ENABLED === 'true' ? 'llm-readonly' : 'readonly-analysis',
      result,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
}
