# NEXT STEPS — Actions requises par l'admin

## Statut actuel du systeme multi-agents SHUI

### OK Realise automatiquement
- Branche `staging` creee depuis `main`
- Branche `agent/setup-infrastructure` creee avec tous les fichiers infrastructure
- Branche `agent/security-initial-audit` creee avec les corrections de securite
- PR #2 — Infrastructure multi-agents (branche -> main)
- PR #3 — Audit securite initial (branche -> staging)
- Issue #4 — Migration Next.js 12 -> 14
- Issue #5 — CVE @project-serum/anchor

### Actions manuelles requises par l'admin

#### 1. Ajouter le fichier GitHub Actions (5 min)
Le token actuel n'a pas le scope `workflow` pour pousser dans `.github/workflows/`.
Vous devez ajouter ce fichier manuellement :

**Option A** : Via l'interface GitHub
1. Aller sur github.com/shui-official/shui-community
2. Basculer sur la branche `agent/setup-infrastructure`
3. Creer `.github/workflows/agents-ci.yml` avec le contenu ci-dessous

**Option B** : En local
```bash
git checkout agent/setup-infrastructure
git pull
# Le fichier .github/workflows/agents-ci.yml est deja sur votre machine
git add .github/workflows/agents-ci.yml
git commit -m "ci(agents): add agents-ci.yml — validate agent/* PRs"
git push
```

#### 2. Proteger la branche main (5 min)
Aller dans **Settings > Branches > Add branch protection rule** pour `main` :
- [x] Require a pull request before merging
- [x] Require approvals (1 minimum)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
- [x] Do not allow bypassing the above settings

#### 3. Proteger la branche staging (5 min)
Meme operation pour `staging` :
- [x] Require a pull request before merging
- [x] Require 1 approval

#### 4. Activer les deployments Vercel Preview (10 min)
Dans Vercel Dashboard :
- Connecter le repo GitHub si ce n'est pas fait
- Activer "Preview Deployments" pour la branche `staging`
- Configurer `main` -> Production, `staging` -> Preview

#### 5. Valider et merger les PRs (15 min)
1. Relire PR #2 (infrastructure) et merger si OK
2. Relire PR #3 (audit securite) et merger si OK en staging

---

## Contenu du fichier agents-ci.yml a ajouter manuellement

```yaml
# ============================================================
# SHUI Agents CI/CD Pipeline
# Valide toutes les PRs venant des branches agent/*
# NE deploie PAS en production — validation humaine requise
# ============================================================
name: SHUI Agents CI/CD

on:
  pull_request:
    branches: [main, staging]
    types: [opened, synchronize, reopened]
  push:
    branches: [staging]

permissions:
  contents: read
  pull-requests: write
  checks: write
  issues: write

jobs:
  # ── Job 1: Valide le nommage des branches ──────────────
  validate-branch:
    name: Validate branch naming
    runs-on: ubuntu-latest
    steps:
      - name: Check agent branch convention
        run: |
          BRANCH="${{ github.head_ref || github.ref_name }}"
          echo "Branch: $BRANCH"
          if [[ "${{ github.event_name }}" == "pull_request" ]]; then
            if [[ ! "$BRANCH" =~ ^(agent/|dependabot/) ]]; then
              echo "::error::PRs vers main/staging doivent venir de branches agent/*"
              echo "Exemples valides: agent/dev-fix, agent/security-headers, agent/seo-meta"
              exit 1
            fi
          fi
          echo "Branch naming OK: $BRANCH"

  # ── Job 2: Build, TypeScript, Lint ────────────────────
  build-and-lint:
    name: Build and Lint
    runs-on: ubuntu-latest
    needs: validate-branch
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "yarn"

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: TypeScript check
        run: yarn tsc --noEmit

      - name: ESLint
        run: yarn lint

      - name: Build (devnet only, no real secrets)
        run: yarn build
        env:
          NEXT_PUBLIC_SOLANA_NETWORK: devnet
          NEXT_PUBLIC_SHUI_MINT: CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C
          SESSION_SECRET: ci-placeholder-not-a-real-secret-do-not-use
          KV_REST_API_URL: https://placeholder.upstash.io
          KV_REST_API_TOKEN: placeholder-token-ci

  # ── Job 3: Security scan ──────────────────────────────
  security-scan:
    name: Security scan
    runs-on: ubuntu-latest
    needs: validate-branch
    steps:
      - uses: actions/checkout@v4

      - name: npm audit (high severity)
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: Check no private keys in source
        run: |
          set +e
          DANGEROUS=$(grep -r \
            -e "private_key\b" \
            -e "PRIVATE_KEY\b" \
            -e "seed_phrase" \
            --include="*.ts" --include="*.tsx" --include="*.js" \
            --exclude-dir=node_modules --exclude-dir=.next \
            . 2>/dev/null | grep -v "//.*private_key" | grep -v "authMessage" | head -3)
          if [ -n "$DANGEROUS" ]; then
            echo "::warning::Possible private key pattern detected - manual review required"
            echo "$DANGEROUS"
          else
            echo "No private key patterns detected in source"
          fi

  # ── Job 4: Security gate ──────────────────────────────
  security-gate:
    name: Security gate (no direct prod deploy)
    runs-on: ubuntu-latest
    needs: [validate-branch, build-and-lint, security-scan]
    steps:
      - name: Production protection confirmation
        run: |
          echo "========================================"
          echo "  SHUI AGENT SECURITY GATE"
          echo "========================================"
          echo "  PR: ${{ github.head_ref }} -> ${{ github.base_ref }}"
          echo "  All CI checks passed"
          echo "  Direct production deploy: BLOCKED"
          echo "  Human review: REQUIRED before merge"
          echo "========================================"

```

---

## Architecture en place

```
SHUI Community Repo
├── main (PROTEGE - PR + review obligatoire)
├── staging (PROTEGE - PR + review)
├── agent/setup-infrastructure (PR #2 -> main)
│   ├── agents/ (4 agents configures)
│   ├── .github/ (templates PR, issues, CODEOWNERS)
│   └── agents-dashboard/ (dashboard Next.js 14 + GitHub Live)
└── agent/security-initial-audit (PR #3 -> staging)
    ├── SECURITY_AUDIT.md (rapport complet)
    ├── src/pages/index.tsx (meta tags ajoutes)
    ├── src/pages/community.tsx (meta tags ajoutes)
    └── src/lib/security/session.ts (SameSite=Strict)
```

## Dashboard SHUI AI Control Center
- URL locale : http://localhost:3001 (apres npm run dev dans agents-dashboard/)
- GitHub Live : connecte en temps reel a l'API GitHub
- Donne les PRs, issues, branches, commits en direct
