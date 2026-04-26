import type { SecurityRule, Agent } from '@/data/agents';

interface SecurityPanelProps {
  rules: SecurityRule[];
  agents: Agent[];
}

const WEB3_CHECKLIST = [
  {
    category: 'Wallet Connect',
    icon: '🔐',
    color: '#00D4FF',
    checks: [
      { label: 'Connexion = signature de message uniquement (pas transaction)', status: 'ok' },
      { label: 'Nonce unique par session, expire en < 5 min', status: 'ok' },
      { label: 'Message signé contient domaine + nonce + timestamp', status: 'ok' },
      { label: 'Vérification signature côté serveur (tweetnacl)', status: 'ok' },
      { label: 'Aucun approve() ou transfert demandé à la connexion', status: 'ok' },
      { label: 'Support multi-wallets (Phantom, Solflare)', status: 'ok' },
    ],
  },
  {
    category: 'Session & Auth',
    icon: '🍪',
    color: '#7B4FFF',
    checks: [
      { label: 'Cookie HttpOnly + Secure + SameSite=Lax', status: 'ok' },
      { label: 'HMAC-SHA256 signature du token de session', status: 'ok' },
      { label: 'Expiration session 24h', status: 'ok' },
      { label: 'Logout efface le cookie correctement', status: 'ok' },
      { label: 'SameSite=Strict recommandé (actuellement Lax)', status: 'warn' },
      { label: 'Rotation de token après élévation de privilège', status: 'warn' },
    ],
  },
  {
    category: 'Protection CSRF',
    icon: '🛡️',
    color: '#00FF88',
    checks: [
      { label: 'Token CSRF généré par /api/auth/csrf', status: 'ok' },
      { label: 'Double Submit Cookie pattern', status: 'ok' },
      { label: 'Header X-CSRF-Token vérifié sur tous les POST', status: 'ok' },
      { label: 'SameSite Cookie aide à prévenir CSRF', status: 'ok' },
      { label: 'CSRF TTL 2h', status: 'ok' },
    ],
  },
  {
    category: 'Protection XSS',
    icon: '💉',
    color: '#FF8C00',
    checks: [
      { label: 'React escaping automatique des variables', status: 'ok' },
      { label: 'Pas de dangerouslySetInnerHTML détecté', status: 'ok' },
      { label: 'Content-Security-Policy header', status: 'warn' },
      { label: 'Sanitization inputs utilisateurs', status: 'ok' },
      { label: 'X-Content-Type-Options header', status: 'warn' },
    ],
  },
  {
    category: 'Dépendances',
    icon: '📦',
    color: '#FF3366',
    checks: [
      { label: '@project-serum/anchor v0.19.1-beta.1 (version ancienne)', status: 'fail' },
      { label: '@solana/wallet-adapter (versions récentes OK)', status: 'ok' },
      { label: 'next v12 (migration v14 recommandée)', status: 'warn' },
      { label: 'tweetnacl v1.0.3 (signature vérification OK)', status: 'ok' },
      { label: 'Audit npm automatique via GitHub Actions', status: 'ok' },
    ],
  },
  {
    category: 'API & Rate Limiting',
    icon: '⚡',
    color: '#FFD700',
    checks: [
      { label: 'Rate limiting implémenté (kvRest + rateLimit)', status: 'ok' },
      { label: 'Validation paramètres wallet (format Solana 44 chars)', status: 'ok' },
      { label: 'Méthode HTTP vérifiée (assertMethod)', status: 'ok' },
      { label: 'Origin/Referer validé (requireSameOrigin)', status: 'ok' },
      { label: 'Pas d\'exposition de clés privées dans les réponses', status: 'ok' },
    ],
  },
];

