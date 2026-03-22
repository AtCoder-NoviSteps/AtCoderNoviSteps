# Phase 7: `any` 型の解消

## 概要

`@typescript-eslint/no-explicit-any` 警告に対応する。
`TaskTable.svelte` の `ProviderData` インターフェースの `metadata` フィールドに適切な型を付与する。

対象: 1ファイル、1箇所

## タスク

### Task 7-1: ContestTableProvider の metadata 型を確認

**対象ファイル:** `src/features/tasks/components/contest-table/TaskTable.svelte`
**対象行:** 58行目

- [ ] `ContestTableProvider` インターフェース/クラスの `getMetadata()` 戻り値型を確認
  - `src/features/tasks/` 以下のプロバイダー実装を Grep で探す
- [ ] `getMetadata()` が返すオブジェクトの構造を把握する

### Task 7-2: metadata フィールドの型を変更

- [ ] `ProviderData` インターフェースの `metadata: any` を適切な型（`getMetadata()` の戻り値型）に変更
  - プロバイダー型が既に存在する場合はそれを使用
  - 存在しない場合はインラインで `{ abbreviationName: string; ... }` 等のオブジェクト型を定義
- [ ] `pnpm check` で型エラーがないことを確認
- [ ] `pnpm lint` で `@typescript-eslint/no-explicit-any` warning が解消したことを確認

## 完了条件

`metadata` フィールドの型が `any` でなくなり、lint warning と型エラーがないこと。
