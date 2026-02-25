import { useMemo, useState } from "react";

const SHUI_MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";

function jupiterSwapUrl() {
  return `https://jup.ag/swap/SOL-${SHUI_MINT}`;
}

function jupiterTokenUrl() {
  return `https://jup.ag/tokens/${SHUI_MINT}`;
}

// Iframe swap : fiable (pas dépendant du plugin-v1 et de ultra-api/execute côté page)
function JupiterIframe({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-semibold text-white">Jupiter Swap — SOL → SHUI</div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Fermer
          </button>
        </div>

        <div className="p-3">
          <div className="mb-2 text-xs text-white/60">
            Sécurité : un swap est une <strong>transaction Solana</strong>. Ton wallet affichera toujours les détails avant signature.
          </div>
          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-black">
            <iframe
              title="Jupiter Swap"
              src={jupiterSwapUrl()}
              className="h-full w-full"
              referrerPolicy="no-referrer"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            />
          </div>
          <div className="mt-3 text-xs text-white/50">
            Si ton wallet ne s’ouvre pas, essaye d’autoriser les popups pour jup.ag, ou clique “Ouvrir Jupiter” en dessous.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyShuiPanel() {
  const [open, setOpen] = useState(false);

  const hasEthereum = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).ethereum);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="text-sm font-semibold text-white/90">Acheter SHUI (sécurisé)</div>
      <p className="mt-2 text-sm text-white/70">
        <strong>Connexion</strong> = signature de message (pas de transaction). <br />
        <strong>Achat / swap</strong> = transaction Solana (normal).
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-purple-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-purple-500"
        >
          Acheter SHUI ici (swap intégré)
        </button>

        <a
          href={jupiterSwapUrl()}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
        >
          Ouvrir Jupiter (nouvel onglet)
        </a>

        <a
          href={jupiterTokenUrl()}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
        >
          Voir le token SHUI (Jupiter)
        </a>
      </div>

      {hasEthereum ? (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="font-semibold">MetaMask détecté</div>
          <div className="mt-2 text-amber-100/90">
            SHUI est sur Solana. MetaMask (EVM) ne peut pas signer une transaction Solana. Parcours safe :
            <ol className="mt-2 list-decimal pl-5 space-y-1">
              <li>Bridge / on-ramp vers Solana (USDC/SOL sur Solana)</li>
              <li>Puis swap vers SHUI via Jupiter (bouton ci-dessus)</li>
            </ol>
          </div>
          <div className="mt-3 text-xs text-amber-100/80">
            Ne partage jamais ta seed phrase. Les transactions doivent toujours être visibles dans ton wallet.
          </div>
        </div>
      ) : null}

      <JupiterIframe open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
