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
