import type { FC } from "react";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const HomeView: FC = () => {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-[#2f3742] text-white">
      {/* Top bar */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between rounded-2xl bg-[#2a313b] px-5 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            {/* Token logo (left) */}
            <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10">
              <img
                src="/shui-token.png"
                alt="SHUI Token"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-wide">SHUI</div>
              <div className="text-xs text-white/60">Solana Community Token</div>
            </div>
          </div>

          {/* KEEP WALLET BUTTON */}
          <WalletMultiButton className="!bg-white/10 hover:!bg-white/15 !text-white !border !border-white/10 !rounded-xl" />
        </div>
      </div>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Text */}
          <div>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              SHUI — a community token built for{" "}
              <span className="text-white/80">participation</span> and{" "}
              <span className="text-white/80">transparent treasury</span>.
            </h1>

            <p className="mt-5 max-w-xl text-base text-white/70 md:text-lg">
              SHUI is a Solana-native token designed to reward contributors,
              fund initiatives through a community treasury, and keep everything
              accountable with clear structure and on-chain transparency.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#token"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1f2630] hover:bg-white/90"
              >
                Explore Token
              </a>
              <a
                href="#community"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Join Community
              </a>
              <Link
                href="/mint"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Go to DApp
              </Link>
            </div>

            <div className="mt-5 text-xs text-white/50">
              Wallet status:{" "}
              {publicKey ? (
                <span className="text-emerald-300">Connected</span>
              ) : (
                <span className="text-white/60">Not connected</span>
              )}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
              {/* locked hero image */}
              <div className="h-[360px] w-full md:h-[420px]">
                <img
                  src="/shui-hero.png"
                  alt="SHUI hero"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Token coin overlay */}
              <div className="absolute -bottom-10 left-6 rounded-3xl border border-white/10 bg-[#1f2630]/60 p-4 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black/10">
                    <img
                      src="/shui-token.png"
                      alt="SHUI Token"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">SHUI Token</div>
                    <div className="text-xs text-white/60">
                      Built on Solana • Fast & low fees
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-8 pt-12">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">Network</div>
                    <div className="mt-1 text-sm font-semibold">Solana</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">Supply</div>
                    <div className="mt-1 text-sm font-semibold">1,000,000,000</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">Symbol</div>
                    <div className="mt-1 text-sm font-semibold">SHUI</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 text-center text-xs text-white/40">
              © {new Date().getFullYear()} SHUI — Community-driven, transparency-first.
            </div>
          </div>
        </div>

        {/* Sections */}
        <section id="token" className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold">Token Overview</h2>
          <p className="mt-3 text-white/70">
            SHUI rewards meaningful participation, supports initiatives via a
            community treasury, and aims for professional-grade transparency.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#1f2630]/30 p-5">
              <div className="text-sm font-semibold">Participation Rewards</div>
              <div className="mt-2 text-sm text-white/65">
                Incentives for builders, contributors, and community actions.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1f2630]/30 p-5">
              <div className="text-sm font-semibold">Community Treasury</div>
              <div className="mt-2 text-sm text-white/65">
                Funding proposals with traceable decisions and spending.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1f2630]/30 p-5">
              <div className="text-sm font-semibold">Serious Structure</div>
              <div className="mt-2 text-sm text-white/65">
                Clear rules, processes, and public documentation.
              </div>
            </div>
          </div>
        </section>

        <section id="community" className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold">Community</h2>
          <p className="mt-3 text-white/70">
            Join the movement and help shape SHUI. Connect your wallet to access
            dApp features when available.
          </p>
        </section>
      </main>
    </div>
  );
};
