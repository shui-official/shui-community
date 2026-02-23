import React, { useEffect, useMemo, useState } from "react";
import BeginnerHint from "./BeginnerHint";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const SHUI_MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";
const LP_MINT = "FwTPGe7q8teWCppWCXT1pQixQtDsaMrCNTrYBPPWfrrn";
const RAYDIUM_AMM_ID = "52w19QzFSHPYTqJWk4akyhVsoeyg4A6iVn2bRsGAAXEC";

const SHUI_DECIMALS = 9;
const SOL_LAMPORTS = 1_000_000_000;

// Raydium
const RAYDIUM_POOL_URL = `https://raydium.io/liquidity/?pool_id=${RAYDIUM_AMM_ID}`;
const RAYDIUM_ADD_URL = `https://raydium.io/liquidity/increase/?mode=add&pool_id=${RAYDIUM_AMM_ID}`;
const RAYDIUM_REMOVE_URL = `https://raydium.io/liquidity/decrease/?mode=remove&pool_id=${RAYDIUM_AMM_ID}`;

// DexScreener
const DEX_TOKEN_URL = `https://api.dexscreener.com/latest/dex/tokens/${SHUI_MINT}`;
const DEX_PAIR_URL = (addr: string) => `https://api.dexscreener.com/latest/dex/pairs/solana/${addr}`;

// Jupiter via proxy serveur (ne pas exposer clé)
const JUP_PRICE_URL = (ids: string) => `/api/price/jup?ids=${encodeURIComponent(ids)}`;
const JUP_QUOTE_URL = (inputMint: string, outputMint: string, amount: number, slippageBps = 50) =>
  `/api/quote/jup?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${encodeURIComponent(
    String(amount)
  )}&slippageBps=${encodeURIComponent(String(slippageBps))}`;

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; symbol?: string };
  quoteToken?: { address?: string; symbol?: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  fdv?: number;
};

type JupQuote = {
  outAmount?: string;
};

type JupPriceAny =
  | {
      [mint: string]: any;
    }
  | {
      data?: Record<string, { price?: string; usdPrice?: number }>;
    };

function short(addr: string) {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : "";
}

function fmtUsd(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return "—";
  try {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  } catch {
    return `$${Math.round(n).toLocaleString()}`;
  }
}

