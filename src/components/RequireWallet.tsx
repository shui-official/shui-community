import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

// Wallet button (UI) doit rester client-side
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function RequireWallet({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="text-sm text-white/60 mb-2">🔒 Espace membres</div>
          <h1 className="text-3xl font-semibold text-white">Accès verrouillé</h1>
          <p className="mt-3 text-white/70">
            Connecte ton wallet pour accéder à l’espace communauté.
            <br />
            <strong className="text-white">Aucune transaction n’est demandée.</strong>
          </p>

          <div className="mt-6 inline-block">
            <WalletMultiButton />
          </div>

          <p className="mt-4 text-xs text-white/50">
            Note : le “membre” V1 est basé sur la présence du wallet (publicKey).
            La sécurisation serveur (signMessage + nonce) viendra ensuite.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
