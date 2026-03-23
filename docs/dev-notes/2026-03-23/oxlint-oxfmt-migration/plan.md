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
