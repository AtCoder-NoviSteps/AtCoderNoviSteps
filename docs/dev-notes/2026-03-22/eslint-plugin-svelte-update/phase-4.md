# Phase 4: `goto()` / `replaceState()` への `resolve()` 適用

## 概要

プログラマティックなナビゲーション（`goto()`, `replaceState()`）の引数に `resolve()` を適用する。
**注意:** 引数が既に絶対URL（`http://...` や `$page.url.href` 等）の場合は `resolve()` でラップしてはならない。
実装前に各変数・関数の戻り値を確認すること。

対象: 3ファイル、5箇所

## タスク

### Task 4-1: AuthForm.svelte の `goto()`

**対象ファイル:** `src/lib/components/AuthForm.svelte`
**対象行:** 83行目

- [ ] 83行目の `goto(HOME_PAGE)` を確認
- [ ] `HOME_PAGE` 定数の値を確認（`/` や `/home` 等の相対パスであることを確認）
- [ ] `goto(resolve(HOME_PAGE))` に変更
- [ ] Phase 3 で追加した `resolve` import が既にあることを確認（なければ追加）

### Task 4-2: workbooks/+page.svelte の `goto()`

**対象ファイル:** `src/routes/workbooks/+page.svelte`
**対象行:** 50行目、68行目、72行目、76行目

- [ ] ファイルを読み込み、各行の `goto()` 引数を確認
- [ ] 50行目: `saved` 変数の内容を確認
  - `onMount` 内で使用。`saved` が相対パス（`/workbooks?tab=...`）であれば `goto(resolve(saved), { replaceState: true })` に変更
  - `saved` が絶対URLの場合は `resolve()` を適用しない（要確認）
- [ ] 68行目: `goto(TAB_URL_BUILDERS[tab]())` → URLビルダーの戻り値が相対パスであることを確認して `goto(resolve(TAB_URL_BUILDERS[tab]()))` に変更
- [ ] 72行目: `goto(buildWorkbooksUrl(...))` → 同様に確認して `resolve()` を適用
- [ ] 76行目: `goto(buildWorkbooksUrl(...))` → 同様に確認して `resolve()` を適用
- [ ] `import { resolve } from '$app/paths'` を追加

### Task 4-3: KanbanBoard.svelte の `replaceState()`

**対象ファイル:** `src/routes/(admin)/workbooks/order/_components/KanbanBoard.svelte`
**対象行:** 57行目

- [ ] ファイルを読み込み、57行目の `replaceState(buildUpdatedUrl(...), {})` を確認
- [ ] `buildUpdatedUrl` 関数の実装・戻り値を確認（`pathname + search` 形式の相対パスであることを確認）
- [ ] `replaceState(resolve(buildUpdatedUrl(...)), {})` に変更
- [ ] `import { resolve } from '$app/paths'` を追加

### Task 4-4: 動作確認

- [ ] `pnpm lint` で `svelte/no-navigation-without-resolve` のエラーが **0件** になったことを確認

## 完了条件

`svelte/no-navigation-without-resolve` に関する全エラー（Phase 2〜4）が解消し、`pnpm lint` のエラーが 0 件になること。
