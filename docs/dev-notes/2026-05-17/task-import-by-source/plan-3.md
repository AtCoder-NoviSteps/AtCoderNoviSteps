# 問題インポート画面 UI改善 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/routes/(admin)/tasks/+page.svelte` の6つのUXバグをモック (`docs/ui-mock/2026-05-16/index.html`) に基づいて修正する。

**Architecture:**
`importContests` をローカル `$state` で保持し、`$effect` で `form.importContests` が存在するときだけ同期する。`create` アクション後は `form` が `{success:true}` に上書きされても `importContests` が消えない。`use:enhance` では `applyAction(result)` のみ呼び（`update()` は呼ばない）、`invalidateAll()` を防いでドロップダウンのリセットを回避する。Flowbite `<Pagination>`（onclick 非対応）は `<PaginationNav>`（numbered pages）に置き換える。

**Tech Stack:** SvelteKit 2, Svelte 5 (Runes), Flowbite Svelte 1.33.1, @lucide/svelte

## 設計上の判断: Superforms を使わない理由

Superforms への移行を検討したが、このページには不適切と判断した。

- `fetch` フォームの入力フィールドは `source` 一つだけ。Zod スキーマ定義・`superValidate` の追加・`+page.server.ts` と `+page.svelte` 両方の変更が必要で、得られる機能（`$delayed`、`$message`）は手動の `isFetching`/`fetchError` 2変数で代替できる。
- `importContests` はフォーム入力ではなくアクションの返却データであり、Superforms は管理しない。結局 `$state` + `onResult` コールバックが必要で、`$effect` アプローチと複雑さは変わらない。
- `create` フォームは行ごとに hidden inputs のみ。バリデーションエラーのフィールド単位表示が不要なため Superforms の旨味がない。

Superforms は「フィールド単位のバリデーションエラー表示が必要なフォーム」向き。このページの要件を満たすコスト最小の実装は `$effect` + `applyAction` パターンである。

---

## 修正対象の問題一覧

| #   | 問題                                       | 根本原因                                                                                   |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | ドロップダウンとコンテンツの間の余白不足   | フォーム section に `p-6` / `mb-10` がない                                                 |
| 2   | ローディング表示なし・ボタン非活性化なし   | `isFetching` 状態と enhance コールバックが未実装                                           |
| 3   | ページネーションのクリックが反応しない     | Flowbite `<Pagination>` の `onclick` が Svelte 5 で機能しない                              |
| 4   | ページネーションの形・配置がモックと異なる | 独自 prev/next コンポーネントが未作成                                                      |
| 5   | 問題名で検索できない                       | フィルタがコンテストID・名前のみ（`tasks[].title` を未チェック）                           |
| 6   | インポート後に失敗表示                     | `create` 後 `form={success:true}` になり `importContests` が消える                         |
| 7   | **AOJ インポートが DB に保存されない**     | `create` が `fetchTasks` を再呼び出し → キャッシュミス時に AOJ API 失敗 → サイレント空振り |
| 8   | ドロップダウンが AtCoder に戻る            | デフォルト `use:enhance` が `invalidateAll()` を呼び、Flowbite Select がリセット           |

---

## ファイル構成

| 変更種別 | ファイル                                                                |
| -------- | ----------------------------------------------------------------------- |
| 新規     | `src/routes/(admin)/tasks/_utils/filter_contests.ts`                    |
| 新規     | `src/routes/(admin)/tasks/_utils/filter_contests.test.ts`               |
| 修正     | `src/routes/(admin)/tasks/+page.svelte`                                 |
| 修正     | `src/routes/(admin)/tasks/_components/TaskTableForImport.svelte`        |
| **修正** | **`src/routes/(admin)/tasks/+page.server.ts`**（create アクションのみ） |

---

## Task 1: filterContests ユーティリティ関数の抽出とテスト（問題5対応）

**Files:**

