const AUDIT_FINDINGS = [
  {
    id: 'A1',
    title: 'Dépendance @project-serum/anchor v0.19.1-beta.1 obsolète',
    category: 'Sécurité / Dépendances',
    severity: 'high' as const,
    status: 'open',
    agent: 'SECURITY',
    detail: 'Cette version bêta date de 2021. Des CVE ont été détectés. La migration vers @coral-xyz/anchor v0.30+ est recommandée.',
    recommendation: 'Mettre à jour vers @coral-xyz/anchor@0.30.1. Tester compatibilité avec wallet-adapter.',
    prReady: false,
  },
  {
    id: 'A2',
    title: 'next.js v12 — migration vers v14 recommandée',
    category: 'Performance / Sécurité',
    severity: 'medium' as const,
    status: 'open',
    agent: 'DEV',
    detail: 'Next.js v12 n\'est plus en maintenance active. Next.js v14 apporte App Router, Server Components, meilleures performances et patches sécurité.',
    recommendation: 'Migration progressive : d\'abord v12→v13 (Pages Router compatible), puis v13→v14. Plan migration en PR.',
    prReady: false,
  },
  {
    id: 'A3',
    title: 'Absence de Content-Security-Policy header',
    category: 'Sécurité / Headers',
    severity: 'medium' as const,
    status: 'open',
    agent: 'SECURITY',
    detail: 'Aucun header CSP détecté. Bien que React protège contre XSS basique, un CSP strict renforce la sécurité contre l\'injection de scripts tiers.',
    recommendation: 'Ajouter dans next.config.js les headers : Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy',
    prReady: true,
  },
  {
    id: 'A4',
    title: 'Cookie session SameSite=Lax → Strict recommandé',
    category: 'Sécurité / Session',
    severity: 'low' as const,
    status: 'open',
    agent: 'SECURITY',
    detail: 'SameSite=Lax protège contre la plupart des CSRF mais pas les requêtes de type navigartion top-level GET. SameSite=Strict est plus conservateur.',
    recommendation: 'Passer shui_session à SameSite=Strict. Vérifier que cela ne casse pas les redirections OAuth.',
    prReady: true,
  },
  {
    id: 'A5',
    title: 'Pages sans meta description (index, community)',
    category: 'SEO',
    severity: 'medium' as const,
    status: 'open',
    agent: 'SEO',
    detail: 'Les pages index.tsx et community.tsx n\'ont pas de meta description. Google affiche un extrait généré automatiquement, moins optimisé.',
    recommendation: 'Ajouter <meta name="description"> et balises Open Graph sur toutes les pages. PR prête avec suggestions.',
    prReady: true,
  },
  {
    id: 'A6',
    title: 'Pattern abus détecté : quête invite-5-members',
    category: 'Communauté / Anti-abus',
    severity: 'high' as const,
    status: 'open',
    agent: 'COMMUNITY',
    detail: '3 wallets avec même IP soumettent mutuellement la quête d\'invitation. Pattern circulaire A→B, B→A, C→A détecté.',
    recommendation: 'Ajouter vérification : un wallet invité ne peut pas être l\'inviteur d\'un wallet qui l\'a invité (anti-circular). PR de vérification.',
    prReady: true,
  },
  {
    id: 'A7',
    title: 'Open Graph images manquantes sur toutes les pages',
    category: 'SEO / Social',
    severity: 'low' as const,
    status: 'open',
    agent: 'SEO',
    detail: 'Les partages sur X/Twitter et Facebook n\'affichent pas d\'image preview. og:image non défini dans les pages.',
    recommendation: 'Créer une image OG par défaut (1200x630px) et l\'ajouter dans _document.tsx. Prévoir images dynamiques par page.',
    prReady: false,
  },
  {
    id: 'A8',
    title: 'Mobile UX : QuestPanel — boutons trop petits sur iOS',
    category: 'UX / Accessibilité',
    severity: 'medium' as const,
    status: 'pending_review',
    agent: 'DEV',
    detail: 'Sur iOS Safari (viewport < 390px), les boutons de soumission de quête font < 44px, en dessous du seuil WCAG 2.1 recommandé.',
    recommendation: 'PR ouverte : agrandir les boutons min-h-[44px] min-w-[44px] sur le QuestPanel.',
    prReady: true,
    prUrl: 'https://github.com/shui-community/shui/pull/42',
  },
  {
    id: 'A9',
    title: 'Audit CSRF : Protection correctement implémentée',
    category: 'Sécurité / CSRF',
    severity: 'info' as const,
    status: 'closed',
    agent: 'SECURITY',
    detail: 'Double Submit Cookie pattern correctement implémenté. Token CSRF vérifié sur tous les endpoints POST (/api/auth/verify, /api/quest/claim, /api/rewards/claim).',
    recommendation: 'RAS. Continuer à vérifier lors de l\'ajout de nouveaux endpoints.',
    prReady: false,
  },
  {
    id: 'A10',
    title: 'Wallet connect : Aucune transaction non-sollicitée',
    category: 'Sécurité Web3',
    severity: 'info' as const,
    status: 'closed',
    agent: 'SECURITY',
    detail: 'Audit positif : la connexion wallet ne demande que la signature d\'un message. Aucune transaction approve() ou transfer() lors de l\'authentification.',
    recommendation: '✅ Comportement correct. Maintenir cette pratique sur tous les futurs développements.',
    prReady: false,
  },
];

