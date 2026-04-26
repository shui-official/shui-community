# SHUI Multi-Agent Architecture

> Version : MVP 1.0 | Date : 2026-04-25 | Statut : Operationnel

## Principe fondamental

Les agents IA **assistent**, ils ne decident jamais seuls.
Chaque action passe par :
```
Agent -> branche agent/* -> Pull Request -> CI/CD -> Review humaine -> Staging -> Production
```

## Regles absolues (inviolables)

| Regle | Statut |
|---|---|
| Zero acces cles privees / seed phrases | Enforced |
| Zero signature de transaction blockchain | Enforced |
| Zero transfert de tokens ou SOL | Enforced |
| Zero deploiement direct en production | Enforced |
| Toute modification = Pull Request obligatoire | Enforced |
| Validation humaine sur toute action sensible | Enforced |
| Staging avant production | Enforced |
| Logs complets de toutes les actions | Enforced |

## Les 4 Agents

### Agent DEV (agent/dev-*)
- Analyse code, bugs, UX, performance
- Cree PRs correctives uniquement
- Ne peut jamais : merger, deployer, acceder aux env vars prod

### Agent SECURITY (agent/security-*)
- Audite wallet connect, CSRF, XSS, CVE
- Produit rapports + PR correctives
- Ne peut jamais : toucher aux wallets, signer, acceder aux fonds

### Agent SEO/CONTENT (agent/seo-*)
- Genere contenu, meta tags, articles en brouillon
- Toujours en PR, jamais publie directement
- Ne peut jamais : publier sur reseaux, modifier prod

### Agent COMMUNITY (agent/community-*)
- Analyse quetes, detecte abus, propose nouvelles quetes
- Propose des validations, ne valide jamais seul
- Ne peut jamais : attribuer points, bannir, acceder aux wallets

## Branches

| Branche | Usage | Protection |
|---|---|---|
| main | Production | PR + CI + 1 review requise |
| staging | Pre-production | PR + CI requise |
| agent/dev-* | Corrections DEV | Automatique |
| agent/security-* | Audits securite | Automatique |
| agent/seo-* | Contenu SEO | Automatique |
| agent/community-* | Quetes / Community | Automatique |

## Dashboard de controle

SHUI AI Control Center : dashboard de monitoring des agents
Fichiers config : agents/*/config.json
Prompts systeme : agents/*/system-prompt.md
Regles : agents/rules/security-rules.md

## Contact

Repo : https://github.com/shui-official/shui-community
Site : https://shui-community.vercel.app
