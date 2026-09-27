/* =====================================================================
   SHUI — Configuration centrale de la vitrine
   ---------------------------------------------------------------------
   RÈGLE : seules des URLs VÉRIFIÉES figurent ici.
   Une valeur `null` = lien non vérifié → le bouton s'affiche désactivé
   avec la mention prévue (ex. « Prochainement »).
   Aucune clé, aucun secret, aucune logique de transaction.
   ===================================================================== */
window.SHUI_CONFIG = {
  token: {
    mint: "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C",
    supply: "1 000 000 000",
    decimals: 9,
    network: "Solana Mainnet",
  },

  // Raydium — valeurs vérifiées (repo shui-community + document Farm)
  raydium: {
    pool: "52w19QzFSHPYTqJWk4akyhVsoeyg4A6iVn2bRsGAAXEC",
    cpmmProgram: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C",
    lpMint: "FwTPGe7q8teWCppWCXT1pQixQtDsaMrCNTrYBPPWfrrn",
    farmProgram: "FarmqiPv5eAj3j1GMdMCMUGXqPUvmquZtMy86QH6rzhG",
  },

  links: {
    // Site existant (Dossier SHUI p.11)
    site: "https://shui-community.vercel.app",
    // Nouvel Explorer intégré au site (page interne)
    explorer: "explorer.html",

    // dApp intégrée (pages internes du site)
    swapApp: "swap.html",
    farmApp: "farm.html",

    // RaydiumPoolPanel.tsx → RAYDIUM_POOL_URL
    farm: "https://raydium.io/liquidity/?pool_id=52w19QzFSHPYTqJWk4akyhVsoeyg4A6iVn2bRsGAAXEC",

    solscan: "https://solscan.io/token/CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C",
    bubblemaps: "https://v2.bubblemaps.io/map?address=CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C&chain=solana",

    telegram: "https://t.me/Shui_Community",
    x: "https://x.com/Shui_Labs",
    instagram: "https://www.instagram.com/shui.officialtoken/",
    email: "mailto:shui.officialtoken@gmail.com",

    // ⏳ NON VÉRIFIÉ — à renseigner lors de la publication
    litepaper: null,
  },

  mobile: {
    version: "0.2.10",
    // APK officiel v0.2.10 — fichier à placer dans public/downloads/ (copié tel quel dans dist/downloads/)
    androidApk: "/downloads/SHUI-Mobile-v0.2.10-Android.apk",
    // SHA-256 du fichier APK (certificat de signature Android SHA-256 : add53c815c34d5036b1368f6e08821350b065a69ce728bfdf583c3f7af3d141d)
    sha256: "a0dab26b8f670e8a8208e0a186243a3b3004cb9a9063aebc41b7edb6e25e20ab",
    googlePlay: null, // prochainement
    appStore: null,   // prochainement
  },
};
