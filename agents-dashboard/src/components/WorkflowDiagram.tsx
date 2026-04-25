import type { Agent } from '@/data/agents';

interface WorkflowStep {
  id: number;
  label: string;
  icon: string;
  description: string;
}

interface WorkflowDiagramProps {
  steps: WorkflowStep[];
  agents: Agent[];
}

const GITHUB_ACTIONS_YAML = `name: SHUI Agents CI/CD
on:
  pull_request:
    branches: [main, staging]
    types: [opened, synchronize]

jobs:
  validate-agent-pr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check branch naming (agents only)
        run: |
          BRANCH=\${{ github.head_ref }}
          if [[ ! "\$BRANCH" =~ ^agent/ ]]; then
            echo "ERROR: Agent PRs must use agent/* branches"
            exit 1
          fi
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: TypeScript check
        run: yarn tsc --noEmit
        
      - name: Lint
        run: yarn lint
        
      - name: Build test
        run: yarn build
        env:
          NEXT_PUBLIC_SOLANA_NETWORK: devnet
          
      - name: Security scan
        run: npm audit --audit-level=high
        
      - name: Block direct prod deploy
        run: |
          echo "✅ PR validated — awaiting human review"
          echo "🚫 Direct production deploy: BLOCKED"
          echo "👤 Required reviewers: SHUI Admin team"`;

const BRANCH_STRATEGY = [
  { branch: 'main', desc: 'Production — protégée, merge uniquement via PR approuvée', color: '#00FF88', icon: '🚀' },
  { branch: 'staging', desc: 'Pré-production — tests avant merge vers main', color: '#00D4FF', icon: '🔬' },
  { branch: 'agent/dev-*', desc: 'Agent DEV — corrections UI/UX, fonctionnalités', color: '#00D4FF', icon: '⚙️' },
  { branch: 'agent/security-*', desc: 'Agent SECURITY — corrections sécurité, audits', color: '#FF3366', icon: '🛡️' },
  { branch: 'agent/seo-*', desc: 'Agent SEO — contenu, articles, méta données', color: '#7B4FFF', icon: '📝' },
  { branch: 'agent/community-*', desc: 'Agent COMMUNITY — quêtes, anti-spam, propositions', color: '#00FF88', icon: '🌊' },
];

const PROTECTION_RULES = [
  { rule: 'Require pull request reviews (min. 1)', branch: 'main' },
  { rule: 'Require status checks to pass (build, lint, tsc)', branch: 'main' },
  { rule: 'Restrict pushes to main (no direct push)', branch: 'main' },
  { rule: 'Dismiss stale PR reviews on new commits', branch: 'main' },
  { rule: 'Require linear history (no merge commits)', branch: 'main' },
  { rule: 'Require PR for staging too (moins strict)', branch: 'staging' },
  { rule: 'Auto-deploy staging sur Vercel Preview', branch: 'staging' },
  { rule: 'Agent branches: créées automatiquement par agents', branch: 'agent/*' },
];