function getSeverityStyle(severity: string) {
  const map: Record<string, { color: string; bg: string; border: string; label: string }> = {
    critical: { color: '#FF3366', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.25)', label: '🔴 CRITIQUE' },
    high: { color: '#FF8C00', bg: 'rgba(255,140,0,0.08)', border: 'rgba(255,140,0,0.25)', label: '🟠 HIGH' },
    medium: { color: '#FFD700', bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.25)', label: '🟡 MEDIUM' },
    low: { color: '#00FF88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)', label: '🟢 LOW' },
    info: { color: '#00D4FF', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)', label: 'ℹ️ INFO' },
  };
  return map[severity] || map.info;
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    open: { label: 'Ouvert', color: '#FF8C00' },
    pending_review: { label: 'PR en review', color: '#00D4FF' },
    closed: { label: '✅ Résolu', color: '#00FF88' },
    wontfix: { label: 'Won\'t Fix', color: '#888' },
  };
  return map[status] || map.open;
}

export default function AuditReport() {
  const open = AUDIT_FINDINGS.filter(f => f.status === 'open' || f.status === 'pending_review');
  const closed = AUDIT_FINDINGS.filter(f => f.status === 'closed');

  const highCount = AUDIT_FINDINGS.filter(f => (f.severity as string === 'critical' || f.severity === 'high') && f.status !== 'closed').length;
  const medCount = AUDIT_FINDINGS.filter(f => f.severity === 'medium' && f.status !== 'closed').length;
  const lowCount = AUDIT_FINDINGS.filter(f => (f.severity === 'low' || f.severity === 'info') && f.status !== 'closed').length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Rapport d'Audit — Site SHUI</h2>
          <p className="text-sm text-gray-400 mt-1">
            Généré automatiquement par les agents IA • Dernière mise à jour: 25/04/2026
          </p>
        </div>
        <div className="flex gap-2">
          <div className="text-center px-4 py-2 rounded-lg" style={{ background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.2)' }}>
            <div className="text-lg font-bold" style={{ color: '#FF8C00' }}>{highCount}</div>
            <div className="text-xs text-gray-500">High</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg" style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
            <div className="text-lg font-bold" style={{ color: '#FFD700' }}>{medCount}</div>
            <div className="text-xs text-gray-500">Medium</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <div className="text-lg font-bold" style={{ color: '#00FF88' }}>{closed.length}</div>
            <div className="text-xs text-gray-500">Résolus</div>
          </div>
        </div>
      </div>

      {/* Open findings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          🔍 Findings Actifs ({open.length})
        </h3>
        <div className="space-y-3">
          {open.map(finding => {
            const sev = getSeverityStyle(finding.severity);
            const statusBadge = getStatusBadge(finding.status);
            return (
              <div key={finding.id} className="rounded-xl overflow-hidden"
                style={{ background: '#0D1526', border: `1px solid ${sev.border}` }}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 p-4"
                  style={{ borderBottom: '1px solid #1A2440' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono px-2 py-1 rounded flex-shrink-0"
                      style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                      {sev.label}
                    </span>
                    <div>
                      <div className="font-medium text-white text-sm">
                        <span className="text-gray-500 font-mono mr-2">[{finding.id}]</span>
                        {finding.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{finding.category}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-xs" style={{ color: '#888' }}>Agent {finding.agent}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-medium" style={{ color: statusBadge.color }}>
                      {statusBadge.label}
                    </span>
                    {finding.prReady && (
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                        📋 PR prête
                      </span>
                    )}
                  </div>
                </div>

                {/* Detail */}
                <div className="p-4 space-y-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1">📋 Description</div>
                    <p className="text-sm text-gray-300">{finding.detail}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1">💡 Recommandation</div>
                    <p className="text-sm" style={{ color: '#00D4FF' }}>{finding.recommendation}</p>
                  </div>
                  {finding.prUrl && (
                    <div className="flex items-center gap-2">
                      <a href={finding.prUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs hover:underline flex items-center gap-1"
                        style={{ color: '#7B4FFF' }}>
                        🔗 Voir la Pull Request → {finding.prUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Closed findings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          ✅ Findings Résolus / Points Positifs ({closed.length})
        </h3>
        <div className="space-y-2">
          {closed.map(finding => (
            <div key={finding.id} className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)' }}>
              <span style={{ color: '#00FF88' }}>✅</span>
              <div>
                <div className="text-sm text-gray-300">{finding.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{finding.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
