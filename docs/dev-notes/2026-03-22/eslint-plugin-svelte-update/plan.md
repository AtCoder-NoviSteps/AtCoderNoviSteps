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

**`SvelteMap` の実体:** `import { SvelteMap } from 'svelte/reactivity'`
Svelte 5 でリアクティブな Map として提供。ミュータブルな操作（`.set()`, `.clear()` 等）をトリガーとする。

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
