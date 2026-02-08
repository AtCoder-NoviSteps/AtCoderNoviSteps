# テスト戦略ガイド

## 概要

AtCoder-NoviStepsプロジェクトの包括的テスト戦略とベストプラクティス

## テスト構成

| テスト種別 | ツール      | 目的                 | 実行頻度         |
| ---------- | ----------- | -------------------- | ---------------- |
| 単体テスト | Vitest      | 関数・コンポーネント | 常時 (commit/PR) |
| 統合テスト | Vitest + DB | サービス層・DB連携   | PR               |
| E2Eテスト  | Playwright  | ユーザーシナリオ     | main ブランチ    |
| HTTPモック | Nock        | 外部API安定化        | 全層             |

## ディレクトリ構成

```
tests/
├─ unit/                     # 単体テスト
│  ├─ utils/                 # ユーティリティ関数
│  ├─ components/            # Svelteコンポーネント
│  ├─ services/              # ビジネスロジック
│  └─ repositories/          # データアクセス層
├─ integration/              # 統合テスト
│  ├─ api/                   # APIエンドポイント
│  ├─ auth/                  # 認証フロー
│  └─ atcoder/               # AtCoder連携
├─ e2e/                      # E2Eテスト
│  ├─ problem/               # 問題関連シナリオ
│  ├─ contest/               # コンテスト関連
│  ├─ user/                  # ユーザー機能
│  └─ auth/                  # 認証フロー
├─ fixtures/                 # テストデータ
│  ├─ problems.json          # 問題サンプルデータ
│  ├─ contests.json          # コンテストデータ
│  └─ users.json             # ユーザーデータ
├─ mocks/
│  ├─ atcoder-api.ts         # AtCoder API モック
│  └─ database.ts            # DB モック
└─ utils/
    ├─ setup.ts              # テスト環境セットアップ
    ├─ factories.ts          # テストデータファクトリ (@quramy/prisma-fabbrica)
    └─ helpers.ts            # テストヘルパー関数
```

## 単体テスト（Vitest）

> **バージョン情報**: Vitest v4.0.7 以上使用
>
> **重要**: v3 → v4 への移行時は、coverage 設定に注意。詳細は `docs/dev-notes/2025-11-05/bump-vitest-from-v3.x-to-v4.x/plan.md` を参照

### 設定例

```typescript
// vite.config.ts
/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      // v4.0.7 以上: 明示的に include を指定（未読込ファイルは集計対象外）
      // ⚠️ v3 の coverage.all, coverage.extensions は v4 で削除
      include: ['src/**/*.{ts,tsx,svelte}'],
      exclude: ['node_modules/**', '.svelte-kit/**', 'build/**', 'dist/**'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

### Svelteコンポーネントテスト

```typescript
// tests/unit/components/ProblemCard.test.ts
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import ProblemCard from '$lib/components/problem/ProblemCard.svelte';

test('displays problem information correctly', () => {
  const problem = {
    id: 'abc001_a',
    title: 'はじめてのあっとこーだー',
    difficulty: 100,
    contestId: 'abc001',
  };

  render(ProblemCard, { props: { problem } });

  expect(screen.getByText('はじめてのあっとこーだー')).toBeInTheDocument();
  expect(screen.getByText('100')).toBeInTheDocument();
});
```

### サービス層テスト

> **Vitest v4 注意**: `vi.restoreAllMocks()` は spy のみ復元します。モック全体をリセットする場合は、`vi.clearAllMocks()` / `vi.resetAllMocks()` / `.mockReset()` を明示的に使用してください。

```typescript
// tests/unit/services/ProblemService.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProblemService } from '$lib/server/services/ProblemService';

describe('ProblemService', () => {
  afterEach(() => {
    // v4 以上: 明示的にモックをリセット
    vi.clearAllMocks();
  });

  it('should fetch problems by difficulty', async () => {
    const mockRepo = {
      findByDifficulty: vi.fn().mockResolvedValue([{ id: 'abc001_a', difficulty: 100 }]),
    };

    const service = new ProblemService(mockRepo);
    const result = await service.getProblemsByDifficulty(0, 200);

    expect(result).toHaveLength(1);
    expect(mockRepo.findByDifficulty).toHaveBeenCalledWith(0, 200);
  });
});
```

## 統合テスト

### データベーステスト

```typescript
// tests/integration/repositories/ProblemRepository.test.ts
import { describe, it, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ProblemRepository } from '$lib/server/repositories/ProblemRepository';