- Create: `src/routes/(admin)/tasks/_utils/filter_contests.ts`
- Create: `src/routes/(admin)/tasks/_utils/filter_contests.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// src/routes/(admin)/tasks/_utils/filter_contests.test.ts
import { describe, test, expect } from 'vitest';
import { filterContests } from './filter_contests';
import type { Contests } from '$lib/types/contest';

const contests: Contests = [
  {
    id: 'abc300',
    title: 'AtCoder Beginner Contest 300',
    tasks: [
      { id: 'abc300_a', contest_id: 'abc300', problem_index: 'A', title: 'N-choice question' },
    ],
    start_epoch_second: 0,
    duration_second: 0,
  },
  {
    id: 'abc301',
    title: 'AtCoder Beginner Contest 301',
    tasks: [{ id: 'abc301_a', contest_id: 'abc301', problem_index: 'A', title: 'Overall Winner' }],
    start_epoch_second: 0,
    duration_second: 0,
  },
  {
    id: 'abc302',
    title: 'AtCoder Beginner Contest 302',
    tasks: [],
    start_epoch_second: 0,
    duration_second: 0,
  },
];

describe('filterContests', () => {
  describe('when query is empty', () => {
    test('returns contests that have tasks', () => {
      expect(filterContests(contests, '')).toHaveLength(2);
    });

    test('excludes contests with no tasks', () => {
      const result = filterContests(contests, '');
      expect(result.every((contest) => contest.tasks.length > 0)).toBe(true);
    });
  });

  describe('when query matches', () => {
    test('filters by contest id', () => {
      const result = filterContests(contests, 'abc300');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('abc300');
    });

    test('filters by contest title', () => {
      const result = filterContests(contests, 'Beginner Contest 301');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('abc301');
    });

    test('filters by task title', () => {
      const result = filterContests(contests, 'Overall Winner');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('abc301');
    });

    test('is case-insensitive', () => {
      expect(filterContests(contests, 'OVERALL WINNER')).toHaveLength(1);
    });
  });

  describe('when query does not match', () => {
    test('returns empty array', () => {
      expect(filterContests(contests, 'zzz_no_match')).toHaveLength(0);
    });

    test('excludes contests with no tasks even if id matches', () => {
      const result = filterContests(contests, 'abc302');
      expect(result).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

```bash
pnpm test:unit src/routes/\\(admin\\)/tasks/_utils/filter_contests.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: フィルタ関数を実装**

```typescript
// src/routes/(admin)/tasks/_utils/filter_contests.ts
import type { Contests } from '$lib/types/contest';

export function filterContests(contests: Contests, query: string): Contests {
  const hasNoQuery = !query;
  const lowerQuery = query.toLowerCase();

  return contests.filter((contest) => {
    if (contest.tasks.length === 0) {
      return false;
    }
    if (hasNoQuery) {
      return true;
    }
    return (
      contest.id.toLowerCase().includes(lowerQuery) ||
      contest.title.toLowerCase().includes(lowerQuery) ||
      contest.tasks.some((task) => task.title.toLowerCase().includes(lowerQuery))
    );
  });
}
```

- [ ] **Step 4: テスト合格を確認**

