import type { Agent } from '@/data/agents';

interface SystemPromptModalProps {
  agent: Agent;
  onClose: () => void;
}

export default function SystemPromptModal({ agent, onClose }: SystemPromptModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(agent.systemPrompt);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,11,23,0.95)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: '#0D1526',
          border: `1px solid ${agent.colorBorder}`,
          boxShadow: `0 0 40px ${agent.color}20`,
          maxHeight: '85vh',
        }}
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid #1A2440', background: agent.colorBg }}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{agent.emoji}</div>
            <div>
              <div className="font-bold text-white">{agent.name} — Prompt Système</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Instructions complètes transmises à l'agent IA
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: agent.colorBg, border: `1px solid ${agent.colorBorder}`, color: agent.color }}>
              📋 Copier
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all"
              style={{ background: '#1A2440' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Security warning */}
        <div className="mx-5 mt-4 p-3 rounded-lg flex items-center gap-2 text-xs"
          style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.2)', color: '#FF3366' }}>
          🔒 Ce prompt ne contient aucune clé privée, credential, ni accès à la production.
          L'agent ne peut qu'analyser et créer des Pull Requests.
        </div>

        {/* Prompt content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: '55vh' }}>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: '#C8D5E8' }}>
            {agent.systemPrompt}
          </pre>
        </div>

        {/* Tools section */}
        <div className="p-5 pt-0">
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Outils disponibles pour cet agent
          </div>
          <div className="flex flex-wrap gap-2">
            {agent.tools.map(tool => (
              <span key={tool} className="text-xs px-2 py-1 rounded"
                style={{ background: '#1A2440', color: '#888', border: '1px solid #1A2440' }}>
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Branch info */}
        <div className="px-5 pb-5 flex items-center gap-2 text-xs text-gray-500">
          <span>🌿 Branche dédiée:</span>
          <code className="px-2 py-0.5 rounded font-mono" style={{ background: '#1A2440', color: agent.color }}>
            {agent.branch}/*
          </code>
        </div>
      </div>
    </div>
  );
}