describe('ProblemRepository Integration', () => {
  let prisma: PrismaClient;
  let repository: ProblemRepository;

  beforeEach(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: 'postgresql://test:test@localhost:5433/test' } },
    });
    await prisma.$connect();
    repository = new ProblemRepository(prisma);
  });

  afterEach(async () => {
    await prisma.problem.deleteMany();
    await prisma.$disconnect();
  });

  it('should create and find problem', async () => {
    const problem = await repository.create({
      id: 'abc001_a',
      title: 'Test Problem',
      difficulty: 100,
    });

    const found = await repository.findById('abc001_a');
    expect(found?.title).toBe('Test Problem');
  });
});
```

## E2Eテスト（Playwright）

### 設定例

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview',
    port: 4173,
  },
});
```

### シナリオテスト例

```typescript
// tests/e2e/problem/problem-search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Problem Search', () => {
  test('should filter problems by difficulty', async ({ page }) => {
    await page.goto('/problems');

    // 難易度フィルター設定
    await page.fill('[data-testid="difficulty-min"]', '100');
    await page.fill('[data-testid="difficulty-max"]', '300');
    await page.click('[data-testid="filter-submit"]');

    // 結果確認
    await expect(page.locator('[data-testid="problem-card"]')).toHaveCount(5);

    // 各問題の難易度が範囲内か確認
    const difficulties = await page.locator('[data-testid="problem-difficulty"]').allTextContents();
    for (const diff of difficulties) {
      const value = parseInt(diff);
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(300);
    }
  });

  test('should navigate to problem detail', async ({ page }) => {
    await page.goto('/problems');

    await page.click('[data-testid="problem-card"]:first-child');
    await expect(page).toHaveURL(/\/problems\/[a-z0-9_]+/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## モック・フィクスチャ

### AtCoder API モック

```typescript
// tests/mocks/atcoder-api.ts
import nock from 'nock';

export function mockAtCoderApi() {
  nock('https://kenkoooo.com')
    .get('/atcoder/atcoder-api/v3/problems')
    .reply(200, [
      {
        id: 'abc001_a',
        title: 'はじめてのあっとこーだー',
        contest_id: 'abc001',
      },
    ]);
}

// テストでの使用
beforeEach(() => {
  mockAtCoderApi();
});

afterEach(() => {
  nock.cleanAll();
});
```

### データファクトリ

```typescript
// tests/utils/factories.ts
import { defineFactory } from '@quramy/prisma-fabbrica';
import { faker } from '@faker-js/faker';

export const ProblemFactory = defineFactory({
  defaultData: () => ({
    id: faker.string.alphanumeric(10),
    title: faker.lorem.words(3),
    difficulty: faker.number.int({ min: 100, max: 3000 }),
    contestId: faker.string.alphanumeric(6),
  }),
});

// 使用例
const problems = await ProblemFactory.createList(5);
```

## カバレッジ目標

> **Vitest v4.0.7 以上**: coverage 設定で `include` / `exclude` を明示指定してください。v3 の `coverage.all` / `coverage.extensions` は削除されました。
>
> **ローカル開発**: `pnpm coverage` でエラーが出た場合は、`vite.config.ts` の coverage 設定を確認してください。

### 目標値

- **Lines**: 80%
- **Branches**: 70%
- **Functions**: 80%
- **Statements**: 80%

### 重点テスト領域

1. **AtCoder API連携**: 外部依存の安定化
2. **認証フロー**: セキュリティ重要機能
3. **データ変換**: 問題データの正規化ロジック
4. **検索・フィルタ**: コア機能

## CI/CD統合

### GitHub Actionsでの実行

```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: pnpm test:unit --coverage

- name: Run integration tests
  run: pnpm test:integration
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## パフォーマンステスト

### ロードテスト例

```typescript
// tests/performance/problem-api.spec.ts
import { test } from '@playwright/test';

test('API should handle concurrent requests', async ({ page }) => {
  const promises = Array.from({ length: 10 }, () =>
    page.request.get('/api/problems?difficulty=100'),
  );

  const responses = await Promise.all(promises);

  for (const response of responses) {
    expect(response.status()).toBe(200);
  }
});
```

## デバッグ・トラブルシューティング

### 一般的な問題

1. **Svelteコンポーネントレンダリング失敗**: jsdom環境設定確認
2. **DB接続エラー**: テスト用DB起動確認
3. **APIタイムアウト**: Nockモック設定確認
4. **Playwright起動失敗**: ブラウザインストール確認

### デバッグコマンド

```bash
# UIモードでVitest実行
pnpm vitest --ui

# PlaywrightのUIモード
pnpm playwright test --ui

# カバレッジ詳細表示
pnpm vitest --coverage --reporter=verbose
```
