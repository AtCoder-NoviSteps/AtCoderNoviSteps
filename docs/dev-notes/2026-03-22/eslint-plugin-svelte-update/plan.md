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

**`SvelteMap` の実体:** `import { SvelteMap } from 'svelte/reactivity'`
Svelte 5 でリアクティブな Map として提供。ミュータブルな操作（`.set()`, `.clear()` 等）をトリガーとする。

**導入背景:** Svelte 5 のリアクティビティはプロキシベースで動作するが、`Map` / `Set` / `Date` などのネイティブ組み込みオブジェクトはエンジン内部実装のためプロキシが透過的にトラップできない。そのため `$state(new Map())` としても `.set()` などの変更が `$derived` / `$effect` に伝播しない。`SvelteMap` は `Map` のサブクラスとして全メソッドをオーバーライドし、Svelte のリアクティブシグナルと連携させることでこの制約を解消している。なお、値の深いリアクティビティ（ネストオブジェクトのプロパティ変更）は対象外（shallow のみ）。

リアクティビティの仕組みは**読み取りと書き込みの2方向**で成立する。読み取り側（`$derived` / `$effect` 内での `.get()` / `.size` / イテレーション）が依存を登録し、書き込み側（`.set()` / `.delete()` / `.clear()`）がその依存を無効化・再実行させる。「ミュータブルな操作をトリガーとする」とはこの書き込み側の通知発火を指す。

> 出典: [svelte/reactivity — Svelte 公式ドキュメント](https://svelte.dev/docs/svelte/svelte-reactivity)

**`prefer-writable-derived` の背景:** Runes の役割分担は `$state`（変更可能な真実の源泉）/ `$derived`（他の state から計算される値）/ `$effect`（副作用 — DOM 操作・API 呼び出し等）と明確に分かれており、`$effect` を計算に使うのはアンチパターン。加えて `$effect` は DOM 更新サイクル後に非同期実行されるため、`$state + $effect` で派生値を更新すると一瞬だけ古い値が残る不整合が生じる。`$derived` は参照時に同期・遅延評価されるため常に一致する。

本プロジェクトでは Svelte v4 で実装を始め 2025年2月に v5 へ移行した経緯があり、当時は生成 AI の Svelte 5 学習データが少なく、v4 の `writable + subscribe` パターンを Runes に機械的に置き換えた `$state + $effect` が定着したと考えられる。今回のルール追加はその移行時の技術的負債を ESLint が炙り出している。

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

## 影響ファイル

### エラー修正対象

| ファイル                                                                  | ルール                        | 件数 |
| ------------------------------------------------------------------------- | ----------------------------- | ---- |
| `src/features/tasks/components/contest-table/TaskTable.svelte`            | prefer-svelte-reactivity      | 2    |
| `src/lib/components/TaskGradeList.svelte`                                 | prefer-svelte-reactivity      | 1    |
| `src/lib/components/ExternalLinkWrapper.svelte`                           | no-navigation-without-resolve | 1    |
| `src/lib/components/TagForm.svelte`                                       | no-navigation-without-resolve | 4    |
| `src/routes/problems/[slug]/+page.svelte`                                 | no-navigation-without-resolve | 1    |
| `src/features/workbooks/components/list/TitleTableBodyCell.svelte`        | no-navigation-without-resolve | 1    |
| `src/features/workbooks/components/list/WorkbookAuthorActionsCell.svelte` | no-navigation-without-resolve | 1    |
| `src/features/workbooks/components/shared/WorkbookLink.svelte`            | no-navigation-without-resolve | 1    |
| `src/lib/components/AuthForm.svelte`                                      | no-navigation-without-resolve | 3    |
| `src/lib/components/TagListForEdit.svelte`                                | no-navigation-without-resolve | 1    |
| `src/lib/components/TaskList.svelte`                                      | no-navigation-without-resolve | 1    |
| `src/lib/components/TaskListSorted.svelte`                                | no-navigation-without-resolve | 1    |
| `src/routes/users/[username]/+page.svelte`                                | no-navigation-without-resolve | 1    |
| `src/routes/workbooks/+page.svelte`                                       | no-navigation-without-resolve | 4    |
| `src/routes/(admin)/workbooks/order/_components/KanbanBoard.svelte`       | no-navigation-without-resolve | 1    |

### 警告修正対象（20ファイル超、require-each-key が大半）

詳細は各 phase ファイルを参照。

## フェーズ一覧

| Phase                   | 内容                                            | 種別    | リスク              |
| ----------------------- | ----------------------------------------------- | ------- | ------------------- |
| [Phase 1](./phase-1.md) | `SvelteMap` 置き換え                            | error   | 低                  |
| [Phase 2](./phase-2.md) | 外部リンクに `rel="external"` 追加              | error   | 低                  |
| [Phase 3](./phase-3.md) | 内部 href に `resolve()` 適用                   | error   | 低                  |
| [Phase 4](./phase-4.md) | `goto()` / `replaceState()` に `resolve()` 適用 | error   | 中（動的URL要確認） |
| [Phase 5](./phase-5.md) | `{#each}` ブロックへのキー追加                  | warning | 低                  |
| [Phase 6](./phase-6.md) | `$derived` リファクタリング                     | warning | 低                  |
| [Phase 7](./phase-7.md) | `any` 型の解消                                  | warning | 低                  |
| [Phase 8](./phase-8.md) | `valid-prop-names-in-kit-pages` 調査・修正      | warning | 中（要コード調査）  |

## 検証方法

```bash
pnpm lint       # 0 errors、warning 最小化
pnpm check      # Svelte 型エラーなし
pnpm test:unit  # 既存テスト全パス
```
