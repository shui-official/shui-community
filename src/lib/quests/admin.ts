export const QUEST_ADMIN_WALLETS = new Set(
  [
    "6zsnxp9fFkv6jqRkfSVf9ntHuGKPmA8q8o8E8APzsTX7",
    "5eGqwM1Yk8dnMuJfRiTBTohizcWNaXMPwig2UenpXJ4t",
    "6ppGTdGGJYRTSiDN1RTCPYKoS4ZB1RuxHizgJCfcqZya",
    "6GA59g4RZyiZ3b4uxB7PnwgmENP1AhoXWP9iq147bDXw",
    "HzE9puz2RbCazSoipebJXsV5Sb6vAyy7bQDZApVfNsVb",
    "BWZqpCNdoKaZ6To67XvFLUeZffv2MaNghQJSNH3tBtnb",
    "5JW3kXLWjG3z8JrDs8JQmYWrcDTZqNV6qnqrwJXXEqu7",
  ].map((w) => w.trim())
);

export const FORCED_OCEAN_WALLETS = new Set(
  [
    "6zsnxp9fFkv6jqRkfSVf9ntHuGKPmA8q8o8E8APzsTX7",
    "5eGqwM1Yk8dnMuJfRiTBTohizcWNaXMPwig2UenpXJ4t",
    "6ppGTdGGJYRTSiDN1RTCPYKoS4ZB1RuxHizgJCfcqZya",
    "6GA59g4RZyiZ3b4uxB7PnwgmENP1AhoXWP9iq147bDXw",
    "HzE9puz2RbCazSoipebJXsV5Sb6vAyy7bQDZApVfNsVb",
    "BWZqpCNdoKaZ6To67XvFLUeZffv2MaNghQJSNH3tBtnb",
    "5JW3kXLWjG3z8JrDs8JQmYWrcDTZqNV6qnqrwJXXEqu7",
  ].map((w) => w.trim())
);

function normalizeWallet(wallet?: string | null) {
  return String(wallet ?? "").trim();
}

export function isQuestAdminWallet(wallet?: string | null): boolean {
  const w = normalizeWallet(wallet);
  return !!w && QUEST_ADMIN_WALLETS.has(w);
}

export function getForcedQuestLevel(wallet?: string | null): "ocean" | null {
  const w = normalizeWallet(wallet);
  return !!w && FORCED_OCEAN_WALLETS.has(w) ? "ocean" : null;
}
