import { useEffect, useRef } from "react";
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
  const lastWalletKeyRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function bootOrSync() {
      await ensureJupiterScriptLoaded();
      if (cancelled) return;

      if (!window.Jupiter || typeof window.Jupiter.init !== "function") return;

      // On construit une clé stable pour détecter un vrai changement wallet
      const walletKey = `${wallet.connected ? "1" : "0"}:${wallet.publicKey?.toBase58?.() || ""}`;

      // Déjà initialisé -> on sync à chaque changement important
      if (initializedRef.current) {
        if (walletKey !== lastWalletKeyRef.current) {
          lastWalletKeyRef.current = walletKey;
          try {
            window.Jupiter?.syncProps?.({
              passthroughWalletContextState: wallet,
            });
          } catch {
            // noop
          }
        }
        return;
      }

      // Pas encore initialisé -> init une fois, mais avec le wallet courant
      initializedRef.current = true;
      lastWalletKeyRef.current = walletKey;

      window.Jupiter.init({
        displayMode: "integrated",
        integratedTargetId: targetId,

        // Wallet passthrough
        enableWalletPassthrough: true,
        passthroughWalletContextState: wallet,

        formProps: {
          ...(initialInputMint ? { initialInputMint } : {}),
          ...(initialOutputMint ? { initialOutputMint } : {}),
        },

        containerClassName: "w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4",
      });
    }

    bootOrSync().catch(() => {
      // Si jamais le chargement échoue, on permet une future tentative
      initializedRef.current = false;
    });

    return () => {
      cancelled = true;
    };
    // Important: on veut réagir aux changements wallet
  }, [wallet.connected, wallet.publicKey, targetId, initialInputMint, initialOutputMint, wallet]);

  return (
    <BeginnerHint
      title="Swap (simple)"
      hintText={
        "Ici tu échanges SOL → SHUI.\n" +
        "Swap = transaction (normal) : Phantom te demandera de confirmer.\n" +
        "1) Vérifie From = SOL.\n" +
        "2) Vérifie To = SHUI.\n" +
        "3) Choisis un petit montant pour tester.\n" +
        "4) Clique Swap → confirme la transaction."
      }
    >
      <div id={targetId} />
    </BeginnerHint>
  );
}