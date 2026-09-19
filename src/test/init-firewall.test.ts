import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

// Behavior is checked by the script's startup self-check; a missing timeout only shows when DNS stalls.
const commandLines = readFileSync('.devcontainer/init-firewall.sh', 'utf8')
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('#'));

const findCalls = (command: string) =>
  commandLines.filter((line) => new RegExp(`\\b${command}\\s`).test(line));

describe('init-firewall.sh', () => {
  test('bounds every curl call with a total time limit', () => {
    expect(findCalls('curl').length).toBeGreaterThan(0);
    expect(findCalls('curl').filter((line) => !line.includes('--max-time'))).toEqual([]);
  });

  test('bounds every dig call with a timeout and a retry limit', () => {
    expect(findCalls('dig').length).toBeGreaterThan(0);
    expect(findCalls('dig').filter((line) => !/\+time=\d+ \+tries=\d+/.test(line))).toEqual([]);
  });
});
