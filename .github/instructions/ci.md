# CI / 自動化ガイド

## 概要

AtCoder-NoviStepsプロジェクトのCI/CDパイプライン設定とベストプラクティス

## 技術スタック

- GitHub Actions
- Playwright (E2E)
- Vitest (Unit/Integration)
- pnpm
- Vercel (デプロイ)

## ワークフロー構成

### 推奨ワークフロー

| ファイル         | トリガ                         | 内容                                          |
| ---------------- | ------------------------------ | --------------------------------------------- |
| `ci.yml`         | PR / push                      | lint, typecheck, unit/integration test, build |
| `e2e.yml`        | `workflow_run: ci.yml success` | Playwright E2E                                |
| `deploy.yml`     | main ブランチ push             | Vercel デプロイ                               |
| `codeql.yml`     | スケジュール/PR                | セキュリティ静的解析                          |
| `dependabot.yml` | スケジュール                   | 依存更新                                      |

### CI パイプライン詳細

```yaml
# .github/workflows/ci.yml の例
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: '>=18.16.0'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm check # svelte-check
      - run: pnpm lint
      - run: pnpm test:unit --coverage
      - run: pnpm build
```

### E2E テスト

```yaml
# .github/workflows/e2e.yml の例
name: E2E Tests
on:
  workflow_run:
    workflows: ['CI']
    types: [completed]

jobs:
  e2e:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10.15.0
      - run: pnpm install
      - run: pnpm build
      - run: pnpm playwright install --with-deps
      - run: pnpm test:integration
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
```

## キャッシュ戦略

- pnpm キャッシュキー: `pnpm-lock.yaml` ハッシュ
- Playwright ブラウザキャッシュ
- Prisma生成ファイルキャッシュ

## パフォーマンス最適化

- 並列実行: lint/typecheck/test を並列化
- matrix戦略: Node.js複数バージョン対応
- 条件付き実行: 変更ファイルベースの最適化

## 環境変数・シークレット

- DATABASE_URL
- SESSION_SECRET
- VERCEL_TOKEN (デプロイ用)
- GitHub Actions Secrets で管理

## カバレッジ

- 目標: Lines 80%, Branches 70%
- Vitest coverage-v8 使用
- アーティファクトでレポート保存
