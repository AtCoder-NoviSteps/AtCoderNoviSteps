# eslint-plugin-svelte v3.10.1 → v3.16.0 アップデート対応

## 概要

PR #3297（定期依存アップデート）で eslint-plugin-svelte を v3.10.1 から v3.16.0 へ更新したことにより、CI の lint チェックが失敗している。本計画では新規追加・severity 変更されたルールへの対応を行い、CI を通過させる。

エラー（CI blocking）を優先して修正し、可能な限り warning も解消する。

## 変更内容と背景

v3.10.1 → v3.16.0 で追加・変更されたルール:

| ルール                                 | 旧        | 新    | 内容                                          |
| -------------------------------------- | --------- | ----- | --------------------------------------------- |
| `svelte/no-navigation-without-resolve` | なし      | error | 内部ナビゲーションに `resolve()` の使用を強制 |
| `svelte/prefer-svelte-reactivity`      | なし      | error | `Map`/`Set` 等の代わりに `SvelteMap` 等を要求 |
| `svelte/require-each-key`              | なし/warn | warn  | `{#each}` にキーを要求                        |
| `svelte/prefer-writable-derived`       | なし      | warn  | `$state` + `$effect` → `$derived` を推奨      |

**`resolve()` の実体:** `import { resolve } from '$app/paths'`
SvelteKit 2.55.0 で実装済み。`resolveRoute` は deprecated となり `resolve` に統一された。
ベースパスをパスに付与する純粋な関数。除外条件: 絶対URL、`rel="external"` 属性、空文字列、hash fragment。

**導入背景:** SvelteKit はルートパス以外（例: `example.com/my-app/`）へのデプロイをサポートするが、`<a href="/foo">` や `goto('/foo')` のようにパスをハードコードすると base path が加味されずナビゲーションが壊れる。`resolve()` は base path を実行時に付与する純粋関数としてこれを解決する。JS のモジュール解決（webpack alias 等）と概念は近いが、モジュール解決がビルド時に静的確定するのに対し、`resolve()` は base path がデプロイ設定に依存して実行時まで確定しないため、明示的な関数呼び出しとして設計されている。`eslint-plugin-svelte` v3.12.0 でルール化された。

**メリット:** base path が変わってもコードの修正不要 / `resolve('/blog/[slug]', { slug })` 形式でルートパラメータをコンパイル時に型検査できる / 全内部ナビゲーションが一貫した経路を通るため挙動が予測しやすい。

**デメリット:** 全コンポーネントに import が必要でボイラープレートが増加 / base path を使わないプロジェクトでは恩恵が見えにくく冗長に感じる / 既存コードへの適用コストが高い（本件がまさにそれ）。

> 出典: [$app/paths — SvelteKit 公式ドキュメント](https://svelte.dev/docs/kit/$app-paths) / [no-navigation-without-resolve — eslint-plugin-svelte](https://github.com/sveltejs/eslint-plugin-svelte/blob/main/docs/rules/no-navigation-without-resolve.md)

**`SvelteMap` の実体:** `import { SvelteMap } from 'svelte/reactivity'` — Svelte 5 でリアクティブな `Map` として提供。`.set()` / `.clear()` 等の変更を `$derived` / `$effect` に伝播する。`$state` ラッパーは不要。

**導入背景:** Svelte 5 のリアクティビティはプロキシベースだが、`Map` 等のネイティブ組み込み型はエンジン内部実装のためプロキシでトラップできない（`$state(new Map())` では `.set()` が伝播しない）。`SvelteMap` はメソッドをオーバーライドしてシグナルと連携することで解決。本プロジェクトは v4 から v5 へ移行した経緯があり、`writable + subscribe` を機械的に置き換えた `$state + $effect` が残存していた。今回のルール追加はその技術的負債を検出したもの。

## 設計方針

- **機械的置き換えを基本とする**: ルールの意図に従い、最小限の変更で修正する
- **外部リンクは `rel="external"` で明示**: `resolve()` で外部URLをラップしない。`rel` 属性に `external` を追加することで rule を満足させる
- **`resolve()` は内部パスのみに適用**: 動的URLの場合は変数の内容（相対パスか絶対URLか）を確認してから適用
- **警告は全件修正を目指す**: `valid-prop-names-in-kit-pages` のみコード調査が必要なため最後に対処

## 却下した代替案

| 案                                                   | 却下理由                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `no-navigation-without-resolve` をルール設定で無効化 | ルールの意図（base path 対応）は正当であり、将来のデプロイ設定変更に備えるべき |
| `// eslint-disable-next-line` で個別無効化           | 件数が多く、保守性が下がる。真に必要な箇所（外部リンク等）に限定すべき         |
| `SvelteMap` を `Map` の型エイリアスで代替            | ルールは型ではなくコンストラクタ呼び出しを検出するため回避不可                 |
| PR を revert して別途対応                            | アップデート内容自体は問題なく、lint 修正のみで対応可能                        |

実装フェーズ完了。`pnpm lint` 0 errors・0 warnings、`pnpm check` 既存の 2 件のみ、`pnpm test:unit` 45 ファイル 1954 件全パス。

## 残課題

**`users/edit/+page.svelte` — AtCoder 認証機能の再公開**

コメントアウト済みの AtCoder ID 認証・バリデーションフォームは未公開状態のまま保持。`status` プロップは `valid-prop-names-in-kit-pages` 制約のため削除済みのため、再公開時は Props 設計（`data` prop への一本化等）を合わせて再検討すること。

## (対応済み) PR #3298 の CodeRabbit レビュー

### 修正した項目と判断

| ファイル                        | 変更内容                                                          | 判断軸                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `TaskTable.svelte`              | `$derived(() => fn)` → `$derived(fn)` + 呼び出し側 `()` 除去      | `$derived` に arrow function を渡すと関数オブジェクトを値として保持するバグ。→ rules 参照                    |
| `account_transfer/+page.svelte` | `'account_transfer'` → `'?/account_transfer'`                     | SvelteKit named action は `?/` 必須。なければ URL 文字列として扱われフォームが動かない                       |
| `workbooks/+page.svelte`        | `resolve(saved)` → `resolve(savedUrl.pathname) + savedUrl.search` | `resolve()` は route pattern のみ受け付ける。query string を含む文字列は型エラー・意味的に不正。→ rules 参照 |
| `UpdatingDropdown.svelte`       | `/signup`・`/login` href を `resolve()` でラップ                  | `no-navigation-without-resolve` ルール準拠。現状 no-op だが base path 設定時に必要                           |
| `KanbanBoard.svelte`            | `replaceState(resolve(...))` → `replaceState(updatedUrl)`         | `$page.url` 由来の URL は base path 込み。`resolve()` を適用すると二重適用になる。→ rules 参照               |
| `AuthForm.svelte`               | `alternativePageLink: string` → `'/login' \| '/signup'`           | 型を絞ることで `as` キャストを除去し exhaustive check を有効化                                               |
| `TaskGradeList.svelte`          | `run()` (svelte/legacy) → `$derived(new Map(...))`                | `run()` は Svelte 4→5 移行。単純な変換なので `$derived` で置き換え可能                                       |

### 採用しなかった指摘

| 指摘                                                                     | 不採用理由                                                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `TagForm.svelte`: `resolve('/(admin)/tags')` → `resolve('/tags')` に変更 | `/(admin)/tags` が正しいルートID。`/tags` は別ルートになる                            |
| `users/[username]/+page.svelte`: `resolve(PROBLEMS_PAGE)` 除去           | `<a href>` への静的パスは base path 設定時に `resolve()` が必要。除去すると将来壊れる |
