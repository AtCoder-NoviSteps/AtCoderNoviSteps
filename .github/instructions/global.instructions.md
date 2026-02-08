# グローバル設定ガイド

## 概要

AtCoder-NoviStepsプロジェクト全体の統一設定とツールチェーン

## 必須設定ファイル

| ファイル               | 目的                   | 重要度 |
| ---------------------- | ---------------------- | ------ |
| `.editorconfig`        | エディタ統一           | 必須   |
| `.eslintrc.cjs`        | TypeScript/Svelte Lint | 必須   |
| `.prettierrc`          | コードフォーマット     | 必須   |
| `tsconfig.json`        | TypeScript設定         | 必須   |
| `svelte.config.js`     | Svelte/SvelteKit設定   | 必須   |
| `tailwind.config.js`   | CSS Framework          | 必須   |
| `playwright.config.ts` | E2Eテスト設定          | 必須   |
| `vitest.config.ts`     | 単体テスト設定         | 必須   |
| `prisma/schema.prisma` | DB スキーマ            | 必須   |

## TypeScript設定

現在の `tsconfig.json` 基準:

- `strict: true` 必須
- `moduleResolution: "bundler"`
- SvelteKit連携 (`.svelte-kit/tsconfig.json` 拡張)

## ESLint設定

```javascript
// .eslintrc.cjs 抜粋
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    extraFileExtensions: ['.svelte'],
  },
};
```

## Prettier設定

```json
{
  "useTabs": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

## Git設定

### Husky + lint-staged

```json
{
  "lint-staged": {
    "**/*.{js,jsx,ts,tsx}": ["pnpm format", "pnpm lint"]
  }
}
```

### .gitignore 重要項目

```
# AtCoder固有
/data/contests/
/data/problems/cache/

# 標準
node_modules/
.env
.svelte-kit/
build/
.vercel/
coverage/
```

## 環境変数管理

### 命名規則

- `PUBLIC_`: クライアント側で使用可能
- `DATABASE_URL`: Prisma接続文字列
- `ATCODER_API_*`: AtCoder API関連
- `LUCIA_SESSION_SECRET`: 認証シークレット

### .env.example

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/atcoder_novisteps"

# Authentication
LUCIA_SESSION_SECRET="your-session-secret-here"

# AtCoder API (if needed)
PUBLIC_ATCODER_API_BASE="https://kenkoooo.com/atcoder/atcoder-api"

# Analytics (optional)
PUBLIC_GA_MEASUREMENT_ID=""
```

## パッケージマネージャ

### pnpm設定

- バージョン: `10.15.0` 固定
- `packageManager` フィールドで強制
- `engines.node`: `>=18.16.0`

## IDE設定

### VSCode推奨拡張

```json
{
  "recommendations": [
    "svelte.svelte-vscode",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma"
  ]
}
```

## セキュリティ設定

### CODEOWNERS

```
# Global
* @KATO-Hiro

# Database migrations
/prisma/migrations/ @KATO-Hiro @database-reviewers

# CI/CD
/.github/ @KATO-Hiro @devops-team
```

### dependabot.yml

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 5
```
