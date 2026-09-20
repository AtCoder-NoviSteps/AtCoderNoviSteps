import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

// Behavior is checked by the script's startup self-check; a missing timeout only shows when DNS stalls.
const commandLines = readFileSync('.devcontainer/init-firewall.sh', 'utf8')
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('#'));

const findCalls = (command: string) =>
  commandLines.filter((line) => new RegExp(`\\b${command}\\s`).test(line));

// VS Code downloads each VSIX from its publisher's own CDN host, so the allowlist has to track this list.
const configuredPublishers = () => {
  const devcontainer = readFileSync('.devcontainer/devcontainer.json', 'utf8');
  const extensions = devcontainer.match(/"extensions":\s*\[([^\]]*)\]/)?.[1] ?? '';

  return [...extensions.matchAll(/"([^".]+)\.[^"]+"/g)].map((match) => match[1].toLowerCase());
};

describe('init-firewall.sh', () => {
  test('allows only the Compose database port on the Docker network', () => {
    const script = commandLines.join('\n');

    expect(script).toContain('getent ahostsv4 db');
    expect(script).toMatch(/iptables -A NOVISTEPS_OUTPUT -p tcp -d .* --dport 5432 -j ACCEPT/);
    expect(script).not.toContain('host_network');
    expect(script).toContain('iptables -A NOVISTEPS_INPUT -p tcp --dport 5173 -j ACCEPT');
    expect(script).toContain('iptables -A NOVISTEPS_INPUT -p tcp --dport 5555 -j ACCEPT');
  });

  test('allows the hosts that serve the VS Code server and extension packages', () => {
    const script = commandLines.join('\n');
    const publishers = configuredPublishers();

    const allowedPublishers = script.match(/vscode_extension_publishers=\(([^)]*)\)/)?.[1] ?? '';

    expect(publishers.length).toBeGreaterThan(0);
    expect(script).toContain('vscode.download.prss.microsoft.com');
    expect(script).toContain('.gallerycdn.vsassets.io');
    expect(
      publishers.filter((publisher) => !allowedPublishers.split(/\s+/).includes(publisher)),
    ).toEqual([]);
  });

  test('sets IPv6 output policy before rebuilding its chain on every run', () => {
    const script = commandLines.join('\n');

    expect(script).not.toMatch(/if ! iptables -C OUTPUT -j NOVISTEPS_OUTPUT/);
    expect(script).toContain('ip6tables -C OUTPUT -j NOVISTEPS_IPV6');
    expect(script.indexOf('ip6tables -P OUTPUT DROP')).toBeLessThan(
      script.indexOf('ip6tables -N NOVISTEPS_IPV6'),
    );
  });

  test('bounds every curl call with a total time limit', () => {
    expect(findCalls('curl').length).toBeGreaterThan(0);
    expect(findCalls('curl').filter((line) => !line.includes('--max-time'))).toEqual([]);
  });

  test('bounds every dig call with a timeout and a retry limit', () => {
    expect(findCalls('dig').length).toBeGreaterThan(0);
    expect(findCalls('dig').filter((line) => !/\+time=\d+ \+tries=\d+/.test(line))).toEqual([]);
  });
});
