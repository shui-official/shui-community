# SHUI Agents — Regles de Securite

> Ces regles s'appliquent a TOUS les agents sans exception.
> Elles ne peuvent pas etre contournees.

## Regles Absolues

### 1. Zero acces aux cles privees
- Aucun agent ne peut lire, stocker ou utiliser une cle privee
- Inclut : seed phrases, .env secrets, process.env.PRIVATE_KEY

### 2. Zero signature de transaction
- Aucun agent ne peut initier ou signer une transaction Solana
- Inclut : sendTransaction(), signTransaction(), signAllTransactions()

### 3. Zero acces a la tresorerie
- Les wallets de tresorerie SHUI sont hors perimetre de tous les agents

### 4. Zero deploiement direct
- Aucun agent ne peut declencher un deploiement Vercel vers la production
- Aucun agent ne peut merger une PR
- Aucun agent ne peut push sur main ou staging

## Regles de Workflow

### 5. Pull Request obligatoire
- Toute modification = PR depuis une branche agent/*
- PR doit contenir : description, fichiers modifies, checklist securite
- PR doit etre approuvee par un humain

### 6. Validation humaine requise pour
- Merger une PR
- Valider une quete utilisateur
- Attribuer des points
- Bannir un utilisateur
- Modifier la configuration de securite
- Deployer en staging ou production

### 7. Nommage des branches
- Format : agent/{type}-{description-courte}
- Exemples : agent/dev-fix-mobile-ux, agent/security-csrf-headers

## Perimetre par agent

| Action | DEV | SECURITY | SEO | COMMUNITY |
|---|:---:|:---:|:---:|:---:|
| Lire code source | oui | oui | oui | oui |
| Creer branche agent/* | oui | oui | oui | oui |
| Ouvrir Pull Request | oui | oui | oui | oui |
| Ouvrir Issue GitHub | oui | oui | oui | oui |
| Merger Pull Request | NON | NON | NON | NON |
| Push sur main | NON | NON | NON | NON |
| Acces env vars prod | NON | NON | NON | NON |
| Acces cles privees | NON | NON | NON | NON |
| Signer transactions | NON | NON | NON | NON |
| Acces tresorerie | NON | NON | NON | NON |
| Valider quetes seul | NON | NON | NON | NON |
| Deployer production | NON | NON | NON | NON |
