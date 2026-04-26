import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type AgentKey = 'dev' | 'security' | 'seo' | 'community';

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

function repoRoot() {
  return path.resolve(process.cwd(), '..');
}

function safeRead(relativePath: string, maxChars = 12000): string {
  try {
    const fullPath = path.join(repoRoot(), relativePath);
    if (!fs.existsSync(fullPath)) return '';
    return fs.readFileSync(fullPath, 'utf8').slice(0, maxChars);
  } catch {
    return '';
  }
}

function readAgentPrompt(agent: AgentKey): string {
  return safeRead(`agents/${agent}/system-prompt.md`, 16000);
}

function readAgentConfig(agent: AgentKey): string {
  return safeRead(`agents/${agent}/config.json`, 8000);
}

function buildLocalFallback(agent: AgentKey, prompt: string) {
  const branch =
    agent === 'dev'
      ? 'agent/dev-maintenance-diagnostic'
      : agent === 'security'
        ? 'agent/security-readonly-audit'
        : `agent/${agent}-readonly-review`;

  return `# Agent ${agent.toUpperCase()} — diagnostic local

${SAFE_MODE_NOTICE}

## Demande utilisateur
${prompt}

## Résultat
Le LLM n'est pas activé localement.

Pour activer ChatGPT/OpenAI dans le dashboard local:
1. Copier agents-dashboard/.env.local.example vers agents-dashboard/.env.local
2. Ajouter OPENAI_API_KEY
3. Mettre AGENTS_LLM_ENABLED=true
4. Relancer le dashboard

## Branche recommandée
\`${branch}\`

## Règles
- PR vers staging uniquement
- Aucun push main/staging
- Aucun vercel --prod
- Toute modification sensible = REQUIRES_HUMAN_REVIEW
`;
}

async function callOpenAI(agent: AgentKey, userPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const enabled = process.env.AGENTS_LLM_ENABLED === 'true';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!enabled || !apiKey) {
    return buildLocalFallback(agent, userPrompt);
  }

  const systemPrompt = readAgentPrompt(agent);
  const config = readAgentConfig(agent);

  const messages = [
    {
      role: 'system',
      content: `${systemPrompt}

${SAFE_MODE_NOTICE}

Agent config:
${config}

Important:
Return only a maintenance diagnostic, risk level, proposed files, proposed commands, and PR summary.
Never claim that files were modified.
Never request or expose secrets.
Never suggest production deployment.
`,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 2200,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return `# Agent ${agent.toUpperCase()} — erreur LLM

${SAFE_MODE_NOTICE}

OpenAI API error: ${response.status}

${text.slice(0, 1200)}

Fallback:
${buildLocalFallback(agent, userPrompt)}
`;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || buildLocalFallback(agent, userPrompt);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agent, prompt } = req.body || {};

  if (!ALLOWED_AGENTS.includes(agent)) {
    return res.status(400).json({ error: 'Agent invalide' });
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    return res.status(400).json({ error: 'Prompt requis' });
  }

  try {
    const result = await callOpenAI(agent, prompt.trim());

    return res.status(200).json({
      ok: true,
      agent,
      mode: process.env.AGENTS_LLM_ENABLED === 'true' ? 'llm' : 'local-fallback',
      result,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Erreur agent',
    });
  }
}
