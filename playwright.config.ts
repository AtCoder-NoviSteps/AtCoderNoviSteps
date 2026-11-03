import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  webServer: {
    command: 'pnpm build && pnpm preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4173',
    // Recording every test cost about 25% of the run; rerun failures with `--last-failed --trace on`.
    trace: 'off',
  },
  testDir: 'e2e',
  projects: [
    {
      name: 'all',
      testMatch: /(.+\.)?spec\.[jt]s/,
    },
  ],
};

export default config;
