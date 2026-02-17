import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const SOCIALS = {
  x: "https://x.com/Shui_Labs",
  instagram: "http://instagram.com/shui.officialtoken",
  telegram: "http://t.me/Shui_Community",
};

const BUBBLEMAPS_URL =
  "https://v2.bubblemaps.io/map?address=CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C&chain=solana&limit=80";

type ApiWallet = {
  key: "lp" | "community" | "treasury" | "team" | "partners";
  label: string;
  address: string;
  expected: number;
  onChainUi: string; // string
  pctExpected: number;
};

type ApiResponse = {
  mint: string;
  network: string;
  totalSupply: number;
  lastUpdated: string;
  wallets: ApiWallet[];
  onChainSumApprox: number;
};

function formatInt(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function shortAddress(a: string) {
  if (!a) return "";
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

const IconX = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M18.9 2H22l-6.8 7.8L23 22h-6.7l-5.2-6.7L5.4 22H2l7.3-8.4L1 2h6.9l4.7 6.1L18.9 2Zm-1.2 18h1.7L6.8 3.9H5L17.7 20Z"
    />
  </svg>
);

const IconInstagram = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm5.2-2.3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
    />
  </svg>
);

const IconTelegram = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M21.8 4.6 3.4 11.7c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.2-.4-1.7-1.5-1.2Zm-2.8 3.2-9.3 8.4-.4 3.6-1.5-4.8 11.2-7.1c.5-.3.9-.1 0 .9Z"
    />
  </svg>
);

