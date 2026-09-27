# SHUI — Parité Web3 Web ⇄ Mobile

Source de vérité du site : `src/lib/solana/constants.ts`. Toute divergence avec SHUI Mobile doit être corrigée **d'un côté ou de l'autre**, jamais « tolérée ».

## Tableau de parité

| FUNCTION | WEB | MOBILE | PROTOCOL | POOL | STATUS |
|---|---|---|---|---|---|
| SOL → SHUI | ✅ `/swap.html` — Raydium SDK v2 `cpmm.swap` (baseIn) | Raydium SOL/SHUI (selon brief) | Raydium CPMM `CPMMoo8L…qKP1C` | `52w19QzF…AXEC` | **Code prêt · simulation Mainnet `err: null` (25 852 CU)** |
| SHUI → SOL | ✅ `/swap.html` — `cpmm.swap` (baseOut) | à confirmer dans le code mobile | Raydium CPMM | `52w19QzF…AXEC` | **Code prêt · simulation Mainnet `err: null` (25 773 CU)** |
| USDC → SHUI | ✅ `/swap.html` — Orca `swapQuoteByInputToken` + `pool.swap`, **direct** | Orca Whirlpool SHUI/USDC (selon brief) | Orca Whirlpool `whirLbMi…uctyCc` | `9kwFpi5i…aNzo` | **Code prêt · construction + validation OK ; simulation non concluante faute d'adresse publique détenant de l'USDC (erreur « insufficient funds » attendue)** |
| SHUI → USDC | ✅ `/swap.html` — Orca, direct | à confirmer dans le code mobile | Orca Whirlpool | `9kwFpi5i…aNzo` | **Code prêt · simulation Mainnet `err: null` (38 069 CU)** |
| Farm deposit | ✅ `/farm.html` — `makeDepositInstructionV6` | à confirmer | Raydium Farm v6 `FarmqiPv…rzhG` | Farm `D2EvBpd92yGxTpT39PxV8S5NLisGfJmzEfTUwRkzVpXu` | **Code prêt · simulation Mainnet `err: null` (43 219 CU)** |
| Farm withdraw | ✅ `/farm.html` — `makeWithdrawInstructionV6` | à confirmer | Raydium Farm v6 | idem | **Code prêt · validé en simulation combinée deposit→withdraw (`success`)** ; seul, échec attendu tant qu'aucun dépôt n'existe |
| Farm claim | ✅ `/farm.html` — withdraw **0 LP** (harvest natif v6) | à confirmer | Raydium Farm v6 | idem | **Code prêt · validé en simulation combinée (`process_withdraw … success`)** ; seul, échec attendu tant qu'aucun dépôt n'existe |

> ⚠️ **Colonne MOBILE** : l'APK fourni n'a pas pu être inspecté (lien de téléchargement : `403 Access denied`). Aucun code SHUI Mobile n'était accessible (`shui-hub` = dashboard soldes + liens Jupiter ; `shui-community` = plugin Jupiter + liens Raydium). Les entrées MOBILE reprennent donc **uniquement** les informations du brief. **À confirmer** avec le code source mobile avant de déclarer la parité complète.

## Règles communes (à appliquer à l'identique sur mobile)

| Règle | Valeur |
|---|---|
| Réseau | Solana Mainnet — genesis `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d` vérifié avant chaque opération |
| SHUI | `CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C` · 9 décimales · Token Program classique (pas Token-2022) · mint & freeze authority `null` (vérifié on-chain) |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` · 6 décimales |
| LP SHUI/SOL | `FwTPGe7q8teWCppWCXT1pQixQtDsaMrCNTrYBPPWfrrn` · 9 décimales |
| Routage | SOL⇄SHUI = Raydium CPMM · USDC⇄SHUI = Orca **direct** (routage via SOL interdit, refusé par la validation) |
| Slippage | défaut 1 % · options 0,5 / 1 / 2 % · borne max 5 % |
| Minimum reçu | `floor(out × (10000 − bps) / 10000)` (Raydium) · `otherAmountThreshold` (Orca) |
| Compute budget | swap 200 000 CU · farm 300 000 CU · priorité 25 000 µlamports/CU |
| Réserve SOL | 0,01 SOL conservé (frais + rent ATA) |
| Simulation | `simulation.value.err === null` **obligatoire** avant toute signature |
| Blockhash | frais à chaque construction ; vérifié avant ET après signature ; jamais modifié après signature |
| Signataires | uniquement le wallet utilisateur (`numRequiredSignatures === 1`) |
| Programmes autorisés | ComputeBudget, System, Token, ATA + **un seul** programme métier (CPMM / Whirlpool / Farm v6) |

## Vérifications on-chain effectuées (lecture seule, 2026-09-26)

| Compte | Vérifié |
|---|---|
| Pool CPMM `52w19QzF…AXEC` | owner = CPMM ; mint0 = WSOL ; mint1 = SHUI ; lp = `FwTPGe…` ; config `D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2` (tradeFee 0,25 %) ; vaults `cgrjxMrf…Dx2` / `2wsWo4zH…NkfH` |
| Whirlpool `9kwFpi5i…aNzo` | owner = Whirlpool ; tokenA = SHUI ; tokenB = USDC ; tickSpacing 64 ; feeRate 3000 (0,30 %) ; config `2LecshUw…P2NQ` ; vaults `AZ6EE39a…VRj` / `HpRzgqz5…ntuC` |
| **Farm `D2EvBpd92yGxTpT39PxV8S5NLisGfJmzEfTUwRkzVpXu`** | owner = Farm v6 ; lpMint = LP SHUI/SOL ; creator = wallet Community `6GA59g4R…bDXw` ; préfixe/suffixe identiques au document (`D2EvBpd9…wRkzVpXu`) ; confirmée aussi par l'API Raydium (farm unique pour ce LP) |
| Autorité Farm (PDA) | `F8XMK7YPnDFkpgkp97rEpwN9Fe1WNNbxzFSKb6erBSZj` (nonce 252, recalculé) |
| LP vault | `8vsVUCyQZeMAfx7MY1G3715Uy3ive5RRMEY9kVmH9gfa` (owner = autorité) |
| Reward vault | `FpnvUKyC6CZQtqcthSMpSUTi6eTz5FjrxsmpWWoDCND3` (mint SHUI, owner = autorité) |
| Reward | 1 reward SHUI « Standard SPL », `perSecond` 64 300 411, open `1790423479`, end `1798199479` (valeurs lues on-chain et affichées telles quelles, jamais codées en dur dans l'UI) |

## Ce qui n'est PAS dans le site (par design)
Création / initialisation / restart de Farm, ajout de reward, retrait créateur, toute utilisation du wallet Community ou de la trésorerie. Aucune de ces instructions n'est importée ni construite par le code.
