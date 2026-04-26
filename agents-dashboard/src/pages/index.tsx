import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { AGENTS, SECURITY_RULES, WORKFLOW_STEPS, ROADMAP_PHASES } from '@/data/agents';
import AgentCard from '@/components/AgentCard';
import SecurityPanel from '@/components/SecurityPanel';
import WorkflowDiagram from '@/components/WorkflowDiagram';
import RoadmapPanel from '@/components/RoadmapPanel';
import AuditReport from '@/components/AuditReport';
import SystemPromptModal from '@/components/SystemPromptModal';
import ConfigFilesPanel from '@/components/ConfigFilesPanel';
import RunAgentPanel from '@/components/RunAgentPanel';
import type { Agent } from '@/data/agents';

type Tab = 'overview' | 'github' | 'agents' | 'security' | 'workflow' | 'roadmap' | 'audit' | 'configs';

// ─── GitHub data types ────────────────────────────────────────────────────────
interface GHItem {
  number: number;
  title: string;
  url: string;
  author: string;
  createdAt: string;
  labels: string[];
  isAgent: boolean;
}
interface GHPRItem extends GHItem {
  branch: string;
  base: string;
  isDraft: boolean;
}

interface AgentRunResult {
  ok?: boolean;
  agent?: string;
  mode?: string;
  result?: string;
  error?: string;
}

interface GitHubData {
  connected: boolean;
  repo?: string;
  stats?: {
    openPRs: number;
    openIssues: number;
    agentPRs: number;
    agentBranches: number;
    securityIssues: number;
  };
  prs?: GHPRItem[];
  issues?: GHItem[];
  agentBranches?: string[];
  agentStats?: {
    dev:       { openPRs: number; branches: string[]; lastPR: { number: number; title: string; url: string } | null };
    security:  { openPRs: number; branches: string[]; lastPR: { number: number; title: string; url: string } | null };
    seo:       { openPRs: number; branches: string[]; lastPR: { number: number; title: string; url: string } | null };
    community: { openPRs: number; branches: string[]; lastPR: { number: number; title: string; url: string } | null };
  };
  latestCommit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
  } | null;
  securityIssues?: GHItem[];
  timestamp?: string;
  error?: string;
}

