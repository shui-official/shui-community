interface RoadmapPhase {
  phase: string;
  days: string;
  color: string;
  tasks: string[];
  status: 'in_progress' | 'pending' | 'completed';
}

interface RoadmapPanelProps {
  phases: RoadmapPhase[];
}

const TOOLS_MATRIX = [
  {
    category: 'Code & Développement',
    icon: '⚙️',
    tools: [
      { name: 'GitHub API v3/v4', purpose: 'Création branches, PRs, issues', agents: ['DEV', 'SECURITY', 'SEO', 'COMMUNITY'], priority: 'required' },
      { name: 'GitHub Actions', purpose: 'CI/CD, tests automatiques, workflow', agents: ['ALL'], priority: 'required' },
      { name: 'Vercel Preview', purpose: 'Déploiement staging automatique', agents: ['DEV'], priority: 'required' },
      { name: 'ESLint + TypeScript', purpose: 'Quality check sur les PRs', agents: ['DEV'], priority: 'required' },
    ],
  },
  {
    category: 'Sécurité',
    icon: '🛡️',
    tools: [
      { name: 'npm audit', purpose: 'Scan CVE dépendances', agents: ['SECURITY'], priority: 'required' },
      { name: 'OWASP ZAP (passive)', purpose: 'Scan passif sécurité web', agents: ['SECURITY'], priority: 'recommended' },
      { name: 'Snyk', purpose: 'Analyse vulnérabilités code', agents: ['SECURITY'], priority: 'recommended' },
      { name: 'Security Headers Analyzer', purpose: 'Vérification headers HTTP', agents: ['SECURITY'], priority: 'required' },
    ],
  },
  {
    category: 'SEO & Contenu',
    icon: '📝',
    tools: [
      { name: 'Google Lighthouse', purpose: 'Audit SEO + performance', agents: ['SEO', 'DEV'], priority: 'required' },
      { name: 'OpenAI GPT-4', purpose: 'Génération contenu articles', agents: ['SEO'], priority: 'required' },
      { name: 'Google Search Console API', purpose: 'Métriques SEO réelles', agents: ['SEO'], priority: 'recommended' },
      { name: 'Readability.js', purpose: 'Analyse lisibilité contenu', agents: ['SEO'], priority: 'optional' },
    ],
  },
  {
    category: 'Communauté & Analytics',
    icon: '🌊',
    tools: [
      { name: 'Solana RPC (read-only)', purpose: 'Vérification holders, LP', agents: ['COMMUNITY', 'SECURITY'], priority: 'required' },
      { name: 'Telegram Bot API (notify)', purpose: 'Alertes actions agents', agents: ['COMMUNITY'], priority: 'recommended' },
      { name: 'Upstash KV (analytics)', purpose: 'Métriques quêtes et abus', agents: ['COMMUNITY'], priority: 'required' },
      { name: 'Graph Analysis (wallet clusters)', purpose: 'Détection wallets liés', agents: ['COMMUNITY'], priority: 'recommended' },
    ],
  },
];

