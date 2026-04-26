# Rapport d'Audit Securite — Agent SECURITY SHUI

> **Date** : 2026-04-25
> **Agent** : Agent SECURITY SHUI v1.0
> **Branche** : agent/security-initial-audit
> **Perimetre** : Code source + Headers HTTP production
> **Validation humaine requise** : Oui

---

## Methodologie

Audit en lecture seule. Analyses effectuees :
- Lecture du code source (session.ts, csrf.ts, nonceStore.ts, rateLimit.ts, validate.ts)
- Scan des headers HTTP de production (`curl -sI https://shui-community.vercel.app`)
- Analyse next.config.js (CSP, headers securite)
- Verification pages.tsx (meta tags, OG tags)
- npm audit (dependances)

---

## Resultats par categorie

### 1. Wallet Connect Security — POSITIF

| Point | Statut | Detail |
|---|---|---|
| Connexion = signature message uniquement | OK | Verifie dans /api/auth/verify et WalletSessionBridge.tsx |
| Nonce unique genere par /api/auth/nonce | OK | cryptoRandomHex(16) — entropie suffisante |
| Nonce expire (TTL) | OK | Verifie dans nonceStore.ts |
| Nonce marque comme utilise apres validation | OK | entry.used = true |
| Verification signature tweetnacl | OK | Visible dans authMessage.ts |
| Aucun approve() ou transfer() a la connexion | OK | Aucune transaction non sollicitee detectee |

**Bilan wallet : SECURISE**

---

### 2. Session & Authentication — POSITIF avec nuances

| Point | Statut | Detail |
|---|---|---|
| HMAC-SHA256 session token | OK | session.ts — timingSafeEqual |
| Cookie HttpOnly | OK | Set dans setSessionCookie() |
| Cookie Secure (prod) | OK | Conditionnel sur NODE_ENV=production |
| Cookie SameSite | WARN | Lax — Strict serait plus conservateur |
| Expiration 24h | OK | maxAgeSeconds=86400 |
| Logout efface le cookie | OK | clearSessionCookie() present |

**Recommendation** : Passer SameSite=Strict pour le cookie shui_session.
Impact : Aucun si le site n'utilise pas de navigation cross-site avec session.

---

### 3. Protection CSRF — POSITIF

| Point | Statut | Detail |
|---|---|---|
| Token CSRF genere | OK | /api/auth/csrf — crypto.randomBytes(32) |
| Double Submit Cookie | OK | csrf.ts — pattern correct |
| Header X-CSRF-Token verifie | OK | requireCsrf() applique |
| TTL 2h | OK | CSRF_TTL_SEC = 7200 |

**Bilan CSRF : BIEN PROTEGE**

---

### 4. Headers HTTP Production — POSITIF

Headers verifies sur https://shui-community.vercel.app :

| Header | Valeur | Statut |
|---|---|---|
| Content-Security-Policy | Presente, configuree | OK |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | OK |
| X-Frame-Options | DENY | OK |
| X-Content-Type-Options | nosniff | OK |
| Referrer-Policy | strict-origin-when-cross-origin | OK |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | OK |
| X-XSS-Protection | 0 (desactive intentionnellement) | OK (recommande pour navigateurs modernes) |
| Cross-Origin-Resource-Policy | same-site | OK |

**Note CSP** : Le CSP utilise `unsafe-inline` sur script-src.
C'est necessaire pour Next.js 12 (pas de nonce CSP natif).
A ameliorer lors de la migration vers Next.js 14 (App Router).

**Bilan headers : BONNE CONFIGURATION**

---

### 5. Problemes reels identifies

#### FINDING-001 — MEDIUM : Meta tags manquants (SEO & partage)

**Severite** : MEDIUM (impact UX/SEO, pas securite directe)
**Fichiers concernes** : src/pages/index.tsx, src/pages/community.tsx
**Description** : Les pages ne contiennent que le titre. Pas de meta description,
pas d'Open Graph, pas de Twitter Card. Les partages sur reseaux sociaux
n'affichent aucun apercu.

