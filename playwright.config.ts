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
  testDir: 'tests',
  projects: [
    //{
    //  name: 'setup db',
    //  testMatch: /global\.setup\.ts/,
    //  teardown:'cleanup db',
    //},
    //{
    //   name: 'cleanup db',
    //   testMatch: /global\.teardown\.ts/,
    //},
    {
      name: 'all',
      testMatch: /(.+\.)?(test|spec)\.[jt]s/,
      //dependencies: ['setup db'],
    },
  ],
};

export default config;