```bash
pnpm test:unit src/routes/\\(admin\\)/tasks/_utils/filter_contests.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: コミット**

```bash
git add src/routes/\(admin\)/tasks/_utils/
git commit -m "feat: add filterContests utility with task title search support"
```

---

## Task 2: PaginationNav の動作確認（問題3・4対応）

### 調査結果

Flowbite Svelte v1.33.1 に `PaginationNav` が存在することを確認済み（`node_modules/flowbite-svelte/dist/pagination/PaginationNav.svelte`）。

- Props: `currentPage: number`, `totalPages: number`, `onPageChange: (page: number) => void`, `visiblePages?: number`（default 5）
- numbered pages（1, 2, ..., n-1, n）を `PaginationButton` でレンダリング — onclick が正しく動作する
- 旧コードのバグ: `<Pagination {pages} />` の pages 配列に `onclick` を渡しても `Pagination` は対応していない（別コンポーネント）

**カスタムコンポーネント（SimplePagination）の作成は不要。** Task 4 の `+page.svelte` で `PaginationNav` を直接使用する。

このタスクでの実装作業はなし（Task 4 に統合）。

---

## Task 3: TaskTableForImport にインポート成功コールバックを追加（問題6対応）

`use:enhance` でインポート成功時に親コンポーネントへ通知する。

**Files:**

- Modify: `src/routes/(admin)/tasks/_components/TaskTableForImport.svelte`

- [ ] **Step 1: TaskTableForImport.svelte を修正**

変更点:

- `import { enhance } from '$app/forms'` と `import type { SubmitFunction } from '@sveltejs/kit'` を追加
- Props に `onImportSuccess: (contestId: string) => void` を追加
- 各インポートフォームに `use:enhance={makeImportHandler(importContest.id)}` を追加

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';

  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Button,
    Label,
    Input,
  } from 'flowbite-svelte';

  import type { Contests } from '$lib/types/contest';
  import type { ContestTaskImportSource } from '$lib/clients';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { newline } from '$lib/utils/newline';

  interface Props {
    importContests: Contests;
    source: ContestTaskImportSource;
    onImportSuccess: (contestId: string) => void;
  }

  let { importContests, source, onImportSuccess }: Props = $props();

  function makeImportHandler(contestId: string): SubmitFunction {
    return () =>
      async ({ result }) => {
        if (result.type === 'success' && (result.data as { success?: boolean })?.success) {
          onImportSuccess(contestId);
        }
      };
  }
</script>

<Table shadow hoverable={true} class="text-md" divClass="">
  <TableHead class="text-md bg-gray-100">
    <TableHeadCell class="w-1/8">コンテストID</TableHeadCell>
    <TableHeadCell class="w-1/3">コンテスト名</TableHeadCell>
    <TableHeadCell class="w-1/3">問題名</TableHeadCell>
    <TableHeadCell class="w-1/8"></TableHeadCell>
  </TableHead>
  <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
    {#each importContests as importContest (importContest.id)}
      <TableBodyRow>
        <TableBodyCell class="p-3">
          <Label>
            {#each newline(getContestNameLabel(importContest.id), 10) as line, i (i)}
              {line}<br />
            {/each}
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          <Label>
            {#each newline(importContest.title, 28) as line, i (i)}
              {line}<br />
            {/each}
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          {#each importContest.tasks as importTask (importTask.id)}
            <li>{importTask.title}</li>
          {/each}
        </TableBodyCell>
        <TableBodyCell>
          <form method="POST" action="?/create" use:enhance={makeImportHandler(importContest.id)}>
            <Input size="md" type="hidden" name="contest_id" value={importContest.id} />
            <Input size="md" type="hidden" name="source" value={source} />
            <Button type="submit">インポート</Button>
          </form>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
```

- [ ] **Step 2: 型チェック**

```bash
pnpm check
```

Expected: No errors for TaskTableForImport (page.svelte は次 Task で修正するのでエラーがある場合は一時的に許容)

---

## Task 4: +page.svelte のメイン改修（問題1・2・3・4・6対応）

ローカル状態管理・ローディング・スペーシング・ページネーション配置を一括修正。

**Files:**

- Modify: `src/routes/(admin)/tasks/+page.svelte`

- [ ] **Step 1: +page.svelte を全面改修**

`importContests` をローカル `$state` で保持し、`$effect` で `form.importContests` が存在するときだけ同期する。`create` 後は `form` が変わっても一覧を維持する。