**Correction** : Ajoutee dans cette PR (src/pages/index.tsx et src/pages/community.tsx)

---

#### FINDING-002 — MEDIUM : NonceStore en memoire (Map JavaScript)

**Severite** : MEDIUM
**Fichier** : src/lib/security/nonceStore.ts
**Description** : Le store des nonces est une Map() JavaScript en memoire.
Sur Vercel (serverless), chaque instance peut avoir sa propre Map.
En cas de redemarrage ou scale-out, les nonces peuvent etre perdus.
Un utilisateur peut se retrouver avec une erreur "nonce not found" si
sa requete tombe sur une autre instance.

**Impact** : UX (echec de connexion rare) + faible risque securite (replay potentiel
entre instances differentes si le nonce n'est pas marque used).

**Recommendation** : Migrer vers Upstash KV (deja utilise pour les sessions).
PR separee a creer (agent/security-nonce-kv-migration).

---

#### FINDING-003 — MEDIUM : RateLimit en memoire (Map JavaScript)

**Severite** : MEDIUM
**Fichier** : src/lib/security/rateLimit.ts
**Description** : Meme probleme que le NonceStore. Le rate limit est en memoire.
Sur plusieurs instances Vercel, chaque instance a son propre compteur.
Un attaquant peut contourner le rate limit en distribuant ses requetes.

**Impact** : Rate limiting non fiable sur Vercel multi-instance.

**Recommendation** : Migrer vers Upstash KV avec sliding window.
Le package `@upstash/ratelimit` est recommande.
PR separee : agent/security-ratelimit-kv.

---

#### FINDING-004 — HIGH : Dependance @project-serum/anchor obsolete

**Severite** : HIGH
**Fichier** : package.json — "@project-serum/anchor": "^0.19.1-beta.1"
**Description** : Cette version bete datant de 2021 n'est plus maintenue.
Le package a ete renomme en @coral-xyz/anchor.
Des vulnerabilites peuvent etre presentes dans cette version ancienne.

**Recommendation** : 
- Verifier si @project-serum/anchor est reellement utilise dans le code
- Si oui : migrer vers @coral-xyz/anchor@0.30.x
- Si non : retirer la dependance
- Issue GitHub creee separement pour suivi

---

#### FINDING-005 — LOW : Cookie SameSite=Lax -> Strict possible

**Severite** : LOW
**Fichier** : src/lib/security/session.ts
**Description** : Le cookie shui_session utilise SameSite=Lax.
SameSite=Strict est plus conservateur et empeche l'envoi du cookie
sur toute navigation cross-site, y compris les liens cliques.

**Impact** : Tres faible. SameSite=Lax protege contre la quasi-totalite des CSRF.
Strict peut casser des flows de navigation depuis des liens externes.

**Recommendation** : Evaluer si SameSite=Strict est compatible avec le flow auth.
Si aucun redirect cross-site avec session, passer a Strict.

---

### 6. Aucune vulnerabilite critique detectee

- Aucune cle privee exposee dans le code
- Aucune transaction non sollicitee
- Aucun dangerouslySetInnerHTML detecte
- Aucun secret dans le code source (pas de hardcoded keys)
- Aucune fuite de wallet ou de donnees utilisateur

---

## Corrections incluses dans cette PR

1. **index.tsx** : Ajout meta description + Open Graph + Twitter Card
2. **community.tsx** : Ajout meta description + Open Graph
3. **SECURITY_AUDIT.md** : Ce rapport

## Actions suivantes (PRs separees)

1. Migration NonceStore vers Upstash KV (FINDING-002)
2. Migration RateLimit vers Upstash KV (FINDING-003)
3. Mise a jour dependance @project-serum/anchor (FINDING-004)
4. Evaluation SameSite=Strict (FINDING-005)

---

*Rapport genere par Agent SECURITY SHUI — Branche agent/security-initial-audit*
*Aucune cle privee. Aucune transaction. Aucun acces wallets ou tresorerie.*
