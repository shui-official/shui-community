import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

const SHUI_MINT = "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";
const SOL_MINT = "So11111111111111111111111111111111111111112";

function toBaseUnits(amountUi: string, decimals: number): string {
  const v = amountUi.trim().replace(",", ".");
  if (!v) return "0";
  if (!/^\d+(\.\d+)?$/.test(v)) return "0";

  const [i, f = ""] = v.split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  const s = (i.replace(/^0+(?=\d)/, "") || "0") + frac;
  return s.replace(/^0+(?=\d)/, "") || "0";
}

function fromBaseUnits(amount: string, decimals: number): string {
  if (!/^\d+$/.test(amount)) return "0";
  const s = amount.padStart(decimals + 1, "0");
  const i = s.slice(0, -decimals);
  const f = s.slice(-decimals).replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}

export default function SimpleShuiSwap() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY"); // BUY: SOL->SHUI, SELL: SHUI->SOL
  const [amountUi, setAmountUi] = useState<string>("0.01");
  const [slippageBps, setSlippageBps] = useState<number>(100); // 1%
  const [shuiDecimals, setShuiDecimals] = useState<number | null>(null);

  const [quoteState, setQuoteState] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const inputMint = direction === "BUY" ? SOL_MINT : SHUI_MINT;
  const outputMint = direction === "BUY" ? SHUI_MINT : SOL_MINT;

  const inputDecimals = useMemo(() => {
    if (direction === "BUY") return 9; // SOL
    return shuiDecimals ?? 9; // fallback
  }, [direction, shuiDecimals]);

  const outputDecimals = useMemo(() => {
    if (direction === "BUY") return shuiDecimals ?? 9;
    return 9;
  }, [direction, shuiDecimals]);

  useEffect(() => {
    let cancelled = false;
    async function loadToken() {
      try {
        const r = await fetch(`/api/jup/token?mint=${encodeURIComponent(SHUI_MINT)}`);
        const j = await r.json();
        if (!cancelled && r.ok && j?.ok) setShuiDecimals(j.decimals);
      } catch {
        // ignore
      }
    }
    loadToken();
    return () => {
      cancelled = true;
    };
  }, []);

  async function fetchQuote() {
    setError("");
    setQuoteState(null);

    if (!amountUi || Number(amountUi.replace(",", ".")) <= 0) {
      setError("Entre un montant > 0");
      return;
    }

    const amount = toBaseUnits(amountUi, inputDecimals);
    if (!amount || amount === "0") {
      setError("Montant invalide");
      return;
    }

    setQuoteLoading(true);
    try {
      const url =
        `/api/jup/quote?inputMint=${encodeURIComponent(inputMint)}` +
        `&outputMint=${encodeURIComponent(outputMint)}` +
        `&amount=${encodeURIComponent(amount)}` +
        `&slippageBps=${encodeURIComponent(String(slippageBps))}`;

      const r = await fetch(url);
      const j = await r.json();
      if (!r.ok || !j?.ok) {
        setError(j?.error || "Quote failed");
        return;
      }

      setQuoteState(j.quote);
    } catch (e: any) {
      setError(e?.message || "Quote error");
    } finally {
      setQuoteLoading(false);
    }
  }

  async function doSwap() {
    setError("");

    if (!wallet.connected || !wallet.publicKey) {
      setError("Connecte d’abord ton wallet Solana (Phantom / Solflare).");
      return;
    }
    if (!quoteState) {
      setError("Clique d’abord sur Obtenir le prix.");
      return;
    }

    setSwapLoading(true);
    try {
      const r = await fetch("/api/jup/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote: quoteState,
          userPublicKey: wallet.publicKey.toBase58(),
        }),
      });

      const j = await r.json();
      if (!r.ok || !j?.ok) {
        setError(j?.body ? `Swap failed: ${j.body}` : (j?.error || "Swap failed"));
        return;
      }

      const txB64 = j.swapTransaction as string;
      const tx = VersionedTransaction.deserialize(Buffer.from(txB64, "base64"));

      // Wallet adapter gère la signature + envoi
      const sig = await wallet.sendTransaction(tx as any, connection);

      setError("");
      alert(`Transaction envoyée ✅\nSignature: ${sig}`);
    } catch (e: any) {
      setError(e?.message || "Swap error");
    } finally {
      setSwapLoading(false);
    }
  }

  const outAmountUi = useMemo(() => {
    const out = quoteState?.outAmount;
    if (!out) return "";
    return fromBaseUnits(String(out), outputDecimals);
  }, [quoteState, outputDecimals]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="text-sm font-semibold text-white/90">Swap SHUI ⇄ SOL (simple)</div>
      <p className="mt-2 text-sm text-white/70">
        <strong>Login</strong> = message signé (pas de transaction).<br />
        <strong>Swap</strong> = transaction Solana (normal).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setDirection("BUY")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            direction === "BUY" ? "bg-purple-600 text-white" : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          Acheter (SOL → SHUI)
        </button>
        <button
          onClick={() => setDirection("SELL")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            direction === "SELL" ? "bg-purple-600 text-white" : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          Vendre (SHUI → SOL)
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <div className="text-xs text-white/60 mb-1">Montant</div>
          <input
            value={amountUi}
            onChange={(e) => setAmountUi(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            placeholder="0.01"
            inputMode="decimal"
          />
          <div className="mt-1 text-xs text-white/50">
            {direction === "BUY" ? "en SOL" : "en SHUI"}
          </div>
        </div>

        <div>
          <div className="text-xs text-white/60 mb-1">Slippage</div>
          <select
            value={slippageBps}
            onChange={(e) => setSlippageBps(Number(e.target.value))}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          >
            <option value={50}>0.5%</option>
            <option value={100}>1%</option>
            <option value={200}>2%</option>
          </select>
          <div className="mt-1 text-xs text-white/50">Tolérance au prix</div>
        </div>

        <div>
          <div className="text-xs text-white/60 mb-1">Résultat estimé</div>
          <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white">
            {outAmountUi ? outAmountUi : "—"}
          </div>
          <div className="mt-1 text-xs text-white/50">
            {direction === "BUY" ? "en SHUI" : "en SOL"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={fetchQuote}
          disabled={quoteLoading}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
        >
          {quoteLoading ? "Prix…" : "Obtenir le prix"}
        </button>

        <button
          onClick={doSwap}
          disabled={swapLoading}
          className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
        >
          {swapLoading ? "Transaction…" : "Swap maintenant"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100 whitespace-pre-wrap">
          {error}
        </div>
      ) : null}

      <div className="mt-4 text-xs text-white/50">
        Rappel : ton wallet affichera toujours la transaction avant signature. Ne partage jamais ta seed phrase.
      </div>
    </div>
  );
}
