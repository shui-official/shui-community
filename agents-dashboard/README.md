# SHUI Agents Dashboard

Dashboard multi-agents IA pour le controle de l'architecture SHUI.

## Fonctionnalites
- Connexion GitHub Live (donnees en temps reel)
- Affichage PRs, Issues, branches agents
- Gestion des 4 agents : DEV, SECURITY, SEO/CONTENT, COMMUNITY
- Audit de securite
- Workflow GitHub complet
- Roadmap MVP 30 jours

## Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- GitHub API (server-side)

## Demarrage
```bash
npm install
cp .env.local.example .env.local  # Ajouter GITHUB_TOKEN
npm run dev
```

## Securite
- GITHUB_TOKEN : serveur uniquement, jamais expose au navigateur
- Lecture seule des donnees GitHub
- Aucune action directe sur le repo depuis le dashboard
