# shui-website — Vitrine SHUI 水 + dApp Swap / Farm

Projet **indépendant** de `shui-community` (lecture seule) et de SHUI Mobile (référence uniquement).

## Prérequis
- **Node.js 22 LTS** (voir `.nvmrc` ; `engines` + `engine-strict` refusent Node 20 : plusieurs dépendances wallet-standard exigent Node ≥ 22).
- npm ≥ 10. Les options d'installation (`legacy-peer-deps`, `save-exact`) sont dans `.npmrc`.

## Lancer
```bash
nvm use            # Node 22
npm ci             # installation reproductible depuis package-lock.json
npm run dev          # http://localhost:4321  (Home = /, Swap = /swap.html, Farm = /farm.html)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest (56 tests, AUCUN appel réseau)
npm run build        # dist/ statique
npm run check        # domaines autorisés, assets, absence de secrets
npx tsx scripts/simulate-mainnet.ts   # diagnostic : construit + SIMULE sur Mainnet, ne signe ni n'envoie jamais
```
RPC : `VITE_SOLANA_RPC=https://…` (le RPC public Mainnet est limité en débit — un RPC dédié est recommandé en production).

## Architecture
```
public/index.html            Home V1 validée — copiée TELLE QUELLE dans dist/ (aucune transformation)
public/assets/css/main.css   CSS V1 (inchangé, octet pour octet)
public/assets/css/dapp.css   CSS additif Swap/Farm (réutilise les tokens V1)
public/assets/js/*.js        JS V1 (water.js + main.js inchangés ; config.js : +2 liens internes)
swap.html · farm.html        Pages dApp (même header, typographies, palette)
src/lib/solana/              constantes vérifiées, montants bigint, connexion + contrôle Mainnet, soldes/ATA
src/lib/raydium/             quote + build swap CPMM SOL⇄SHUI
src/lib/orca/                quote + build swap Whirlpool USDC⇄SHUI (direct)
src/lib/farm/                lecture état/position Farm v6, rewards en attente, build deposit/withdraw/claim
src/lib/transactions/        pipeline unique : validate → simulate → sign → broadcast → confirm
src/lib/wallet/              Phantom + Solflare (adapters officiels, clé publique uniquement)
src/ui/ · src/pages/         UI (aucune logique de transaction)
tests/                       tests unitaires
SHUI_WEB3_PARITY.md          parité Web ⇄ Mobile + vérifications on-chain
```

## Sécurité
- Aucune seed / clé privée / mnemonic : le site ne lit que la clé publique ; toute signature se fait dans le wallet.
- Simulation `err === null` obligatoire avant toute demande de signature.
- Liste blanche de programmes par opération, comptes attendus obligatoires, comptes interdits, 1 seul signataire.
- Blockhash frais, vérifié avant et après signature ; transaction jamais modifiée après signature.
- Aucune fonction de création / administration de Farm dans le code.
- Mode diagnostic : ajouter `?debug=1` à l'URL (err / logs / unitsConsumed, données publiques uniquement).
- Persistance wallet entre pages : seul le NOM du wallet (`localStorage["shui.wallet"]`) est mémorisé ; reconnexion via `adapter.autoConnect()` (extension déjà autorisée). Effacé uniquement par « Déconnecter ».
- Solflare affiche « Site inconnu » sur localhost : protection normale du wallet, à ne pas contourner.

## Propriété
Projet propriétaire — dépôt source PRIVÉ. Aucune licence open-source. Voir `docs/V1_FINALISATION_REPORT.md` §Licences (obligations tierces : GPL-3.0 Raydium SDK, licence Orca non commerciale).
