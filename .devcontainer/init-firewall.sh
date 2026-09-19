#!/bin/bash
# Egress allowlist, adapted from https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh
set -euo pipefail

# Destinations the container may reach; each one is also an exfiltration path, so keep it minimal.
allowed_domains=(
  # npm and Prisma engines
  registry.npmjs.org
  binaries.prisma.sh
  # Claude Code
  api.anthropic.com
  claude.ai
  platform.claude.com
  # Codex (ChatGPT sign-in)
  chatgpt.com
  auth.openai.com
  # VS Code
  marketplace.visualstudio.com
  vscode.blob.core.windows.net
  update.code.visualstudio.com
  # External APIs the app calls (src/lib/constants/urls.ts)
  kenkoooo.com
  judgeapi.u-aizu.ac.jp
  # CodeRabbit CLI
  cli.coderabbit.ai
  app.coderabbit.ai
  ide.coderabbit.ai
)

# 1. Reset rules from a previous run, but keep Docker's embedded DNS, which lives in the NAT table.
docker_dns_rules="$(iptables-save -t nat | grep '127\.0\.0\.11' || true)"
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
ipset destroy allowed-domains 2>/dev/null || true

if [[ -n "${docker_dns_rules}" ]]; then
  iptables -t nat -N DOCKER_OUTPUT 2>/dev/null || true
  iptables -t nat -N DOCKER_POSTROUTING 2>/dev/null || true
  echo "${docker_dns_rules}" | xargs -L 1 iptables -t nat
fi

# 2. Build the set of allowed IPs, since iptables matches IPs rather than domain names.
ipset create allowed-domains hash:net

# GitHub publishes its IPv4 ranges for web, API and git (SSH); merge adjacent ranges before adding.
curl -fsS https://api.github.com/meta \
  | jq -r '(.web + .api + .git)[] | select(contains(":") | not)' \
  | aggregate -q \
  | xargs -L 1 ipset add allowed-domains

# Other destinations: resolve each domain once at startup and add its IPv4 addresses.
for domain in "${allowed_domains[@]}"; do
  if ! ips="$(dig +short A "${domain}" | grep -E '^[0-9.]+$')"; then
    echo "Failed to resolve ${domain}" >&2
    exit 1
  fi

  xargs -L 1 ipset add -exist allowed-domains <<<"${ips}"
done

# 3. Allow local traffic: loopback, DNS, and the compose network that holds `db` and the host gateway.
host_network="$(ip route | awk '/^default/ {print $3}' | sed 's/\.[0-9]*$/.0\/24/')"

iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT -s "${host_network}" -j ACCEPT
iptables -A OUTPUT -d "${host_network}" -j ACCEPT

# 4. Allow replies and the allowed set, then reject everything else.
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT
# REJECT rather than DROP so a blocked request fails immediately instead of timing out.
iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# 5. The allowed set is IPv4 only, so close IPv6 except loopback.
ip6tables -F
ip6tables -A OUTPUT -o lo -j ACCEPT
ip6tables -P OUTPUT DROP

# 6. Verify that an unlisted destination is blocked.
if curl -fsS --connect-timeout 5 https://example.com >/dev/null 2>&1; then
  echo 'Firewall check failed: example.com is reachable' >&2
  exit 1
fi

echo 'Firewall configured'
