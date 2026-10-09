#!/usr/bin/env bash
# One-time setup, run as root by SHUI's creator: lets SHUI publish services on
# the internet without root and without exposing the wallet.
#   sudo bash setup-services.sh [host-suffix]
# Default host suffix: <public-ip-with-dashes>.sslip.io (free, real HTTPS).
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "run with sudo" >&2; exit 1; }
HERE=$(cd "$(dirname "$0")" && pwd)

IP=$(ip -4 route get 1.1.1.1 | sed -n 's/.* src \([0-9.]*\).*/\1/p')
SUFFIX=${1:-${IP//./-}.sslip.io}
echo "== host suffix: $SUFFIX"

echo "== caddy"
command -v caddy >/dev/null || apt-get install -y caddy

echo "== user shui-svc (no home, no shell, not in group automaton)"
id shui-svc >/dev/null 2>&1 || useradd --system --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin shui-svc

echo "== /srv/shui/services (written by SHUI, read-only for services)"
mkdir -p /srv/shui/services
chown automaton:automaton /srv/shui /srv/shui/services
chmod 755 /srv/shui /srv/shui/services

echo "== configuration"
mkdir -p /etc/shui-agent /etc/caddy/shui-sites
printf 'HOST_SUFFIX=%s\n' "$SUFFIX" > /etc/shui-agent/services.conf
chmod 644 /etc/shui-agent/services.conf
if ! grep -q 'import /etc/caddy/shui-sites/\*.caddy' /etc/caddy/Caddyfile 2>/dev/null; then
  [[ -f /etc/caddy/Caddyfile ]] && cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.before-shui-$(date +%Y%m%d%H%M%S)"
  printf '# SHUI public services (managed by /usr/local/sbin/shui-service)\nimport /etc/caddy/shui-sites/*.caddy\n' > /etc/caddy/Caddyfile
fi

echo "== helper + sudoers (only this command, nothing else)"
install -o root -g root -m 755 "$HERE/shui-service" /usr/local/sbin/shui-service
printf 'automaton ALL=(root) NOPASSWD: /usr/local/sbin/shui-service\n' > /etc/sudoers.d/shui-service
chmod 440 /etc/sudoers.d/shui-service
visudo -cf /etc/sudoers.d/shui-service

echo "== firewall: open 80 and 443 (HTTPS + certificates)"
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null

systemctl enable --now caddy >/dev/null 2>&1
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || true
systemctl reload caddy || systemctl restart caddy

echo "== checks"
if [[ "$(systemctl show shui-agent.service -p NoNewPrivileges --value 2>/dev/null)" == "yes" ]]; then
  echo "WARNING: shui-agent.service has NoNewPrivileges=yes: sudo cannot work from SHUI. Remove it from the unit." >&2
fi
sudo -u automaton sudo -n /usr/local/sbin/shui-service list
ufw status | grep -E '^(22|80|443)' || true
echo "done: SHUI can now use service_deploy; services get https://<name>.$SUFFIX"
