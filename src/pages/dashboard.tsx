import type { GetServerSideProps } from "next";
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import { getSession } from "../lib/security/session";
import BeginnerHint from "../components/BeginnerHint";

const QuestPanel = dynamic(() => import("../components/QuestPanel"), { ssr: false });
const RewardsPanel = dynamic(() => import("../components/RewardsPanel"), { ssr: false });
const RaydiumPoolPanel = dynamic(() => import("../components/RaydiumPoolPanel"), { ssr: false });

type Props = {
  wallet: string;
  exp: number;
  iat: number;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const req = ctx.req as any;

  const session = getSession(req);
  if (!session) {
    return { redirect: { destination: "/community", permanent: false } };
  }

  return {
    props: { wallet: session.wallet, exp: session.exp, iat: session.iat },
  };
};


async function logoutSession() {
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

function short(addr: string) {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : "";
}

export default function DashboardPage({ wallet, exp, iat }: Props) {
  const router = useRouter();
  const { connected, publicKey } = useWallet();

  // ✅ CLIENT GUARD: wallet doit être connecté ET matcher la session
  useEffect(() => {
    const w = publicKey?.toBase58() || "";
    if (!connected || !w) {
      logoutSession().finally(() => router.replace("/community?reason=wallet_required"));
      return;
    }
    if (wallet && w && wallet !== w) {
      logoutSession().finally(() => router.replace("/community?reason=wallet_mismatch"));
    }
  }, [connected, publicKey, wallet, router]);

  const expDate = new Date(exp * 1000);
  const iatDate = new Date(iat * 1000);

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <Head>
        <title>SHUI — Dashboard</title>
        <meta name="description" content="Espace membres SHUI — accès protégé par session (V2)." />
      </Head>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(45%_45%_at_70%_25%,rgba(168,85,247,0.14),transparent_60%),radial-gradient(40%_40%_at_55%_85%,rgba(16,185,129,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-8 pb-12">
        {/* Top card */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10 bg-black/20">
              <img src="/shui-token.png" alt="SHUI Token" className="h-full w-full object-cover" />
            </div>

            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-wide">SHUI</div>
              <div className="text-xs text-white/60">Dashboard membres (protégé V2)</div>
            </div>
          </div>

          <div className="text-xs text-white/70">
            Wallet : <span className="text-white/90 font-semibold">{short(wallet)}</span>
          </div>
        </div>

        {/* Quick nav */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Link href="/community" passHref>
              <a className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                ← Retour à /community
              </a>
            </Link>

            <a
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              href={`https://solscan.io/account/${wallet}`}
              target="_blank"
              rel="noreferrer"
            >
              Solscan (wallet)
            </a>

            <a
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
              href="https://solscan.io/token/CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C"
              target="_blank"
              rel="noreferrer"
            >
              Solscan (SHUI)
            </a>
          </div>

          <div className="text-xs text-white/60">
            Statut : <span className="text-emerald-300 font-semibold">Session OK</span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:col-span-2">
            <h1 className="text-3xl font-bold">Espace membres</h1>
            <p className="mt-2 text-white/70">
              Tu es connecté via <strong className="text-white">V2 ULTRA</strong> : signature d’un message lisible + nonce +
              session serveur (cookie httpOnly).
            </p>

            {/* Security banner */}
            <BeginnerHint
              title="Dashboard (simple)"
hintText={
                "Ici tu es déjà “connecté” (Session OK).\n" +
                "La session vient d’une signature de message (pas de transaction).\n" +
                "Si la session expire : retourne sur /community et réactive la connexion sécurisée."
              }
            >
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold">Sécurité — ce que tu dois retenir</div>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  <li>
                    ✅ <strong className="text-white">Connexion</strong> = signature d’un <strong className="text-white">message</strong> (pas de
                    transaction).
                  </li>
                  <li>
                    ✅ Anti-replay : <strong className="text-white">nonce unique</strong> + expiration courte.
                  </li>
                  <li>
                    ✅ Session : cookie <strong className="text-white">httpOnly</strong> (non lisible par le JS).
                  </li>
                  <li>
                    ⚠️ <strong className="text-white">Swap</strong> = transaction (normal). Tu vois toujours la transaction dans Phantom.
                  </li>
                </ul>
              </div>
            </BeginnerHint>

            {/* Session info */}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold">Session (début)</div>
                <div className="mt-2 text-sm text-white/70">{iatDate.toLocaleString()}</div>
                <div className="mt-2 text-xs text-white/50">Issued At (iat)</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold">Session (expiration)</div>
                <div className="mt-2 text-sm text-white/70">{expDate.toLocaleString()}</div>
                <div className="mt-2 text-xs text-white/50">Expire automatiquement</div>
              </div>
            </div>

            {/* ✅ Quêtes */}
            <div className="mt-6" id="quest-panel">
              <BeginnerHint
                title="Quêtes (simple)"
hintText={
                  "Les quêtes servent à récompenser l’activité.\n" +
                  "Tu suis les étapes proposées, puis tu valides.\n" +
                  "Certaines quêtes peuvent demander une action on-chain plus tard (swap/hold), mais pas le login."
                }
              >
                <div>
                  <QuestPanel />
                </div>
              </BeginnerHint>
            </div>

            {/* ✅ Rewards mensuels */}
            <div className="mt-6" id="rewards-panel">
              <BeginnerHint
                title="Rewards (simple)"
hintText={
                  "Ici tu vois tes récompenses / ton statut.\n" +
                  "Un export CSV ou des actions “admin” peuvent exister : elles sont réservées aux wallets allowlist.\n" +
                  "Si tu n’es pas admin, tu peux juste consulter."
                }
              >
                <div>
                  <RewardsPanel />
                </div>
              </BeginnerHint>
            </div>
          </section>

          {/* Side */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm font-semibold text-white/90">Identité membre</div>
              <div className="mt-3 text-sm text-white/70">
                Wallet complet :
                <div className="mt-2 break-all rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/80">{wallet}</div>
              </div>

              <p className="mt-4 text-xs text-white/50">
                Ce wallet a prouvé la possession via signature de message. Aucune clé privée n’est partagée.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm font-semibold text-white/90">Aide rapide</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>• Si “Session OK” disparaît : retourne sur /community et reconnecte V2.</li>
                <li>
                  • Si Phantom affiche une transaction pour login : <strong className="text-white">STOP</strong>.
                </li>
                <li>• Les swaps demandent une transaction : c’est normal.</li>
              </ul>
            </div>

            {/* ✅ Raydium Pool panel */}
            <RaydiumPoolPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