export default function SecurityPanel({ rules, agents }: SecurityPanelProps) {
  const absoluteRules = rules.filter(r => r.level === 'absolute');
  const criticalRules = rules.filter(r => r.level === 'critical');
  const importantRules = rules.filter(r => r.level === 'important');

  const totalChecks = WEB3_CHECKLIST.reduce((a, c) => a + c.checks.length, 0);
  const okChecks = WEB3_CHECKLIST.reduce((a, c) => a + c.checks.filter(ch => ch.status === 'ok').length, 0);
  const warnChecks = WEB3_CHECKLIST.reduce((a, c) => a + c.checks.filter(ch => ch.status === 'warn').length, 0);
  const failChecks = WEB3_CHECKLIST.reduce((a, c) => a + c.checks.filter(ch => ch.status === 'fail').length, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Sécurité Web3 — Checklist & Règles</h2>
          <p className="text-sm text-gray-400 mt-1">Audit complet basé sur l'analyse du code SHUI existant</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <div className="text-lg font-bold" style={{ color: '#00FF88' }}>{okChecks}</div>
            <div className="text-xs text-gray-500">OK</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg" style={{ background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.2)' }}>
            <div className="text-lg font-bold" style={{ color: '#FF8C00' }}>{warnChecks}</div>
            <div className="text-xs text-gray-500">WARN</div>
          </div>
          <div className="text-center px-4 py-2 rounded-lg" style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
            <div className="text-lg font-bold" style={{ color: '#FF3366' }}>{failChecks}</div>
            <div className="text-xs text-gray-500">FAIL</div>
          </div>
        </div>
      </div>

      {/* Score global */}
      <div className="rounded-xl p-5" style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-white">Score Sécurité Global</div>
          <div className="text-lg font-bold" style={{ color: '#00FF88' }}>
            {Math.round((okChecks / totalChecks) * 100)}%
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: '#1A2440' }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${(okChecks / totalChecks) * 100}%`,
              background: 'linear-gradient(90deg, #00D4FF, #00FF88)',
            }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{okChecks}/{totalChecks} checks passés</span>
          <span>{warnChecks} warnings • {failChecks} failures</span>
        </div>
      </div>

      {/* Règles de sécurité absolues */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
          🔒 Règles Absolues — Inviolables
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {absoluteRules.map(rule => (
            <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <div className="text-green-500 flex-shrink-0">🔒</div>
              <div className="text-sm text-gray-300">{rule.rule}</div>
              <div className="ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                ACTIF
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Règles critiques */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
          ⚠️ Règles Critiques — Workflow
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[...criticalRules, ...importantRules].map(rule => (
            <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: '#0D1526', border: '1px solid #1A2440' }}>
              <div className="text-yellow-500 flex-shrink-0">
                {rule.level === 'critical' ? '⚠️' : 'ℹ️'}
              </div>
              <div className="text-sm text-gray-300">{rule.rule}</div>
              <div className="ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                ACTIF
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Web3 Security Checklist */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          🔍 Checklist Sécurité Web3 — Audit Site SHUI
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WEB3_CHECKLIST.map(category => (
            <div key={category.category} className="rounded-xl p-4"
              style={{ background: '#0D1526', border: `1px solid ${category.color}20` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium text-white text-sm">{category.category}</span>
                <span className="ml-auto text-xs" style={{ color: category.color }}>
                  {category.checks.filter(c => c.status === 'ok').length}/{category.checks.length}
                </span>
              </div>
              <ul className="space-y-1.5">
                {category.checks.map((check, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 mt-0.5">
                      {check.status === 'ok' && <span style={{ color: '#00FF88' }}>✅</span>}
                      {check.status === 'warn' && <span style={{ color: '#FF8C00' }}>⚠️</span>}
                      {check.status === 'fail' && <span style={{ color: '#FF3366' }}>❌</span>}
                    </span>
                    <span className={check.status === 'fail' ? 'text-red-400' : check.status === 'warn' ? 'text-yellow-400' : 'text-gray-400'}>
                      {check.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions par agent */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          🤖 Permissions par Agent
        </h3>
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #1A2440' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0D1526', borderBottom: '1px solid #1A2440' }}>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Permission</th>
                {agents.map(a => (
                  <th key={a.id} className="text-center p-3 text-xs font-medium" style={{ color: a.color }}>
                    {a.emoji} {a.name.split(' ')[1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                'Lire le code source',
                'Créer branches dédiées',
                'Ouvrir Pull Requests',
                'Merger des PR',
                'Push sur main',
                'Déployer en production',
                'Accès clés privées',
                'Signer transactions',
                'Accès trésorerie',
                'Modifier env vars prod',
                'Bannir utilisateurs',
                'Valider quêtes seul',
              ].map((perm, i) => {
                const isAbsoluteForbidden = [
                  'Accès clés privées',
                  'Signer transactions',
                  'Accès trésorerie',
                  'Déployer en production',
                  'Merger des PR',
                  'Push sur main',
                ].includes(perm);

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1A2440', background: i % 2 === 0 ? '#0D1526' : '#0A0F1E' }}>
                    <td className="p-3 text-xs text-gray-400">{perm}</td>
                    {agents.map(a => {
                      const isAllowed = a.permissions.allowed.some(p =>
                        p.toLowerCase().includes(perm.toLowerCase().split(' ').slice(0, 2).join(' '))
                      );
                      const isForbidden = a.permissions.forbidden.some(p =>
                        p.toLowerCase().includes(perm.toLowerCase().split(' ').slice(0, 2).join(' '))
                      ) || isAbsoluteForbidden;

                      return (
                        <td key={a.id} className="p-3 text-center">
                          {isAbsoluteForbidden ? (
                            <span style={{ color: '#FF3366' }}>🚫</span>
                          ) : isAllowed ? (
                            <span style={{ color: '#00FF88' }}>✅</span>
                          ) : (
                            <span style={{ color: '#FF3366' }}>❌</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