export default function WorkflowDiagram({ steps, agents }: WorkflowDiagramProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Workflow GitHub — Architecture Complète</h2>
        <p className="text-sm text-gray-400 mt-1">
          Chaque modification passe obligatoirement par ce pipeline avant d'atteindre la production
        </p>
      </div>

      {/* Main workflow */}
      <div className="rounded-xl p-6" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
        <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-wider">Pipeline de déploiement</h3>
        
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    background: i < 3 ? 'rgba(0,212,255,0.15)' : i === 4 ? 'rgba(123,79,255,0.15)' : 'rgba(0,255,136,0.15)',
                    border: `1px solid ${i < 3 ? 'rgba(0,212,255,0.4)' : i === 4 ? 'rgba(123,79,255,0.4)' : 'rgba(0,255,136,0.4)'}`,
                  }}>
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-8 mt-1" style={{ background: 'linear-gradient(180deg, #1A2440, transparent)' }} />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{step.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1A2440', color: '#888' }}>
                    Étape {step.id}
                  </span>
                  {step.id === 5 && (
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(123,79,255,0.15)', color: '#7B4FFF', border: '1px solid rgba(123,79,255,0.3)' }}>
                      👤 Validation humaine
                    </span>
                  )}
                  {step.id === 7 && (
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}>
                      🚀 Production
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branch strategy */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Stratégie de Branches</h3>
        <div className="space-y-2">
          {BRANCH_STRATEGY.map(b => (
            <div key={b.branch} className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
              <span className="text-lg">{b.icon}</span>
              <code className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#1A2440', color: b.color }}>
                {b.branch}
              </code>
              <span className="text-sm text-gray-400">{b.desc}</span>
              {b.branch === 'main' && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded"
                  style={{ background: 'rgba(255,51,102,0.1)', color: '#FF3366', border: '1px solid rgba(255,51,102,0.2)' }}>
                  🔒 PROTÉGÉE
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Branch protection rules */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          Règles de Protection GitHub
        </h3>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A2440' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0D1526', borderBottom: '1px solid #1A2440' }}>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Règle</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Branche</th>
                <th className="text-center p-3 text-xs font-medium text-gray-400">Statut</th>
              </tr>
            </thead>
            <tbody>
              {PROTECTION_RULES.map((rule, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #0A0F1E', background: i % 2 === 0 ? '#0D1526' : '#0A0F1E' }}>
                  <td className="p-3 text-xs text-gray-300">{rule.rule}</td>
                  <td className="p-3">
                    <code className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ background: '#1A2440', color: '#00D4FF' }}>
                      {rule.branch}
                    </code>
                  </td>
                  <td className="p-3 text-center">
                    <span style={{ color: '#00FF88' }}>✅</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GitHub Actions YAML */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          GitHub Actions — CI/CD Agents
        </h3>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A2440' }}>
          <div className="flex items-center justify-between px-4 py-2 text-xs"
            style={{ background: '#0A0F1E', borderBottom: '1px solid #1A2440', color: '#888' }}>
            <span className="font-mono">.github/workflows/agents-ci.yml</span>
            <span style={{ color: '#00D4FF' }}>GitHub Actions</span>
          </div>
          <pre className="p-4 text-xs overflow-x-auto leading-relaxed"
            style={{ background: '#060B17', color: '#E8EDF5', fontFamily: 'JetBrains Mono, monospace' }}>
            {GITHUB_ACTIONS_YAML}
          </pre>
        </div>
      </div>

      {/* Diagram: Site → Agents → GitHub → Validation → Production */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          Vue d'ensemble — Flux de données
        </h3>
        <div className="rounded-xl p-6" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
          <div className="flex flex-col gap-4">
            {/* Row 1: Site → Agents */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                  style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}>
                  <span className="text-2xl">💧</span>
                  <span className="text-xs" style={{ color: '#00D4FF' }}>SHUI</span>
                </div>
                <span className="text-xs text-gray-500">Site Production</span>
              </div>
              
              <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                <div className="flex gap-1">→ analyse →</div>
                <div className="text-gray-600 text-xs">(lecture seule)</div>
              </div>
              
              <div className="flex gap-3">
                {agents.map(a => (
                  <div key={a.id} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: a.colorBg, border: `1px solid ${a.colorBorder}` }}>
                      {a.emoji}
                    </div>
                    <span className="text-xs text-gray-500">{a.name.split(' ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-0.5 h-6" style={{ background: '#1A2440' }} />
            </div>

            {/* Row 2: GitHub */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #1A2440' }}>
                  <span className="text-2xl">🐙</span>
                  <span className="text-xs text-gray-400">GitHub</span>
                </div>
                <span className="text-xs text-gray-500">Branches + PRs</span>
              </div>
              <span className="text-gray-600">→</span>
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                  style={{ background: 'rgba(123,79,255,0.1)', border: '1px solid rgba(123,79,255,0.3)' }}>
                  <span className="text-2xl">🧪</span>
                  <span className="text-xs" style={{ color: '#7B4FFF' }}>CI/CD</span>
                </div>
                <span className="text-xs text-gray-500">Tests auto</span>
              </div>
              <span className="text-gray-600">→</span>
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                  style={{ background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.3)' }}>
                  <span className="text-2xl">👤</span>
                  <span className="text-xs" style={{ color: '#FF8C00' }}>Review</span>
                </div>
                <span className="text-xs text-gray-500">Validation humaine</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-0.5 h-6" style={{ background: '#1A2440' }} />
            </div>

            {/* Row 3: Staging → Production */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <span className="text-2xl">🔬</span>
                  <span className="text-xs" style={{ color: '#00D4FF' }}>Staging</span>
                </div>
                <span className="text-xs text-gray-500">Pre-production</span>
              </div>
              <span className="text-gray-600">→</span>
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center"
                  style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                  <span className="text-2xl">🚀</span>
                  <span className="text-xs" style={{ color: '#00FF88' }}>PROD</span>
                </div>
                <span className="text-xs text-gray-500">Production Vercel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
