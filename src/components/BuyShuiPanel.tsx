import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import JupiterPlugin from "./JupiterPlugin";

const SHUI_MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";
const SOL_MINT = "So11111111111111111111111111111111111111112";

function jupiterSwapUrl() {
  return `https://jup.ag/swap/SOL-${SHUI_MINT}`;
}

function jupiterTokenUrl() {
  return `https://jup.ag/tokens/${SHUI_MINT}`;
}

export default function BuyShuiPanel() {
  const wallet = useWallet();

  const hasEthereum = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).ethereum);
  }, []);

  const isSolanaWalletReady = Boolean(wallet.connected && wallet.publicKey);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="text-sm font-semibold text-white/90">Acheter SHUI (sécurisé)</div>
      <p className="mt-2 text-sm text-white/70">
        <strong>Connexion</strong> = signature de message (pas de transaction). <br />
        <strong>Achat / swap</strong> = transaction Solana (normal).
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <a
          href={jupiterSwapUrl()}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-purple-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-purple-500"
        >
          Ouvrir Jupiter (swap SOL → SHUI)
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

      <div className="mt-5">
        <div className="text-sm font-semibold text-white/90">Swap intégré (Jupiter)</div>
        <p className="mt-2 text-sm text-white/70">
          Pour utiliser le swap intégré, connecte un wallet <strong>Solana</strong> (Phantom/Solflare/Backpack).
        </p>

        <div className="mt-4">
          <JupiterPlugin targetId="jupiter-plugin" initialInputMint={SOL_MINT} initialOutputMint={SHUI_MINT} />
        </div>
      </div>

      {hasEthereum && !isSolanaWalletReady ? (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="font-semibold">MetaMask détecté</div>
          <div className="mt-2 text-amber-100/90">
            SHUI est sur Solana. Pour acheter avec MetaMask (EVM), le parcours safe est :
            <ol className="mt-2 list-decimal pl-5 space-y-1">
              <li>Bridge / on-ramp vers Solana (USDC/SOL sur Solana)</li>
              <li>Puis swap SOL/USDC → SHUI via Jupiter (lien ci-dessus)</li>
            </ol>
          </div>
          <div className="mt-3 text-xs text-amber-100/80">
            Conseil : évite de signer quoi que ce soit dans MetaMask depuis ce site — utilise Phantom/Solflare pour les transactions Solana.
          </div>
        </div>
      ) : null}
    </div>
  );
}
