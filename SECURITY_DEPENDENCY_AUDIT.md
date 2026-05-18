# SECURITY DEPENDENCY AUDIT — SHUI

## Date
2026-04-26

## Scope

- Root application
- agents-dashboard

## Root npm audit summary

- 98 vulnerabilities
- 8 critical
- 32 high
- 37 moderate
- 21 low

## agents-dashboard npm audit summary

- 2 vulnerabilities
- 1 high
- 1 moderate

## High-level findings

### 🔴 CRITICAL — protobufjs via Trezor / wallet dependency chain

Impact:
Potential arbitrary code execution according to npm audit.

Risk:
This is transitive through wallet-related dependencies. Any fix may require changing Solana wallet adapter packages.

Recommendation:
Do not run `npm audit fix --force`. Review wallet dependency tree first.

Review:
REQUIRES_HUMAN_REVIEW

---

### 🟠 HIGH — Next.js root app

Impact:
Root app uses Next.js 12.1.0. Multiple Next advisories affect old versions.

Recommendation:
Evaluate controlled upgrade to latest compatible Next 12 patch first, not Next 16.

Review:
REQUIRES_HUMAN_REVIEW

---

### 🟠 HIGH — Wallet adapter / Solana dependency tree

Impact:
Transitive vulnerabilities through wallet-adapter, WalletConnect, Torus, Trezor, elliptic, lodash, uuid.

Recommendation:
Audit which wallet adapters are actually used in SHUI UI. Remove unused adapters before upgrading.

Review:
REQUIRES_HUMAN_REVIEW

---

### 🟠 HIGH — Vercel CLI dependency tree

Impact:
Many vulnerabilities are transitive through local Vercel CLI tooling.

Recommendation:
Confirm whether `vercel` is required as a project devDependency. If not required locally, remove from package.json in a dedicated PR.

Review:
REQUIRES_HUMAN_REVIEW

---

### 🟡 MEDIUM — agents-dashboard Next/PostCSS

Impact:
Local dashboard depends on Next 14.2.x and PostCSS with audit warnings.

Recommendation:
Keep dashboard local only. Consider a separate upgrade path after root app security plan.

Review:
REQUIRES_HUMAN_REVIEW

## Safe remediation strategy

1. Do not run `npm audit fix --force`.
2. Identify unused wallet adapters.
3. Remove unused high-risk wallet integrations first.
4. Upgrade Next root app within same major if possible.
5. Remove or isolate Vercel CLI dev dependency if not required.
6. Run:
   - npm run tsc
   - npm run lint
   - npm run build
7. Open separate PRs per risk area.

## Proposed PR batches

### PR 1 — Audit report only
Branch:
agent/security-dependency-audit

### PR 2 — Remove unused wallet adapters
Branch:
agent/security-wallet-adapter-prune

### PR 3 — Next 12 patch upgrade
Branch:
agent/security-next12-patch

### PR 4 — Vercel CLI dependency review
Branch:
agent/security-vercel-cli-review

## Review

REQUIRES_HUMAN_REVIEW
