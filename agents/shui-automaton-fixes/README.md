# Correctifs SHUI Automaton — 2026-10-05

Patch : `2026-10-05-orchestration-timeouts.patch`.
Il s'applique au backup `SHUI-IA-FULL-BACKUP-20261005-055758`, dossier `~/workspace/automaton-main`.

Le patch corrige des bugs et des incohérences. Il ne touche pas au concept de l'agent : genesis, SOUL.md, constitution, mission, wallet et politique financière restent identiques.

## Ce qui était cassé et ce qui change

### 1. Plusieurs workers sur le même objectif après les timeouts (`assigned=4`)
**Cause.** Au `replanning`, l'orchestrateur remettait en `pending` la tâche échouée **et** insérait toutes les tâches du nouveau plan. Quand le replanner échoue (Ollama lent, JSON rejeté), son plan de repli recrée une tâche portant le titre du goal (« Build ONE simple arbitrage monitoring dashboard »). Chaque replan ajoutait donc une copie supplémentaire. Après deux replans, on avait 3 copies, plus le worker `researcher`.

**Correctif** (`orchestrator.ts`) :
- Une tâche du nouveau plan dont le titre existe déjà dans le goal réutilise la ligne existante. Sa description est mise à jour, et les dépendances sont remappées vers la tâche existante.
- Les doublons ouverts déjà présents en base sont annulés (`cancelled`) au prochain replan, sauf le plus ancien. Leurs dépendants sont redirigés vers la tâche conservée.

### 2. Le nombre de workers dépassait `maxChildren`
**Cause.** La phase `executing` lançait un worker pour **chaque** tâche prête, sans aucune limite. Avec `maxChildren = 3`, on a vu `assigned=4`. Tous ces workers partagent le même Ollama (`127.0.0.1:11435`), ce qui explique aussi les timeouts côté Ollama.

**Correctif.** Le nombre de tâches `assigned` ou `running` est maintenant plafonné à `maxConcurrentTasks`. Si cette valeur n'est pas définie, c'est `maxChildren` qui s'applique (3 actuellement). Les tâches en trop attendent le tick suivant.

### 3. Timeout à 300 s pour toutes les tâches
**Causes.**
- Le planner fournit un `timeoutMs` par tâche, mais `plannerOutputToTasks` l'ignorait. Toutes les tâches recevaient donc la valeur par défaut de la base (300 s).
- 300 s est incohérent avec un modèle 9B local : un seul appel Ollama peut durer jusqu'à 180 s, et 25 tours ne tiennent pas dans 5 minutes.

**Correctif** (`orchestrator.ts`, `task-graph.ts`, `local-worker.ts`) :
- Le `timeoutMs` du planner est maintenant enregistré, avec un plancher de **900 s** par défaut, configurable via `workerTaskTimeoutMs`.
- Ce plancher s'applique aussi aux tâches déjà en base avec 300 s.

### 4. Le travail fait était perdu à chaque timeout
**Cause.** Un `Budget exhausted: timeout` jetait tout. Pire : la tâche retentée repasse en `pending`, et `buildWisdomFromGoal` ne lisait que les tâches `failed`. Le worker suivant ignorait donc la tentative précédente et repartait de zéro, d'où la boucle `timeout → nouveau worker → timeout`.

**Correctif** (`base-harness.ts`, `harness-types.ts`) :
- Le message d'échec d'un budget épuisé liste désormais les fichiers déjà écrits, avec la consigne « Resume from these files instead of starting over ».
- Ce message est transmis au worker suivant, dans la section « Known Failures » de son prompt.

### 5. Plans valides rejetés à cause du format des risques
**Cause.** Qwen 9B renvoie souvent `risks: [{ risk, mitigation }]` au lieu de `risks: [string]`. Le validateur rejetait alors tout le plan, et l'orchestrateur tombait sur le repli à tâche unique, ce qui alimentait le point 1.

**Correctif** (`planner.ts`) : ces objets sont convertis en texte (`"risk — mitigation"`). Les autres types sont toujours rejetés.

### 6. Tentative de sandbox Conway à chaque tâche
**Cause.** `registeredWithConway` vaut `false`, donc chaque spawn passait d'abord par Conway, recevait un 401, puis basculait sur un worker local.

**Correctif** (`loop.ts`) : quand l'agent n'est pas enregistré chez Conway, le worker local est lancé directement. Le comportement `UNKNOWN` / `low-compute` du solde Conway n'est **pas modifié** : il était déjà correct.

## Tests
- 8 nouveaux tests, dans `src/__tests__/orchestration/orchestrator-consolidation.test.ts`. 7 d'entre eux échouent sur le code d'origine et passent avec le patch.
- `tsc --noEmit` : 0 erreur.
- Suite complète : 1640 tests passent. Les 27 tests en échec sont **exactement les mêmes avant et après le patch** (`loop.test.ts`, `soul.test.ts`, `context-hardening.test.ts`, `policy-engine.test.ts`). Ces échecs existaient déjà dans le backup et viennent des modifications manuelles précédentes (immutable core, soul, prompt). Le patch ne les corrige pas.

