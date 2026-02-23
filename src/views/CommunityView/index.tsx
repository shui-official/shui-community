import Link from "next/link";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { useBeginnerMode } from "../../contexts/BeginnerMode";
import JupiterPlugin from "../../components/JupiterPlugin";
import SecureLogin from "../../components/SecureLogin";
import RaydiumPoolPanel from "../../components/RaydiumPoolPanel";
import BeginnerProgress from "../../components/BeginnerProgress";

const SHUI_MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";
const SOL_MINT = "So11111111111111111111111111111111111111112";

const SOCIALS = {
  tg: "http://t.me/Shui_Community",
  ig: "http://instagram.com/shui.officialtoken",
};

function jupiterTokenUrl() {
  return `https://jup.ag/tokens/${SHUI_MINT}`;
}
function jupiterSwapUrl() {
  return `https://jup.ag/swap/SOL-${SHUI_MINT}`;
}

export default function CommunityView() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { isBeginner, openCoach, setGuideOpen } = useBeginnerMode();

  async function onDashboardClick(e: any) {
    if (!isBeginner) return;
    e.preventDefault();

    if (!connected) {
      openCoach(
        "Accès Dashboard",
        `Pour accéder au dashboard :
1) Connecte d’abord ton wallet (bouton en haut).
2) Active la connexion sécurisée (V2) : tu signes un message (pas une transaction).
3) Ensuite : clique sur Dashboard.`
      );
      setGuideOpen(true);
      return;
    }

    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      const j = await r.json();
      if (r.ok && j?.ok) {
        router.push("/dashboard");
        return;
      }
    } catch {
      // ignore
    }

    openCoach(
      "Accès Dashboard",
      `Le dashboard est réservé aux membres avec Session OK.
Active d’abord la connexion sécurisée (V2) :
→ tu signes un message lisible (gratuit), PAS une transaction.`
    );
    setGuideOpen(true);
    router.push("/community#secure-login");
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(45%_45%_at_70%_25%,rgba(168,85,247,0.14),transparent_60%),radial-gradient(40%_40%_at_55%_85%,rgba(16,185,129,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10 bg-black/20">
              <img src="/shui-token.png" alt="SHUI Token" className="h-full w-full object-cover" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-wide">SHUI</div>
              <div className="text-xs text-white/60">Espace membres • Connexion sans transaction</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs text-white/60">
              {publicKey ? <span className="text-emerald-300">Connected</span> : "Not connected"}
            </div>

            <Link href="/dashboard" passHref>
              <a
                onClick={onDashboardClick}
                className="hidden md:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                Dashboard
              </a>
            </Link>

            <a
              href={SOCIALS.tg}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
            >
              Telegram
            </a>

            <a
              href={SOCIALS.ig}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
            >
              Instagram
            </a>

            <WalletMultiButton className="!bg-white/10 hover:!bg-white/15 !text-white !border !border-white/10 !rounded-xl" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link href="/" passHref>
            <a className="inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
              ← Retour accueil
            </a>
          </Link>

          <div className="text-xs text-white/50 break-all">
            {publicKey ? (
              <>
                Wallet :{" "}
                <span className="text-white/80">
                  {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-sm text-white/60">Community</div>
            <h1 className="mt-2 text-5xl font-extrabold text-white leading-tight">Espace membres</h1>
            <p className="mt-3 text-white/70">
              Ici tu trouveras les outils de la communauté SHUI.
              <br />
              <strong className="text-white">Connexion = accès (sans transaction).</strong>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-500"
                href={jupiterTokenUrl()}
                target="_blank"
                rel="noreferrer"
              >
                Buy / Sell sur Jupiter
              </a>

              <a
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10"
                href={jupiterSwapUrl()}
                target="_blank"
                rel="noreferrer"
              >
                Swap SOL → SHUI
              </a>

              <a
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10"
                href={`https://solscan.io/token/${SHUI_MINT}`}
                target="_blank"
                rel="noreferrer"
              >
                Voir sur Solscan
              </a>
            </div>

            <div className="mt-4 text-xs text-white/50 break-all">Mint SHUI : {SHUI_MINT}</div>

            <div className="mt-4 text-xs text-white/50">
              ✅ Connexion : aucune transaction.
              <br />
              ⚠️ Swap : si tu swaps, Jupiter te fera signer une transaction (normal).
            </div>
          </section>

          <aside className="space-y-6">
            {isBeginner ? <BeginnerProgress /> : null}

            <div id="secure-login">
              <SecureLogin />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm font-semibold text-white/90">Swap intégré (Jupiter)</div>
              <p className="mt-2 text-sm text-white/70">
                Swap directement ici (pré-config SOL → SHUI). Aucun swap n’est lancé sans ton action.
              </p>

              <div className="mt-4">
                <JupiterPlugin targetId="jupiter-plugin" initialInputMint={SOL_MINT} initialOutputMint={SHUI_MINT} />
              </div>
            </div>

            <RaydiumPoolPanel />

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm font-semibold text-white/90">Prochaines étapes</div>
              <ul className="mt-3 space-y-2 text-white/70">
                <li>• Quêtes / rewards (allowlist serveur)</li>
                <li>• Votes / propositions</li>
                <li>• Tableau de bord trésorerie</li>
              </ul>
              <p className="mt-4 text-xs text-white/50">
                Sécurité ULTRA : signMessage + nonce + session serveur anti-replay.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