export const HomeView: FC = () => {
  const { publicKey } = useWallet();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // refresh auto
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const r = await fetch("/api/allocation");
        const j = (await r.json()) as ApiResponse;

        if (!r.ok) throw new Error((j as any)?.details || "API error");
        if (alive) setData(j);
      } catch (e: any) {
        if (alive) setErr(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 30_000); // 30s

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const chartStops = useMemo(() => {
    // donut pro sans lib : conic-gradient
    // on base le donut sur les % EXPECTED (officiels), c’est stable et lisible
    const wallets = data?.wallets || [];
    const colors = {
      lp: "#6EE7B7",
      community: "#60A5FA",
      treasury: "#A78BFA",
      team: "#F59E0B",
      partners: "#F87171",
    } as const;

    let acc = 0;
    const parts = wallets.map((w) => {
      const start = acc;
      acc += w.pctExpected;
      const end = acc;
      return `${colors[w.key]} ${start}% ${end}%`;
    });

    return {
      background: `conic-gradient(${parts.join(", ")})`,
      legend: wallets.map((w) => ({
        key: w.key,
        label: w.label,
        pct: w.pctExpected,
        color: colors[w.key],
      })),
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-[#2f3742] text-white">
      {/* Top bar */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between rounded-2xl bg-[#2a313b] px-5 py-4 shadow-lg">
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

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <a
                href={SOCIALS.x}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="X"
                title="X"
              >
                <IconX className="h-5 w-5" />
              </a>
              <a
                href={SOCIALS.instagram}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Instagram"
                title="Instagram"
              >
                <IconInstagram className="h-5 w-5" />
              </a>
              <a
                href={SOCIALS.telegram}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Telegram"
                title="Telegram"
              >
                <IconTelegram className="h-5 w-5" />
              </a>
            </div>

            {/* KEEP WALLET BUTTON */}
            <WalletMultiButton className="!bg-white/10 hover:!bg-white/15 !text-white !border !border-white/10 !rounded-xl" />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/55">
          <div>
            Wallet status:{" "}
            {publicKey ? (
              <span className="text-emerald-300">Connected</span>
            ) : (
              <span className="text-white/70">Not connected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Network: Solana
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Supply: 1,000,000,000 SHUI
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        {/* HERO */}
        <div className="grid items-start gap-10 lg:grid-cols-2">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Transparency-first • On-chain allocation
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              SHUI (水) — community token built for{" "}
              <span className="text-white/70">participation</span> &{" "}
              <span className="text-white/70">transparent treasury</span>.
            </h1>

            <p className="mt-5 max-w-xl text-base text-white/70 md:text-lg">
              A Solana-native token designed to reward contributors, fund initiatives
              through a community treasury, and keep governance accountable with
              clear structure and on-chain transparency.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#allocation"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1f2630] hover:bg-white/90"
              >
                View Allocation
              </a>

              <a
                href={BUBBLEMAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Open Bubblemaps
              </a>

              <Link href="/mint" passHref>
                <a className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Open dApp
                </a>
              </Link>
            </div>

            <div className="mt-4 text-xs text-white/55">
              Mint:{" "}
              <span className="font-mono text-white/75">
                CnrMg…Cz4C
              </span>
            </div>
          </div>

          {/* Right: Allocation card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 p-6">
              <div>
                <div className="text-sm font-semibold">Allocation & Wallets (Live)</div>
                <div className="mt-1 text-xs text-white/60">
                  Updates every 30s • Expected distribution + on-chain balances
                </div>
              </div>

              <div className="text-right text-xs text-white/60">
                {loading ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Loading…
                  </span>
                ) : err ? (
                  <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-red-200">
                    API error
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    Updated
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* donut + legend */}
              <div className="grid gap-6 md:grid-cols-2 md:items-center">
                <div className="flex items-center justify-center">
                  <div
                    className="relative h-48 w-48 rounded-full border border-white/10"
                    style={{ background: chartStops.background }}
                  >
                    <div className="absolute inset-5 rounded-full bg-[#2f3742] border border-white/10" />
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                      <div>
                        <div className="text-xs text-white/60">Total supply</div>
                        <div className="text-lg font-semibold">1,000,000,000</div>
                        <div className="text-xs text-white/60">SHUI</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {chartStops.legend.map((l) => (
                    <div
                      key={l.key}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#1f2630]/25 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: l.color }}
                        />
                        <div className="text-sm font-semibold">{l.pct.toFixed(0)}%</div>
                        <div className="text-xs text-white/60">{l.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* table wallets */}
              <div className="mt-6 rounded-2xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-12 bg-[#1f2630]/40 px-4 py-3 text-xs text-white/60">
                  <div className="col-span-5">Bucket</div>
                  <div className="col-span-3 text-right">Expected</div>
                  <div className="col-span-2 text-right">On-chain</div>
                  <div className="col-span-2 text-right">Wallet</div>
                </div>

                {(data?.wallets || []).map((w) => (
                  <div
                    key={w.key}
                    className="grid grid-cols-12 px-4 py-3 text-sm border-t border-white/10 bg-white/[0.02]"
                  >
                    <div className="col-span-5">
                      <div className="font-semibold">{w.label}</div>
                    </div>

                    <div className="col-span-3 text-right text-white/70">
                      {formatInt(w.expected)} SHUI
                    </div>

                    <div className="col-span-2 text-right text-white/80">
                      {loading ? "…" : err ? "—" : formatInt(Number(w.onChainUi || 0))}
                    </div>

                    <div className="col-span-2 text-right">
                      <a
                        href={`https://solscan.io/account/${w.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-white/70 hover:text-white"
                        title={w.address}
                      >
                        {shortAddress(w.address)}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-xs text-white/50">
                {data?.lastUpdated ? (
                  <>Last update: {new Date(data.lastUpdated).toLocaleString()}</>
                ) : (
                  <>Last update: —</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BUBBLEMAPS EMBED */}
        <section
          id="allocation"
          className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Holder Map (Bubblemaps)</h2>
              <p className="mt-2 text-white/70">
                Live visualization of SHUI holders clusters — sourced from Bubblemaps.
              </p>
            </div>

            <a
              href={BUBBLEMAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Open in new tab
            </a>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/10">
            <iframe
              src={BUBBLEMAPS_URL}
              title="Bubblemaps SHUI"
              className="h-[520px] w-full"
              loading="lazy"
            />
          </div>

          <div className="mt-3 text-xs text-white/50">
            If the embed is blocked by the browser, use “Open in new tab”.
          </div>
        </section>

        <div className="mt-14 text-center text-xs text-white/40">
          © {new Date().getFullYear()} SHUI — Community-driven, transparency-first.
        </div>
      </main>
    </div>
  );
};
