# ESLint → oxlint / Prettier → oxfmt 移行互換性調査

## 概要

ファイル数が300程度となり、lint/fmt 実行のたびに待ち時間が発生している。
oxlint（50–100x 高速）と oxfmt（30x 高速）への移行で DX を改善することを検討。
ただし Svelte + Tailwind のプラグイン依存があるため、完全互換性を事前に確認した。

関連 issue: [#2226](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2226)

---

## 現在の構成

### ESLint (`eslint.config.mjs`)

| 依存                                            | 用途                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@eslint/js`                                    | JS 推奨ルール                                                                                                       |
| `@typescript-eslint/eslint-plugin`              | TS ルール（ban-ts-comment, no-unused-vars, no-explicit-any）                                                        |
| `@typescript-eslint/parser`                     | TS パーサー                                                                                                         |
| `eslint-plugin-svelte` + `svelte-eslint-parser` | Svelte 固有ルール（require-each-key, no-useless-mustaches, prefer-writable-derived, valid-prop-names-in-kit-pages） |
| `globals`                                       | ブラウザ/Node グローバル + Svelte 5 runes グローバル定義                                                            |

### Prettier (`.prettierrc` + `prettier.config.js`)

| 依存                          | 用途                             |
| ----------------------------- | -------------------------------- |
| `prettier-plugin-svelte`      | `.svelte` ファイルのフォーマット |
| `prettier-plugin-tailwindcss` | Tailwind クラスのソート          |

### Pre-commit (Lefthook)

```yaml
- name: format
  run: pnpm exec prettier --write {staged_files}
  glob: '**/*.{js,jsx,ts,tsx,md,svelte}'

- name: eslint
  run: pnpm exec eslint {staged_files}
  glob: '**/*.{js,jsx,ts,tsx,svelte}'
```

---

## oxlint 互換性調査

### ルール対応状況

| ルール / プラグイン                  | 対応          | 備考                                                                      |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------- |
| JS 推奨ルール（`@eslint/js`）        | ✅            | 699ルール中108がデフォルト有効                                            |
| `@typescript-eslint/no-unused-vars`  | ✅            |                                                                           |
| `@typescript-eslint/no-explicit-any` | ✅            |                                                                           |
| `@typescript-eslint/ban-ts-comment`  | ✅            | `allow-with-description` オプションの挙動は実装時に要検証                 |
| `eslint-plugin-svelte`               | ❌ **未対応** | Svelte プラグイン自体が存在しない                                         |
| `.svelte` ファイルの lint            | ⚠️ 部分的     | `<script>` ブロックのみ可。Svelte 固有ルール（require-each-key 等）は全滅 |
| Svelte 5 runes グローバル            | ⚠️ 要設定     | `$state` 等を `oxlint.json` の globals に手動追加が必要                   |
| ESLint フラット設定形式              | ❌ 非互換     | oxlint 独自の `oxlint.json` 形式を使用                                    |

### 結論

**完全移行は不可。**
`eslint-plugin-svelte` が未対応のため `.svelte` ファイルは引き続き ESLint が必要。

**ハイブリッド移行（JS/TS は oxlint、Svelte は ESLint 継続）は今すぐ可能。**

---

## oxfmt 互換性調査

### 機能対応状況

| 機能                                | 対応              | 備考                                                                                |
| ----------------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| JS / TS / JSX / TSX                 | ✅                | Prettier 100% conformance テスト通過（2026-02 beta）                                |
| JSON / YAML / Markdown / CSS / SCSS | ✅                |                                                                                     |
| Tailwind クラスソート               | ✅ **ビルトイン** | `sortTailwindcss` オプション（デフォルト無効）で `prettier-plugin-tailwindcss` 不要 |
| `.svelte` ファイル                  | ❌ **未対応**     | サポート対象言語リストに Svelte なし                                                |
| `prettier-plugin-svelte` 相当機能   | ❌                | 代替なし                                                                            |

### Svelte 対応の現状（2026-03 時点）

- PR [oxc-project/oxc#19807](https://github.com/oxc-project/oxc/pull/19807): "Support .svelte file"（ドラフト、2026-03-27 オープン）
- Issue #20184: "Svelte repo formatting diffs with Prettier"（追跡中）
- 関連 issue #20180–#20183 が未解決

### 結論

**現時点での移行は不可。**
`.svelte` ファイルが未対応のため、Prettier を完全置換できない。
PR #19807 がマージされ安定版に含まれるまで待機が必要。

---

## 推奨移行戦略

| 移行                            | 判断              | 理由                                       |
| ------------------------------- | ----------------- | ------------------------------------------ |
| ESLint → oxlint（完全）         | ❌ 不可           | `eslint-plugin-svelte` 未対応              |
| ESLint → oxlint（ハイブリッド） | ✅ **今すぐ可能** | JS/TS のみ oxlint、Svelte は ESLint 継続   |
| Prettier → oxfmt                | ⏳ **待機**       | `.svelte` 未対応。PR #19807 のマージを監視 |

---

## ハイブリッド移行の実装イメージ（oxlint）

### Lefthook 変更案

```yaml
# 追加: JS/TS 専用（50-100x 高速化）
- name: oxlint
  run: pnpm exec oxlint {staged_files}
  glob: '**/*.{js,ts,tsx}'

# 縮小: Svelte 専用
- name: eslint
  run: pnpm exec eslint {staged_files}
  glob: '**/*.svelte'
```

### 依存パッケージの変更

- 追加: `oxlint`
- 削除可能: `@eslint/js`（oxlint がカバー）
- 保持: `eslint`, `eslint-plugin-svelte`, `svelte-eslint-parser`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`

### oxlint.json 設定例

```json
{
  "globals": {
    "$state": "readonly",
    "$derived": "readonly",
    "$effect": "readonly",
    "$props": "readonly",
    "$bindable": "readonly",
    "$inspect": "readonly"
  },
  "rules": {
    "@typescript-eslint/ban-ts-comment": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

---

## oxfmt 移行後のイメージ（Svelte 対応後）

Svelte 対応 PR がマージされ安定版に含まれた時点で：

- `prettier-plugin-svelte` → oxfmt ネイティブ対応に移行
- `prettier-plugin-tailwindcss` → oxfmt ビルトインの `sortTailwindcss` に移行
- Prettier を devDependencies から完全削除可能

---

## 監視が必要な upstream

- [oxc-project/oxc PR #19807](https://github.com/oxc-project/oxc/pull/19807) — oxfmt の Svelte サポート
- [oxc-project/oxc Issue #20184](https://github.com/oxc-project/oxc/issues/20184) — oxfmt と Prettier の Svelte フォーマット差分追跡

---

## 実装計画（ハイブリッド移行）

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** JS/TS ファイルを oxlint で lint し、.svelte ファイルは ESLint が継続担当するハイブリッド構成にする

**Architecture:** `oxlint` を追加し、ESLint config を Svelte 専用に絞る。Lefthook と lint スクリプトに oxlint を組み込む。アプリコードは一切変更しない。

**Tech Stack:** oxlint, ESLint 10 (flat config), Lefthook, pnpm

---

### 変更対象ファイル

| ファイル            | 変更種別 | 内容                                                     |
| ------------------- | -------- | -------------------------------------------------------- |
| `oxlint.json`       | 新規作成 | TS ルール設定 + Svelte 5 runes グローバル定義            |
| `package.json`      | 変更     | `oxlint` 追加、`@eslint/js` 削除、lint スクリプト更新    |
| `eslint.config.mjs` | 変更     | JS/TS を ignores に追加、`js.configs.recommended` を削除 |
| `lefthook.yml`      | 変更     | oxlint ジョブ追加、eslint ジョブを .svelte 専用に変更    |

---

### Phase 1: oxlint インストールと設定ファイル作成

レイヤー: ツール設定のみ
目的: oxlint を追加し、既存コードに対してエラーなく動作することを確認する

**Files:**

- Create: `oxlint.json`
- Modify: `package.json`

- [x] **Step 1: oxlint をインストール**

```bash
pnpm add -D oxlint
```

- [x] **Step 2: `oxlint.json` を作成**

Svelte 5 runes グローバルと、ESLint から移行するルールを設定する。
`ban-ts-comment` のオプション形式は oxlint のスキーマで要確認（`ts-ignore: false` が oxlint で有効か検証する）。

```json
{
  "env": {
    "browser": true,
    "node": true
  },
  "globals": {
    "$state": "readonly",
    "$derived": "readonly",
    "$effect": "readonly",
    "$props": "readonly",
    "$bindable": "readonly",
    "$inspect": "readonly"
  },
  "rules": {
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": false
      }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

- [x] **Step 3: 既存コードへの適用を確認**

```bash
pnpm exec oxlint .
```

期待値: エラー 0 件（既存コードは ESLint が通っているため）

- [x] **Step 4: コミット**

```bash
git add oxlint.json package.json pnpm-lock.yaml
git commit -m "chore: Add oxlint with TypeScript rules and Svelte 5 rune globals"
```

---

### Phase 2: eslint.config.mjs の Svelte 専用化

レイヤー: ツール設定のみ
目的: ESLint が .svelte ファイルのみを処理するよう縮小する

**Files:**

- Modify: `eslint.config.mjs`
- Modify: `package.json`（`@eslint/js` 削除）

- [x] **Step 1: JS/TS ファイルを ignores に追加、`js.configs.recommended` を削除**

`eslint.config.mjs` を以下のように変更する:

1. `import js from '@eslint/js';` を削除
2. ignores 配列に `'**/*.{js,ts,tsx,mjs,cjs}'` を追加
3. config 配列から `js.configs.recommended,` を削除

変更後のファイル先頭:

```javascript
// See:
// https://eslint.org/docs/latest/use/configure/migration-guide
// https://eslint.org/docs/latest/use/migrate-to-9.0.0
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import svelteParser from 'svelte-eslint-parser';
import sveltePlugin from 'eslint-plugin-svelte';

export default [
  {
    ignores: [
      '**/.DS_Store',
      '**/node_modules',
      'build',
      'coverage',
      '.svelte-kit',
      '.vercel',
      'package',
      '**/.env',
      '**/.env.*',
      '!**/.env.example',
      '.pnpm-store',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
      '**/vite.config.js.timestamp-*',
      '**/vite.config.ts.timestamp-*',
      'prisma/.fabbrica/index.ts',
      // oxlint handles JS/TS files
      '**/*.{js,ts,tsx,mjs,cjs}',
    ],
  },
  // Svelte rules override JS rules where appropriate (intentional)
  // This allows Svelte-specific handling of rules like no-undef, no-unused-vars
  ...sveltePlugin.configs['flat/recommended'],
  // ... 以降は現状維持
```

- [x] **Step 2: ESLint が .svelte のみを処理することを確認**

```bash
pnpm exec eslint src --quiet
```

期待値: `.svelte` ファイルのみが処理される（`.ts` ファイルは "File ignored" または結果なし）

```bash
pnpm exec eslint src/lib/utils/general.ts
```

期待値: `File ignored because of a matching ignore pattern.` というメッセージ

- [x] **Step 3: `@eslint/js` を package.json から削除**

```bash
pnpm remove @eslint/js
```

- [x] **Step 4: コミット**

```bash
git add eslint.config.mjs package.json pnpm-lock.yaml
git commit -m "chore: Scope ESLint to .svelte files only, delegate JS/TS to oxlint"
```

---

### Phase 3: lint スクリプト更新

レイヤー: ツール設定のみ
目的: `pnpm lint` に oxlint を組み込む

**Files:**

- Modify: `package.json`（scripts.lint）

- [x] **Step 1: lint スクリプトを更新**

`package.json` の `"lint"` を変更:

```json
"lint": "prettier --check . && oxlint . && eslint ."
```

- [x] **Step 2: `pnpm lint` が通ることを確認**

```bash
pnpm lint
```

期待値: 3 コマンドがすべて成功（エラー 0 件）

- [x] **Step 3: コミット**

```bash
git add package.json
git commit -m "chore: Add oxlint to pnpm lint script"
```

---

### Phase 4: Lefthook 更新

レイヤー: ツール設定のみ
目的: pre-commit フックに oxlint を追加し、eslint を .svelte 専用に変更

**Files:**

- Modify: `lefthook.yml`

- [x] **Step 1: Lefthook に oxlint ジョブを追加し、eslint ジョブを縮小**

```yaml
version: 2

pre-commit:
  parallel: true
  jobs:
    - name: format
      run: pnpm exec prettier --write {staged_files}
      glob: '**/*.{js,jsx,ts,tsx,md,svelte}'

    - name: oxlint
      run: pnpm exec oxlint {staged_files}
      glob: '**/*.{js,jsx,ts,tsx}'

    - name: eslint
      run: pnpm exec eslint {staged_files}
      glob: '**/*.svelte'
```

- [x] **Step 2: staged file に .ts を含む状態で動作確認**

```bash
# テスト用に .ts ファイルをステージ
git add src/lib/utils/general.ts   # 任意の .ts ファイル
LEFTHOOK=1 git commit --dry-run
```

期待値: oxlint ジョブが実行される（eslint ジョブはスキップ）

- [x] **Step 3: staged file に .svelte を含む状態で動作確認**

```bash
git add src/routes/+page.svelte   # 任意の .svelte ファイル
LEFTHOOK=1 git commit --dry-run
```

期待値: eslint ジョブが実行される（oxlint ジョブはスキップ）

- [x] **Step 4: コミット**

```bash
git add lefthook.yml
git commit -m "chore: Add oxlint to Lefthook pre-commit, scope ESLint to .svelte"
```

---

## 検証コマンド（全フェーズ完了後）

```bash
pnpm lint          # prettier + oxlint + eslint すべて通ること
pnpm exec oxlint . # 単体で 0 エラー
pnpm exec eslint . # .svelte のみ処理、0 エラー
```

---

## 実装完了後の知見

### 実装で判明した非自明な事項

1. **oxlint の設定ファイル名は `.oxlintrc.json`**（`oxlint.json` は自動検出されない）
   - `--config <path>` で明示指定するか、`.oxlintrc.json` という名前にする必要がある
   - 設定ファイル名を誤るとすべてのルールがデフォルトになりサイレントに動作してしまう

2. **ESLint は `.ts` ファイルを実質的にリントしていなかった**
   - 現行の `eslint.config.mjs` では `files` 指定のないブロックでも ESLint 9 flat config が `.ts` を "no matching configuration" として無視していた
   - oxlint 導入により `.ts` ファイルが初めて厳密にリントされ、未検出だった問題（未使用インポート・未使用パラメータ）が発覚した

3. **catch 変数の unused 対応は TypeScript 4.0+ の optional catch binding で最もシンプルに解決できる**
   - `catch (_e)` は oxlint が `_` プレフィックス付きでも "never used" と判定するケースがある
   - `catch { }` 構文（optional catch binding）が最もクリーンな解決策

4. **未使用インポートは削除ではなくテスト追加で対応すべきケースがある**
   - テストファイルで意図的にインポートされていたプロバイダー群（将来テスト追加予定）は削除せずテストを実装した
   - oxlint 導入が間接的に 10 件のテスト追加を促した
