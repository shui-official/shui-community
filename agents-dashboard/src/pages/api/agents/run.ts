import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type AgentKey = 'dev' | 'security' | 'seo' | 'community';

const ALLOWED_AGENTS: AgentKey[] = ['dev', 'security', 'seo', 'community'];

const FILE_TARGETS: Record<AgentKey, string[]> = {
  dev: [
    'src',
    'pages',
    'components',
    'lib',
    'package.json',
    'tsconfig.json',
  ],
  security: [
    'src/pages/api',
    'src/lib',
    'middleware.ts',
    'package.json',
    'package-lock.json',
  ],
  seo: [
    'src/pages',
    'pages',
    'public',
    'next.config.js',
    'package.json',
  ],
  community: [
    'src/lib/quests/catalog.ts',
    'agents/rules/anti-abuse.md',
    'agents/community/system-prompt.md',
  ],
};

const BLOCKED_PATTERNS = [
  '.env',
  'node_modules',
  '.next',
  '.git',
  'private',
  'secret',
  'wallet.json',
  'keypair',
];

function repoRoot(): string {
  return path.join(process.cwd(), '..');
}

function isBlocked(filePath: string): boolean {
  const normalized = filePath.toLowerCase();
  return BLOCKED_PATTERNS.some((p) => normalized.includes(p));
}

function safeRead(filePath: string, maxChars = 6000): string {
  if (isBlocked(filePath)) return '[BLOCKED]';
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.slice(0, maxChars);
  } catch {
    return '';
  }
}

function listFiles(target: string): string[] {
  const root = repoRoot();
  const full = path.join(root, target);

  if (!fs.existsSync(full)) return [];
  if (isBlocked(full)) return [];

  const stat = fs.statSync(full);

  if (stat.isFile()) return [full];

  const results: string[] = [];

  function walk(dir: string) {
    if (results.length >= 25) return;
    if (isBlocked(dir)) return;

    for (const item of fs.readdirSync(dir)) {
      if (results.length >= 25) return;

      const p = path.join(dir, item);
      if (isBlocked(p)) continue;

      const s = fs.statSync(p);

      if (s.isDirectory()) {
        walk(p);
      } else if (/\.(ts|tsx|js|jsx|md|json|css)$/.test(p)) {
        results.push(p);
      }
    }
  }

  walk(full);
  return results;
}

function readSystemPrompt(agent: AgentKey): string {
  const promptPath = path.join(repoRoot(), 'agents', agent, 'system-prompt.md');
  return safeRead(promptPath, 12000);
}

function getAgentFiles(agent: AgentKey): { relative: string; content: string }[] {
  const root = repoRoot();
  const files = FILE_TARGETS[agent].flatMap(listFiles);

  return files.slice(0, 12).map((file) => ({
    relative: path.relative(root, file),
    content: safeRead(file),
  }));
}

function analyzeDev(files: { relative: string; content: string }[]): string[] {
  const findings: string[] = [];

  for (const f of files) {
    if (f.content.includes('any')) {
      findings.push(`🟡 ${f.relative}: présence possible de type \`any\` à vérifier.`);
    }
    if (f.content.includes('console.log')) {
      findings.push(`🟢 ${f.relative}: \`console.log\` détecté, à retirer si non nécessaire.`);
    }
    if (f.content.includes('useEffect') && !f.content.includes('eslint-disable-next-line react-hooks/exhaustive-deps')) {
      findings.push(`ℹ️ ${f.relative}: hooks React présents, vérifier les dépendances useEffect.`);
    }
  }

  return findings;
}

