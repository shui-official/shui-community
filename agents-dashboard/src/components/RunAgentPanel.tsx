import { useState } from 'react';

type AgentKey = 'dev' | 'security' | 'seo' | 'community';

const AGENT_OPTIONS: { id: AgentKey; label: string; emoji: string; color: string }[] = [
  { id: 'dev', label: 'Agent DEV', emoji: '⚙️', color: '#00D4FF' },
  { id: 'security', label: 'Agent SECURITY', emoji: '🛡️', color: '#FF3366' },
  { id: 'seo', label: 'Agent SEO', emoji: '📈', color: '#7B4FFF' },
  { id: 'community', label: 'Agent COMMUNITY', emoji: '🌊', color: '#FF8C00' },
];

const EXAMPLES: Record<AgentKey, string> = {
  dev: 'Analyse le projet SHUI et propose un petit correctif non critique UI ou TypeScript. Ne modifie rien.',
  security: 'Fais un audit sécurité lecture seule du système wallet connect. Ne modifie rien.',
  seo: 'Propose 2 articles SEO pour débutants sur Solana et SHUI. Format PR uniquement.',
  community: 'Analyse le catalogue de quêtes et propose une amélioration anti-abus. Ne valide aucune quête.',
};

export default function RunAgentPanel() {
  const [agent, setAgent] = useState<AgentKey>('dev');
  const [prompt, setPrompt] = useState(EXAMPLES.dev);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const selected = AGENT_OPTIONS.find((a) => a.id === agent)!;

  async function runAgent() {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      setResult(data.result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            🚀 Run Agent — Mode safe local
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Teste un agent sans modification repo, sans push GitHub, sans PR automatique.
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}>
          SAFE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {AGENT_OPTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setAgent(a.id);
              setPrompt(EXAMPLES[a.id]);
              setResult('');
              setError('');
            }}
            className="text-left rounded-lg p-3 transition-all hover:opacity-90"
            style={{
              background: agent === a.id ? `${a.color}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${agent === a.id ? `${a.color}55` : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div className="text-lg">{a.emoji}</div>
            <div className="text-sm font-semibold mt-1" style={{ color: agent === a.id ? a.color : '#fff' }}>
              {a.label}
            </div>
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-400">Mission pour {selected.label}</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-lg p-3 text-sm text-white outline-none"
          style={{ background: '#060B17', border: `1px solid ${selected.color}40` }}
        />
      </div>

      <button
        onClick={runAgent}
        disabled={loading}
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        style={{ background: selected.color, color: '#06101F' }}
      >
        {loading ? 'Analyse en cours...' : `Run ${selected.label}`}
      </button>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#FF8C99' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg p-4" style={{ background: '#060B17', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs text-gray-500 mb-2">Résultat agent</div>
          <pre className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{result}</pre>
        </div>
      )}
    </div>
  );
}
