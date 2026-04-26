# SHUI Agents — Regles Anti-Abus (Community)

## Patterns d'abus detectes automatiquement

### 1. Referral circulaire
Si wallet A a invite wallet B, wallet B ne peut pas inviter wallet A.

### 2. Multi-wallet meme IP
Plus de 2 wallets depuis la meme IP dans les 24h -> flag automatique.

### 3. Wallet tres recent
Wallet cree < 48h avant soumission -> score confiance reduit.

### 4. Progression anormale
Plus de 100 points en 24h -> flag automatique.

### 5. Soumissions identiques
Meme preuve soumise par 2 wallets differents -> rejet automatique.

## Score de Confiance (0-100)

- Anciennete wallet > 30j : +20
- Holder SHUI verifie on-chain : +20
- Historique quetes clean : +20
- IP non-flaguee : +20
- Pas de pattern suspect : +20

Score >= 80 : Validation auto possible
Score 50-79 : Semi-auto -> review rapide humaine
Score < 50 : Review humaine obligatoire
