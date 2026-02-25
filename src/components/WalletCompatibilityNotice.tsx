import { useEffect, useState } from "react";

export default function WalletCompatibilityNotice() {
  const [hasEthereum, setHasEthereum] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasEthereum(Boolean((window as any).ethereum));
  }, []);

  if (!hasEthereum) return null;

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
      <div className="font-semibold">Info Wallet (important)</div>
      <div className="mt-2 text-amber-100/90">
        MetaMask est détecté dans ce navigateur. SHUI est un token <strong>Solana</strong> :
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Pour acheter/swap SHUI sur Solana : utilise Phantom / Solflare / Backpack.</li>
          <li>MetaMask sert aux réseaux EVM. Pour l’utiliser avec SHUI : il faut passer par un bridge/on-ramp.</li>
        </ul>
      </div>
      <div className="mt-3 text-xs text-amber-100/80">
        Sécurité : on ne te demandera jamais ta seed phrase. Login = message signé. Swap = transaction Solana (normal).
      </div>
    </div>
  );
}
