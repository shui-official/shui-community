import type { FC } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const BUBBLEMAPS_URL =
  "https://v2.bubblemaps.io/map?address=CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C&chain=solana&limit=80";

const TOKEN_MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";

const SOCIALS = {
  x: "https://x.com/Shui_Labs",
  tg: "http://t.me/Shui_Community",
  ig: "http://instagram.com/shui.officialtoken",
};

const allocation = [
  {
    label: "Liquidité (LP Raydium/Jupiter)",
    percent: 25,
    amount: 250_000_000,
    wallet: "HzE9puz2RbCazSoipebJXsV5Sb6vAyy7bQDZApVfNsVb",
  },
  {
    label: "Communauté (airdrop + rewards)",
    percent: 30,
    amount: 300_000_000,
    wallet: "6GA59g4RZyiZ3b4uxB7PnwgmENP1AhoXWP9iq147bDXw",
  },
  {
    label: "Trésorerie (DAO / projets)",
    percent: 20,
    amount: 200_000_000,
    wallet: "5JW3kXLWjG3z8JrDs8JQmYWrcDTZqNV6qnqrwJXXEqu7",
  },
  {
    label: "Équipe (locked / vesting)",
    percent: 15,
    amount: 150_000_000,
    wallet: "BWZqpCNdoKaZ6To67XvFLUeZffv2MaNghQJSNH3tBtnb",
  },
  {
    label: "Partenariats / Marketing",
    percent: 10,
    amount: 100_000_000,
    wallet: "6ppGTdGGJYRTSiDN1RTCPYKoS4ZB1RuxHizgJCfcqZya",
  },
];

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

function short(addr: string) {
  return addr.slice(0, 4) + "…" + addr.slice(-4);
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copié ✅");
  } catch {
    alert("Impossible de copier automatiquement. Copie manuelle.");
  }
}

const IconX = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.7L5.4 22H2l7.3-8.4L1 2h6.9l4.7 6.1L18.9 2Zm-1.2 18h1.7L6.8 3.9H5L17.7 20Z"
    />
  </svg>
);

const IconTelegram = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M21.8 4.6c.2-1-.7-1.8-1.7-1.4L2.9 10.1c-1 .4-1 1.8 0 2.2l4.6 1.7 1.7 5.2c.3 1 1.6 1.2 2.2.4l2.7-3.5 4.8 3.5c.8.6 2 .1 2.2-.9l1.5-14.1ZM9.5 13.5l8.6-6.9-6.8 8.4-.3 3.3-1.6-4.9-3.1-1.1Z"
    />
  </svg>
);

const IconInstagram = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5ZM18 7a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z"
    />
  </svg>
);

export const HomeView: FC = () => {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-[#2f3742] text-white">
      {/* TOP BAR */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#2a313b] px-5 py-4 shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
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

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={SOCIALS.x}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              <IconX className="h-4 w-4" />
              X
            </a>

            <a
              href={SOCIALS.tg}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              <IconTelegram className="h-4 w-4" />
              Telegram
            </a>

            <a
              href={SOCIALS.ig}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              <IconInstagram className="h-4 w-4" />
              Instagram
            </a>

            <div className="ml-0 md:ml-2">
              <WalletMultiButton className="!bg-white/10 hover:!bg-white/15 !text-white !border !border-white/10 !rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Community token • Transparency-first
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
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
                href="#allocation"
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

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="text-xs uppercase tracking-wider text-white/50">
                Token mint
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-black/20 px-2 py-1 text-xs text-white/80">
                  {TOKEN_MINT}
                </code>
                <button
                  onClick={() => copyToClipboard(TOKEN_MINT)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  type="button"
                >
                  Copy
                </button>
                <a
                  href={`https://solscan.io/token/${TOKEN_MINT}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white"
                >
                  Solscan
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE BUBBLEMAPS */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold">Live distribution map</div>
                  <div className="text-xs text-white/60">
                    BubbleMaps • Top holders view
                  </div>
                </div>
                <a
                  href={BUBBLEMAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
                >
                  Open BubbleMaps
                </a>
              </div>

              <div className="aspect-[16/10] w-full">
                <iframe
                  src={BUBBLEMAPS_URL}
                  title="SHUI BubbleMaps"
                  className="h-full w-full"
                  loading="lazy"
                />
              </div>

              <div className="px-5 py-4 text-xs text-white/50">
                Tip: BubbleMaps se met à jour selon les données on-chain (pas “seconde par seconde”,
                mais régulièrement).
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-white/40">
              © {new Date().getFullYear()} SHUI — Community-driven, transparency-first.
            </div>
          </div>
        </div>

        {/* ALLOCATION */}
        <section
          id="allocation"
          className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-8"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                SHUI (水) — Allocation & Wallets (On-chain)
              </h2>
              <p className="mt-2 text-white/70">
                Total supply: <span className="font-semibold">1,000,000,000 SHUI</span> •
                Network: <span className="font-semibold">Solana</span>
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {allocation.map((a) => (
              <div
                key={a.wallet}
                className="rounded-2xl border border-white/10 bg-[#1f2630]/25 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold">{a.label}</div>
                    <div className="mt-1 text-xs text-white/60">
                      {a.percent}% — {formatNumber(a.amount)} SHUI
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-black/20 px-2 py-1 text-xs text-white/75">
                        {short(a.wallet)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(a.wallet)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                        type="button"
                      >
                        Copy
                      </button>
                      <a
                        href={`https://solscan.io/account/${a.wallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white"
                      >
                        View on Solscan
                      </a>
                    </div>
                  </div>

                  <div className="w-full md:w-[320px]">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-white/60"
                        style={{ width: `${a.percent}%` }}
                      />
                    </div>
                    <div className="mt-2 text-right text-xs text-white/50">
                      {a.percent}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <div className="text-sm font-semibold">Admin / Mint wallet</div>
            <div className="mt-1 text-xs text-white/60">
              (sécurisé, non utilisé pour la distribution) — si tu veux, on l’ajoute ici aussi quand tu me donnes l’adresse.
            </div>
          </div>
        </section>

        {/* COMMUNITY */}
        <section
          id="community"
          className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8"
        >
          <h2 className="text-xl font-semibold">Community</h2>
          <p className="mt-3 text-white/70">
            Join the movement and help shape SHUI. Connect your wallet to access
            dApp features when available.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={SOCIALS.tg}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1f2630] hover:bg-white/90"
            >
              Join Telegram
            </a>
            <a
              href={SOCIALS.x}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Follow on X
            </a>
            <a
              href={SOCIALS.ig}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Instagram
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};
