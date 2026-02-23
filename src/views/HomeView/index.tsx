import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getShuiBalance } from "../../utils/solana";
import type { FC } from "react";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const BUBBLEMAPS_URL =
  "https://v2.bubblemaps.io/map?address=CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C&chain=solana&limit=80";

const SOCIALS = {
  x: "https://x.com/Shui_Labs",
  tg: "http://t.me/Shui_Community",
  ig: "http://instagram.com/shui.officialtoken",
};

export const HomeView: FC = () => {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(45%_45%_at_70%_25%,rgba(168,85,247,0.14),transparent_60%),radial-gradient(40%_40%_at_55%_85%,rgba(16,185,129,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      </div>

      {/* Top bar */}
      <div className="relative mx-auto max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10 bg-black/20">
              <img
                src="/shui-token.png"
                alt="SHUI Token"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-wide">SHUI</div>
              <div className="text-xs text-white/60">
                Solana Community Token • Transparency-first
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (SOCIALS + STATUS + WALLET) */}
          <div className="flex items-center gap-3">
            {/* Wallet status */}
            <div className="hidden sm:block text-xs text-white/50">
              {publicKey ? (
                <span className="text-emerald-300">Connected</span>
              ) : (
                <span className="text-white/60">Not connected</span>
              )}
            </div>

            {/* Socials: ALWAYS next to wallet */}
            <a
              href={SOCIALS.x}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="X"
              title="X"
            >
              X
            </a>

            <a
              href={SOCIALS.tg}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Telegram"
              title="Telegram"
            >
              Telegram
            </a>

            <a
              href={SOCIALS.ig}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Instagram"
              title="Instagram"
            >
              Instagram
            </a>

            <WalletMultiButton className="!bg-white/10 hover:!bg-white/15 !text-white !border !border-white/10 !rounded-xl" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <main className="relative mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          {/* Left */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Community token • Treasury • Governance
            </div>

            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Build together.
              <span className="block text-white/60">
                Reward participation, fund initiatives, and govern transparently.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-white/70 md:text-lg">
              SHUI is a Solana-native community token designed to reward contributors,
              finance projects via a shared treasury, and operate with clear rules and
              public accountability.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#token"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1220] hover:bg-white/90"
              >
                Token Overview
              </a>

              {/* ✅ FIX: Community doit aller sur /community */}
              <Link href="/community" passHref>
                <a className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Community
                </a>
              </Link>

              <Link href="/mint" passHref>
                <a className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Open dApp
                </a>
              </Link>
            </div>

            <div className="mt-5 text-xs text-white/50">
              Live holder map powered by Bubblemaps (Top 80).
            </div>
          </div>

          {/* Right: Bubblemaps Embed */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="text-sm font-semibold">Live Holder Map</div>
                <a
                  href={BUBBLEMAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-white/70 hover:text-white"
                >
                  Open full view →
                </a>
              </div>

              {/* Responsive 16:10 */}
              <div className="relative w-full" style={{ paddingTop: "62.5%" }}>
                <iframe
                  src={BUBBLEMAPS_URL}
                  title="SHUI Bubblemaps"
                  className="absolute inset-0 h-full w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  allow="fullscreen"
                />
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-white/40">
              Data updates depend on Bubblemaps refresh cadence.
            </div>
          </div>
        </div>

        {/* Sections */}
        <section
          id="token"
          className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-8"
        >
          <h2 className="text-xl font-semibold">Token Overview</h2>
          <p className="mt-3 text-white/70">
            SHUI rewards meaningful participation, supports initiatives via a community
            treasury, and aims for professional-grade transparency.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-semibold">Participation Rewards</div>
              <div className="mt-2 text-sm text-white/65">
                Incentives for builders, contributors, and community actions.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-semibold">Community Treasury</div>
              <div className="mt-2 text-sm text-white/65">
                Funding proposals with traceable decisions and spending.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-semibold">Serious Structure</div>
              <div className="mt-2 text-sm text-white/65">
                Clear rules, processes, and public documentation.
              </div>
            </div>
          </div>
        </section>

        <section
          id="community"
          className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8"
        >
          <h2 className="text-xl font-semibold">Community</h2>
          <p className="mt-3 text-white/70">
            Section community (info). Pour l’espace membres, utilise la page{" "}
            <span className="text-white font-semibold">/community</span>.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/community" passHref>
              <a className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500">
                Accéder à la communauté
              </a>
            </Link>

            <a
              href={SOCIALS.tg}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Rejoindre Telegram
            </a>
          </div>

          <p className="mt-4 text-xs text-white/50">
            Aucune transaction n’est demandée pour accéder aux membres (V1).
          </p>
        </section>

        <div className="mt-12 text-center text-xs text-white/40">
          © {new Date().getFullYear()} SHUI — Community-driven, transparency-first.
        </div>
      </main>
    </div>
  );
};
