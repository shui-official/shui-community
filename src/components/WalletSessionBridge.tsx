import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";

async function safeLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // noop
  }
}

export default function WalletSessionBridge() {
  const router = useRouter();
  const { connected } = useWallet();
  const prevConnected = useRef<boolean>(connected);

  useEffect(() => {
    // détecte un "connected -> disconnected"
    const was = prevConnected.current;
    prevConnected.current = connected;

    if (was && !connected) {
      // wallet vient d'être déconnecté : on logout la session serveur
      safeLogout().finally(() => {
        // si l'utilisateur est sur dashboard, on le renvoie sur community
        if (router.pathname === "/dashboard") {
          router.replace("/community?reason=wallet_disconnected");
        }
      });
    }
  }, [connected, router]);

  return null;
}