function analyzeSecurity(files: { relative: string; content: string }[]): string[] {
  const findings: string[] = [];

  for (const f of files) {
    if (f.content.includes('dangerouslySetInnerHTML')) {
      findings.push(`🟠 ${f.relative}: \`dangerouslySetInnerHTML\` détecté, risque XSS à auditer.`);
    }
    if (f.content.includes('localStorage') || f.content.includes('sessionStorage')) {
      findings.push(`🟡 ${f.relative}: stockage navigateur détecté, vérifier absence de token/session sensible.`);
    }
    if (f.content.includes('POST') && !f.content.toLowerCase().includes('csrf')) {
      findings.push(`🟡 ${f.relative}: endpoint/action POST possible sans mention CSRF visible.`);
    }
    if (f.content.includes('process.env')) {
      findings.push(`ℹ️ ${f.relative}: variables d'environnement utilisées, vérifier qu'aucun secret n'est exposé client.`);
    }
  }

  return findings;
}

function analyzeSeo(files: { relative: string; content: string }[]): string[] {
  const findings: string[] = [];

  for (const f of files) {
    if (/\.(tsx|jsx|ts|js)$/.test(f.relative)) {
      if (!f.content.includes('<Head') && !f.content.includes('metadata')) {
        findings.push(`ℹ️ ${f.relative}: vérifier présence title/meta si page publique.`);
      }
      if (!f.content.includes('og:') && f.relative.includes('page')) {
        findings.push(`🟢 ${f.relative}: Open Graph non visible dans l'extrait analysé.`);
      }
    }
  }

  return findings;
}

function analyzeCommunity(files: { relative: string; content: string }[]): string[] {
  const findings: string[] = [];

  for (const f of files) {
    if (f.relative.endsWith('catalog.ts')) {
      if (f.content.includes('auto-onchain-hold') || f.content.includes('auto-onchain-lp')) {
        findings.push(`🟠 ${f.relative}: quêtes on-chain automatiques détectées, surveiller farming daily et multiplicateurs.`);
      }
      if (f.content.includes('semi-social') && f.content.includes('abuseRisk: "low"')) {
        findings.push(`🟡 ${f.relative}: certaines quêtes sociales semi-auto semblent classées low, risque farming à revoir.`);
      }
      if (f.content.includes('pointsToShui(points)')) {
        findings.push(`ℹ️ ${f.relative}: conversion points→SHUI détectée, tout changement de points a un impact économique.`);
      }
    }
  }

  return findings;
}

function buildFindings(agent: AgentKey, files: { relative: string; content: string }[]): string[] {
  const map = {
    dev: analyzeDev,
    security: analyzeSecurity,
    seo: analyzeSeo,
    community: analyzeCommunity,
  };

  const findings = map[agent](files);
  return findings.length ? findings : ['ℹ️ Aucun finding évident détecté dans les fichiers analysés.'];
}

function buildResponse(agent: AgentKey, userPrompt: string, systemPrompt: string, files: { relative: string; content: string }[]): string {
  const branchPrefix: Record<AgentKey, string> = {
    dev: 'agent/dev-readonly-diagnostic',
    security: 'agent/security-readonly-audit',
    seo: 'agent/seo-readonly-draft',
    community: 'agent/community-readonly-review',
  };

  const findings = buildFindings(agent, files);

  return [
    `# Agent ${agent.toUpperCase()} — Analyse V2 lecture seule`,
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
    `## Prompt système`,
    `Prompt chargé correctement (${systemPrompt.length} caractères).`,
    ``,
    `## Fichiers analysés`,
    ...files.map((f) => `- \`${f.relative}\``),
    ``,
    `## Findings`,
    ...findings.map((f) => `- ${f}`),
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agent, prompt } = req.body || {};

  if (!ALLOWED_AGENTS.includes(agent)) {
    return res.status(400).json({ error: 'Agent invalide' });
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
    return res.status(400).json({ error: 'Prompt trop court' });
  }

  try {
    const systemPrompt = readSystemPrompt(agent);
    const files = getAgentFiles(agent);

    return res.status(200).json({
      ok: true,
      agent,
      mode: 'readonly-analysis-v2',
      result: buildResponse(agent, prompt.trim(), systemPrompt, files),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: String(error),
    });
  }
}
