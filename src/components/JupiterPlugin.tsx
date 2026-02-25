import { useEffect, useMemo, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletContextState } from "@solana/wallet-adapter-react";
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

  if (window.Jupiter && typeof window.Jupiter.init === "function") {
    return Promise.resolve();
  }

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
      () => reject(new Error("Failed to load Jupiter script")),
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

  /**
   * IMPORTANT:
   * - Pas de .bind() : certains adapters utilisent leur propre contexte
   * - On inclut `wallet` (adapter) car Jupiter peut s'appuyer dessus pour signer/envoyer
   */
  const passthrough = useMemo(() => {
    const w = wallet as WalletContextState & any;
    return {
      // state
      publicKey: w.publicKey || null,
      connected: Boolean(w.connected),
      connecting: Boolean(w.connecting),
      disconnecting: Boolean(w.disconnecting),

      // wallet (adapter) — crucial pour Jupiter
      wallet: w.wallet || null,

      // methods (sans bind)
      connect: typeof w.connect === "function" ? w.connect : undefined,
      disconnect: typeof w.disconnect === "function" ? w.disconnect : undefined,
      sendTransaction: typeof w.sendTransaction === "function" ? w.sendTransaction : undefined,
      signTransaction: typeof w.signTransaction === "function" ? w.signTransaction : undefined,
      signAllTransactions: typeof w.signAllTransactions === "function" ? w.signAllTransactions : undefined,
      signMessage: typeof w.signMessage === "function" ? w.signMessage : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wallet.publicKey?.toBase58?.() || "",
    wallet.connected,
    wallet.connecting,
    wallet.disconnecting,
    // functions:
    wallet.connect,
    wallet.disconnect,
    wallet.sendTransaction,
    // @ts-ignore
    wallet.signTransaction,
    // @ts-ignore
    wallet.signAllTransactions,
    // @ts-ignore
    wallet.signMessage,
    // @ts-ignore
    wallet.wallet,
  ]);

  const canSwap = Boolean(passthrough.connected && passthrough.publicKey && (passthrough.signTransaction || passthrough.sendTransaction));

  const initializedRef = useRef(false);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const walletKey = `${passthrough.connected ? "1" : "0"}:${passthrough.publicKey?.toBase58?.() || ""}:${
      passthrough.signTransaction ? "signTx" : "noSignTx"
    }:${passthrough.sendTransaction ? "sendTx" : "noSendTx"}`;

    async function boot() {
      // Wallet pas prêt => on n'init pas Jupiter
      if (!canSwap) {
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

      // wallet change => re-init (plus fiable que syncProps seul)
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

      if (!initializedRef.current) {
        initializedRef.current = true;
        lastKeyRef.current = walletKey;

        window.Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: targetId,

          enableWalletPassthrough: true,
          passthroughWalletContextState: passthrough,

          formProps: {
            ...(initialInputMint ? { initialInputMint } : {}),
            ...(initialOutputMint ? { initialOutputMint } : {}),
          },

          containerClassName: "w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4",
        });

        return;
      }

      // déjà init => sync props
      try {
        window.Jupiter?.syncProps?.({
          passthroughWalletContextState: passthrough,
        });
      } catch {
        // noop
      }
    }

    boot().catch(() => {
      initializedRef.current = false;
      lastKeyRef.current = "";
    });

    return () => {
      cancelled = true;
    };
  }, [targetId, initialInputMint, initialOutputMint, passthrough, canSwap]);

  return (
    <BeginnerHint
      title="Swap (simple)"
      hintText={
        "Ici tu échanges SOL → SHUI.\n" +
        "Swap = transaction (normal) : Phantom te demandera de confirmer.\n" +
        "Astuce : connecte Phantom/Solflare avant de swap."
      }
    >
      {!canSwap ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Connecte un wallet <strong className="text-white">Solana</strong> (Phantom / Solflare) pour activer le swap intégré.
          <div className="mt-2 text-xs text-white/50">Login = message signé (gratuit). Swap = transaction (normal).</div>
        </div>
      ) : (
        <div id={targetId} />
      )}
    </BeginnerHint>
  );
}