```svelte
<script lang="ts">
  import type { SubmitFunction } from '@sveltejs/kit';
  import { enhance, applyAction } from '$app/forms';

  import { Select, Label, Button, PaginationNav } from 'flowbite-svelte';

  import type { Contests } from '$lib/types/contest';
  import { importSourceEntries, type ContestTaskImportSource } from '$lib/clients';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import SpinnerWrapper from '$lib/components/SpinnerWrapper.svelte';
  import TaskTableForImport from './_components/TaskTableForImport.svelte';
  import TaskSearchBox from './_components/TaskSearchBox.svelte';
  import { filterContests } from './_utils/filter_contests';

  const PAGE_SIZE = 20;

  let { data, form } = $props();

  let selectedSource = $state<ContestTaskImportSource>('atcoder');
  let searchQuery = $state('');
  let currentPage = $state(1);
  let importContests = $state<Contests>([]);
  let isFetching = $state(false);
  let fetchError = $state<string | null>(null);

  // Sync only when form.importContests is present.
  // After a create action, form becomes {success:true} with no importContests,
  // so this block does not fire and the displayed list is preserved.
  $effect(() => {
    if (form?.importContests) {
      importContests = form.importContests;
      currentPage = 1;
      searchQuery = '';
      fetchError = null;
    } else if (form?.message) {
      fetchError = form.message;
    }
  });

  const filteredContests = $derived(filterContests(importContests, searchQuery));

  const pagedContests = $derived(
    filteredContests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  );

  const totalPages = $derived(Math.max(1, Math.ceil(filteredContests.length / PAGE_SIZE)));

  const sourceOptions = importSourceEntries.map(([value, config]) => ({
    value,
    name: config.label,
  }));

  // Use applyAction() instead of update() to skip invalidateAll(),
  // preventing Flowbite Select from resetting its displayed value.
  const handleFetch: SubmitFunction = () => {
    isFetching = true;
    fetchError = null;
    return async ({ result }) => {
      isFetching = false;
      await applyAction(result); // updates form, triggering $effect
    };
  };

  function handleImportSuccess(contestId: string) {
    importContests = importContests.filter((contest) => contest.id !== contestId);
  }
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="問題のインポート" />

  <section class="mb-10 p-6">
    <form method="POST" action="?/fetch" use:enhance={handleFetch} class="flex flex-col gap-4">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <Label for="source-select">コンテストサイト・種別</Label>
          <Select
            id="source-select"
            name="source"
            bind:value={selectedSource}
            items={sourceOptions}
            onchange={() => {
              currentPage = 1;
            }}
          />
        </div>
        <Button type="submit" disabled={isFetching}>問題を取得</Button>
      </div>
    </form>
  </section>

  {#if isFetching}
    <div class="flex flex-col items-center">
      <SpinnerWrapper size="8" />
      <p class="text-sm text-gray-500 dark:text-gray-400">データを取得しています...</p>
    </div>
  {:else if fetchError !== null}
    <p class="text-red-500">{fetchError}</p>
  {:else if localImportContests.length >= 1}
    {#snippet paginationNav()}
      <PaginationNav
        {currentPage}
        {totalPages}
        onPageChange={(page) => {
          currentPage = page;
        }}
      />
    {/snippet}

    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <TaskSearchBox bind:value={searchQuery} />
        {@render paginationNav()}
      </div>

      <TaskTableForImport
        importContests={pagedContests}
        source={selectedSource}
        onImportSuccess={handleImportSuccess}
      />

      <div class="flex justify-end">
        {@render paginationNav()}
      </div>
    </div>
  {/if}
</div>
```

- [ ] **Step 2: 型チェック**

```bash
pnpm check
```

Expected: No errors

- [ ] **Step 3: ユニットテスト通過確認**

```bash
pnpm test:unit
```

Expected: All tests pass

- [ ] **Step 4: コミット**

```bash
git add src/routes/\(admin\)/tasks/+page.svelte src/routes/\(admin\)/tasks/_components/TaskTableForImport.svelte
git commit -m "fix: decouple importContests from form state, add loading state, use PaginationNav for numbered pagination"
```

---

---

## Task 5: create アクションから fetchTasks を除去（AOJ インポート不具合の修正）

### 根本原因

`create` アクションが `fetchTasks(source)` を再度呼び出している。

```typescript
// +page.server.ts (現行の create アクション)
const tasks = await fetchTasks(source); // ← AOJ API を再度呼ぶ
```

`getCachedOrFetch` のキャッシュが切れた場合（開発サーバー再起動など）、AOJ API への再リクエストが失敗すると catch で `[]` を返す。
`tasksByContestId = []` → `Promise.all([])` → **何も保存せず `{ success: true }` を返す**（サイレント失敗）。

AtCoder が問題ない理由: AtCoder Problems API は複数回呼んでも安定しているが、AOJ API はキャッシュなしで連続呼び出しすると失敗しやすい。

### 解決策

`create` アクションが `fetchTasks` を呼ばないよう、フォームの hidden input にタスクデータを JSON で乗せる。

**Files:**

- Modify: `src/routes/(admin)/tasks/_components/TaskTableForImport.svelte`（hidden input 追加）
- Modify: `src/routes/(admin)/tasks/+page.server.ts`（create アクション改修）

