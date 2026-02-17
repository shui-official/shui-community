import type { FC } from "react";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const BUBBLEMAPS_EMBED_URL =
  "PASTE_YOUR_BUBBLEMAPS_IFRAME_SRC_HERE"; // <- remplace par le src Bubblemaps

export const HomeView: FC = () => {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Subtle background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(59,130,246,0.20),transparent_60%),radial-gradient(50%_50%_at_70%_30%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(40%_40%_at_60%_80%,rgba(168,85,247,0.14),transparent_60%)]" />
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

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs text-white/50">
              {publicKey ? (
                <span className="text-emerald-300">Connected</span>
              ) : (
                <span className="text-white/60">Not connected</span>
              )}
            </div>

            {/* KEEP WALLET BUTTON */}
            <WalletMultiButton className="!bg-white/10 hover:!bg-white/15 !text-white !border !border-white/10 !rounded-xl" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <main className="relative mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          {/* Left: copy + CTAs */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Community token • Treasury • Governance
            </div>

            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              Build together.
              <span className="block text-white/70">
                Reward participation, fund initiatives, and govern transparently.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-white/70 md:text-lg">
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

              <a
                href="#community"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Community
              </a>

              <Link href="/mint" passHref>
                <a className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Open dApp
                </a>
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Network</div>
                <div className="mt-1 text-sm font-semibold">Solana</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Total Supply</div>
                <div className="mt-1 text-sm font-semibold">1,000,000,000</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Symbol</div>
                <div className="mt-1 text-sm font-semibold">SHUI</div>
              </div>
            </div>
          </div>

          {/* Right: Bubblemap embed */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="text-sm font-semibold">Live Token Distribution</div>

                <a
                  href={BUBBLEMAPS_EMBED_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-white/60 hover:text-white"
                >
                  Open full view →
                </a>
              </div>

              <div className="relative aspect-[16/10] w-full bg-black/20">
                {/* Bubblemaps iframe */}
                <iframe
                  src={BUBBLEMAPS_EMBED_URL}
                  title="SHUI Bubblemap"
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>

              <div className="px-5 py-4 text-xs text-white/50">
                Data source: Bubblemaps embed. If the map does not load, open full view.
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-white/40">
              © {new Date().getFullYear()} SHUI — Community-driven, transparency-first.
            </div>
          </div>
        </div>

        {/* Sections */}
        <section
          id="token"
          className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
          <h2 className="text-xl font-semibold">Token Overview</h2>
          <p className="mt-3 text-white/70">
            SHUI rewards meaningful participation, supports initiatives via a community
            treasury, and aims for professional-grade transparency.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <div className="text-sm font-semibold">Participation Rewards</div>
              <div className="mt-2 text-sm text-white/65">
                Incentives for builders, contributors, and community actions.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <div className="text-sm font-semibold">Community Treasury</div>
              <div className="mt-2 text-sm text-white/65">
                Funding proposals with traceable decisions and spending.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <div className="text-sm font-semibold">Serious Structure</div>
              <div className="mt-2 text-sm text-white/65">
                Clear rules, processes, and public documentation.
              </div>
            </div>
          </div>
        </section>

        <section
          id="community"
          className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
          <h2 className="text-xl font-semibold">Community</h2>
          <p className="mt-3 text-white/70">
            Join the movement and help shape SHUI. Connect your wallet to access dApp
            features when available.
          </p>
        </section>
      </main>
    </div>
  );
};
