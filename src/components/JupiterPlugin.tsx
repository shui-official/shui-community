import { useEffect, useRef } from "react";
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
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function boot() {
      await ensureJupiterScriptLoaded();
      if (cancelled) return;
      if (!window.Jupiter || typeof window.Jupiter.init !== "function") return;

      // Re-init propre si on remonte le composant
      if (initializedRef.current) {
        try {
          window.Jupiter?.close?.();
        } catch {
          // noop
        }
        const el = document.getElementById(targetId);
        if (el) el.innerHTML = "";
        initializedRef.current = false;
      }

      initializedRef.current = true;

      /**
       * ✅ IMPORTANT :
       * On désactive le wallet passthrough.
       * Jupiter gère la connexion et la signature directement via Phantom/Solflare (comme sur jup.ag).
       * => évite le cas “Missing signed transaction” en prod.
       */
      window.Jupiter.init({
        displayMode: "integrated",
        integratedTargetId: targetId,

        enableWalletPassthrough: false,

        formProps: {
          ...(initialInputMint ? { initialInputMint } : {}),
          ...(initialOutputMint ? { initialOutputMint } : {}),
        },

        containerClassName: "w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4",
      });
    }

    boot();

    return () => {
      cancelled = true;
      try {
        window.Jupiter?.close?.();
      } catch {
        // noop
      }
      initializedRef.current = false;
      const el = document.getElementById(targetId);
      if (el) el.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, initialInputMint, initialOutputMint]);

  return (
    <BeginnerHint
      title="Swap (simple)"
      hintText={
        "Ici tu échanges SOL → SHUI.\n" +
        "Swap = transaction (normal) : ton wallet te demandera de confirmer.\n" +
        "Si Jupiter te demande de connecter un wallet dans le widget : c’est normal (connexion swap ≠ login V2)."
      }
    >
      <div id={targetId} />
    </BeginnerHint>
  );
}