- [ ] **Step 1: TaskTableForImport.svelte にタスクデータの hidden input を追加**

`use:enhance` の create フォームに `<input type="hidden" name="tasks" value={JSON.stringify(importContest.tasks)} />` を追加する（Task 3 で追加した `use:enhance` と合わせて変更）。

```svelte
<form method="POST" action="?/create" use:enhance={makeImportHandler(importContest.id)}>
  <input type="hidden" name="contest_id" value={importContest.id} />
  <input type="hidden" name="source" value={source} />
  <input type="hidden" name="tasks" value={JSON.stringify(importContest.tasks)} />
  <Button type="submit">インポート</Button>
</form>
```

- [ ] **Step 2: +page.server.ts の create アクションを改修**

`fetchTasks` の呼び出しを除去し、フォームから受け取ったタスクデータを直接使用する。

```typescript
create: async ({ request, locals }) => {
  await validateAdminAccess(locals);

  const formData = await request.formData();
  const source = formData.get('source');

  if (!isContestTaskImportSource(source)) {
    return fail(BAD_REQUEST, { message: 'コンテストサイト・種別が不正です。' });
  }

  const contest_id = formData.get('contest_id');

  if (typeof contest_id !== 'string' || !contest_id) {
    return fail(BAD_REQUEST, { message: 'コンテストIDが指定されていません。' });
  }

  const tasksJson = formData.get('tasks');

  if (typeof tasksJson !== 'string') {
    return fail(BAD_REQUEST, { message: '問題データが不正です。' });
  }

  let tasks: TasksForImport;

  try {
    tasks = JSON.parse(tasksJson) as TasksForImport;
  } catch {
    return fail(BAD_REQUEST, { message: '問題データの解析に失敗しました。' });
  }

  try {
    await Promise.all(
      tasks.map(async (task: TaskForImport) => {
        const id = (await sha256(contest_id + task.title)) as string;
        await taskService.createTask(
          id,
          task.id,
          task.contest_id,
          task.problem_index,
          task.title,
        );
      }),
    );
  } catch {
    return { success: false };
  }

  return { success: true };
},
```

不要になったインポートを削除: `fetchTasks` の参照がなければ `import { fetchContests, fetchTasks, isContestTaskImportSource }` から `fetchTasks` を除く。

- [ ] **Step 3: 型チェック**

```bash
pnpm check
```

Expected: No errors

- [ ] **Step 4: コミット**

```bash
git add src/routes/\(admin\)/tasks/+page.server.ts src/routes/\(admin\)/tasks/_components/TaskTableForImport.svelte
git commit -m "fix: remove fetchTasks from create action to prevent silent AOJ import failures"
```

---

## ドロップダウンが AtCoder に戻る問題について

**根本原因:** デフォルトの `use:enhance`（コールバックなし）が `invalidateAll()` を呼び出し、Flowbite Select の内部状態がリセットされる。

**修正:** Task 4 のカスタム `handleFetch` コールバックで `update()` を呼ばない設計にしたことで、`invalidateAll()` が発生しなくなるため、この問題も合わせて解決される。

---

## 検証

```bash
# 型チェック
pnpm check

# ユニットテスト
pnpm test:unit

# 開発サーバーで手動確認
pnpm dev
```

手動確認チェックリスト:

- [ ] ドロップダウンセクションに `p-6` のパディングが付き、下部に十分な余白がある
- [ ] 「問題を取得」クリック中: スピナーが表示され、ボタンが非活性になる
- [ ] コンテストID・コンテスト名・**問題名**で絞り込める
- [ ] ページネーションがナンバー形式（1, 2, ..., n-1, n）で表示され、各ページボタンが機能する
- [ ] ページネーションが検索欄の右と表の下の2ヵ所に表示される
- [ ] インポート成功後: 該当行が一覧から消え、他の行は維持される
- [ ] データ取得失敗時: 赤いエラーメッセージが表示される（表示崩れなし）
- [ ] **AOJ（PCK・JAG・コース）のインポートが確実に DB に保存される**
- [ ] **インポート後もドロップダウンが選択したコンテストサイトを維持する**
