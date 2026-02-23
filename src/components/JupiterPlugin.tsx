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
  const initAttemptedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function init() {
      if (initAttemptedRef.current) return;
      initAttemptedRef.current = true;

      try {
        await ensureJupiterScriptLoaded();
        if (cancelled) return;

        if (!window.Jupiter || typeof window.Jupiter.init !== "function") {
          return;
        }

        if (initializedRef.current) {
          try {
            window.Jupiter?.syncProps?.({ passthroughWalletContextState: wallet });
          } catch {
            // noop
          }
          return;
        }

        initializedRef.current = true;

        window.Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: targetId,

          enableWalletPassthrough: true,
          passthroughWalletContextState: wallet,

          formProps: {
            ...(initialInputMint ? { initialInputMint } : {}),
            ...(initialOutputMint ? { initialOutputMint } : {}),
          },

          containerClassName:
            "w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4",
        });
      } finally {
        // Autorise une nouvelle tentative si init n'a pas réellement eu lieu
        setTimeout(() => {
          if (!cancelled && !initializedRef.current) initAttemptedRef.current = false;
        }, 3000);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, targetId, initialInputMint, initialOutputMint]);

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