// ─── GitHub Live Panel ─────────────────────────────────────────────────────────
function GitHubPanel({ data, loading, onRefresh }: { data: GitHubData | null; loading: boolean; onRefresh: () => void }) {
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    return `il y a ${Math.floor(hrs / 24)}j`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">🐙</div>
          <div className="text-gray-400 text-sm">Connexion à GitHub...</div>
        </div>
      </div>
    );
  }

  if (!data || !data.connected) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: '#0D1526', border: '1px solid rgba(255,51,102,0.3)' }}>
        <div className="text-3xl mb-3">⚠️</div>
        <div className="text-white font-semibold mb-2">Connexion GitHub indisponible</div>
        <div className="text-gray-400 text-sm mb-4">{data?.error || 'Impossible de joindre l\'API GitHub'}</div>
        <button onClick={onRefresh} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: 'rgba(0,212,255,0.2)', border: '1px solid rgba(0,212,255,0.4)' }}>
          🔄 Réessayer
        </button>
      </div>
    );
  }

  const s = data.stats!;

  return (
    <div className="space-y-6">
      {/* Header + last updated */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🐙</span> GitHub Live
            <span className="text-xs font-normal px-2 py-0.5 rounded-full ml-2" style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}>
              CONNECTÉ
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.repo} • Mis à jour {data.timestamp ? timeAgo(data.timestamp) : '—'}
          </p>
        </div>
        <button onClick={onRefresh} className="px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          🔄 Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'PRs ouvertes', value: s.openPRs, color: '#00D4FF', icon: '📋' },
          { label: 'Issues ouvertes', value: s.openIssues, color: '#7B4FFF', icon: '🐛' },
          { label: 'PRs agents', value: s.agentPRs, color: '#00FF88', icon: '🤖' },
          { label: 'Branches agents', value: s.agentBranches, color: '#FF8C00', icon: '🌿' },
          { label: 'Issues sécurité', value: s.securityIssues, color: '#FF3366', icon: '🔒' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: '#0D1526', border: `1px solid ${stat.color}30` }}>
            <div className="text-lg mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Latest commit */}
      {data.latestCommit && (
        <div className="rounded-xl p-4" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
          <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Dernier commit (main)</div>
          <div className="flex items-start gap-3">
            <div className="text-lg">⚡</div>
            <div className="flex-1 min-w-0">
              <a href={data.latestCommit.url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white hover:text-shui-blue transition-colors font-mono truncate block">
                [{data.latestCommit.sha}] {data.latestCommit.message}
              </a>
              <div className="text-xs text-gray-500 mt-0.5">
                par {data.latestCommit.author} • {timeAgo(data.latestCommit.date)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two columns: PRs + Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pull Requests */}
        <div className="rounded-xl p-4" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">📋 Pull Requests Ouvertes ({s.openPRs})</div>
            <a href={`https://github.com/${data.repo}/pulls`} target="_blank" rel="noopener noreferrer"
              className="text-xs hover:underline" style={{ color: '#00D4FF' }}>Voir tout →</a>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.prs && data.prs.length > 0 ? data.prs.map((pr) => (
              <a key={pr.number} href={pr.url} target="_blank" rel="noopener noreferrer"
                className="block p-2.5 rounded-lg hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-gray-500 mt-0.5 flex-shrink-0">#{pr.number}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-300 truncate">{pr.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-600">{pr.branch}</span>
                      {pr.isAgent && (
                        <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}>agent</span>
                      )}
                      {pr.labels.map((l) => (
                        <span key={l} className="text-xs px-1.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF80' }}>{l}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 flex-shrink-0">{timeAgo(pr.createdAt)}</div>
                </div>
              </a>
            )) : (
              <div className="text-center text-gray-600 text-sm py-6">Aucune PR ouverte</div>
            )}
          </div>
        </div>

        {/* Issues */}
        <div className="rounded-xl p-4" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">🐛 Issues Ouvertes ({s.openIssues})</div>
            <a href={`https://github.com/${data.repo}/issues`} target="_blank" rel="noopener noreferrer"
              className="text-xs hover:underline" style={{ color: '#7B4FFF' }}>Voir tout →</a>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.issues && data.issues.length > 0 ? data.issues.map((issue) => (
              <a key={issue.number} href={issue.url} target="_blank" rel="noopener noreferrer"
                className="block p-2.5 rounded-lg hover:opacity-80 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-gray-500 mt-0.5 flex-shrink-0">#{issue.number}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-300 truncate">{issue.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {issue.isAgent && (
                        <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(123,79,255,0.15)', color: '#7B4FFF' }}>agent</span>
                      )}
                      {issue.labels.map((l) => (
                        <span key={l} className="text-xs px-1.5 rounded" style={{ background: 'rgba(255,51,102,0.1)', color: '#FF336680' }}>{l}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 flex-shrink-0">{timeAgo(issue.createdAt)}</div>
                </div>
              </a>
            )) : (
              <div className="text-center text-gray-600 text-sm py-6">Aucune issue ouverte</div>
            )}
          </div>
        </div>
      </div>

      {/* Agent branches */}
      <div className="rounded-xl p-4" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
        <div className="text-sm font-semibold text-white mb-3">🌿 Branches Agents Actives ({data.agentBranches?.length ?? 0})</div>
        <div className="flex flex-wrap gap-2">
          {data.agentBranches && data.agentBranches.length > 0 ? data.agentBranches.map((branch) => {
            const color = branch.includes('/dev') ? '#00D4FF'
              : branch.includes('/security') ? '#FF3366'
              : branch.includes('/seo') ? '#7B4FFF'
              : '#FF8C00';
            return (
              <a
                key={branch}
                href={`https://github.com/${data.repo}/tree/${branch}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-mono hover:opacity-80 transition-opacity"
                style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                🌿 {branch}
              </a>
            );
          }) : (
            <span className="text-gray-600 text-sm">Aucune branche agent détectée</span>
          )}
        </div>
      </div>

      {/* Per-agent stats */}
      {data.agentStats && (
        <div>
          <div className="text-sm font-semibold text-white mb-3">🤖 Activité par Agent</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.agentStats).map(([key, stat]) => {
              const agentInfo: Record<string, { emoji: string; color: string; label: string }> = {
                dev:       { emoji: '🛠️', color: '#00D4FF', label: 'DEV' },
                security:  { emoji: '🛡️', color: '#FF3366', label: 'SECURITY' },
                seo:       { emoji: '📈', color: '#7B4FFF', label: 'SEO' },
                community: { emoji: '🏘️', color: '#FF8C00', label: 'COMMUNITY' },
              };
              const info = agentInfo[key];
              return (
                <div key={key} className="rounded-xl p-3" style={{ background: '#0D1526', border: `1px solid ${info.color}25` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{info.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: info.color }}>{info.label}</span>
                  </div>
                  <div className="text-lg font-bold text-white">{stat.openPRs}</div>
                  <div className="text-xs text-gray-500">PRs ouvertes</div>
                  <div className="text-xs text-gray-600 mt-1">{stat.branches.length} branche(s)</div>
                  {stat.lastPR && (
                    <a href={stat.lastPR.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs mt-2 block truncate hover:underline" style={{ color: info.color }}>
                      ↗ PR #{stat.lastPR.number}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [runAgentKey, setRunAgentKey] = useState<'dev' | 'security' | 'seo' | 'community'>('dev');
  const [runPrompt, setRunPrompt] = useState('Analyse le site SHUI et propose une correction de maintenance safe.');
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState<AgentRunResult | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptAgent, setPromptAgent] = useState<Agent | null>(null);
  const [githubData, setGithubData] = useState<GitHubData | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubFetched, setGithubFetched] = useState(false);

  const fetchGithub = useCallback(async () => {
    setGithubLoading(true);
    try {
      const res = await fetch('/api/github');
      const json = await res.json() as GitHubData;
      setGithubData(json);
    } catch (e) {
      setGithubData({ connected: false, error: String(e) });
    } finally {
      setGithubLoading(false);
      setGithubFetched(true);
    }
  }, []);

  const runAgent = useCallback(async () => {
    setRunLoading(true);
    setRunResult(null);

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: runAgentKey, prompt: runPrompt }),
      });

      const json = await res.json() as AgentRunResult;
      setRunResult(json);
    } catch (e) {
      setRunResult({ ok: false, error: String(e) });
    } finally {
      setRunLoading(false);
    }
  }, [runAgentKey, runPrompt]);

  // Auto-fetch on GitHub tab
  useEffect(() => {
    if (activeTab === 'github' && !githubFetched) {
      fetchGithub();
    }
  }, [activeTab, githubFetched, fetchGithub]);

  // Also fetch in background on first overview load for stats
  useEffect(() => {
    fetchGithub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPending = githubData?.stats?.openPRs ?? AGENTS.reduce((acc, a) => acc + a.stats.pendingReview, 0);
  const totalApproved = AGENTS.reduce((acc, a) => acc + a.stats.approved, 0);
  const totalPRs = githubData?.stats?.agentPRs ?? AGENTS.reduce((acc, a) => acc + a.stats.totalPRs, 0);
  const openIssues = githubData?.stats?.openIssues ?? 0;
  const isLive = githubData?.connected === true;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',  label: 'Vue d\'ensemble', icon: '🏠' },
    { id: 'github',    label: 'GitHub Live',     icon: '🐙' },
    { id: 'agents',    label: 'Agents IA',       icon: '🤖' },
    { id: 'security',  label: 'Sécurité',        icon: '🛡️' },
    { id: 'workflow',  label: 'Workflow',         icon: '🔄' },
    { id: 'roadmap',   label: 'Roadmap',          icon: '🗓️' },
    { id: 'audit',     label: 'Audit Site',       icon: '🔍' },
    { id: 'configs',   label: 'Configurations',  icon: '⚙️' },
  ];

  return (
    <>
      <Head>
        <title>SHUI — Dashboard Multi-Agents IA</title>
        <meta name="description" content="Architecture multi-agents IA sécurisée pour SHUI Community — contrôle humain total" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen grid-bg">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-50 border-b border-shui-border"
          style={{ background: 'rgba(6,11,23,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg, #00D4FF20, #7B4FFF20)', border: '1px solid #00D4FF40' }}>
                💧
              </div>
              <div>
                <div className="font-bold text-white text-sm tracking-wide">SHUI AI Control Center</div>
                <div className="text-xs flex items-center gap-2" style={{ color: '#00D4FF80' }}>
                  Multi-Agent Architecture — MVP 1.0
                  {isLive && (
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}>
                      ● LIVE GitHub
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00FF88' }}>
                <span className="status-dot status-active"></span>
                4 Agents Actifs
              </div>

              {totalPending > 0 && (
                <button
                  onClick={() => setActiveTab('github')}
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-xs hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.3)', color: '#FF8C00' }}>
                  ⏳ {totalPending} PR{totalPending > 1 ? 's' : ''} en attente
                </button>
              )}

              <a href="https://shui-community.vercel.app" target="_blank" rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}>
                🔗 Site SHUI
              </a>
              <a href="https://github.com/shui-official/shui-community" target="_blank" rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                🐙 GitHub
              </a>
            </div>
          </div>

          {/* TABS */}
          <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'text-white border-shui-blue'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}>
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
                {tab.id === 'github' && isLive && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00FF88' }}></span>
                )}
              </button>
            ))}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero */}
              <div className="text-center py-8">
                <div className="text-5xl mb-4">💧</div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Architecture Multi-Agents SHUI
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  4 agents IA spécialisés, entièrement contrôlés par l&apos;humain.
                  Aucun accès aux clés privées, trésorerie ou déploiement direct.
                </p>

                {/* GitHub connection status */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {githubLoading ? (
                    <span className="text-xs text-gray-500 animate-pulse">🔄 Connexion à GitHub...</span>
                  ) : isLive ? (
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}>
                      ● Données GitHub en temps réel
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,140,0,0.1)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.3)' }}>
                      ⚠ Simulation — GitHub non connecté
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-6 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#00D4FF' }}>{totalPRs}</div>
                    <div className="text-xs text-gray-500">PRs agents</div>
                  </div>
                  <div className="w-px h-8 bg-shui-border"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#00FF88' }}>{totalApproved}</div>
                    <div className="text-xs text-gray-500">Actions approuvées</div>
                  </div>
                  <div className="w-px h-8 bg-shui-border"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#FF8C00' }}>{totalPending}</div>
                    <div className="text-xs text-gray-500">PRs en attente</div>
                  </div>
                  <div className="w-px h-8 bg-shui-border"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#7B4FFF' }}>{openIssues}</div>
                    <div className="text-xs text-gray-500">Issues ouvertes</div>
                  </div>
                  <div className="w-px h-8 bg-shui-border"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#FF3366' }}>0</div>
                    <div className="text-xs text-gray-500">Accès prod directs</div>
                  </div>
                </div>
              </div>

              {/* Security banner */}
              <div className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="text-2xl">🔒</div>
                <div>
                  <div className="font-semibold text-white text-sm">Toutes les règles de sécurité actives</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {SECURITY_RULES.filter(r => r.enforced).length}/{SECURITY_RULES.length} règles appliquées •
                    Zéro accès clés privées • Zéro déploiement direct • Validation humaine obligatoire
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}>
                  ✅ SÉCURISÉ
                </div>
              </div>

              {/* Latest security PR from GitHub */}
              {isLive && githubData?.securityIssues && githubData.securityIssues.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.2)' }}>
                  <div className="text-sm font-semibold text-white mb-3">🔒 Issues Sécurité Ouvertes</div>
                  <div className="space-y-2">
                    {githubData.securityIssues.slice(0, 3).map((i) => (
                      <a key={i.number} href={i.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <span className="text-xs font-mono text-gray-500">#{i.number}</span>
                        <span className="text-sm text-gray-300 truncate flex-1">{i.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,51,102,0.15)', color: '#FF3366' }}>
                          security
                        </span>
                      </a>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('github')}
                    className="mt-3 text-xs hover:underline" style={{ color: '#00D4FF' }}>
                    Voir tout dans GitHub Live →
                  </button>
                </div>
              )}

              {/* Agent cards grid */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Agents Actifs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AGENTS.map(agent => (
                    <AgentCard key={agent.id} agent={agent} compact
                      onViewDetails={() => { setSelectedAgent(agent); setActiveTab('agents'); }}
                      onViewPrompt={() => { setPromptAgent(agent); setShowPromptModal(true); }}
                    />
                  ))}
                </div>
              </div>

              {/* Architecture diagram */}
              <div className="rounded-xl p-6" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
                <h2 className="text-lg font-semibold text-white mb-6">Architecture — Flux de Travail</h2>
                <div className="flex items-center justify-between overflow-x-auto gap-2">
                  {WORKFLOW_STEPS.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                          style={{
                            background: i < 3 ? 'rgba(0,212,255,0.15)' : i < 5 ? 'rgba(123,79,255,0.15)' : 'rgba(0,255,136,0.15)',
                            border: `1px solid ${i < 3 ? 'rgba(0,212,255,0.3)' : i < 5 ? 'rgba(123,79,255,0.3)' : 'rgba(0,255,136,0.3)'}`,
                          }}>
                          {step.icon}
                        </div>
                        <div className="text-xs text-center text-gray-400 max-w-16">{step.label}</div>
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div className="w-8 h-px" style={{ background: 'linear-gradient(90deg, #1A2440, #00D4FF40)' }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-5" style={{ background: '#0D1526', border: '1px solid rgba(255,51,102,0.2)' }}>
                  <div className="text-sm font-medium text-gray-400 mb-1">🔴 Issues sécurité</div>
                  <div className="text-2xl font-bold text-white mb-1">{githubData?.stats?.securityIssues ?? 3}</div>
                  <div className="text-xs text-gray-500">{isLive ? 'GitHub Live' : 'Simulation'}</div>
                </div>
                <div className="rounded-xl p-5" style={{ background: '#0D1526', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <div className="text-sm font-medium text-gray-400 mb-1">📋 PRs en attente review</div>
                  <div className="text-2xl font-bold text-white mb-1">{totalPending}</div>
                  <div className="text-xs text-gray-500">Requièrent validation humaine</div>
                </div>
                <div className="rounded-xl p-5" style={{ background: '#0D1526', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <div className="text-sm font-medium text-gray-400 mb-1">✅ Sécurité wallet</div>
                  <div className="text-2xl font-bold" style={{ color: '#00FF88' }}>OK</div>
                  <div className="text-xs text-gray-500">Connexion = signature seule, aucune tx</div>
                </div>
              </div>
            </div>
          )}

          {/* ── GITHUB TAB ── */}
          {activeTab === 'github' && (
            <GitHubPanel data={githubData} loading={githubLoading} onRefresh={fetchGithub} />
          )}

          {/* ── AGENTS TAB ── */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <RunAgentPanel />

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Agents IA — Détails &amp; Actions</h2>
                <div className="text-sm text-gray-400">Cliquez pour voir les détails</div>
              </div>

              <div className="agent-runner-card p-6">
                <div className="relative z-10">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-3"
                        style={{ background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
                        ⚡ Local Agent Runner
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">Maintenance contrôlée</h3>
                      <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                        Donne une instruction à un agent. Il répond en diagnostic sécurisé uniquement :
                        aucun fichier modifié, aucun commit, aucun push, aucun déploiement.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}>
                        SAFE MODE
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,140,0,0.10)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.22)' }}>
                        HUMAN REVIEW
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_220px] gap-4 items-stretch">
                    <label className="block">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Agent</span>
                      <select
                        value={runAgentKey}
                        onChange={(e) => setRunAgentKey(e.target.value as 'dev' | 'security' | 'seo' | 'community')}
                        className="agent-input mt-2 w-full rounded-2xl px-4 py-4 text-sm text-white outline-none"
                      >
                        <option value="dev">⚙️ Agent DEV</option>
                        <option value="security">🛡️ Agent SECURITY</option>
                        <option value="seo">📈 Agent SEO</option>
                        <option value="community">🌊 Agent COMMUNITY</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Instruction</span>
                      <textarea
                        value={runPrompt}
                        onChange={(e) => setRunPrompt(e.target.value)}
                        rows={4}
                        className="agent-input mt-2 w-full rounded-2xl px-4 py-4 text-sm text-white outline-none resize-y"
                        placeholder="Ex: Corrige les clés i18n affichées sur la homepage..."
                      />
                    </label>

                    <button
                      onClick={runAgent}
                      disabled={runLoading || runPrompt.trim().length < 3}
                      className="agent-run-button mt-6 lg:mt-8 rounded-2xl px-5 py-4 text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {runLoading ? '⏳ Analyse…' : '▶ Run Agent'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
                    {['No write', 'No commit', 'No push', 'No deploy'].map((item) => (
                      <div key={item} className="rounded-xl px-3 py-2 text-xs text-gray-400"
                        style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        🔒 {item}
                      </div>
                    ))}
                  </div>

                  {runResult && (
                    <div className="agent-result mt-5 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2440]">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Résultat agent</div>
                        <div className="text-xs px-2 py-1 rounded-full"
                          style={{ background: runResult.ok === false ? 'rgba(255,140,0,0.12)' : 'rgba(0,255,136,0.12)', color: runResult.ok === false ? '#FF8C00' : '#00FF88' }}>
                          {runResult.mode || (runResult.ok === false ? 'error' : 'ready')}
                        </div>
                      </div>
                      <pre className="p-5 text-sm leading-6 whitespace-pre-wrap overflow-x-auto text-[#D7E3F4]">
                        {runResult.error || runResult.result || JSON.stringify(runResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {AGENTS.map(agent => (
                  <AgentCard key={agent.id} agent={agent} compact={false}
                    selected={selectedAgent?.id === agent.id}
                    onViewDetails={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                    onViewPrompt={() => { setPromptAgent(agent); setShowPromptModal(true); }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security'  && <SecurityPanel rules={SECURITY_RULES} agents={AGENTS} />}
          {activeTab === 'workflow'  && <WorkflowDiagram steps={WORKFLOW_STEPS} agents={AGENTS} />}
          {activeTab === 'roadmap'   && <RoadmapPanel phases={ROADMAP_PHASES} />}
          {activeTab === 'audit'     && <AuditReport />}
          {activeTab === 'configs'   && <ConfigFilesPanel agents={AGENTS} />}

        </main>

        <footer className="border-t border-shui-border mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-gray-600">
            <div>SHUI AI Control Center — Architecture Multi-Agents MVP 1.0</div>
            <div className="flex items-center gap-4">
              <span>🔒 Aucun accès clés privées</span>
              <span>🚫 Zéro déploiement direct</span>
              <span>✅ 100% Pull Requests</span>
              {isLive && <span style={{ color: '#00FF88' }}>● Données GitHub Live</span>}
            </div>
          </div>
        </footer>
      </div>

      {showPromptModal && promptAgent && (
        <SystemPromptModal agent={promptAgent} onClose={() => { setShowPromptModal(false); setPromptAgent(null); }} />
      )}
    </>
  );
}
