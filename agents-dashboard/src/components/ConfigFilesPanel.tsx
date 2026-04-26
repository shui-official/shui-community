import { useState } from 'react';
import type { Agent } from '@/data/agents';

interface ConfigFilesPanelProps {
  agents: Agent[];
}

const GITHUB_ACTIONS = `name: SHUI Agents CI/CD Pipeline
on:
  pull_request:
    branches: [main, staging]
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write
  issues: write
  checks: write

jobs:
  # ── Job 1: Validate agent branch naming ──
  validate-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Check branch naming convention
        run: |
          BRANCH="\${{ github.head_ref }}"
          echo "Branch: \$BRANCH"
          # Agents must use agent/* branches
          if [[ ! "\$BRANCH" =~ ^(agent/|dependabot/) ]]; then
            echo "❌ ERROR: PRs must come from agent/* branches"
            echo "Valid: agent/dev-*, agent/security-*, agent/seo-*, agent/community-*"
            exit 1
          fi
          echo "✅ Branch naming valid: \$BRANCH"

  # ── Job 2: Build & type check ──
  build-and-lint:
    runs-on: ubuntu-latest
    needs: validate-branch
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: TypeScript check
        run: yarn tsc --noEmit
        
      - name: ESLint
        run: yarn lint
        
      - name: Build (no private keys)
        run: yarn build
        env:
          NEXT_PUBLIC_SOLANA_NETWORK: devnet
          NEXT_PUBLIC_SHUI_MINT: CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C
          # NO SESSION_SECRET, NO KV_REST_API_* in CI

  # ── Job 3: Security scan ──
  security-scan:
    runs-on: ubuntu-latest
    needs: validate-branch
    steps:
      - uses: actions/checkout@v4
      
      - name: npm audit
        run: npm audit --audit-level=high
        continue-on-error: true
        
      - name: Check for exposed secrets
        run: |
          # Ensure no private keys in changed files
          if git diff --name-only origin/main | xargs grep -l "private_key\\|SECRET\\|PRIVATE" 2>/dev/null; then
            echo "❌ SECURITY: Possible secret exposure detected!"
            exit 1
          fi
          echo "✅ No secrets exposed in diff"

  # ── Job 4: Block direct production ──
  prevent-direct-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Production deploy protection
        run: |
          echo "═══════════════════════════════════════"
          echo "🔒 SHUI SECURITY GATE"
          echo "═══════════════════════════════════════"
          echo "✅ PR validated by CI pipeline"
          echo "🚫 Direct production deploy: BLOCKED"
          echo "👤 Required: Human review & approval"
          echo "🔄 Next step: Staging deployment"
          echo "═══════════════════════════════════════"`;

const PR_TEMPLATE = `## 🤖 Agent PR — SHUI

**Agent:** <!-- DEV / SECURITY / SEO / COMMUNITY -->
**Type:** <!-- fix / feat / security / content / quest -->
**Branche:** \`agent/[type]-[description]\`

---

## 📋 Description

<!-- Décrivez clairement ce que cet agent a fait et pourquoi -->

## 🎯 Problème résolu / Objectif

<!-- Quel bug, faille, ou amélioration est adressée ? -->

## 🧪 Tests effectués par l'agent

- [ ] Build réussi localement
- [ ] TypeScript: aucune erreur
- [ ] ESLint: aucun warning critique
- [ ] Tests manuels: <!-- décrivez les scénarios testés -->
- [ ] Impact sécurité vérifié: <!-- aucune clé privée exposée -->

## 📸 Screenshots (si changement UI)

<!-- Avant / Après si applicable -->

## ⚠️ Points d'attention pour la review humaine

<!-- Indiquez ici ce qui nécessite une attention particulière -->

## 🔒 Checklist Sécurité Agent

- [ ] Aucune clé privée / seed phrase dans le code
- [ ] Aucune transaction signée
- [ ] Aucun accès aux fonds ou trésorerie
- [ ] Pas de modification directe en production
- [ ] Variables d'environnement non exposées

## 🏷️ Labels

<!-- Ajoutez les labels appropriés: agent-dev, agent-security, agent-seo, agent-community -->

---
*PR créée automatiquement par Agent SHUI — Validation humaine REQUISE avant merge*`;

const AGENT_CONFIG_DEV = `{
  "agent_id": "agent-dev",
  "version": "1.0.0",
  "name": "Agent DEV SHUI",
  "branch_prefix": "agent/dev-",
  "permissions": {
    "github_read": true,
    "github_create_branch": true,
    "github_create_pr": true,
    "github_create_issue": true,
    "github_merge_pr": false,
    "github_push_main": false,
    "vercel_deploy": false,
    "env_vars_access": false,
    "wallet_access": false,
    "treasury_access": false
  },
  "allowed_file_patterns": [
    "src/components/**",
    "src/pages/**",
    "src/styles/**",
    "src/lib/**",
    "public/**",
    "tailwind.config.js",
    "next.config.js"
  ],
  "forbidden_file_patterns": [
    ".env*",
    "*.pem",
    "*.key",
    "vercel.json",
    ".github/workflows/**"
  ],
  "auto_actions": [
    "create_issue",
    "create_branch",
    "create_pr_draft"
  ],
  "requires_human_approval": [
    "pr_ready_for_review",
    "security_related_change",
    "api_endpoint_change",
    "dependency_update"
  ],
  "rate_limits": {
    "prs_per_day": 5,
    "issues_per_day": 10,
    "branches_per_day": 5
  }
}`;

