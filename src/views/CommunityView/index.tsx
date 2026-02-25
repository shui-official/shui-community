import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { useBeginnerMode } from "../../contexts/BeginnerMode";
import SecureLogin from "../../components/SecureLogin";
import RaydiumPoolPanel from "../../components/RaydiumPoolPanel";
import BeginnerProgress from "../../components/BeginnerProgress";
import BuyShuiPanel from "../../components/BuyShuiPanel";
import WalletCompatibilityNotice from "../../components/WalletCompatibilityNotice";

const SHUI_MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";

const SOCIALS = {
  tg: "http://t.me/Shui_Community",
  ig: "http://instagram.com/shui.officialtoken",
};

function solscanTokenUrl() {
  return `https://solscan.io/token/${SHUI_MINT}`;
}

export default function CommunityView() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { publicKey, connected } = useWallet();
  const { isBeginner, openCoach, setGuideOpen } = useBeginnerMode();

  const wallet = useMemo(() => publicKey?.toBase58() || "", [publicKey]);

  // ✅ GUARD: /community réservé aux wallets connectés (petit délai pour auto-connect)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!connected && !publicKey) {
        router.replace("/", undefined, { locale: router.locale });
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [connected, publicKey, router]);

  async function onDashboardClick(e: any) {
    if (!isBeginner) return;
    e.preventDefault();

    if (!connected) {
      openCoach(t("community.coach.dashboardAccessTitle"), t("community.coach.dashboardNeedWalletText"));
      setGuideOpen(true);
      return;
    }

    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      const j = await r.json();
      if (r.ok && j?.ok) {
        router.push("/dashboard", undefined, { locale: router.locale });
        return;
      }
    } catch {
      // ignore
    }

    openCoach(t("community.coach.dashboardAccessTitle"), t("community.coach.dashboardNeedSessionText"));
    setGuideOpen(true);
    router.push("/community#secure-login", undefined, { locale: router.locale });
  }

  const connectedLabel = publicKey ? t("community.connected") : t("community.notConnected");

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
              <div className="text-xs text-white/60">{t("community.topTagline")}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs text-white/60">
              {publicKey ? <span className="text-emerald-300">{connectedLabel}</span> : connectedLabel}
            </div>

            <Link href="/dashboard" passHref>
              <a
                onClick={onDashboardClick}
                className="hidden md:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                {t("nav.dashboard")}
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
              {t("nav.backHome")}
            </a>
          </Link>

          <div className="text-xs text-white/50 break-all">
            {wallet ? (
              <>
                {t("community.walletLabel")}:{" "}
                <span className="text-white/80">
                  {wallet.slice(0, 4)}…{wallet.slice(-4)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-sm text-white/60">{t("nav.community")}</div>
            <h1 className="mt-2 text-5xl font-extrabold text-white leading-tight">{t("community.dashboardMembers")}</h1>

            <p className="mt-3 text-white/70">
              {t("community.toolsIntro")}
              <br />
              <strong className="text-white">{t("community.accessNoTxStrong")}</strong>
            </p>

            <div className="mt-4 text-xs text-white/50 break-all">
              {t("community.mintLabel")}: {SHUI_MINT}
            </div>

            <div className="mt-4 text-xs text-white/50">
              {t("community.loginNoTx")}
              <br />
              {t("community.swapTxNormal")}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10"
                href={solscanTokenUrl()}
                target="_blank"
                rel="noreferrer"
              >
                {t("community.viewOnSolscan")}
              </a>
            </div>
          </section>

          <aside className="space-y-6">
            {isBeginner ? <BeginnerProgress /> : null}

            <WalletCompatibilityNotice />

            <div id="secure-login">
              <SecureLogin />
            </div>

            <BuyShuiPanel />

            <RaydiumPoolPanel />

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm font-semibold text-white/90">{t("community.nextStepsTitle")}</div>
              <ul className="mt-3 space-y-2 text-white/70">
                <li>{t("community.nextSteps1")}</li>
                <li>{t("community.nextSteps2")}</li>
                <li>{t("community.nextSteps3")}</li>
              </ul>
              <p className="mt-4 text-xs text-white/50">{t("community.securityUltra")}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
