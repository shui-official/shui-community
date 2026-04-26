import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type AgentKey = 'dev' | 'security' | 'seo' | 'community';

const ALLOWED_AGENTS: AgentKey[] = ['dev', 'security', 'seo', 'community'];

function readSystemPrompt(agent: AgentKey): string {
  const promptPath = path.join(process.cwd(), '..', 'agents', agent, 'system-prompt.md');
  return fs.readFileSync(promptPath, 'utf8');
}

function buildSafeResponse(agent: AgentKey, userPrompt: string, systemPrompt: string): string {
  const branchPrefix: Record<AgentKey, string> = {
    dev: 'agent/dev-diagnostic',
    security: 'agent/security-audit',
    seo: 'agent/seo-content-draft',
    community: 'agent/community-quest-review',
  };

  return [
    `# Simulation Agent ${agent.toUpperCase()} — Mode SAFE LOCAL`,
    ``,
    `## Mission reçue`,
    userPrompt,
    ``,
    `## Statut`,
    `Aucune modification effectuée.`,
    `Aucun push GitHub.`,
    `Aucune PR créée automatiquement.`,
    `Aucun accès wallet, clé privée, treasury ou production.`,
    ``,
    `## Branche recommandée`,
    `\`${branchPrefix[agent]}\``,
    ``,
    `## Lecture prompt système`,
    `Prompt chargé correctement (${systemPrompt.length} caractères).`,
    ``,
    `## Réponse contrôlée`,
    `Je peux analyser et proposer un plan d'action, mais toute modification doit passer par une branche agent/* puis une Pull Request vers staging.`,
    ``,
    `## Prochaine étape recommandée`,
    `1. Diagnostic lecture seule`,
    `2. Proposition de changement minimal`,
    `3. Validation humaine`,
    `4. PR vers staging si validé`,
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

    return res.status(200).json({
      ok: true,
      agent,
      mode: 'safe-local-simulation',
      result: buildSafeResponse(agent, prompt.trim(), systemPrompt),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: String(error),
    });
  }
}
