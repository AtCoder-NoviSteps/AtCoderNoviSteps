# Phase 6: `$derived` リファクタリング

## 概要

`svelte/prefer-writable-derived` 警告に対応する。
`$state` + `$effect` で値を計算しているパターンを `$derived` に書き換える。

**変換パターン:**
```typescript
// Before
let value = $state(initialValue);
$effect(() => {
  value = computeFrom(deps);
});

// After
let value = $derived(computeFrom(deps));
```

対象: 2ファイル、3箇所

## タスク

### Task 6-1: ThermometerProgressBar.svelte

**対象ファイル:** `src/lib/components/ThermometerProgressBar.svelte`
**対象行:** 20行目（`submissionRatios`）、21行目（`submissionCounts`）

- [ ] ファイルを読み込み、`submissionRatios` と `submissionCounts` の `$state` + `$effect` パターンを確認
- [ ] `submissionRatios`: `$state([])` と対応する `$effect` ブロックを削除し、`$derived(() => filteredStatuses.map(...))` に置き換え
- [ ] `submissionCounts`: 同様に `$derived` に置き換え
- [ ] テンプレート内での使用（82行目、99行目の `{#each}`）は変更不要（`$derived` も同様にアクセス可能）
- [ ] `pnpm check` で型エラーがないことを確認

### Task 6-2: workbooks/[slug]/+page.svelte

**対象ファイル:** `src/routes/workbooks/[slug]/+page.svelte`
**対象行:** 34行目（`taskResults`）

- [ ] ファイルを読み込み、`taskResults` の `$state` + `$effect` パターンを確認
- [ ] `let taskResults: Map<string, TaskResult> = $state(new Map())` と対応する `$effect(() => { taskResults = data.taskResults; })` を確認
- [ ] `let taskResults = $derived(data.taskResults)` に置き換え（型注釈は必要に応じて維持）
- [ ] `pnpm check` で型エラーがないことを確認

### Task 6-3: 動作確認

- [ ] `pnpm lint` で `svelte/prefer-writable-derived` の warning が 0 件になったことを確認
- [ ] `pnpm check` で Svelte 型エラーがないことを確認

## 完了条件

`svelte/prefer-writable-derived` に関する全 warning が解消し、型エラーがないこと。
