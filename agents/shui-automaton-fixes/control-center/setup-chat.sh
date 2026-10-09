#!/usr/bin/env bash
# One-time setup of the creator chat (run with sudo, once).
# - creates a random token, readable only by root (SHUI reads it through systemd)
#   and by the Control Center user (~/.shui-chat-token, mode 600);
# - SHUI listens on 127.0.0.1:3334 only; published services (user shui-svc)
#   cannot read either copy of the token.
# The token is never printed.
set -euo pipefail
CC_USER="${1:-ubuntu}"
ENV_FILE=/etc/shui-agent/chat.env
DROPIN=/etc/systemd/system/shui-agent.service.d/chat.conf
[ "$(id -u)" -eq 0 ] || { echo "run with sudo"; exit 1; }
id "$CC_USER" >/dev/null 2>&1 || { echo "unknown user $CC_USER"; exit 1; }

mkdir -p /etc/shui-agent "$(dirname "$DROPIN")"
if [ ! -s "$ENV_FILE" ]; then
  umask 077
  printf 'SHUI_CHAT_TOKEN=%s\nSHUI_CHAT_PORT=3334\n' "$(openssl rand -hex 32)" > "$ENV_FILE"
fi
chown root:root "$ENV_FILE"; chmod 600 "$ENV_FILE"

printf '[Service]\nEnvironmentFile=%s\n' "$ENV_FILE" > "$DROPIN"
chmod 644 "$DROPIN"

CC_HOME="$(getent passwd "$CC_USER" | cut -d: -f6)"
install -m 600 -o "$CC_USER" -g "$CC_USER" /dev/null "$CC_HOME/.shui-chat-token"
sed -n 's/^SHUI_CHAT_TOKEN=//p' "$ENV_FILE" > "$CC_HOME/.shui-chat-token"

systemctl daemon-reload
echo "ok: token in $ENV_FILE (root) and $CC_HOME/.shui-chat-token ($CC_USER). Restart SHUI to open the chat endpoint."
