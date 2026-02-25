import { useEffect, useMemo, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import BeginnerHint from "./BeginnerHint";

declare global {
  interface Window {
    Jupiter?: {
      init: (props: any) => void;
      close?: () => void;
      resume?: () => void;
      syncProps?: (props: any) => void;
    };
  }
}

type Props = {
  targetId?: string;
  initialInputMint?: string;
  initialOutputMint?: string;
};

const DEFAULT_TARGET_ID = "jupiter-plugin";
const JUP_SCRIPT_SRC = "https://plugin.jup.ag/plugin-v1.js";

function ensureJupiterScriptLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  // Already available
  if (window.Jupiter && typeof window.Jupiter.init === "function") {
    return Promise.resolve();
  }

  // Already loading / loaded
  const existing = document.querySelector(`script[src="${JUP_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
  if (existing) {
    // @ts-ignore
    if ((existing as any)._loaded) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const onLoad = () => resolve();
      const onError = () => reject(new Error("Failed to load Jupiter script"));
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
    });
  }

  // Create script
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = JUP_SCRIPT_SRC;
    s.async = true;
    s.defer = true;

    s.addEventListener(
      "load",
      () => {
        // @ts-ignore
        (s as any)._loaded = true;
        resolve();
      },
      { once: true }
    );

    s.addEventListener(
      "error",
      () => {
        reject(new Error("Failed to load Jupiter script"));
      },
      { once: true }
    );

    document.head.appendChild(s);
  });
}

export default function JupiterPlugin({
  targetId = DEFAULT_TARGET_ID,
  initialInputMint,
  initialOutputMint,
}: Props) {
  const wallet = useWallet();

  const initializedRef = useRef(false);
  const lastKeyRef = useRef<string>("");

  // ✅ Ready uniquement si wallet Solana peut signer une transaction
  const canSignTx = useMemo(() => {
    return Boolean(wallet.connected && wallet.publicKey && (wallet as any).signTransaction);
  }, [wallet.connected, wallet.publicKey, wallet]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const walletKey = `${wallet.connected ? "1" : "0"}:${wallet.publicKey?.toBase58?.() || ""}:${
      canSignTx ? "signTx" : "noSignTx"
    }`;

    async function initOrReinit() {
      // 1) Wallet pas prêt => on n'init pas Jupiter
      if (!canSignTx) {
        if (initializedRef.current) {
          try {
            window.Jupiter?.close?.();
          } catch {
            // noop
          }
          initializedRef.current = false;
          lastKeyRef.current = "";
          const el = document.getElementById(targetId);
          if (el) el.innerHTML = "";
        }
        return;
      }

      await ensureJupiterScriptLoaded();
      if (cancelled) return;

      if (!window.Jupiter || typeof window.Jupiter.init !== "function") return;

      // 2) Wallet a changé => re-init propre (plus fiable que syncProps)
      if (initializedRef.current && walletKey !== lastKeyRef.current) {
        try {
          window.Jupiter?.close?.();
        } catch {
          // noop
        }
        initializedRef.current = false;
        const el = document.getElementById(targetId);
        if (el) el.innerHTML = "";
      }

      // 3) Init si nécessaire
      if (!initializedRef.current) {
        initializedRef.current = true;
        lastKeyRef.current = walletKey;

        window.Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: targetId,

          enableWalletPassthrough: true,
          passthroughWalletContextState: wallet,

          formProps: {
            ...(initialInputMint ? { initialInputMint } : {}),
            ...(initialOutputMint ? { initialOutputMint } : {}),
          },

          containerClassName: "w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4",
        });
      }
    }

    initOrReinit().catch(() => {
      initializedRef.current = false;
      lastKeyRef.current = "";
    });

    return () => {
      cancelled = true;
    };
  }, [wallet.connected, wallet.publicKey, canSignTx, targetId, initialInputMint, initialOutputMint, wallet]);

  return (
    <BeginnerHint
      title="Swap (simple)"
      hintText={
        "Ici tu échanges SOL → SHUI.\n" +
        "Swap = transaction (normal) : Phantom/Solflare te demandera de confirmer.\n" +
        "Astuce: connecte d'abord un wallet Solana (Phantom/Solflare) avant de swap."
      }
    >
      {!canSignTx ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Connecte un wallet <strong className="text-white">Solana</strong> (Phantom / Solflare) pour activer le swap intégré.
          <div className="mt-2 text-xs text-white/50">
            Si MetaMask affiche une alerte “deceptive request”, annule : ce swap doit être signé par un wallet Solana.
          </div>
        </div>
      ) : (
        <div id={targetId} />
      )}
    </BeginnerHint>
  );
}
