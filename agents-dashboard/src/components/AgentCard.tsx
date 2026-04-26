import { useState } from 'react';
import type { Agent, AgentAction, ActionStatus, SeverityLevel } from '@/data/agents';

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
  selected?: boolean;
  onViewDetails?: () => void;
  onViewPrompt?: () => void;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    active: 'Actif',
    idle: 'Inactif',
    paused: 'Pausé',
    error: 'Erreur',
    pending_review: 'En review',
  };
  return map[status] || status;
}

function getSeverityBadge(severity?: SeverityLevel) {
  if (!severity) return null;
  const map: Record<SeverityLevel, { label: string; cls: string }> = {
    critical: { label: '🔴 CRITIQUE', cls: 'severity-critical' },
    high: { label: '🟠 HIGH', cls: 'severity-high' },
    medium: { label: '🟡 MEDIUM', cls: 'severity-medium' },
    low: { label: '🟢 LOW', cls: 'severity-low' },
    info: { label: 'ℹ️ INFO', cls: 'severity-info' },
  };
  const s = map[severity];
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs border font-mono ${s.cls}`}>
      {s.label}
    </span>
  );
}

function getActionStatusBadge(status: ActionStatus) {
  const map: Record<ActionStatus, { label: string; color: string }> = {
    completed: { label: '✅ Validé', color: '#00FF88' },
    pending_review: { label: '⏳ En review', color: '#FF8C00' },
    rejected: { label: '❌ Rejeté', color: '#FF3366' },
    in_progress: { label: '🔄 En cours', color: '#00D4FF' },
    draft: { label: '📝 Brouillon', color: '#888' },
  };
  const s = map[status];
  return (
    <span className="text-xs font-medium" style={{ color: s.color }}>
      {s.label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AgentCard({ agent, compact = false, selected = false, onViewDetails, onViewPrompt }: AgentCardProps) {
  const [showPermissions, setShowPermissions] = useState(false);

  return (
    <div
      className="rounded-xl transition-all duration-300"
      style={{
        background: selected ? agent.colorBg : '#0D1526',
        border: `1px solid ${selected ? agent.colorBorder : '#1A2440'}`,
        boxShadow: selected ? `0 0 20px ${agent.color}15` : 'none',
      }}>
      
      {/* Header */}
      <div className="p-5 cursor-pointer" onClick={onViewDetails}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: agent.colorBg, border: `1px solid ${agent.colorBorder}` }}>
              {agent.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white">{agent.name}</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: agent.status === 'active' ? 'rgba(0,255,136,0.1)' : 'rgba(255,140,0,0.1)',
                    color: agent.status === 'active' ? '#00FF88' : '#FF8C00',
                    border: `1px solid ${agent.status === 'active' ? 'rgba(0,255,136,0.3)' : 'rgba(255,140,0,0.3)'}`,
                  }}>
                  <span className={`status-dot ${agent.status === 'active' ? 'status-active' : 'status-idle'}`}></span>
                  {getStatusLabel(agent.status)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{agent.role}</div>
              <div className="text-xs mt-0.5" style={{ color: agent.color + '80' }}>
                Branch: <span className="font-mono">{agent.branch}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-center hidden sm:block">
              <div className="text-lg font-bold" style={{ color: agent.color }}>{agent.stats.totalPRs}</div>
              <div className="text-xs text-gray-500">PRs</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-lg font-bold" style={{ color: '#FF8C00' }}>{agent.stats.pendingReview}</div>
              <div className="text-xs text-gray-500">Review</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-lg font-bold" style={{ color: '#00FF88' }}>{agent.stats.approved}</div>
              <div className="text-xs text-gray-500">Approv.</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mt-3 leading-relaxed">{agent.description}</p>

        {compact && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={e => { e.stopPropagation(); onViewDetails?.(); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: agent.colorBg, border: `1px solid ${agent.colorBorder}`, color: agent.color }}>
              Voir détails →
            </button>
            <button
              onClick={e => { e.stopPropagation(); onViewPrompt?.(); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1A2440', color: '#888' }}>
              📋 Prompt système
            </button>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {!compact && (
        <div>
          {/* Tab buttons */}
          <div className="px-5 pb-0 flex gap-2 border-t border-shui-border">
            <button
              onClick={() => setShowPermissions(false)}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-all ${
                !showPermissions ? 'text-white border-current' : 'text-gray-500 border-transparent'
              }`}
              style={{ borderColor: !showPermissions ? agent.color : 'transparent' }}>
              Actions récentes
            </button>
            <button
              onClick={() => setShowPermissions(true)}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-all ${
                showPermissions ? 'text-white border-current' : 'text-gray-500 border-transparent'
              }`}
              style={{ borderColor: showPermissions ? agent.color : 'transparent' }}>
              Permissions
            </button>
          </div>

          {!showPermissions ? (
            /* Recent Actions */
            <div className="p-5 pt-4 space-y-3">
              {agent.recentActions.map(action => (
                <ActionItem key={action.id} action={action} agentColor={agent.color} />
              ))}
            </div>
          ) : (
            /* Permissions */
            <div className="p-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: '#00FF88' }}>✅ AUTORISÉ</div>
                <ul className="space-y-1">
                  {agent.permissions.allowed.map((p, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-green-500 flex-shrink-0">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: '#FF3366' }}>🚫 INTERDIT</div>
                <ul className="space-y-1">
                  {agent.permissions.forbidden.map((p, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span style={{ color: '#FF3366' }} className="flex-shrink-0">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="px-5 pb-5 flex items-center gap-2 flex-wrap">
            <button
              onClick={onViewPrompt}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: agent.colorBg, border: `1px solid ${agent.colorBorder}`, color: agent.color }}>
              📋 Voir prompt système
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <div className="text-xs text-gray-500">Outils:</div>
              {agent.tools.slice(0, 3).map(tool => (
                <span key={tool} className="text-xs px-2 py-0.5 rounded" style={{ background: '#1A2440', color: '#888' }}>
                  {tool}
                </span>
              ))}
              {agent.tools.length > 3 && (
                <span className="text-xs text-gray-600">+{agent.tools.length - 3}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionItem({ action, agentColor }: { action: AgentAction; agentColor: string }) {
  return (
    <div className="rounded-lg p-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1A2440' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-gray-300 flex-1">{action.description}</div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {getActionStatusBadge(action.status)}
          {getSeverityBadge(action.severity)}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-600 font-mono">{formatDate(action.timestamp)}</span>
        {action.branch && (
          <span className="text-xs font-mono" style={{ color: agentColor + '80' }}>
            🌿 {action.branch}
          </span>
        )}
        {action.prUrl && (
          <a href={action.prUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs hover:underline" style={{ color: agentColor }}>
            → PR GitHub
          </a>
        )}
        {action.issueUrl && (
          <a href={action.issueUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs hover:underline" style={{ color: '#FF8C00' }}>
            → Issue GitHub
          </a>
        )}
        {action.requiresHumanApproval && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,140,0,0.1)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.2)' }}>
            👤 Validation humaine requise
          </span>
        )}
        {action.humanApproved && action.approvedBy && (
          <span className="text-xs" style={{ color: '#00FF88' }}>
            ✅ Approuvé par {action.approvedBy}
          </span>
        )}
      </div>
    </div>
  );
}
