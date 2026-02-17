import type { FC } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const TOKEN_NAME = "Shui";
const TOKEN_SYMBOL = "SHUI";
const TOKEN_NETWORK = "Solana";
const TOKEN_SUPPLY = "1,000,000,000";
const TOKEN_DECIMALS = "9";
const TOKEN_MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";
const SOLSCAN_URL = `https://solscan.io/token/${TOKEN_MINT}`;

export const HomeView: FC = () => {
  const { publicKey } = useWallet();

  const copyMint = async () => {
    try {
      await navigator.clipboard.writeText(TOKEN_MINT);
      // eslint-disable-next-line no-alert
      alert("Token address copied ✅");
    } catch {
      // eslint-disable-next-line no-alert
      alert("Copy failed. Please copy manually.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Subtle background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-260px] right-[-160px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative mx-auto max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <img
                src="/shui-token.png"
                alt="SHUI"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">
                {TOKEN_SYMBOL}
              </div>
              <div className="text-xs text-white/60">{TOKEN_NAME} • {TOKEN_NETWORK}</div>
            </div>
          </div>

          {/* KEEP WALLET BUTTON */}
          <div className="flex items-center gap-3">
            <div className="hidden text-xs text-white/60 md:block">
              {publicKey ? (
                <span className="text-emerald-300">Connected</span>
              ) : (
                <span>Not connected</span>
              )}
            </div>
            <WalletMultiButton className="!rounded-xl !border !border-white/10 !bg-white/10 hover:!bg-white/15 !text-white" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-12">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
              Community token • Transparency-first
            </div>

            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              Build together.
              <span className="block text-white/70">
                Reward participation, fund initiatives, and govern transparently.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-white/70 md:text-lg">
              {TOKEN_SYMBOL} is a Solana-native community token designed to reward contributors,
              finance projects via a shared treasury, and operate with clear rules and public accountability.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#token"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1220] hover:bg-white/90"
              >
                Token Overview
              </a>

              <a
                href="#community"
                className="rounded-xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Community
              </a>

              <Link href="/mint" passHref>
                <a className="rounded-xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Open dApp
                </a>
              </Link>
            </div>

            {/* Mint address */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs text-white/60">Token Mint Address</div>
                  <div className="mt-1 font-mono text-xs text-white/80 break-all">
                    {TOKEN_MINT}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyMint}
                    className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
                  >
                    Copy
                  </button>
                  <a
                    href={SOLSCAN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#0b1220] hover:bg-white/90"
                  >
                    View on Solscan
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-md">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <img
                  src="/shui-hero.png"
                  alt="SHUI hero"
                  className="h-[360px] w-full object-cover md:h-[440px]"
                />
              </div>

              {/* Overlay mini token card */}
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Network</div>
                  <div className="mt-1 text-sm font-semibold">{TOKEN_NETWORK}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Supply</div>
                  <div className="mt-1 text-sm font-semibold">{TOKEN_SUPPLY}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Decimals</div>
                  <div className="mt-1 text-sm font-semibold">{TOKEN_DECIMALS}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sections */}
        <section id="token" className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold">Token Overview</h2>
          <p className="mt-3 max-w-3xl text-white/70">
            A simple, serious structure: reward contribution, fund proposals via treasury,
            and document decisions publicly for long-term trust.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-6">
              <div className="text-sm font-semibold">Rewards</div>
              <p className="mt-2 text-sm text-white/65">
                Incentivize builders and active members with transparent criteria.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-6">
              <div className="text-sm font-semibold">Treasury</div>
              <p className="mt-2 text-sm text-white/65">
                Fund initiatives through a community treasury with traceable spending.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-6">
              <div className="text-sm font-semibold">Governance</div>
              <p className="mt-2 text-sm text-white/65">
                Make decisions with clear rules and open documentation.
              </p>
            </div>
          </div>
        </section>

        <section id="community" className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold">Community</h2>
          <p className="mt-3 max-w-3xl text-white/70">
            Connect your wallet to access the dApp and future community features. We build SHUI together:
            transparency, structure, and long-term execution.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/mint" passHref>
              <a className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0b1220] hover:bg-white/90">
                Open dApp
              </a>
            </Link>
            <a
              href={SOLSCAN_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Solscan
            </a>
          </div>
        </section>

        <footer className="mt-14 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {TOKEN_SYMBOL} — Community-driven, transparency-first.
        </footer>
      </main>
    </div>
  );
};
