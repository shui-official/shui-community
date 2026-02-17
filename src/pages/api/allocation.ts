import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    token: {
      name: "Shui",
      symbol: "SHUI",
      chain: "Solana",
      totalSupply: 1_000_000_000,
      decimals: 9,
      mint: "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C",
    },
    allocation: [
      {
        label: "Liquidity (LP Raydium/Jupiter)",
        percent: 25,
        amount: 250_000_000,
        wallet: "HzE9puz2RbCazSoipebJXsV5Sb6vAyy7bQDZApVfNsVb",
      },
      {
        label: "Community (airdrop + rewards)",
        percent: 30,
        amount: 300_000_000,
        wallet: "6GA59g4RZyiZ3b4uxB7PnwgmENP1AhoXWP9iq147bDXw",
      },
      {
        label: "Treasury (DAO / projects)",
        percent: 20,
        amount: 200_000_000,
        wallet: "5JW3kXLWjG3z8JrDs8JQmYWrcDTZqNV6qnqrwJXXEqu7",
      },
      {
        label: "Team (locked / vesting)",
        percent: 15,
        amount: 150_000_000,
        wallet: "BWZqpCNdoKaZ6To67XvFLUeZffv2MaNghQJSNH3tBtnb",
      },
      {
        label: "Partners / Marketing",
        percent: 10,
        amount: 100_000_000,
        wallet: "6ppGTdGGJYRTSiDN1RTCPYKoS4ZB1RuxHizgJCfcqZya",
      },
    ],
    links: {
      x: "https://x.com/Shui_Labs",
      telegram: "http://t.me/Shui_Community",
      instagram: "http://instagram.com/shui.officialtoken",
      bubblemaps:
        "https://v2.bubblemaps.io/map?address=CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C&chain=solana&limit=80",
    },
    updatedAt: new Date().toISOString(),
  });
}
