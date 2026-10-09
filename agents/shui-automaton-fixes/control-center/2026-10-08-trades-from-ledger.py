#!/usr/bin/env python3
"""
SHUI Control Center — the Trading page reads confirmed swaps from SHUI's ledger.

Why: the aggregator dated each swap with the time the event was seen
(ts = ev.ts) and replaced the row when the same swap was seen again, so a
restart re-dated the ORCA buy of 07/10 16:44 UTC to 08/10 06:40. Telemetry
events also carry no PnL and raw amounts.

What: /api/trades now builds confirmed swaps from shui_ledger (read-only):
real block time, readable amounts (0.1086 USDC), realized PnL on sales.
Failed / pending attempts still come from telemetry. Response shape unchanged.

Usage (from /home/ubuntu/shui-control-center):
  python3 2026-10-08-trades-from-ledger.py --dry-run   # checks anchors, writes nothing
  python3 2026-10-08-trades-from-ledger.py             # backs up then edits
"""
import shutil
import sys
import time
from pathlib import Path

ROOT = Path.cwd()
SHUI_DB = ROOT / "backend/src/shui-db.ts"
SERVER = ROOT / "backend/src/server.ts"
MARK = "Lot 8d: confirmed swaps from shui_ledger"

DB_ANCHOR = "  /** Requête SELECT paramétrée. Aucune autre instruction n'est possible ici. */"
DB_METHOD = '''  /**
   * Lot 8d: confirmed swaps from shui_ledger (read-only): real block time,
   * readable amounts and realized PnL on sales. Buys keep pnl = null (UNKNOWN
   * until sold), never 0.
   */
  ledgerTrades(inSeconds: boolean): Array<{
    id: string; ts: number; tokenIn: string | null; tokenOut: string | null; amountIn: string | null;
    amountOut: string | null; quote: string | null; slippage: string | null; signature: string | null;
    status: string; result: string | null; pnl: string | null; fees: string | null; route: string | null;
    goalId: string | null; demo: boolean;
  }> {
    if (!this.tableExists('shui_ledger')) return [];
    const TOKENS: Record<string, [string, number]> = {
      So11111111111111111111111111111111111111112: ['SOL', 9],
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: ['USDC', 6],
      J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn: ['jitoSOL', 9],
      orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE: ['ORCA', 6],
      JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: ['JUP', 6],
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': ['RAY', 6],
      cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij: ['cbBTC', 8],
      DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: ['BONK', 5],
      EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm: ['WIF', 6],
      HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3: ['PYTH', 6],
    };
    const sym = (mint: string | null) => (mint && TOKENS[mint] ? TOKENS[mint][0] : mint);
    const amount = (raw: string | null, mint: string | null): string | null => {
      if (raw === null || !/^[0-9]+$/.test(raw)) return raw;
      const t = mint ? TOKENS[mint] : undefined;
      if (!t) return `${raw} (raw units)`;
      const ui = Number(raw) / 10 ** t[1];
      return `${ui.toFixed(t[1]).replace(/0+$/, '').replace(/\\.$/, '')} ${t[0]}`;
    };
    const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const rows = this.select<{
      signature: string; ts: string; input_mint: string | null; input_amount_raw: string | null;
      output_mint: string | null; output_amount_raw: string | null; realized_pnl_usd: number | null;
    }>(
      `SELECT signature, ts, input_mint, input_amount_raw, output_mint, output_amount_raw, realized_pnl_usd
       FROM shui_ledger WHERE kind = 'swap' ORDER BY ts DESC LIMIT 200`
    );
    return rows.map((r) => {
      const ms = Date.parse(r.ts);
      const sale = r.output_mint === USDC && r.input_mint !== USDC;
      const pnl = sale && typeof r.realized_pnl_usd === 'number'
        ? `${r.realized_pnl_usd >= 0 ? '+' : ''}${r.realized_pnl_usd.toFixed(4)} USD`
        : null;
      return {
        id: r.signature, ts: inSeconds ? Math.floor(ms / 1000) : ms,
        tokenIn: sym(r.input_mint), tokenOut: sym(r.output_mint),
        amountIn: amount(r.input_amount_raw, r.input_mint), amountOut: amount(r.output_amount_raw, r.output_mint),
        quote: null, slippage: null, signature: r.signature, status: 'confirmed',
        result: sale ? 'vente (P&L réalisé)' : 'achat (P&L à la revente)', pnl, fees: null, route: 'journal SHUI',
        goalId: null, demo: false,
      };
    });
  }

'''

SERVER_OLD = "    res.json({ telemetry: store.listTrades(false), shuiDb: snapshot.transactions, shuiDbAvailable: snapshot.available });"
SERVER_NEW = '''    // Lot 8d: confirmed swaps from shui_ledger (real block time, readable amounts, realized PnL);
    // failed / pending attempts are only known from telemetry.
    const telemetry = store.listTrades(false);
    const inSeconds = telemetry.length > 0 && telemetry[0].ts < 1e12;
    const ledger = shuiDb.ledgerTrades(inSeconds);
    const signatures = new Set(ledger.map((t) => t.signature));
    const trades = ledger.length
      ? [...ledger, ...telemetry.filter((t) => t.status !== 'confirmed' && !(t.signature && signatures.has(t.signature)))]
          .sort((a, b) => b.ts - a.ts)
      : telemetry;
    res.json({ telemetry: trades, shuiDb: snapshot.transactions, shuiDbAvailable: snapshot.available });'''


def main() -> int:
    dry = "--dry-run" in sys.argv
    for f in (SHUI_DB, SERVER):
        if not f.exists():
            print(f"MISSING {f} (run from /home/ubuntu/shui-control-center)")
            return 1
    db_src = SHUI_DB.read_text(encoding="utf-8")
    srv_src = SERVER.read_text(encoding="utf-8")
    if "ledgerTrades(" in db_src or "Lot 8d" in srv_src:
        print("ALREADY APPLIED: nothing to do")
        return 0
    ok = True
    if db_src.count(DB_ANCHOR) != 1:
        print(f"ANCHOR NOT FOUND (or not unique) in {SHUI_DB}")
        ok = False
    if srv_src.count(SERVER_OLD) != 1:
        print(f"ANCHOR NOT FOUND (or not unique) in {SERVER}")
        ok = False
    if not ok:
        return 1
    if dry:
        print("DRY-RUN OK: both anchors found, nothing written")
        return 0
    stamp = time.strftime("%Y%m%d-%H%M%S")
    for f in (SHUI_DB, SERVER):
        shutil.copy2(f, f"{f}.before-ledger-trades-{stamp}")
    SHUI_DB.write_text(db_src.replace(DB_ANCHOR, DB_METHOD + DB_ANCHOR, 1), encoding="utf-8")
    SERVER.write_text(srv_src.replace(SERVER_OLD, SERVER_NEW, 1), encoding="utf-8")
    print(f"APPLIED ({MARK}); backups: *.before-ledger-trades-{stamp}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