function fmtPriceUsd(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return "—";
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toPrecision(6)}`;
}

function parseJupUsdPrice(json: any, mint: string): number | null {
  const j = json as JupPriceAny;

  const b = (j as any)?.data?.[mint];
  if (b) {
    const p = b.usdPrice ?? (b.price ? Number(b.price) : undefined);
    if (typeof p === "number" && isFinite(p)) return p;
  }

  const a = (j as any)?.[mint];
  if (a) {
    const p = a.usdPrice ?? (a.price ? Number(a.price) : undefined);
    if (typeof p === "number" && isFinite(p)) return p;
  }

  return null;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // noop
  }
}

function pickShuiSolPair(pairs: DexPair[]) {
  return (
    pairs.find(
      (p) =>
        (p?.baseToken?.address === SHUI_MINT && p?.quoteToken?.address === SOL_MINT) ||
        (p?.baseToken?.address === SOL_MINT && p?.quoteToken?.address === SHUI_MINT)
    ) || null
  );
}

export default function RaydiumPoolPanel() {
  const [loading, setLoading] = useState(true);

  const [pair, setPair] = useState<DexPair | null>(null);
  const [err, setErr] = useState<string>("");

  const [jupPrice, setJupPrice] = useState<number | null>(null);
  const [jupErr, setJupErr] = useState<string>("");

  const [jupQuotePrice, setJupQuotePrice] = useState<number | null>(null);
  const [jupQuoteErr, setJupQuoteErr] = useState<string>("");

  const dexUrl = useMemo(() => pair?.url || "", [pair]);

  async function loadDex() {
    const res = await fetch(DEX_TOKEN_URL, { method: "GET" });
    if (res.ok) {
      const j = await res.json();
      const pairs: DexPair[] = Array.isArray(j?.pairs) ? j.pairs : [];
      const pick = pickShuiSolPair(pairs);
      if (pick) return { pick };
    }

    for (const addr of [LP_MINT, RAYDIUM_AMM_ID]) {
      const r2 = await fetch(DEX_PAIR_URL(addr), { method: "GET" });
      if (!r2.ok) continue;
      const j2 = await r2.json();
      const pairs2: DexPair[] = Array.isArray(j2?.pairs) ? j2.pairs : [];
      const pick2 = pickShuiSolPair(pairs2) || pairs2[0] || null;
      if (pick2) return { pick: pick2 };
    }

    return { pick: null as DexPair | null };
  }

  async function loadJupPriceV3() {
    setJupErr("");
    try {
      const r = await fetch(JUP_PRICE_URL(SHUI_MINT), { method: "GET", headers: { Accept: "application/json" } });
      if (!r.ok) {
        setJupErr(`Jupiter price error (${r.status})`);
        setJupPrice(null);
        return;
      }
      const j = await r.json();
      const px = parseJupUsdPrice(j, SHUI_MINT);
      if (typeof px === "number" && isFinite(px) && px > 0) {
        setJupPrice(px);
      } else {
        setJupPrice(null);
        setJupErr("Jupiter price/v3: pas de prix exploitable (token récent / index).");
      }
    } catch {
      setJupErr("Network error (Jupiter price).");
      setJupPrice(null);
    }
  }

  async function loadJupQuoteImpliedUsd() {
    setJupQuoteErr("");
    setJupQuotePrice(null);

    try {
      // quote 1 SOL -> SHUI
      const q = await fetch(JUP_QUOTE_URL(SOL_MINT, SHUI_MINT, SOL_LAMPORTS, 50), { method: "GET" });
      if (!q.ok) {
        const body = await q.text();
        setJupQuoteErr(`Jupiter quote error (${q.status}) ${body.slice(0, 120)}`);
        return;
      }
      const quote = (await q.json()) as JupQuote;
      const outAmountStr = quote?.outAmount;
      const outAmount = outAmountStr ? Number(outAmountStr) : NaN;
      if (!isFinite(outAmount) || outAmount <= 0) {
        setJupQuoteErr("Jupiter quote: outAmount invalide.");
        return;
      }

      const shuiOut = outAmount / Math.pow(10, SHUI_DECIMALS);
      if (!isFinite(shuiOut) || shuiOut <= 0) {
        setJupQuoteErr("Jupiter quote: conversion SHUI invalide.");
        return;
      }

      // SOL USD
      const p = await fetch(JUP_PRICE_URL(SOL_MINT), { method: "GET", headers: { Accept: "application/json" } });
      if (!p.ok) {
        setJupQuoteErr(`SOL price error (${p.status})`);
        return;
      }
      const pj = await p.json();
      const solUsd = parseJupUsdPrice(pj, SOL_MINT);
      if (!solUsd || !isFinite(solUsd) || solUsd <= 0) {
        setJupQuoteErr("SOL price: indisponible.");
        return;
      }

      const implied = solUsd / shuiOut;
      if (!isFinite(implied) || implied <= 0) {
        setJupQuoteErr("Prix implicite invalide.");
        return;
      }

      setJupQuotePrice(implied);
    } catch {
      setJupQuoteErr("Network error (Jupiter quote).");
      setJupQuotePrice(null);
    }
  }

  async function load() {
    setLoading(true);
    setErr("");
    setPair(null);

    try {
      const { pick } = await loadDex();
      if (pick) {
        setPair(pick);
        setErr("");
      } else {
        setPair(null);
        setErr("DexScreener: paire SHUI/SOL introuvable (indexation en cours ?).");
      }

      if (!pick) {
        await loadJupQuoteImpliedUsd();
        await loadJupPriceV3();
      }
    } catch {
      setErr("Network error (DexScreener).");
      setPair(null);
      await loadJupQuoteImpliedUsd();
      await loadJupPriceV3();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BeginnerHint
      title="LP / Pool (simple)"
      hintText={
        "LP = réserve de 2 tokens (SOL + SHUI) qui permet les échanges.\n" +
        "Add liquidity : tu déposes SOL + SHUI (transaction).\n" +
        "Remove liquidity : tu récupères ta part (transaction).\n" +
        "Tu reçois un token LP qui prouve ta part.\n" +
        "⚠️ Risque : si le prix bouge, ta valeur peut varier (impermanent loss)."
      }
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/90">Raydium LP — SHUI/SOL</div>
            <div className="mt-1 text-xs text-white/60">Pool + actions Raydium.</div>
          </div>

          <button
            type="button"
            onClick={load}
            className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
            disabled={loading}
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>

        {/* ✅ Anti-scam / Token verified */}
        <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-emerald-200">SHUI vérifié</div>
              <div className="mt-1 text-xs text-white/70">
                Vérifie toujours le <strong className="text-white">mint</strong> avant d’ajouter de la liquidité.
              </div>
            </div>

            <button
              type="button"
              onClick={() => copyText(SHUI_MINT)}
              className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              title="Copier le mint SHUI"
            >
              Copier
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-white/80">
              Mint : <span className="font-semibold">{short(SHUI_MINT)}</span>
            </span>

            <a
              href={`https://solscan.io/token/${SHUI_MINT}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-white/80 hover:bg-white/10"
            >
              Solscan
            </a>

            <a
              href={`https://jup.ag/tokens/${SHUI_MINT}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-white/80 hover:bg-white/10"
            >
              Jupiter
            </a>
          </div>

          <div className="mt-3 text-[11px] text-white/55">
            ⚠️ Si une autre adresse est affichée ailleurs → n’ajoute pas de LP.
          </div>
        </div>

        {/* Important */}
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          <div className="font-semibold text-white/90">Important</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-white">Connexion</strong> = signature message (pas de transaction).
            </li>
            <li>
              <strong className="text-white">LP</strong> (Add/Remove) = transaction Raydium → Phantom demandera une transaction.
            </li>
            <li>
              <strong className="text-white">Risque LP</strong> : ta valeur peut varier si le prix bouge (normal).
            </li>
          </ul>
        </div>

        {/* Stats */}
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          {loading ? (
            <div className="text-sm text-white/70">Chargement des stats…</div>
          ) : pair ? (
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="text-white/70">
                <span className="font-medium text-white/90">Prix (USD):</span> {pair?.priceUsd ? pair.priceUsd : "—"}
              </div>
              <div className="text-white/70">
                <span className="font-medium text-white/90">Liquidité (TVL):</span> {fmtUsd(pair?.liquidity?.usd)}
              </div>
              <div className="text-white/70">
                <span className="font-medium text-white/90">Volume 24h:</span> {fmtUsd(pair?.volume?.h24)}
              </div>
              <div className="text-white/70">
                <span className="font-medium text-white/90">FDV:</span> {fmtUsd(pair?.fdv)}
              </div>
              {dexUrl ? (
                <div className="text-white/70">
                  <a className="underline decoration-white/30 hover:decoration-white/70" href={dexUrl} target="_blank" rel="noreferrer">
                    Ouvrir DexScreener
                  </a>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-white/70">
              <div>
                <span className="font-semibold text-white/90">Stats:</span> {err || "Indisponible."}
              </div>

              <div className="mt-2">
                <span className="font-semibold text-white/90">Prix (fallback Jupiter QUOTE):</span>{" "}
                {typeof jupQuotePrice === "number" ? fmtPriceUsd(jupQuotePrice) : "—"}
                {jupQuoteErr ? <span className="text-xs text-white/50"> ({jupQuoteErr})</span> : null}
              </div>

              <div className="mt-2">
                <span className="font-semibold text-white/90">Prix (fallback Jupiter price/v3):</span>{" "}
                {typeof jupPrice === "number" ? fmtPriceUsd(jupPrice) : "—"}
                {jupErr ? <span className="text-xs text-white/50"> ({jupErr})</span> : null}
              </div>

              <div className="mt-2 text-xs text-white/50">
                Tant que DexScreener n’indexe pas la paire, on garde les actions LP + un prix fallback (QUOTE prioritaire).
              </div>
            </div>
          )}
        </div>

        {/* Addresses */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-semibold text-white/80">SOL mint</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="text-xs text-white/80">{short(SOL_MINT)}</code>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  onClick={() => copyText(SOL_MINT)}
                >
                  Copy
                </button>
                <a
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  href={`https://solscan.io/token/${SOL_MINT}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Solscan
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-semibold text-white/80">SHUI mint</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="text-xs text-white/80">{short(SHUI_MINT)}</code>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  onClick={() => copyText(SHUI_MINT)}
                >
                  Copy
                </button>
                <a
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  href={`https://solscan.io/token/${SHUI_MINT}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Solscan
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-semibold text-white/80">LP token</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="text-xs text-white/80">{short(LP_MINT)}</code>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  onClick={() => copyText(LP_MINT)}
                >
                  Copy
                </button>
                <a
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  href={`https://solscan.io/token/${LP_MINT}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Solscan
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-semibold text-white/80">Raydium AMM ID</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="text-xs text-white/80">{short(RAYDIUM_AMM_ID)}</code>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  onClick={() => copyText(RAYDIUM_AMM_ID)}
                >
                  Copy
                </button>
                <a
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  href={`https://solscan.io/account/${RAYDIUM_AMM_ID}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Solscan
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href={RAYDIUM_POOL_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            Voir le pool
          </a>
          <a
            href={RAYDIUM_ADD_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            Add liquidity
          </a>
          <a
            href={RAYDIUM_REMOVE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            Remove liquidity
          </a>
        </div>

        <div className="mt-3 text-xs text-white/50">
          Stats via DexScreener (public). Prix fallback via Jupiter (QUOTE/price). Actions LP → Raydium.
        </div>
      </div>
    </BeginnerHint>
  );
}
