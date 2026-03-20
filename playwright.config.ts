import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  webServer: {
    command: 'pnpm build && pnpm preview',
    port: 4173,
    timeout: 10000 * 1000,
  },
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4173',
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
