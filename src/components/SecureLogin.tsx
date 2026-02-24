import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import BeginnerHint from "./BeginnerHint";

type MeRes =
  | { ok: true; wallet: string; exp: number }
  | { ok: false; error?: string };

type NonceRes =
  | { ok: true; wallet: string; nonce: string; issuedAt: number; expiresAt: number; message: string; nonceToken: string }
  | { ok: false; error: string };

export default function SecureLogin() {
  
  const { t } = useTranslation("common");
const { publicKey, signMessage, connected } = useWallet();

  const wallet = useMemo(() => publicKey?.toBase58() || "", [publicKey]);

  const [me, setMe] = useState<MeRes>({ ok: false });
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string>("");

  const isAuthed = !!wallet && me.ok && me.wallet === wallet;

  const refreshMe = useCallback(async (): Promise<MeRes> => {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    const j = (await r.json()) as MeRes;
    setMe(j);
    return j;
  }, []);

  useEffect(() => {
    refreshMe().catch(() => {});
  }, [refreshMe]);

  const doLogin = useCallback(async () => {
    setLastError("");

    if (!connected || !wallet) {
      setLastError("Connecte ton wallet d’abord.");
      return;
    }
    if (!signMessage) {
      setLastError(t("secureLogin.noSignMessage"));
      return;
    }

    setBusy(true);
    try {
      // 1) Nonce + message canonique serveur + nonceToken HMAC (anti-tamper)
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wallet }),
      });

      const nonceJson = (await nonceRes.json()) as NonceRes;
      if (!nonceJson.ok) {
        throw new Error(((nonceJson as any).error) || "nonce_failed");
      }

      // 2) Signature du message EXACT serveur (connexion ≠ transaction)
      const encoded = new TextEncoder().encode(nonceJson.message);
      const sigBytes = await signMessage(encoded);
      const signature = bs58.encode(sigBytes);

      // 3) Verify serveur (wallet + nonceToken + signature base58)
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wallet, nonceToken: nonceJson.nonceToken, signature }),
      });

      const verifyJson = await verifyRes.json();
      if (!verifyJson?.ok) {
        throw new Error(verifyJson?.error || "verify_failed");
      }

      // 4) Re-check session
      const m = await refreshMe();
      if (!m.ok) {
        setLastError(((m as any).error) ?? "Session non reconnue après verify.");
        return;
      }
    } catch (e: any) {
      setLastError(e?.message || "Erreur login");
    } finally {
      setBusy(false);
    }
  }, [connected, wallet, signMessage, refreshMe]);

  const doLogout = useCallback(async () => {
    setLastError("");
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await refreshMe();
  }, [refreshMe]);

  return (
    <BeginnerHint
      title="Connexion (simple)"
      hintText={
        "But : activer une session sans transaction.\n" +
        "Ce que tu signes : un message lisible (pas une transaction).\n" +
        "1) Connect ton wallet (bouton en haut).\n" +
        "2) Clique Activer la connexion sécurisée.\n" +
        "3) Phantom affiche un message → Sign.\n" +
        "Si Phantom te demande une transaction ici : STOP."
      }
    >
      <div id="secure-login" className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="text-sm font-semibold text-white/90">{t("secureLogin.title")}</div>

        <p className="mt-2 text-sm text-white/70">
          {t("secureLogin.desc")}
          <br />
          <span className="text-white font-semibold">{t("secureLogin.noTx")}</span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!isAuthed ? (
            <button
              onClick={doLogin}
              disabled={busy || !wallet || !signMessage}
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {busy ? "Ouvre Phantom…" : "Activer la connexion sécurisée"}
            </button>
          ) : (
            <button
              onClick={doLogout}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t("secureLogin.logout")}
            </button>
          )}

          <div className="text-xs text-white/60">
            {t("dashboard.statusLabel")}:  {isAuthed ? <span className="text-emerald-300">Session OK</span> : <span>Non activée</span>}
          </div>
        </div>

        <div className="mt-3 text-xs text-white/50 space-y-1">
          <div>
            <b>{t("secureLogin.walletConnected")} :</b> {connected ? t("secureLogin.yes") : t("secureLogin.no")}
          </div>
          <div>
            <b>{t("secureLogin.signMessageAvailable")}:  </b> {signMessage ? t("secureLogin.yes") : t("secureLogin.no")}
          </div>
          {lastError ? <div className="text-red-300">{lastError}</div> : null}
        </div>
      </div>
    </BeginnerHint>
  );
}
