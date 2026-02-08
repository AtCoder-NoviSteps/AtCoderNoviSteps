# CI/CD設定ガイド

## 現在の設定ファイル

- メインワークフロー: `.github/workflows/ci.yml`
- E2Eテスト: `.github/workflows/playwright.yml`
- パッケージ設定: `package.json`
- TypeScript設定: `tsconfig.json`

## 推奨改善点

### package.jsonのscripts

現在の`package.json`を確認して、以下のスクリプトが適切に設定されているか確認：

```json
{
  "scripts": {
    "build": "vite build",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "test:unit": "vitest",
    "test:integration": "playwright test"
  }
}
```

### CIワークフローの最適化

`.github/workflows/ci.yml`で以下の点を確認：

- pnpmバージョンが`package.json`の`packageManager`と一致
- Node.jsバージョンが`engines.node`と整合
- キャッシュキーが適切に設定されている