## Appliquer sur le VPS
```bash
sudo systemctl stop <service-shui>          # ou arrêter le process automaton
cd /home/automaton/workspace/automaton-main
patch -p1 --dry-run < 2026-10-05-orchestration-timeouts.patch
patch -p1 < 2026-10-05-orchestration-timeouts.patch
pnpm exec tsc --noEmit && pnpm exec vitest run src/__tests__/orchestration
pnpm build
sudo systemctl start <service-shui>
```
Les doublons déjà présents en base sont nettoyés au prochain `replanning` de SHUI. Entre-temps, le plafond de concurrence s'applique dès le redémarrage.

## Réglages optionnels (non appliqués, à décider)
Dans `~/.automaton/automaton.json` :
- `"maxConcurrentTasks": 1` : recommandé avec un seul Ollama 9B. La boucle principale et chaque worker se disputent le même GPU.
- `"workerTaskTimeoutMs": 900000` : valeur par défaut, à ajuster si besoin.

## À propos de `SOUL.md` modifié (`git diff` : Modified 2, Untracked 16)
Ce n'est pas SHUI qui l'a modifié. Le dépôt git de `~/.automaton` ne contient qu'un seul commit (genesis, 2 octobre). Toute modification ultérieure apparaît donc comme `Modified`. Les fichiers `SOUL.md.before-genesis-realignment-20261005` (05:22) et `SOUL.md.before-survive-realignment-20261005` (05:44) correspondent aux réalignements manuels du 5 octobre, et la version actuelle date de 05:46. Pour que les prochains `git diff` révèlent une vraie modification par l'agent, committer l'état actuel :
```bash
cd /home/automaton/.automaton && git add SOUL.md constitution.md && git commit -m "baseline after 2026-10-05 realignment"
```

## Hors périmètre, à signaler
- Le backup contient `wallet.json`. Il n'a pas été ouvert, mais l'archive a circulé. Il faut considérer la clé comme exposée, et exclure ou chiffrer ce fichier dans les prochains backups.
- La politique financière d'`automaton.json` n'est pas cohérente : `maxSingleTransferCents` (30000) est supérieur à `maxDailyTransferCents` (10000), et le seuil de confirmation est au-dessus du solde total. Elle n'a **pas** été modifiée : c'est une décision humaine.
- Le dossier `src/` contient environ 100 fichiers `.backup-*` / `.before-*`, plus deux artefacts de shell (`udo -u automaton bash -c '` et `src/{config,database,websocket,alert,core}/`). Ils n'ont aucun effet sur le build, mais un nettoyage est conseillé.

## Patch `2026-10-06-live-run-fixes.patch` (après l'analyse en direct du 6 octobre)
À appliquer par-dessus les 8 patches précédents.
- Planificateur : une estimation mal écrite (`"120"`, `"2 hours"`) ne fait plus rejeter le plan. Une seconde tentative précède le repli sur une tâche unique.
- Budget du planificateur : la valeur vérifiée du wallet remplace les crédits Conway (inconnus, donc 0, ce qui menait à « critical » puis à « kill this goal »).
- Workers :
  - vrai `web_fetch` en lecture seule (avant : alias de `x402_fetch`, limité à conway.tech) ;
  - chemins relatifs et commandes dans le dossier de la tâche ;
  - consignes sur la machine (venv, pas de CLI `solana`, pas de root, données réelles uniquement) ;
  - outils de gestion de SHUI masqués ; outils du wallet conservés ;
  - `check_usdc_balance` corrigé.
- Tâches des objectifs échoués ou terminés annulées automatiquement. Les workers concernés sont arrêtés.
- Un `config.json` de projet est autorisé dans le dossier de la tâche. Les écritures refusées ne comptent plus comme travail conservé.
- Le journal affiche le détail des avertissements et des erreurs.
- Les appels d'outils écrits en texte par qwen3-coder (`<function=…>`) sont récupérés. Consignes shell : `python3`, pas de `source`, serveurs en arrière-plan.
- Tests : 30 échecs, les mêmes qu'avant le patch (fichiers `/etc/shui-agent/*` absents de l'environnement de test). Tous les tests de l'orchestration et des workers passent.

## Patch `2026-10-06-guards-swap-dryrun.patch`
- Un `task_done` réussi est refusé une première fois si le code écrit simule encore son fonctionnement (`mock_…`, « simulating the execution »…). Si la simulation reste, la tâche est enregistrée en échec. Les tests et la documentation ne sont pas concernés.
- Sans objectif ni message, SHUI se rendort 5 minutes au lieu de 60 s.
- Les outils qui ne marchent qu'avec Conway sont masqués tant que SHUI n'est pas enregistré.
- La réserve de SOL passe à 0,01 SOL (frais et loyer des nouveaux comptes de tokens). `raydium_swap` explique les frais, le loyer et les unités brutes, accepte tout token SPL, et propose un mode `dryRun=true` (simulation sans signature ni envoi).

## Patch `2026-10-06-prompt-value-machine-facts.patch` (prompt, approuvé par le créateur)
- Ajoute aux règles de SHUI : *« Plans, documents and simulated services are not value: only verified revenue or realized trading profit counts. »*
- Ajoute les faits sur la machine : pas de root, pas de Docker, pas de CLI `solana`, venv Python, ports non exposés, tout token SPL possible, 0,01 SOL réservé.