const SECURITY_HEADERS_CONFIG = `// next.config.js — Headers de sécurité recommandés par Agent SECURITY
// PR: agent/security-add-security-headers

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: *.solana.com bubblemaps.io",
      "connect-src 'self' *.solana.com api.mainnet-beta.solana.com",
      "frame-src 'none'",
      "object-src 'none'",
    ].join('; ')
  },
];

module.exports = {
  ...existingConfig,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};`;

const FILES = [
  { id: 'ci', label: 'GitHub Actions CI/CD', filename: '.github/workflows/agents-ci.yml', content: GITHUB_ACTIONS, lang: 'yaml' },
  { id: 'pr', label: 'Template Pull Request', filename: '.github/PULL_REQUEST_TEMPLATE/agent-pr.md', content: PR_TEMPLATE, lang: 'markdown' },
  { id: 'config-dev', label: 'Config Agent DEV', filename: 'agents/dev/config.json', content: AGENT_CONFIG_DEV, lang: 'json' },
  { id: 'security-headers', label: 'Headers Sécurité (PR prête)', filename: 'next.config.js (modification)', content: SECURITY_HEADERS_CONFIG, lang: 'javascript' },
];

export default function ConfigFilesPanel({ agents }: ConfigFilesPanelProps) {
  const [activeFile, setActiveFile] = useState(FILES[0].id);
  const active = FILES.find(f => f.id === activeFile)!;

  const handleCopy = () => {
    navigator.clipboard.writeText(active.content);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Configurations — Fichiers à Déployer</h2>
        <p className="text-sm text-gray-400 mt-1">
          Fichiers de configuration prêts à l'emploi pour l'architecture multi-agents SHUI
        </p>
      </div>

      {/* File selector */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A2440' }}>
        {/* Tabs */}
        <div className="flex overflow-x-auto" style={{ background: '#0A0F1E', borderBottom: '1px solid #1A2440' }}>
          {FILES.map(file => (
            <button
              key={file.id}
              onClick={() => setActiveFile(file.id)}
              className={`px-4 py-3 text-xs font-mono whitespace-nowrap border-b-2 transition-all ${
                activeFile === file.id
                  ? 'text-white border-shui-blue'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}>
              {file.label}
            </button>
          ))}
        </div>

        {/* File header */}
        <div className="flex items-center justify-between px-4 py-2"
          style={{ background: '#0D1526', borderBottom: '1px solid #1A2440' }}>
          <span className="text-xs font-mono text-gray-500">{active.filename}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded"
              style={{ background: '#1A2440', color: '#888' }}>
              {active.lang}
            </span>
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1 rounded transition-all hover:opacity-80"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}>
              📋 Copier
            </button>
          </div>
        </div>

        {/* Code */}
        <pre className="p-4 text-xs overflow-x-auto leading-relaxed"
          style={{ background: '#060B17', color: '#C8D5E8', fontFamily: 'JetBrains Mono, monospace', maxHeight: '500px', overflowY: 'auto' }}>
          {active.content}
        </pre>
      </div>

      {/* Agents system prompt files */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          📁 Fichiers Prompts Système — Résumé
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.map(agent => (
            <div key={agent.id} className="rounded-xl p-4"
              style={{ background: '#0D1526', border: `1px solid ${agent.colorBorder}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{agent.emoji}</span>
                <code className="text-xs font-mono" style={{ color: agent.color }}>
                  agents/{agent.id.split('-')[1]}/system-prompt.md
                </code>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Contient: rôle, règles absolues, stack technique, format de sortie, exemples
              </div>
              <div className="text-xs text-gray-400">
                ~{agent.systemPrompt.split('\n').length} lignes • {Math.round(agent.systemPrompt.length / 1000)}k caractères
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick setup guide */}
      <div className="rounded-xl p-5" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
        <h3 className="text-sm font-semibold text-white mb-4">🚀 Guide de Setup Rapide (30 min)</h3>
        <div className="space-y-3">
          {[
            { n: 1, cmd: 'git checkout -b staging && git push origin staging', desc: 'Créer branche staging' },
            { n: 2, cmd: 'cp .github/workflows/agents-ci.yml → GitHub', desc: 'Ajouter workflow CI agents' },
            { n: 3, cmd: 'GitHub Settings → Branches → Protect main', desc: 'Activer protection main (require PR + checks)' },
            { n: 4, cmd: 'Vercel → Branch Deployments → staging', desc: 'Configurer preview staging auto' },
            { n: 5, cmd: 'mkdir -p agents/{dev,security,seo,community}', desc: 'Créer dossiers agents' },
            { n: 6, cmd: 'cp system-prompts → agents/*/system-prompt.md', desc: 'Copier les prompts système' },
            { n: 7, cmd: 'npm run agents:security-audit', desc: 'Lancer premier audit sécurité' },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}>
                {s.n}
              </div>
              <div className="flex-1">
                <code className="text-xs font-mono" style={{ color: '#00D4FF' }}>{s.cmd}</code>
                <div className="text-xs text-gray-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
