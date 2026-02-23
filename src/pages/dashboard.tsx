import type { GetServerSideProps } from "next";
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

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

  // ✅ Pas de session => retour accueil
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const locale = ctx.locale ?? "fr";
  const i18nProps = await serverSideTranslations(locale, ["common"]);

  return {
    props: { wallet: session.wallet, exp: session.exp, iat: session.iat, ...i18nProps } as any,
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
  const { t } = useTranslation("common");
  const router = useRouter();
  const { connected, publicKey } = useWallet();

  // ✅ CLIENT GUARD: wallet doit être connecté ET matcher la session
  useEffect(() => {
    const w = publicKey?.toBase58() || "";

    // Wallet déconnecté => logout cookie + retour accueil
    if (!connected || !w) {
      logoutSession().finally(() => router.replace("/"));
      return;
    }

    // Wallet mismatch => logout cookie + retour accueil
    if (wallet && w && wallet !== w) {
      logoutSession().finally(() => router.replace("/"));
    }
  }, [connected, publicKey, wallet, router]);

  const expDate = new Date(exp * 1000);
  const iatDate = new Date(iat * 1000);

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <Head>
        <title>{t("dashboard.pageTitle")}</title>
        <meta name="description" content={t("dashboard.pageDescription")} />
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
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10 bg-black/20">
              <Image src="/shui-token.png" alt="SHUI Token" layout="fill" objectFit="cover" priority />
            </div>

            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-wide">SHUI</div>
              <div className="text-xs text-white/60">{t("dashboard.topTagline")}</div>
            </div>
          </div>

          <div className="text-xs text-white/70">
            {t("dashboard.walletShort")} : <span className="text-white/90 font-semibold">{short(wallet)}</span>
          </div>
        </div>

        {/* Quick nav */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Link href="/community" passHref>
              <a className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                {t("dashboard.backCommunity")}
              </a>
            </Link>

            <a
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              href={`https://solscan.io/account/${wallet}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("dashboard.solscanWallet")}
            </a>

            <a
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
              href="https://solscan.io/token/CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C"
              target="_blank"
              rel="noreferrer"
            >
              {t("dashboard.solscanShui")}
            </a>
          </div>

          <div className="text-xs text-white/60">
            {t("dashboard.statusLabel")} : <span className="text-emerald-300 font-semibold">{t("dashboard.statusOk")}</span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:col-span-2">
            <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
            <p className="mt-2 text-white/70">{t("dashboard.intro")}</p>

            <BeginnerHint title={t("dashboard.beginnerDashboardTitle")} hintText={t("dashboard.beginnerDashboardHint")}>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold">{t("dashboard.securityBoxTitle")}</div>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  <li>{t("dashboard.security1")}</li>
                  <li>{t("dashboard.security2")}</li>
                  <li>{t("dashboard.security3")}</li>
                  <li>{t("dashboard.security4")}</li>
                </ul>
              </div>
            </BeginnerHint>

            {/* Session info */}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold">{t("dashboard.sessionStartTitle")}</div>
                <div className="mt-2 text-sm text-white/70">{iatDate.toLocaleString()}</div>
                <div className="mt-2 text-xs text-white/50">{t("dashboard.issuedAt")}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm font-semibold">{t("dashboard.sessionExpTitle")}</div>
                <div className="mt-2 text-sm text-white/70">{expDate.toLocaleString()}</div>
                <div className="mt-2 text-xs text-white/50">{t("dashboard.expiresAuto")}</div>
              </div>
            </div>

            {/* Quêtes */}
            <div className="mt-6" id="quest-panel">
              <BeginnerHint title={t("dashboard.questsTitle")} hintText={t("dashboard.questsHint")}>
                <div>
                  <QuestPanel />
                </div>
              </BeginnerHint>
            </div>

            {/* Rewards */}
            <div className="mt-6" id="rewards-panel">
              <BeginnerHint title={t("dashboard.rewardsTitle")} hintText={t("dashboard.rewardsHint")}>
                <div>
                  <RewardsPanel />
                </div>
              </BeginnerHint>
            </div>
          </section>

          {/* Side */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm font-semibold text-white/90">{t("dashboard.memberIdentityTitle")}</div>
              <div className="mt-3 text-sm text-white/70">
                {t("dashboard.fullWallet")} :
                <div className="mt-2 break-all rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/80">{wallet}</div>
              </div>

              <p className="mt-4 text-xs text-white/50">{t("dashboard.identityNote")}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm font-semibold text-white/90">{t("dashboard.quickHelpTitle")}</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>{t("dashboard.help1")}</li>
                <li>{t("dashboard.help2")}</li>
                <li>{t("dashboard.help3")}</li>
              </ul>
            </div>

            <RaydiumPoolPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
