# rename tests/ → e2e/

最新の SvelteKit プロジェクト構成に合わせ、E2E テストディレクトリ・ファイル命名を統一する。

- `tests/` → `e2e/`
- E2E テストファイル: `.test.ts` → `.spec.ts`、ハイフン → アンダースコア
- スクリプト: `test:integration` → `test:e2e`

関連 Issue: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3288

---

## Phase 1: ドキュメント・ルール更新（ランタイム影響なし）

- [ ] `.claude/rules/testing.md`
  - `paths: 'tests/**'` → `'e2e/**'`
  - テーブル: `tests/` → `e2e/`、`pnpm test:integration` → `pnpm test:e2e`
- [ ] `AGENTS.md`
  - `pnpm test:integration` → `pnpm test:e2e`
  - `tests/ # E2E tests (Playwright)` → `e2e/ # E2E tests (Playwright)`
  - `tests/global-setup.ts` の記述を削除（ファイル削除済み）
- [ ] `docs/guides/architecture.md`
  - `E2E テスト（\`tests/\`）`→`E2E テスト（\`e2e/\`）`
- [ ] `docs/guides/claude-code.md`
  - `paths: 'tests/**'` → `'e2e/**'`
  - テーブル: `` `*.test.ts`, `tests/**` のテストパターン `` → `` `*.test.ts`, `e2e/**` のテストパターン ``
- [ ] `.claude/skills/session-close/instructions.md`
  - `pnpm test:integration` → `pnpm test:e2e`
- [ ] `.github/workflows/ci.yml`
  - コメント内 `pnpm test:integration` → `pnpm test:e2e`

## Phase 2: ファイルリネーム

`tests/` ディレクトリ以下を `e2e/` に移動し、同時にファイル名を変更する。

| 変更前                         | 変更後                       |
| ------------------------------ | ---------------------------- |
| `tests/about_page.test.ts`     | `e2e/about_page.spec.ts`     |
| `tests/custom-colors.spec.ts`  | `e2e/custom_colors.spec.ts`  |
| `tests/dark-mode.spec.ts`      | `e2e/dark_mode.spec.ts`      |
| `tests/navbar.spec.ts`         | `e2e/navbar.spec.ts`         |
| `tests/robots.test.ts`         | `e2e/robots.spec.ts`         |
| `tests/signin.test.ts`         | `e2e/signin.spec.ts`         |
| `tests/sitemap.test.ts`        | `e2e/sitemap.spec.ts`        |
| `tests/toppage.test.ts`        | `e2e/toppage.spec.ts`        |
| `tests/workbook_order.test.ts` | `e2e/workbook_order.spec.ts` |
| `tests/workbooks_list.test.ts` | `e2e/workbooks_list.spec.ts` |
| `tests/helpers/auth.ts`        | `e2e/helpers/auth.ts`        |

- [ ] 上記ファイルを移動・リネーム
- [ ] `tests/` ディレクトリが空になったことを確認

## Phase 4: 設定ファイル更新

- [ ] `playwright.config.ts`
  - `testDir: 'tests'` → `testDir: 'e2e'`
  - `testMatch: /(.+\.)?(test|spec)\.[jt]s/` → `testMatch: /(.+\.)?spec\.[jt]s/`
  - コメントアウトされた `global.setup.ts` / `global.teardown.ts` ブロックを削除
- [ ] `package.json`
  - `"test:integration": "playwright test"` → `"test:e2e": "playwright test"`
  - `"test": "npm run test:integration && ..."` → `"test": "npm run test:e2e && ..."`

## Phase 5: 検証

- [ ] `pnpm check` — 型エラーなし
- [ ] `pnpm lint` — lint エラーなし
- [ ] `pnpm test:e2e` — Playwright がテストを検出・実行できること