## Patch `2026-10-06-services-payments.patch` + `services/` (F + G, approuvés par le créateur)
- Outils `service_deploy`, `service_stop`, `service_status` et `service_logs`. Un service placé dans `/srv/shui/services/<nom>/run.sh` :
  - tourne sous l'utilisateur `shui-svc`, dans un bac à sable systemd sans accès à `/home`, donc sans accès au wallet ;
  - redémarre seul et survit aux redémarrages du serveur ;
  - est publié en HTTPS par Caddy sur `https://<nom>.<ip>.sslip.io`.
- Outils `payment_request` et `payment_check` : liens Solana Pay en USDC vers le wallet central, puis vérification du paiement on-chain. Les USDC reçus comptent comme revenu.
- `web_fetch` aussi pour SHUI.
- `services/setup-services.sh` : installation root, à lancer une seule fois (Caddy, utilisateur `shui-svc`, programme d'aide `shui-service`, règle sudoers limitée à ce programme, ports 80 et 443 dans `ufw`).

## Patch `2026-10-06-dashboard-bridge.patch`
SHUI envoie au Control Center les événements `memory_write`, `wallet`, `trade`/`trade_result` et `decision`. Les pages Mémoire, Wallet, Trading et Stratégie affichent ainsi ses vraies données. Les faits, les procédures et les swaps déjà enregistrés sont rattrapés au démarrage.

## Patch `2026-10-06-safe-services-no-fake-revenue.patch`
- Services : mode debug, écoute sur 0.0.0.0 et dépendances non installées sont refusés au déploiement.
- Garde-fou : faux paiements dans les CSV/JSON, URL de paiement inventées et annonces de revenu absentes du journal vérifié sont refusés.
- Workers : écriture limitée au dossier de la tâche, commandes exécutées dans ce dossier, moins de fausses boucles, rôle `critic` sans délégation, `read_file` plus tolérant, journal avec les URL lues.

---

# Chat créateur (page « Chat SHUI » du Control Center) — 2026-10-06

Patch : `2026-10-06-creator-chat.patch`, plus le dossier `control-center/`.

## Pourquoi la page était « NON CONNECTÉ »
Le Control Center lit `state.db` en lecture seule. Il ne peut donc pas écrire dans `inbox_messages`, et aucun transport n'existait.

## Comment ça marche maintenant
Le chemin d'un message est le suivant :
1. La page envoie le message au backend du Control Center (`POST /api/chat`).
2. Le backend le transmet à SHUI, sur `http://127.0.0.1:3334/chat`, avec un jeton.
3. SHUI l'enregistre dans `inbox_messages` sous l'expéditeur `creator:control-center`, puis crée un `wake_event`.
4. SHUI se réveille en 30 s maximum et lit le message comme un message authentifié de son créateur.
5. Le tour suivant de SHUI devient sa réponse : son texte et les outils qu'il a lancés.
6. La réponse est enregistrée, puis affichée par la page (`GET /api/chat`).

Points de sécurité et de comportement :
- `state.db` reste en lecture seule pour le Control Center.
- L'endpoint n'écoute que sur 127.0.0.1. Il exige un jeton aléatoire de 64 caractères.
- Les services publiés tournent sous l'utilisateur `shui-svc` et n'ont pas accès au jeton. Ils ne peuvent donc pas se faire passer pour le créateur.
- Sans jeton configuré, l'endpoint est désactivé.
- Le message du créateur a la même autorité qu'avant (niveau `agent`). Aucune permission ni règle financière n'est changée.

Le patch contient aussi deux corrections pour les workers :
- Leurs commandes passent par `bash`. Avant, `/bin/sh` renvoyait « Bad substitution ».
- Quand un chemin est refusé, le message indique maintenant le bon dossier projet. Avant, le worker inventait `/home/automaton/workspace/<goal>`.

## Installation
1. Côté SHUI : appliquer le patch, compiler, puis lancer `sudo bash setup-chat.sh ubuntu` une seule fois. Le script crée le jeton sans l'afficher.
2. Côté Control Center : copier `control-center/shui-chat-transport.ts` dans `backend/src/`. Brancher ensuite `chat.ts` sur ce module :
   - `GET /api/chat` doit renvoyer `connected`/`transport` depuis `shuiChatStatus()` et les messages depuis `listShuiChat()` ;
   - `POST /api/chat` doit appeler `sendCreatorMessage(content)`.
   Ne jamais renvoyer le jeton au navigateur.

---

# Outils de trading et d'autonomie — 2026-10-06

Patch : `2026-10-06-trading-tools.patch`. Il s'applique après `2026-10-06-chat-inbox-fix.patch`. Côté Control Center, `control-center/chat.ts` et `control-center/shui-chat-transport.ts` sont mis à jour pour afficher les messages que SHUI t'envoie.

1. **Bug du swap Raydium (`REQ_INPUT_ACCOUT_ERROR`).** Quand l'entrée n'était pas du SOL, le compte de token du wallet n'était jamais transmis à Raydium, ce qui faisait échouer tous les swaps USDC → token. Il est maintenant transmis. Le compte de sortie est aussi transmis s'il existe déjà.
2. **A. Pas de tâche « déployer » réussie sans service en ligne.** Pour une tâche dont le titre contient deploy, publish, launch, host ou expose, le succès est refusé tant qu'aucun service publié avec `service_deploy` ne répond en HTTPS (réponse inférieure à 500).
3. **B. Pas de serveur public lancé par `exec`.** Après chaque `exec`, les processus de SHUI qui écoutent sur une adresse publique (0.0.0.0, `::`) sont arrêtés. SHUI reçoit alors un message qui le renvoie vers `service_deploy`. Les tests sur 127.0.0.1 restent permis.
4. **C. `payment_request` rappelle qu'un lien de paiement n'est pas un revenu.**
5. **`message_creator`.** SHUI peut t'écrire de lui-même dans le chat, avec un maximum de 6 messages par heure. Ses messages apparaissent avec 📨. Les workers n'ont pas cet outil.
6. **`jupiter_swap`.** C'est l'agrégateur Jupiter : il cherche le meilleur prix sur tous les DEX Solana et accepte presque tous les tokens. Il passe par le même moteur sécurisé que le swap Raydium : solde vérifié sur la chaîne, réserve de 0,01 SOL, verrou de transaction en attente, simulation et journal comptable. La transaction construite par Jupiter est vérifiée avant signature :
   - SHUI est le seul signataire ;
   - l'instruction de Jupiter contient exactement le montant, la sortie annoncée et le slippage demandés ;
   - aucune délégation ni changement d'autorité sur ses tokens ;
   - les SOL ne sont envoyés que vers son propre compte de SOL « wrappé » ;
   - les frais de priorité sont plafonnés.
7. **`market_scan`.** Données de marché en direct, via les API gratuites GeckoTerminal et DexScreener :
   - `trending` : les pools en tendance ;
   - `search` : la recherche d'un token par nom ou symbole ;
   - `token` : le pool le plus profond d'un token, avec un résumé des bougies horaires sur 24 h.
   Il signale les liquidités faibles et les paires de moins de 24 h.
8. **Ordres automatiques : `order_create`, `order_list`, `order_cancel`.** Trois types : stop_loss, take_profit et buy_below. Le code vérifie les prix Jupiter toutes les 30 s, sans attendre le modèle, et exécute le swap par le moteur sécurisé. SHUI reçoit un message dans sa boîte quand un ordre est exécuté, échoue ou expire. Garde-fous :
   - un ordre interrompu par un redémarrage n'est jamais relancé à l'aveugle ;
   - 20 ordres ouverts au maximum.
9. **Staking.** Il se fait par `jupiter_swap` : SOL → jitoSOL ou mSOL, environ 7 % par an. Le journal comptable compte le gain quand SHUI revend contre de l'USDC. Le prêt d'USDC (Kamino, marginfi) n'est pas inclus : il demande d'intégrer le SDK de chaque protocole, et sur 24 USDC il rapporterait moins d'un centime par jour.

## Tests
- 20 nouveaux tests ; `tsc` ne signale aucune erreur.
- Suite complète : 1736 tests réussis. Les 27 échecs sont exactement ceux d'avant, dus à l'absence de `/etc/shui-agent` dans l'environnement de test.
- Les API Raydium et Jupiter ne sont pas joignables depuis l'environnement de test. La vérification se fait donc sur le VPS, en dry run.

---

# Limites de requêtes des API de marché — 2026-10-06

Patch : `2026-10-06-rate-limit-fix.patch`, à appliquer après `2026-10-06-trading-tools.patch`.

Raydium, Jupiter et GeckoTerminal répondent en texte (« Rate limit exceeded ») quand ils limitent le nombre de requêtes. Le code lisait cette réponse comme du JSON et plantait sur « Unexpected token 'R' ». Désormais :
- une limite de requêtes (HTTP 429) ou une erreur serveur (5xx) est réessayée deux fois, après 1,5 s puis 4 s ;
- si la limite persiste, SHUI reçoit un message clair : « … is rate-limiting requests … Wait a minute before retrying. »

Le dry run Raydium USDC → SOL a été vérifié sur le VPS (17:11:19) : la transaction passerait, avec 6 001 lamports de frais. Le bug `REQ_INPUT_ACCOUT_ERROR` est donc corrigé.

---

# Clé d'API Jupiter — 2026-10-06

Patch : `2026-10-06-jupiter-key.patch`, à appliquer après `2026-10-06-rate-limit-fix.patch`.

L'API gratuite sans clé de Jupiter (`lite-api.jup.ag`) a renvoyé HTTP 429 dès le premier swap de SHUI. Si la variable `JUPITER_API_KEY` est définie (clé gratuite à créer sur portal.jup.ag), SHUI utilise `api.jup.ag` avec l'en-tête `x-api-key`, pour les swaps comme pour les prix des ordres automatiques. Sans clé, il garde l'API gratuite. Quand elle est saturée, le message d'erreur renvoie SHUI vers `raydium_swap`.

Pour ajouter la clé sans qu'elle s'affiche à l'écran : `sudo bash -c 'read -rsp "Clé Jupiter: " K; echo; echo "JUPITER_API_KEY=$K" >> /etc/shui-agent/chat.env'`, puis `sudo systemctl restart shui-agent`.

---

# Nettoyage automatique (janitor) — 2026-10-06

Patch : `2026-10-06-janitor.patch`, à appliquer après `2026-10-06-jupiter-key.patch`. Le script `maintenance/shui-cleanup.py` est aussi mis à jour.

Toutes les 6 heures (premier passage 10 minutes après le démarrage), du code s'exécute sans passer par le modèle. Rien n'est supprimé directement : ce qui est abandonné part dans `~/archive/janitor-<date>/`, et seules ces archives automatiques sont supprimées au bout de 14 jours.
- **Objectifs abandonnés** : un objectif actif sans aucune tâche terminée depuis 12 h est annulé, et ses tâches avec.
- **Dossiers de travail** : ceux des objectifs terminés, échoués ou annulés depuis plus de 24 h (ou qui n'appartiennent à aucun objectif) sont archivés.
- **Services publiés en panne** : un service qui ne répond pas ou renvoie une erreur 5xx à 3 vérifications, sur au moins 24 h, est arrêté et son dossier archivé. Un service qui répond n'est jamais touché.
- **Brouillons de services** : un dossier de `/srv/shui/services` jamais publié et pas modifié depuis 48 h est archivé.
- **Fichiers laissés à la racine du code** (non suivis par git : arbitrage, trader, dashboard, bot…) : archivés.
- **Historique des « résultats récents » du planificateur** : gardé sur 3 jours seulement.

SHUI reçoit un bilan de chaque passage dans sa boîte. Le nettoyage ne touche jamais au wallet, au journal comptable, au compteur de vie, aux ordres, au chat, aux liens de paiement, à SOUL, au code de l'agent, ni à ses faits et méthodes appris.

Changements de `shui-cleanup.py` (ménage manuel) :
- les services qui répondent restent en ligne ;
- ceux qui ne répondent pas sont arrêtés puis archivés ;
- les dossiers de services jamais publiés sont archivés.

---

# Correctif des ordres automatiques — 2026-10-06

Patch : `2026-10-06-orders-fix.patch`, à appliquer après `2026-10-06-janitor.patch`.

- Un `stop_loss` ou un `take_profit` doit vendre le token qu'il surveille (`inputMint` = `watchMint`). Un `buy_below` doit acheter ce token (`outputMint` = `watchMint`). Un worker avait créé « stop_loss : tout l'USDC → SOL quand le SOL passe sous 100 $ », un ordre qui achète du SOL quand il baisse, soit l'inverse d'un stop-loss.
- `order_create` et `order_cancel` sont réservés à la boucle principale. Un worker ne vit que le temps d'une tâche, alors qu'un ordre reste actif après elle. Les workers gardent `order_list` et les swaps.

---

# Analyse technique et règles de trading — 2026-10-06

Patch : `2026-10-06-technical-analysis.patch`, à appliquer après `2026-10-06-orders-fix.patch`.

- **`technical_analysis`** (mint, timeframe : 5m, 15m, 1h, 4h ou 1d) travaille sur de vraies bougies (le pool le plus liquide via DexScreener, les bougies via GeckoTerminal) et renvoie :
  - **tendance** : EMA20, EMA50, SMA200 ;
  - **momentum** : RSI14, MACD et ses croisements ;
  - **volatilité** : ATR14, bandes de Bollinger ;
  - **supports et résistances**, tirés des derniers sommets et creux ;
  - **niveaux de Fibonacci** : retracements 0,236 à 0,786 et extensions 1,272, 1,618 et 2,618 du mouvement principal, avec la manière de les lire ;
  - **un biais** (haussier, baissier ou neutre) avec ses raisons ;
  - **un plan de trade** : entrée, stop-loss (sous le support, ou 2 ATR), TP1 et TP2 (résistance ou extension de Fibonacci), ratio gain/risque, et taille de position pour risquer 2 % du wallet.
- **`trading_playbook`** : 12 règles de trader expérimenté (1 à 2 % de risque par trade, stop systématique, ratio gain/risque d'au moins 2, suivre la tendance, chercher la confluence de plusieurs signaux, liquidité, pas de FOMO, journal, pas de « revenge trading »…). Ce sont des conseils : rien n'est imposé, SHUI garde la main.
- Le prompt de SHUI lui indique d'utiliser ces deux outils avant tout trade.

---

# Oublier ce qui n'est plus vrai — 2026-10-06

Patch : `2026-10-06-forget-stale-facts.patch`, à appliquer après `2026-10-06-technical-analysis.patch`.

- Quand un outil réussit, les erreurs que SHUI avait notées pour cet outil (`tool_error:<outil>:*`) sont effacées de sa mémoire. Avant, une erreur déjà corrigée (raydium_swap) continuait de l'éloigner de l'outil.
- Le nettoyage automatique efface aussi de sa mémoire les liens de paiement jamais payés de plus de 3 jours. Ils ressemblaient à de l'argent à venir. Le journal comptable et les demandes de paiement elles-mêmes sont conservés.

---

# Jupiter : SOL emballé dans un compte temporaire — 2026-10-07

Patch : `2026-10-07-jupiter-wsol.patch`, à appliquer après `2026-10-06-forget-stale-facts.patch`.

Le premier vrai swap SOL → USDC via Jupiter (6 octobre, 19:12) a été refusé par la vérification avec le message « moves SOL outside SHUI's wrapped-SOL account ». Pour emballer le SOL, Jupiter passe en effet par un compte temporaire (CreateAccount ou CreateAccountWithSeed) au lieu du compte wSOL standard. La vérification accepte désormais ce cas aux conditions suivantes, toutes obligatoires :
- le compte temporaire est financé par SHUI ;
- il appartient au programme des tokens ;
- il est initialisé au nom de SHUI ;
- il est refermé au profit de SHUI.

Tout autre transfert de SOL, toute autre instruction système et toute initialisation au nom d'un autre wallet restent refusés. Les messages de refus précisent maintenant l'instruction concernée et sa destination.

---

# Services qui plantent en boucle — 2026-10-07

Patch : `2026-10-07-service-crash-loop.patch`, à appliquer après `2026-10-07-jupiter-wsol.patch`. Le helper `services/shui-service` est aussi mis à jour (à réinstaller en root).

Le service `usdc-sol-trader` a redémarré 6297 fois pendant la nuit. Il écrivait son fichier de log dans son propre dossier, qui est en lecture seule une fois publié (bac à sable systemd).
- Les règles données aux workers et la description de `service_deploy` le disent désormais : les logs vont sur stdout (visibles avec `service_logs`), les données dans `$STATE_DIRECTORY`, et un service publié n'a pas accès au wallet.
- Si un service n'est pas `active` juste après `service_deploy`, l'outil renvoie un avertissement qui invite SHUI à lire `service_logs` et à corriger.
- Le helper limite chaque service à 10 redémarrages en 10 minutes (avant : 1 toutes les 5 s, sans fin). Au-delà, le service reste arrêté, et le nettoyage automatique l'archive au bout de 24 h.

---

# Mode trading — 2026-10-07

Patch : `2026-10-07-trading-focus.patch`, à appliquer après `2026-10-07-service-crash-loop.patch`.

- **Mode trading** : activé par `SHUI_FOCUS=trading` dans `/etc/shui-agent/chat.env`, et réversible (on retire la ligne, puis on redémarre SHUI). Les outils de services et de paiement sont masqués, pour SHUI comme pour ses workers. Le prompt reçoit une section « FOCUS: TRADING ONLY » avec la méthode à suivre à chaque cycle : stats, scan, analyse, plan dans le journal, achat dimensionné pour risquer 2 %, stop-loss et take-profit immédiats, leçon tirée après coup. SOUL, la genèse et la règle de durée de vie ne changent pas.
- **`setup_scan`** : passe en revue une liste de tokens liquides (SOL, JUP, RAY, PYTH, ORCA, BONK, WIF, ou des mints fournis) et ne remonte que les achats conformes au playbook :
  - tendance haussière en 4h (EMA20 au-dessus de l'EMA50, prix au-dessus de l'EMA50) ;
  - RSI 1h entre 35 et 68, momentum qui se retourne ;
  - liquidité d'au moins 50 k$ ;
  - stop placé sous le support ou à 2 ATR, objectif à la prochaine résistance majeure en 4h ou à l'extension Fibonacci 1,272 ;
  - ratio gain/risque d'au moins 2.
  
  Pour chaque token écarté, il donne la raison.
- **`journal_add`** : plan avant un trade, leçon après, ou simple note.
- **`trade_stats`** : résultats réels tirés du journal comptable (ventes vers l'USDC) : nombre de trades, taux de réussite, PnL réalisé, gain et perte moyens, espérance par trade, PnL du jour. Il signale « STOP » après 2 pertes d'affilée dans la journée, et une méthode perdante sur 10 trades ou plus.

---

# Trading, lot 1 — 2026-10-07

Patch : `2026-10-07-trading-lot1.patch`, à appliquer après `2026-10-07-trading-focus.patch`. Décisions du créateur : B1 à B6, et la priorité 1 des outils.

**Durée de vie, règles v2** (en vigueur à partir du premier démarrage avec ce patch ; les jours déjà jugés restent dans l'historique) :
- **B2** : bilan par semaine de 7 jours.
- **B1** : bilan en % de la valeur vérifiée du wallet au début de la semaine :
  - +2 % = +1 jour, +5 % = +2 jours, +10 % = +3 jours ;
  - entre -2 % et +2 %, rien ne change (**B3**, zone neutre) ;
  - sous -2 % = -1 jour, sous -10 % = -2 jours.
- **B4** : période d'apprentissage de 14 jours, pendant laquelle les pertes de jours sont annulées.
- Si une donnée manque (valeur de départ ou prix), la semaine est notée inconnue et la vie ne change pas.
- **B5** : disjoncteur. Si la valeur du wallet descend de 15 % sous son plus haut, les achats sont suspendus 24 h. Les ventes et les stop-loss continuent de fonctionner, et SHUI est prévenu.
- **B6** : le statut affiché est plus calme (vie restante, gain de la semaine, règle, « la patience ne coûte rien »). Les lignes « Credits / Survival tier » de Conway, qui ne servaient à rien, n'apparaissent plus.

**Outils** :
- **Ordres OCO** : `protect_position` pose en un seul appel un stop-loss (fixe ou suiveur) et un take-profit liés. Quand l'un s'exécute, l'autre est annulé. Avant, le stop restait « orphelin ».
- **Stop suiveur** : `order_create kind=trailing_stop trailPct=…`. Le stop monte avec le prix, jamais l'inverse.
- **`positions`** : chaque token détenu, avec sa valeur, son prix moyen d'entrée (tiré du journal comptable), son PnL latent et ses ordres. Une position sans stop-loss est signalée.
- **`token_safety`** : signaux d'arnaque avant un achat :
  - mint authority ou freeze authority encore actives ;
  - extensions Token-2022 dangereuses (permanent delegate, transfer hook, frais, pause) ;
  - concentration des gros détenteurs ;
  - liquidité, âge du pool.
  
  Verdict : HIGH RISK, CAUTION ou OK. Le verrouillage de la liquidité n'est pas vérifié, et l'outil le signale.
- Les workers ne peuvent pas créer d'ordres (y compris `protect_position`).

---

# Mission de trader et nouveau départ — 2026-10-07

- Patch : `2026-10-07-trader-mission.patch`, à appliquer après `2026-10-07-trading-lot1.patch`. En mode trading, les règles de base du prompt sont remplacées par la mission de trader validée par le créateur : mesure hebdomadaire, méthode, honnêteté, pas de services, pas de demande d'argent. Les règles d'auto-préservation ne changent pas.
- Genèse validée par le créateur : `genesis/genesis-trading.md` (à installer dans `/etc/shui-agent/genesis.md`).
- `maintenance/shui-cleanup.py --fresh-start` : en plus du ménage habituel (qui garde ce que SHUI a appris), il :
  - archive SOUL.md et WORKLOG.md (reconstruits à partir de la nouvelle genèse) ;
  - annule les ordres automatiques ouverts ;
  - arrête tous les services publiés.

---

# Trading, lot 2 — 2026-10-07

Patch : `2026-10-07-trading-lot2.patch`, à appliquer après `2026-10-07-trader-mission.patch`.

- **`backtest`** : teste une règle sur environ 300 bougies réelles (15m, 1h, 4h ou 1d). Trois règles disponibles :
  - `ema_cross` : croisement de deux moyennes mobiles (EMA) ;
  - `rsi_rebound` : rebond du RSI depuis la zone basse ;
  - `breakout` : cassure d'un plus-haut avec du volume.
  
  Chaque trade a un stop à X ATR et un objectif à N fois le risque. Les frais sont comptés (0,25 % par côté), et si le stop et l'objectif sont touchés dans la même bougie, c'est le stop qui compte. Résultat : nombre de trades, taux de réussite, rendement moyen et total, perte maximale, comparaison avec la simple détention, verdict.
- **`strategy_create` / `strategy_list` / `strategy_stop`** : SHUI conçoit, le code exécute.
  - Toutes les 5 min, le code regarde les bougies clôturées. Sur un signal, il achète un montant fixe en USDC via Jupiter, puis pose aussitôt un stop et un objectif liés (OCO).
  - Une position à la fois par stratégie, 3 stratégies actives au maximum, jamais deux achats sur la même bougie.
  - Un backtest tourne à la création : s'il est perdant, la stratégie est refusée, sauf avec `force=true`.
  - Le disjoncteur de perte reste respecté, et SHUI est prévenu à chaque achat ou refus.
- **`price_alert`** : réveille SHUI quand un prix franchit un niveau, sans trader.
- **`market_regime`** : la météo du marché (RISK-ON, NEUTRAL ou RISK-OFF) à partir de :
  - la tendance journalière de SOL ;
  - la variation sur 7 jours de SOL et de BTC (CoinGecko) ;
  - l'indice Fear & Greed (alternative.me) ;
  - le volume des DEX Solana (DefiLlama).
- La méthode du mode trading intègre ces outils. Les workers ne peuvent pas créer ni arrêter de stratégie.

---

# Trading, lot 3 — 2026-10-07

Patch : `2026-10-07-trading-lot3.patch`, à appliquer après `2026-10-07-trading-lot2.patch`.

- **Indicateurs avancés** dans `technical_analysis` :
  - VWAP sur 24 bougies, pour savoir si les acheteurs ou les vendeurs dominent ;
  - Stoch RSI ;
  - ADX avec +DI et -DI, qui mesure la force de la tendance (marché sans tendance sous 20, tendance forte au-dessus de 25) ;
  - direction de l'OBV, pour repérer une hausse qui n'est pas suivie par le volume.
  
  L'ADX entre dans le calcul du biais.
- **`dca_create`** : achats réguliers (montant, intervalle, nombre d'achats), avec un prix maximal au-delà duquel l'achat est sauté. Le tout est exécuté par le code et s'annule avec `order_cancel`.
- **Paper trading** :
  - `paper_trade` ouvre une position simulée, avec stop et objectif liés (OCO), sans aucun mouvement de fonds ;
  - `strategy_create paper=true` crée une stratégie simulée (jusqu'à 5) ;
  - `paper_stats` donne les résultats simulés et recommande de passer en réel au-delà de 20 trades positifs.
- **`stake_sol` / `unstake_sol`** : SOL vers jitoSOL (environ 7 % par an) et retour. Le jitoSOL suit le prix du SOL : ce n'est pas une position en cash.
- **Rapport quotidien automatique** (après 20 h UTC, une fois par jour), envoyé dans le chat du créateur. Il est rédigé par le code à partir des données vérifiées (le modèle ne peut pas embellir) : valeur du wallet, PnL réalisé, trades, durée de vie, ordres, stratégies, paper trading, dernière leçon.

## Lot 4 : levier et positions courtes (Drift perpetuals)

Patch : `2026-10-07-trading-lot4.patch`, à appliquer après `2026-10-07-trading-lot3.patch`.

Le patch nécessite le SDK Drift sur le VPS : `pnpm add @drift-labs/sdk@2.156.0`. Sans le SDK, SHUI fonctionne normalement et les outils perp indiquent la commande d'installation.

- **Outils** :
  - `perp_deposit` : dépose de l'USDC comme collatéral sur Drift. Le premier dépôt crée le compte (environ 0,035 SOL de loyer, récupérable).
  - `perp_open` : ouvre un long ou un short sur SOL-PERP, BTC-PERP ou ETH-PERP. Le stop est obligatoire ; l'objectif est facultatif. L'option `dryRun` affiche le plan sans rien envoyer.
  - `perp_close` : ferme la position au marché et annule ses ordres. La fermeture est toujours autorisée.
  - `perp_withdraw` : retire l'USDC vers le wallet, uniquement le collatéral libre (jamais d'emprunt).
  - `perp_positions` : affiche le compte, les positions, le PnL et le prix de liquidation.
- **Garde-fous vérifiés par le code**, validés par le créateur :
  - levier maximum 5x ;
  - levier limité à 1x pour les 5 premiers trades ;
  - collatéral Drift limité à 50 % du capital total ;
  - stop obligatoire, posé sur Drift dans la même transaction que l'entrée (ordre reduce-only), donc actif même quand SHUI dort ;
  - prix de liquidation estimé à au moins 1,5 fois la distance du stop ;
  - perte au stop limitée à 2 % du capital, frais compris ;
  - une seule position par marché ;
  - le disjoncteur de drawdown bloque les nouvelles positions.
- **Comptabilité** :
  - la valeur du compte Drift (collatéral et PnL latent) est comptée dans la valeur du wallet. Un dépôt n'est donc pas vu comme une perte par le disjoncteur. Si cette valeur n'est pas fraîche, la valorisation est marquée incomplète, jamais à zéro ;
  - les dépôts et retraits sont journalisés (`perp_transfer`, gain 0) ;
  - le PnL réalisé (trades, frais, funding) est journalisé (`perp_pnl`) quand le compte n'a plus de position. Il compte dans `trade_stats` et dans la durée de vie hebdomadaire.
- **Moniteur toutes les 5 minutes** : il rafraîchit la valeur, enregistre le PnL, et envoie une alerte dans l'inbox si une position est à moins de 5 % de sa liquidation.
- **Workers** : ils ne peuvent pas utiliser les outils perp qui déplacent des fonds.

## Lot 5 : shorts en tendance baissière, règle des 2 pertes appliquée par le code, paper trading en attente

Patch : `2026-10-07-trading-lot5.patch`, à appliquer après `2026-10-07-trading-lot4.patch`.

- **`setup_scan` dans les deux sens** :
  - en tendance 4 h haussière, le scanner cherche des achats, comme avant ;
  - en tendance 4 h baissière, pour SOL, BTC (cbBTC) et ETH, il cherche un short sur Drift : un rebond qui s'essouffle (RSI 1 h entre 32 et 65, momentum qui se retourne), un stop au-dessus de la résistance, un objectif au prochain creux 4 h et un reward/risk d'au moins 2. Il donne la commande `perp_open` prête à l'emploi, à tester d'abord avec `dryRun` ;
  - cbBTC et ETH sont ajoutés à la liste surveillée.
- **Règle « 2 pertes » appliquée par le code** :
  - une perte ne compte que si elle dépasse 0,5 % du capital : les swaps de test ne comptent plus ;
  - après 2 vraies pertes dans la journée, les nouveaux achats et `perp_open` sont bloqués jusqu'à 00:00 UTC (raison `LOSS_STREAK_STOP`) ;
  - les ventes et les stops restent autorisés ;
  - les ordres automatiques attendent la fin du blocage au lieu d'échouer ;
  - `trade_stats` donne l'heure exacte de reprise.
- **En attente** : quand aucun setup réel n'est trouvé, SHUI garde une stratégie en paper trading active (après un backtest) ou simule le meilleur quasi-setup, au lieu de seulement dormir.

## Limite de débit GeckoTerminal (bougies)

Patch : `2026-10-07-market-data-rate-limit.patch`, à appliquer après `2026-10-07-trading-lot5.patch`.

L'API gratuite de GeckoTerminal accepte environ 30 requêtes par minute pour tout le processus. `setup_scan` en envoyait trop vite, si bien que 5 tokens sur 7 étaient ignorés (HTTP 429). Le patch apporte trois changements :

- les appels à GeckoTerminal sont espacés d'au moins 2,2 s ;
- après une réponse 429, la requête est relancée plus longtemps (5 s, puis 15 s, puis 30 s) ;
- les réponses sont mises en cache :
  - 3 minutes pour les bougies 1 h ;
  - 10 minutes pour les bougies 4 h ;
  - 30 minutes pour les bougies journalières ;
  - 5 minutes pour les pools DexScreener.

Le cache sert aussi à `technical_analysis`, aux backtests et au runner de stratégies. Un scan complet prend environ 40 s, sans erreur.
