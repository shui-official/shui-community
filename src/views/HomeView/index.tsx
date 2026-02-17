import type { FC } from "react";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const SOCIALS = [
  {
    name: "X",
    href: "https://x.com/Shui_Labs",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.7L5.3 22H2l7.3-8.4L1 2h6.8l4.7 6.1L18.9 2Zm-1.2 18h1.7L6.8 3.9H5L17.7 20Z"
        />
      </svg>
    ),
  },
  {
    name: "Telegram",
    href: "http://t.me/Shui_Community",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.9 4.6 19 19.2c-.2 1-.8 1.2-1.6.8l-4.4-3.2-2.1 2c-.2.2-.4.4-.8.4l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2l-10.5 6.6-4.5-1.4c-1-.3-1-1 .2-1.5L20.2 3.8c.8-.3 1.5.2 1.3.8Z"
        />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "http://instagram.com/shui.officialtoken",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2ZM18.4 6.6a.9.9 0 1 1-.9-.9.9.9 0 0 1 .9.9Z"
        />
      </svg>
    ),
  },
];

export const HomeView: FC = () => {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-[#2f3742] text-white">
      {/* Top bar */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between rounded-2xl bg-[#2a313b] px-5 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            {/* Token logo */}
            <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10 bg-black/10">
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

          <div className="flex items-center gap-3">
            {/* Socials */}
            <div className="hidden items-center gap-2 md:flex">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <span className="opacity-90">{s.icon}</span>
                  <span className="hidden lg:inline">{s.name}</span>
                </a>
              ))}
            </div>

            {/* Wallet */}
            <WalletMultiButton className="!bg-white/10 hover:!bg-white/15 !text-white !border !border-white/10 !rounded-xl" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Community token • Transparency-first
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              Build together.{" "}
              <span className="text-white/70">
                Reward participation, fund initiatives, and govern transparently.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-white/70 md:text-lg">
              SHUI is a Solana-native community token designed to reward contributors,
              finance projects via a shared treasury, and operate with clear rules and public accountability.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#token"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1f2630] hover:bg-white/90"
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

            <div className="mt-5 text-xs text-white/50">
              Wallet status:{" "}
              {publicKey ? (
                <span className="text-emerald-300">Connected</span>
              ) : (
                <span className="text-white/60">Not connected</span>
              )}
            </div>

            {/* Socials on mobile */}
            <div className="mt-6 flex flex-wrap gap-2 md:hidden">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <span className="opacity-90">{s.icon}</span>
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
              <div className="h-[360px] w-full md:h-[420px]">
                <img
                  src="/shui-hero.png"
                  alt="SHUI hero"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="px-6 pb-8 pt-6">
                <div className="grid gap-3 sm:grid-cols-3">
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
            </div>

            <div className="mt-10 text-center text-xs text-white/40">
              © {new Date().getFullYear()} SHUI — Community-driven, transparency-first.
            </div>
          </div>
        </div>

        {/* Sections */}
        <section id="token" className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold">Token Overview</h2>
          <p className="mt-3 text-white/70">
            SHUI rewards meaningful participation, supports initiatives via a community treasury, and aims for professional-grade transparency.
          </p>
        </section>

        <section id="community" className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold">Community</h2>
          <p className="mt-3 text-white/70">
            Join the movement and help shape SHUI. Connect your wallet to access dApp features when available.
          </p>
        </section>
      </main>
    </div>
  );
};
