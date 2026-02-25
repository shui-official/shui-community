#!/usr/bin/env bash
set -euo pipefail

SHUI_MINT="CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C"
SOL_MINT="So11111111111111111111111111111111111111112"
DUMMY_USER="So11111111111111111111111111111111111111112"
AMOUNT_SOL_LAMPORTS="10000000" # 0.01 SOL

node_json_get() {
  node - "$1" "$2" <<'NODE'
const input = process.argv[2];   // argv[1] is "-" because node - reads stdin
const path = process.argv[3];
let obj;
try {
  obj = JSON.parse(input);
} catch (e) {
  console.error("JSON_PARSE_FAIL:", String(input).slice(0, 80));
  process.exit(1);
}
const parts = path.split(".");
let cur = obj;
for (const p of parts) {
  if (cur == null) { console.log(""); process.exit(0); }
  cur = cur[p];
}
if (typeof cur === "string" || typeof cur === "number" || typeof cur === "boolean") {
  console.log(String(cur));
} else if (cur == null) {
  console.log("");
} else {
  console.log(JSON.stringify(cur));
}
NODE
}

fetch_json() { curl -sS "$1"; }
post_json() { curl -sS -X POST "$1" -H "Content-Type: application/json" -d "$2"; }
http_status() { curl -sS -o /dev/null -w "%{http_code}" "$1"; }

run_suite() {
  local BASE="$1"
  local TS
  TS=$(date +%s)

  echo ""
  echo "=============================="
  echo "AUTO TEST on BASE=$BASE"
  echo "=============================="

  echo ""
  echo "== version =="
  V=$(fetch_json "$BASE/api/version?ts=$TS")
  echo "$V"
  COMMIT=$(node_json_get "$V" "vercelGitCommitSha" || true)
  echo "commit=${COMMIT:-null}"

  echo ""
  echo "== token (SHUI decimals) =="
  T=$(fetch_json "$BASE/api/jup/token?mint=$SHUI_MINT&ts=$TS")
  echo "$T"
  TOK_OK=$(node_json_get "$T" "ok")
  if [ "$TOK_OK" != "true" ]; then
    echo "❌ token endpoint failed"
    exit 1
  fi
  DEC=$(node_json_get "$T" "decimals")
  echo "decimals=$DEC"

  echo ""
  echo "== quote BUY (SOL -> SHUI) =="
  QBUY=$(fetch_json "$BASE/api/jup/quote?inputMint=$SOL_MINT&outputMint=$SHUI_MINT&amount=$AMOUNT_SOL_LAMPORTS&slippageBps=100&ts=$TS")
  echo "$QBUY" | head -c 800; echo
  QB_OK=$(node_json_get "$QBUY" "ok")
  if [ "$QB_OK" != "true" ]; then
    echo "❌ quote BUY failed"
    exit 1
  fi
  OUT_AMT=$(node_json_get "$QBUY" "quote.outAmount")
  echo "quote.outAmount=$OUT_AMT"

  echo ""
  echo "== swap TX (UNSIGNED) from quote BUY =="
  BODY=$(node - "$QBUY" <<NODE
const q = JSON.parse(process.argv[2]).quote;
console.log(JSON.stringify({ quote: q, userPublicKey: "$DUMMY_USER" }));
NODE
)
  SW=$(post_json "$BASE/api/jup/swap?ts=$TS" "$BODY")
  echo "$SW" | head -c 800; echo
  SW_OK=$(node_json_get "$SW" "ok")
  if [ "$SW_OK" != "true" ]; then
    echo "❌ swap endpoint failed"
    exit 1
  fi
  TXB64=$(node_json_get "$SW" "swapTransaction")
  if [ -z "$TXB64" ]; then
    echo "❌ missing swapTransaction"
    exit 1
  fi
  echo "swapTransaction(base64) length=${#TXB64}"
  echo "✅ swap transaction generated (unsigned)."

  echo ""
  echo "== Health (optional) =="
  HS=$(http_status "$BASE/api/health/jup?ts=$TS")
  echo "health status=$HS"

  echo ""
  echo "✅ ALL OK on $BASE"
}

if [ "${1:-}" = "local" ]; then
  run_suite "http://localhost:3000"
elif [ "${1:-}" = "prod" ]; then
  run_suite "https://shui-community.vercel.app"
else
  echo "Usage:"
  echo "  scripts/autotest-swap.sh local"
  echo "  scripts/autotest-swap.sh prod"
  exit 2
fi