export default function RoadmapPanel({ phases }: RoadmapPanelProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Roadmap MVP — 30 Jours</h2>
        <p className="text-sm text-gray-400 mt-1">Plan de déploiement progressif de l'architecture multi-agents SHUI</p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {phases.map((phase, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${phase.color}30` }}>
            {/* Phase header */}
            <div className="flex items-center justify-between p-4"
              style={{ background: `${phase.color}10`, borderBottom: `1px solid ${phase.color}20` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: phase.color + '20', color: phase.color, border: `1px solid ${phase.color}40` }}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-white">{phase.phase}</div>
                  <div className="text-xs text-gray-400">{phase.days}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {phase.status === 'in_progress' && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}>
                    <span className="status-dot status-active"></span>
                    En cours
                  </span>
                )}
                {phase.status === 'pending' && (
                  <span className="px-3 py-1 rounded-full text-xs"
                    style={{ background: '#1A2440', color: '#666' }}>
                    À venir
                  </span>
                )}
                {phase.status === 'completed' && (
                  <span className="px-3 py-1 rounded-full text-xs"
                    style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                    ✅ Terminé
                  </span>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="p-4" style={{ background: '#0D1526' }}>
              <ul className="space-y-2">
                {phase.tasks.map((task, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 mt-0.5" style={{ color: phase.color }}>
                      {phase.status === 'completed' ? '✅' : phase.status === 'in_progress' ? '🔄' : '○'}
                    </span>
                    <span className={phase.status === 'pending' ? 'text-gray-500' : 'text-gray-300'}>
                      {task}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Tools Matrix */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          🔧 Outils Recommandés par Agent
        </h3>
        <div className="space-y-4">
          {TOOLS_MATRIX.map(category => (
            <div key={category.category} className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A2440' }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: '#0D1526', borderBottom: '1px solid #1A2440' }}>
                <span>{category.icon}</span>
                <span className="font-medium text-white text-sm">{category.category}</span>
              </div>
              <div style={{ background: '#0A0F1E' }}>
                {category.tools.map((tool, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < category.tools.length - 1 ? '1px solid #0D1526' : 'none' }}>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{tool.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{tool.purpose}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {tool.agents.map(a => (
                          <span key={a} className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: '#1A2440', color: '#888' }}>
                            {a === 'ALL' ? '🤖 ALL' : a}
                          </span>
                        ))}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        tool.priority === 'required'
                          ? 'text-red-400 bg-red-400/10'
                          : tool.priority === 'recommended'
                          ? 'text-yellow-400 bg-yellow-400/10'
                          : 'text-gray-500 bg-gray-500/10'
                      }`}>
                        {tool.priority === 'required' ? '必 Requis' : tool.priority === 'recommended' ? '⭐ Recommandé' : 'Optional'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File structure */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          📁 Structure de Fichiers Proposée
        </h3>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A2440' }}>
          <div className="flex items-center justify-between px-4 py-2"
            style={{ background: '#0A0F1E', borderBottom: '1px solid #1A2440' }}>
            <span className="text-xs font-mono text-gray-500">shui-community/ (repo GitHub)</span>
          </div>
          <pre className="p-4 text-xs leading-relaxed overflow-x-auto"
            style={{ background: '#060B17', color: '#E8EDF5', fontFamily: 'JetBrains Mono, monospace' }}>
{`shui-community/
├── 📁 .github/
│   ├── 📁 workflows/
│   │   ├── agents-ci.yml          # CI pour PRs agents
│   │   ├── codeql.yml             # Scan sécurité (existant)
│   │   ├── staging-deploy.yml     # Auto-deploy staging
│   │   └── rollback.yml           # Workflow rollback
│   ├── 📁 ISSUE_TEMPLATE/
│   │   ├── agent-dev.md           # Template issue agent DEV
│   │   ├── agent-security.md      # Template issue sécurité
│   │   ├── agent-seo.md           # Template contenu SEO
│   │   └── agent-community.md     # Template quête community
│   └── 📁 PULL_REQUEST_TEMPLATE/
│       └── agent-pr.md            # Template PR agents
│
├── 📁 agents/                     # Configuration agents (NEW)
│   ├── 📁 dev/
│   │   ├── system-prompt.md       # Prompt système agent DEV
│   │   ├── config.json            # Config permissions
│   │   └── audit-checklist.md     # Checklist audit code
│   ├── 📁 security/
│   │   ├── system-prompt.md       # Prompt système agent SECURITY
│   │   ├── config.json
│   │   └── audit-template.md      # Template rapport sécurité
│   ├── 📁 seo/
│   │   ├── system-prompt.md       # Prompt système agent SEO
│   │   ├── config.json
│   │   └── content-templates/     # Templates articles/posts
│   └── 📁 community/
│       ├── system-prompt.md       # Prompt système agent COMMUNITY
│       ├── config.json
│       └── quest-template.json    # Template nouvelle quête
│
├── 📁 src/                        # Code site (existant)
│   ├── 📁 pages/
│   ├── 📁 components/
│   └── 📁 lib/
│
├── 📁 staging/                    # Config staging (NEW)
│   └── vercel.staging.json        # Config Vercel staging
│
├── 📁 logs/                       # Logs agents (NEW)
│   └── .gitkeep                   # Logs stockés ailleurs (KV)
│
└── AGENTS.md                      # Documentation architecture agents`}
          </pre>
        </div>
      </div>

      {/* Deployment steps */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          🚀 Plan de Déploiement Étape par Étape
        </h3>
        <div className="space-y-3">
          {[
            { step: 1, action: 'Créer branch "staging" sur le repo GitHub SHUI', detail: 'git checkout -b staging && git push origin staging', urgency: 'immediate' },
            { step: 2, action: 'Activer protection de branch sur "main"', detail: 'GitHub → Settings → Branches → Add rule : require PR + status checks', urgency: 'immediate' },
            { step: 3, action: 'Configurer Vercel Preview pour staging', detail: 'Vercel → Project Settings → Git → Branch Deployments → staging', urgency: 'immediate' },
            { step: 4, action: 'Créer les 4 fichiers de prompt système agents', detail: 'agents/dev/system-prompt.md, agents/security/..., etc.', urgency: 'semaine1' },
            { step: 5, action: 'Configurer GitHub Actions agents-ci.yml', detail: 'Validation automatique des PRs venant de branches agent/*', urgency: 'semaine1' },
            { step: 6, action: 'Premier run Agent SECURITY — audit complet', detail: 'Rapport sécurité baseline → Issues GitHub correctives', urgency: 'semaine1' },
            { step: 7, action: 'Premier run Agent DEV — analyse code + PRs', detail: 'Dépendances, mobile UX, performance', urgency: 'semaine2' },
            { step: 8, action: 'Premier run Agent SEO — audit + 3 articles', detail: 'Meta tags, articles brouillons en PR', urgency: 'semaine2' },
            { step: 9, action: 'Premier run Agent COMMUNITY — analyse quêtes', detail: 'Rapport patterns, propositions nouvelles quêtes', urgency: 'semaine2' },
            { step: 10, action: 'Mettre en place logs centralisés (Upstash KV)', detail: 'Historique actions agents, audit trail complet', urgency: 'semaine3' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: s.urgency === 'immediate' ? 'rgba(255,51,102,0.2)' : s.urgency === 'semaine1' ? 'rgba(255,140,0,0.2)' : 'rgba(0,212,255,0.2)',
                  color: s.urgency === 'immediate' ? '#FF3366' : s.urgency === 'semaine1' ? '#FF8C00' : '#00D4FF',
                }}>
                {s.step}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{s.action}</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{s.detail}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                s.urgency === 'immediate' ? 'text-red-400 bg-red-400/10' :
                s.urgency === 'semaine1' ? 'text-orange-400 bg-orange-400/10' :
                'text-blue-400 bg-blue-400/10'
              }`}>
                {s.urgency === 'immediate' ? '🔴 Immédiat' : s.urgency === 'semaine1' ? '🟠 Semaine 1' : '🔵 Semaine 2+'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
