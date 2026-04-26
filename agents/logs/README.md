# SHUI Agents — Logs et Audit Trail

## Structure des logs

- Upstash KV : logs temps-reel (cle: agent:logs:{agent_id}:{date})
- GitHub Issues : rapports persistants (label: agent-log)
- PR comments : actions liees a une PR specifique

## Format d'un log

```json
{
  "id": "log_{timestamp}_{random}",
  "agent": "security | dev | seo | community",
  "action": "AUDIT_COMPLETED | PR_CREATED | ISSUE_OPENED",
  "timestamp": "2026-04-25T10:30:00Z",
  "branch": "agent/security-initial-audit",
  "pr_url": "https://github.com/shui-official/shui-community/pull/N",
  "severity": "info | low | medium | high | critical",
  "description": "Description courte",
  "requires_human_approval": true,
  "human_approved": false,
  "rollback_sha": "commit_sha_before_change"
}
```

## Types d'actions

| Action | Description |
|---|---|
| BRANCH_CREATED | Nouvelle branche agent/* |
| PR_CREATED | Pull Request ouverte |
| ISSUE_OPENED | Issue GitHub ouverte |
| AUDIT_COMPLETED | Audit termine |
| ABUSE_DETECTED | Pattern d'abus detecte |
| QUEST_PROPOSED | Nouvelle quete proposee |
| SECURITY_REPORT | Rapport securite genere |

## Rollback

Chaque action qui modifie le code est loggee avec le SHA precedent.
```bash
git revert {commit_sha}
# Apres validation humaine uniquement
```
