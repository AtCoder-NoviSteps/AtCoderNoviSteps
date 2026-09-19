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

temporary_set="allowed-domains-$$"
swapped=0

cleanup() {
  local status="$1"

  if [[ "${swapped}" -eq 1 && "${status}" -ne 0 ]]; then
    if ! ipset swap "${temporary_set}" allowed-domains; then
      echo 'Failed to restore the previous allowed domains' >&2
    fi
  fi

  if [[ -n "${temporary_set}" ]]; then
    ipset destroy "${temporary_set}" 2>/dev/null || true
  fi
}
trap 'cleanup "$?"' EXIT

# Keep the active set and rules intact until every destination is available.
ipset create "${temporary_set}" hash:net

# GitHub publishes its IPv4 ranges for web, API and git (SSH); merge adjacent ranges before adding.
github_ranges="$(curl -fsS --connect-timeout 5 --max-time 30 https://api.github.com/meta \
  | jq -er '(.web + .api + .git)[] | select(contains(":") | not)' \
  | aggregate -q)"

if [[ -z "${github_ranges}" ]]; then
  echo 'GitHub metadata contains no IPv4 ranges' >&2
  exit 1
fi

while IFS= read -r range; do
  ipset add -exist "${temporary_set}" "${range}"
done <<<"${github_ranges}"

# Other destinations: resolve each domain once at startup and add its IPv4 addresses.
for domain in "${allowed_domains[@]}"; do
  if ! ips="$(dig +short +time=2 +tries=1 A "${domain}" | grep -E '^[0-9.]+$')"; then
    echo "Failed to resolve ${domain}" >&2
    exit 1
  fi

  while IFS= read -r address; do
    ipset add -exist "${temporary_set}" "${address}"
  done <<<"${ips}"
done

if ipset list -n | grep -Fxq allowed-domains; then
  ipset swap "${temporary_set}" allowed-domains
  swapped=1
else
  ipset rename "${temporary_set}" allowed-domains
  temporary_set=''
fi

# An existing installation only needs an ipset swap; the rules remain in place.
# Known gap: an interruption after the IPv4 OUTPUT jump but before the IPv6 jump leaves IPv6 open on reruns.
# Accepted as unlikely: those steps are plain -I/-P after ip6tables already succeeded, and a container restart presumably gets a fresh netns (unverified).
if ! iptables -C OUTPUT -j NOVISTEPS_OUTPUT 2>/dev/null; then
  host_network="$(ip route | awk '/^default/ {print $3}' | sed 's/\.[0-9]*$/.0\/24/')"

  # Flush chains left by an interrupted installation so the next start can finish it.
  iptables -N NOVISTEPS_INPUT 2>/dev/null || iptables -F NOVISTEPS_INPUT
  iptables -N NOVISTEPS_OUTPUT 2>/dev/null || iptables -F NOVISTEPS_OUTPUT
  iptables -N NOVISTEPS_FORWARD 2>/dev/null || iptables -F NOVISTEPS_FORWARD
  iptables -A NOVISTEPS_INPUT -i lo -j ACCEPT
  iptables -A NOVISTEPS_INPUT -s "${host_network}" -j ACCEPT
  iptables -A NOVISTEPS_INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
  iptables -A NOVISTEPS_INPUT -j DROP
  iptables -A NOVISTEPS_OUTPUT -o lo -j ACCEPT
  # Only Docker's embedded DNS; port 53 to any other IP would bypass the allowlist.
  iptables -A NOVISTEPS_OUTPUT -p udp -d 127.0.0.11/32 --dport 53 -j ACCEPT
  iptables -A NOVISTEPS_OUTPUT -p tcp -d 127.0.0.11/32 --dport 53 -j ACCEPT
  iptables -A NOVISTEPS_OUTPUT -d "${host_network}" -j ACCEPT
  iptables -A NOVISTEPS_OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
  iptables -A NOVISTEPS_OUTPUT -m set --match-set allowed-domains dst -j ACCEPT
  # Reject blocked requests immediately instead of waiting for a timeout.
  iptables -A NOVISTEPS_OUTPUT -j REJECT --reject-with icmp-admin-prohibited
  iptables -A NOVISTEPS_FORWARD -j DROP

  ip6tables -N NOVISTEPS_IPV6 2>/dev/null || ip6tables -F NOVISTEPS_IPV6
  ip6tables -A NOVISTEPS_IPV6 -o lo -j ACCEPT
  ip6tables -A NOVISTEPS_IPV6 -j REJECT --reject-with icmp6-adm-prohibited

  iptables -I INPUT 1 -j NOVISTEPS_INPUT
  iptables -I OUTPUT 1 -j NOVISTEPS_OUTPUT
  iptables -I FORWARD 1 -j NOVISTEPS_FORWARD
  ip6tables -I OUTPUT 1 -j NOVISTEPS_IPV6
  iptables -P INPUT DROP
  iptables -P FORWARD DROP
  iptables -P OUTPUT DROP
  ip6tables -P OUTPUT DROP
fi

# An HTTP error status still proves the connection was allowed, so omit -f.
# Keep the body to one command: set -e is disabled inside functions called from conditionals.
probe() {
  curl -sS -o /dev/null --connect-timeout 5 --max-time 8 "https://$1"
}

# Verify both directions; a check that only tests blocking passes even when everything is blocked.
check_failed=0

for destination in api.github.com registry.npmjs.org api.anthropic.com; do
  if probe "${destination}"; then
    echo "Firewall check OK: ${destination} is reachable"
  else
    echo "Firewall check failed: ${destination} is unreachable" >&2
    check_failed=1
  fi
done

# Only curl's exit 7 (couldn't connect) proves the REJECT rule; DNS, TLS or timeout failures do not.
blocked_status=0
probe example.com 2>/dev/null || blocked_status=$?

if [[ "${blocked_status}" -eq 7 ]]; then
  echo 'Firewall check OK: example.com is blocked'
else
  echo "Firewall check failed: example.com was not rejected (exit ${blocked_status})" >&2
  check_failed=1
fi

if [[ "${check_failed}" -ne 0 ]]; then
  exit 1
fi

echo 'Firewall configured'
