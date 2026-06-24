# filterTasksBySearch に URL 検索を追加

## Context

`src/routes/(admin)/tasks/grade/+page.svelte` で `https://onlinejudge.u-aizu.ac.jp/problems/1400` のようなURLで検索してもヒットしない。`1400` ではヒットする（`task_id` に部分一致するため）。

一方、`src/lib/components/TaskSearchBox.svelte` では同じURLでヒットする。

**原因**: `filterTasksBySearch`（`src/lib/utils/task_filter.ts`）は `title`, `task_id`, `contest_id`, `getContestNameLabel()` の4フィールドのみ検索。`TaskSearchBox.svelte` は `getTaskUrl(contest_id, task_id)` で生成したURLも検索対象に含めている。

## 変更内容

### `src/lib/utils/task_filter.ts`

1. `getTaskUrl` を `$lib/utils/task` からインポート
2. filter条件に `getTaskUrl(task.contest_id, task.task_id).toLowerCase().includes(query)` を追加

```typescript
import { getTaskUrl } from '$lib/utils/task';

// filter内:
task.title.toLowerCase().includes(query) ||
task.task_id.toLowerCase().includes(query) ||
task.contest_id.toLowerCase().includes(query) ||
getContestNameLabel(task.contest_id).toLowerCase().includes(query) ||
getTaskUrl(task.contest_id, task.task_id).toLowerCase().includes(query),
```

### `src/test/lib/utils/task_filter.test.ts`

`prisma/tasks.ts` のseed値を参照し、テストデータに現実の値を使用:

```typescript
// 既存テストデータ（AtCoder）はそのまま維持
// AOJ問題を追加（prisma/tasks.ts L11409-11415 参照）
{ title: 'Fast Forwarding', task_id: '1400', contest_id: 'ICPCRegional2019' },
```

テストケース:
- AOJ URL（`https://onlinejudge.u-aizu.ac.jp/problems/1400`）で検索 → AOJ問題がヒット
- AtCoder URL（`https://atcoder.jp/contests/abc300/tasks/abc300_a`）で検索 → AtCoder問題がヒット（既存テストデータ `abc300_a` を利用）
- AtCoder URL の部分一致（`atcoder.jp/contests/abc300`）でも検索可能なことを確認

## 変更しないこと

- `TaskSearchBox.svelte` のマルチワード検索（空白区切りAND）は今回スコープ外
- `filterTasksBySearch` のインターフェース（引数・戻り値）は変更なし

## 検証

```bash
pnpm test:unit -- src/test/lib/utils/task_filter.test.ts
```
