# Phase 1: `svelte/prefer-svelte-reactivity` — SvelteMap 置き換え

## 概要

`new Map()` をミュータブルに使用している箇所を `SvelteMap` に置き換える。
`SvelteMap` は `svelte/reactivity` からインポートし、型注釈も合わせて変更する。

対象: 2ファイル、3箇所

## タスク

### Task 1-1: TaskTable.svelte の Map を SvelteMap に置き換え

**対象ファイル:** `src/features/tasks/components/contest-table/TaskTable.svelte`

- [ ] ファイルを読み込み、現在の Map 使用箇所を確認
- [ ] `import { SvelteMap } from 'svelte/reactivity'` をインポートに追加
- [ ] 65行目: `prepareContestTablesMap` 関数内の `new Map<string, ProviderData>()` を `new SvelteMap<string, ProviderData>()` に変更
- [ ] 161行目: `taskResultsMap` の `$derived` 内、`reduce` の初期値 `new Map<ContestTaskPairKey, TaskResult>()` を `new SvelteMap<...>()` に変更
  - 同行の型注釈 `map: Map<ContestTaskPairKey, TaskResult>` も `SvelteMap<...>` に変更
- [ ] `pnpm lint` で当該ファイルのエラーが消えたことを確認

### Task 1-2: TaskGradeList.svelte の Map を SvelteMap に置き換え

**対象ファイル:** `src/lib/components/TaskGradeList.svelte`

- [ ] ファイルを読み込み、現在の Map 使用箇所を確認
- [ ] `import { SvelteMap } from 'svelte/reactivity'` をインポートに追加
- [ ] 22行目: `$state(new Map())` を `$state(new SvelteMap())` に変更
- [ ] `run()` 内の `new Map()` も `new SvelteMap()` に変更（型の一貫性のため）
- [ ] `pnpm lint` で当該ファイルのエラーが消えたことを確認

## 完了条件

`pnpm lint` を実行し、`svelte/prefer-svelte-reactivity` のエラーが 0 件になること。
