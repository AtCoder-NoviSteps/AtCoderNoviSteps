# PR #3316 マージ後修正 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `review.md` に記載されたマージ後修正タスク（#1〜#13、#優先度中テスト）を実施し、コード品質・テスト・UI/UX・DB整合性を改善する。

**Architecture:** 低リスク（テスト・定数）→ 中リスク（UI・サービス）→ 高リスク（DB migration）の順で実施。`Pct → percentage` リネーム（#6）は現コードベースに `Pct` が存在しないため実施不要（既解決）。並行投票対策（#14）は優先度低・将来対応のためスコープ外。

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes, TypeScript, Prisma, Vitest, Playwright, Flowbite Svelte

---

## 対象ファイル一覧

| 操作           | ファイル                                                                  | 理由                                                                                |
| -------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 修正           | `src/features/account/services/atcoder_verification.test.ts`              | `vi.stubEnv` パターンへ移行（#11）                                                  |
| 新規           | `src/test/lib/services/users.test.ts`                                     | `getUser` / `getUserById` / `deleteUser` のテスト追加（#10）                        |
| 修正           | `src/features/votes/services/vote_grade.ts`                               | `MIN_VOTES_FOR_STATISTICS` を export + `upsertVoteGradeTables` 戻り値追加（#4, #5） |
| 修正           | `src/features/votes/actions/vote_actions.ts`                              | `upsertVoteGradeTables` 戻り値を利用（#4）                                          |
| 修正           | `src/routes/votes/[slug]/+page.svelte`                                    | `MIN_VOTES_FOR_STATISTICS` 参照に変更（#5）                                         |
| 修正           | `src/routes/(admin)/vote_management/+page.server.ts`                      | `updateTask` に try/catch 追加（#7）                                                |
| 修正           | `src/lib/components/SubmissionButton.svelte`                              | `loading` prop 追加（#8a）                                                          |
| 修正           | `src/lib/components/FormWrapper.svelte`                                   | `isSubmitting` context 追加（#8b）                                                  |
| 修正           | `src/features/account/components/settings/AtCoderVerificationForm.svelte` | ボタン間隔（#8c）+ Flowbite Clipboard 導入（#8d）                                   |
| 新規           | `src/features/votes/internal_clients/vote_grade.ts`                       | `fetchMyVote` / `submitVote` / `fetchMedianVote` 抽出（#1, #2）                     |
| 新規           | `src/features/votes/internal_clients/vote_grade.test.ts`                  | vote_grade.ts の単体テスト（#2）                                                    |
| 修正           | `src/features/votes/components/VotableGrade.svelte`                       | vote_grade.ts 利用 + AbortController 連打対策（#1, #2, #3）                         |
| 修正           | `e2e/votes.spec.ts`                                                       | セレクタ修正 + 初期状態対応（#9）                                                   |
| 新規 migration | `prisma/migrations/.../migration.sql`                                     | CHECK 制約追加（#12, #13）                                                          |
| 修正           | `prisma/schema.prisma`                                                    | コメント追加（#12, #13）                                                            |
| 修正           | `prisma/ERD.md`                                                           | CHECK 制約ドキュメント（#12, #13）                                                  |
| 修正           | `.claude/rules/svelte-components.md`                                      | SSR 安全性・`{#each}` キー式ルール追加                                              |
| 修正           | `.claude/rules/prisma-db.md`                                              | FK @relation・DB 値域制約ルール追加                                                 |
| 修正           | `.claude/rules/coding-style.md`                                           | load関数 try-catch・auth 監査・success フラグ・Dead Code ルール追加                 |
| 修正           | `.claude/rules/testing.md`                                                | `vi.stubEnv` ルール追加                                                             |

---

## Phase 1: テスト品質改善

### Task 1: vi.stubEnv パターンへ移行（atcoder_verification.test.ts）

**Files:**

- Modify: `src/features/account/services/atcoder_verification.test.ts:1-60`

- [ ] **Step 1: テスト実行（修正前の失敗確認は不要。現在パスしていることを確認）**

```bash
pnpm test:unit -- atcoder_verification
```

Expected: 全テスト PASS

- [ ] **Step 2: `beforeEach` / `afterEach` の手動 `process.env` を `vi.stubEnv` に置換**

ファイル冒頭の import に `afterAll` を追加し、以下のように変更する:

```typescript
// 変更前
beforeEach(() => {
  process.env.CONFIRM_API_URL = SAMPLE_API_URL;
});

afterEach(() => {
  delete process.env.CONFIRM_API_URL;
});

// 変更後
beforeEach(() => {
  vi.stubEnv('CONFIRM_API_URL', SAMPLE_API_URL);
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

- [ ] **Step 3: テスト再実行**

```bash
pnpm test:unit -- atcoder_verification
```

Expected: 全テスト PASS（11件）

- [ ] **Step 4: コミット**

```bash
git add src/features/account/services/atcoder_verification.test.ts
git commit -m "test: migrate process.env manual stubs to vi.stubEnv in atcoder_verification tests"
```

---

### Task 2: users.ts 単体テスト追加

**Files:**

- Create: `src/test/lib/services/users.test.ts`

- [ ] **Step 1: テストファイルを作成（実装なし・FAIL 確認用）**

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { User } from '@prisma/client';

vi.mock('$lib/server/database', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import db from '$lib/server/database';
import { getUser, getUserById, deleteUser } from '$lib/services/users';

const mockFindUnique = vi.mocked(db.user.findUnique);
const mockDelete = vi.mocked(db.user.delete);

// Type-safe fixture (no `as any`)
type UserWithAccount = User & {
  atCoderAccount: {
    userId: string;
    handle: string;
    isValidated: boolean;
    validationCode: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

const SAMPLE_USER: UserWithAccount = {
  id: 'user-abc123',
  username: 'testuser',
  atCoderAccount: {
    userId: 'user-abc123',
    handle: 'testuser_ac',
    isValidated: true,
    validationCode: 'code-xyz',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
} as UserWithAccount;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUser', () => {
  test('returns user with atCoderAccount when found', async () => {
    mockFindUnique.mockResolvedValueOnce(SAMPLE_USER);

    const result = await getUser('testuser');

    expect(result).toEqual(SAMPLE_USER);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { username: 'testuser' },
      include: { atCoderAccount: true },
    });
  });

  test('returns null when user is not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getUser('nonexistent');

    expect(result).toBeNull();
  });
});

describe('getUserById', () => {
  test('returns user with atCoderAccount when found', async () => {
    mockFindUnique.mockResolvedValueOnce(SAMPLE_USER);

    const result = await getUserById('user-abc123');

    expect(result).toEqual(SAMPLE_USER);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-abc123' },
      include: { atCoderAccount: true },
    });
  });

  test('returns null when user is not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getUserById('nonexistent-id');

    expect(result).toBeNull();
  });
});

describe('deleteUser', () => {
  test('deletes user and subsequent getUser returns null', async () => {
    mockDelete.mockResolvedValueOnce(SAMPLE_USER);
    mockFindUnique.mockResolvedValueOnce(null);

    const deleteResult = await deleteUser('testuser');

    expect(deleteResult).toEqual(SAMPLE_USER);
    expect(mockDelete).toHaveBeenCalledWith({ where: { username: 'testuser' } });

    // Verify that the user is actually deleted (subsequent getUser returns null)
    const getResult = await getUser('testuser');
    expect(getResult).toBeNull();
  });
});
```

- [ ] **Step 2: テスト実行（FAIL 確認）**

```bash
pnpm test:unit -- src/test/lib/services/users
```

Expected: テストファイルが存在しないためエラー（または関数が存在しないため FAIL）

- [ ] **Step 3: テスト実行（PASS 確認）**

実装は `src/lib/services/users.ts` に既存（変更不要）。

```bash
pnpm test:unit -- src/test/lib/services/users
```

Expected: 5件 PASS

- [ ] **Step 4: コミット**

```bash
git add src/test/lib/services/users.test.ts
git commit -m "test: add unit tests for getUser, getUserById, and deleteUser"
```

---

## Phase 2: サービス・ルート修正

### Task 3: MIN_VOTES_FOR_STATISTICS を export し hardcode を除去

**Files:**

- Modify: `src/features/votes/services/vote_grade.ts:27`
- Modify: `src/routes/votes/[slug]/+page.svelte:46`

- [ ] **Step 1: vote_grade.ts の定数を export に変更**

```typescript
// 変更前（line 27）
const MIN_VOTES_FOR_STATISTICS = 3;

// 変更後
export const MIN_VOTES_FOR_STATISTICS = 3;
```

- [ ] **Step 2: votes/[slug]/+page.svelte の hardcode を置換**

import を追加し、Tooltip テキストを定数参照に変更:

```typescript
// script 内の import に追加
import { MIN_VOTES_FOR_STATISTICS } from '$features/votes/services/vote_grade';
```

```svelte
<!-- 変更前（line 46） -->
3票以上集まると中央値が暫定グレードとして一覧表に反映されます。

<!-- 変更後 -->
{MIN_VOTES_FOR_STATISTICS}票以上集まると中央値が暫定グレードとして一覧表に反映されます。
```

- [ ] **Step 3: 型チェック**

```bash
pnpm check
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/features/votes/services/vote_grade.ts src/routes/votes/[slug]/+page.svelte
git commit -m "refactor: export MIN_VOTES_FOR_STATISTICS and remove hardcoded '3' in votes page"
```

---

### Task 4: upsertVoteGradeTables の戻り値を { success: true } に変更

**Files:**

- Modify: `src/features/votes/services/vote_grade.ts:30-34`
- Modify: `src/features/votes/actions/vote_actions.ts:54-58`

- [ ] **Step 1: vote_grade.ts の関数シグネチャと戻り値を変更**

```typescript
// 変更前
export async function upsertVoteGradeTables(
  userId: string,
  taskId: string,
  grade: TaskGrade,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // ...
  });
}

// 変更後
export async function upsertVoteGradeTables(
  userId: string,
  taskId: string,
  grade: TaskGrade,
): Promise<{ success: true }> {
  await prisma.$transaction(async (tx) => {
    // ... (内容変更なし)
  });
  return { success: true };
}
```

- [ ] **Step 2: vote_actions.ts でサービスの戻り値を返すよう変更**

```typescript
// 変更前
try {
  await upsertVoteGradeTables(userId, taskId, grade);
} catch (error) {
  console.error('Failed to vote absolute grade: ', error);
  return fail(INTERNAL_SERVER_ERROR, { message: 'Failed to record vote.' });
}
// (暗黙の undefined return → SvelteKit が success として扱う)

// 変更後
try {
  return await upsertVoteGradeTables(userId, taskId, grade);
} catch (error) {
  console.error('Failed to vote absolute grade: ', error);
  return fail(INTERNAL_SERVER_ERROR, { message: 'Failed to record vote.' });
}
```

- [ ] **Step 3: 型チェック**

```bash
pnpm check
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/features/votes/services/vote_grade.ts src/features/votes/actions/vote_actions.ts
git commit -m "refactor: make upsertVoteGradeTables return { success: true } for explicit action response"
```

---

### Task 5: vote_management の updateTask に 404 エラー処理を追加

**Files:**

- Modify: `src/routes/(admin)/vote_management/+page.server.ts:54`

- [ ] **Step 1: `updateTask` 呼び出しを try/catch で囲む**

Prisma の `P2025`（RecordNotFound）を明示的に処理する。import を追加:

```typescript
import { Prisma } from '@prisma/client';
```

アクション内を変更:

```typescript
// 変更前（line 54-55）
await updateTask(taskId, grade as TaskGrade);
return { success: true };

// 変更後
try {
  await updateTask(taskId, grade as TaskGrade);
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return { success: false, message: `Not found task: ${taskId}` };
  }

  throw error;
}
return { success: true };
```

- [ ] **Step 2: 型チェック**

```bash
pnpm check
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/routes/(admin)/vote_management/+page.server.ts
git commit -m "fix: handle RecordNotFound error in setTaskGrade action for vote_management"
```

---

## Phase 3: UI コンポーネント改善

### Task 6: SubmissionButton loading prop + FormWrapper isSubmitting context

**Files:**

- Modify: `src/lib/components/SubmissionButton.svelte`
- Modify: `src/lib/components/FormWrapper.svelte`

- [ ] **Step 1: SubmissionButton に loading prop を追加し getContext で自動取得**

`SubmissionButton.svelte` の内容を差し替え:

```svelte
<script lang="ts">
  import { getContext } from 'svelte';

  import { Button } from 'flowbite-svelte';

  interface Props {
    width?: string;
    labelName: string;
    loading?: boolean;
  }

  let { width = 'w-full', labelName, loading = false }: Props = $props();

  // FormWrapper が setContext('form', ...) でセットしている場合、自動的に isSubmitting を受け取る。
  // FormWrapper 外で使う場合は context が undefined になるため ?? false でフォールバック。
  const formContext = getContext<{ isSubmitting: boolean } | undefined>('form');
  const isLoading = $derived(loading || (formContext?.isSubmitting ?? false));
</script>

<Button type="submit" class={width} loading={isLoading}>{labelName}</Button>
```

- [ ] **Step 2: FormWrapper に isSubmitting state と setContext を追加**

`FormWrapper.svelte` の内容を差し替え:

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    method?: 'POST' | 'GET' | 'DIALOG' | 'post' | 'get' | 'dialog' | null | undefined;
    action: string;
    marginTop?: string;
    spaceYAxis?: string;
    children?: Snippet;
  }

  let {
    method = 'POST',
    action,
    marginTop = 'mt-6',
    spaceYAxis = 'space-y-6',
    children,
  }: Props = $props();

  let isSubmitting = $state(false);

  setContext('form', {
    get isSubmitting() {
      return isSubmitting;
    },
  });

  function handleEnhance() {
    isSubmitting = true;

    return async ({ update }: { update: () => Promise<void> }) => {
      await update();
      isSubmitting = false;
    };
  }
</script>

<form
  {method}
  {action}
  class={`w-full max-w-md ${marginTop} ${spaceYAxis}`}
  use:enhance={handleEnhance}
>
  {#if children}
    {@render children()}
  {/if}
</form>
```

- [ ] **Step 3: 型チェック**

```bash
pnpm check
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/lib/components/SubmissionButton.svelte src/lib/components/FormWrapper.svelte
git commit -m "feat: add loading state to SubmissionButton via FormWrapper context (prevent double-submit)"
```

---

### Task 7: AtCoderVerificationForm ボタン間隔追加 + Flowbite Clipboard 導入

**Files:**

- Modify: `src/features/account/components/settings/AtCoderVerificationForm.svelte`

- [ ] **Step 1: ボタン間隔追加（8c）とリセット FormWrapper に `marginTop` を指定**

`status === 'generated'` ブロックの2つ目の `FormWrapper` を変更（現在 `marginTop=""` が未指定で隙間なし）:

```svelte
<!-- 変更前（line 127） -->
<FormWrapper action="?/reset" marginTop="">

<!-- 変更後 -->
<FormWrapper action="?/reset" marginTop="mt-4">
```

- [ ] **Step 2: Flowbite Clipboard 導入（8d）**

`AtCoderVerificationForm.svelte` の `<script>` 上部を変更:

```typescript
// 削除するインポート
import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';

// 追加するインポート
import { Clipboard } from 'flowbite-svelte';
import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';
import Check from '@lucide/svelte/icons/check';
```

カスタム `copyToClipboard` 関数と `handleClick` 関数を**削除**する（lines 11-69 の該当部分）。

`TODO` コメントも削除する（lines 10 と 65）。

- [ ] **Step 3: クリップボード UI を Flowbite Clipboard コンポーネントに置換**

`status === 'generated'` ブロックのクリップボード部分を変更:

```svelte
<!-- 変更前（lines 113-122） -->
<Label class="flex flex-col gap-2">
  <span>本人確認用の文字列</span>
  <div>
    <Input size="md" value={atCoderAccount.validationCode}>
      {#snippet right()}
        <ClipboardCopy class="w-5 h-5" onclick={handleClick} />
      {/snippet}
    </Input>
  </div>
</Label>

<!-- 変更後 -->
<Label class="flex flex-col gap-2">
  <span>本人確認用の文字列</span>
  <div class="flex items-center gap-2">
    <Input size="md" value={atCoderAccount.validationCode} readonly />

    <Clipboard value={atCoderAccount.validationCode}>
      {#snippet children(success)}
        {#if success}
          <Check class="w-5 h-5 text-green-500" />
        {:else}
          <ClipboardCopy class="w-5 h-5" />
        {/if}
      {/snippet}
    </Clipboard>
  </div>
</Label>
```

- [ ] **Step 4: 型チェック**

```bash
pnpm check
```

Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/features/account/components/settings/AtCoderVerificationForm.svelte
git commit -m "feat: add button gap and replace custom clipboard with Flowbite Clipboard in AtCoderVerificationForm"
```

---

## Phase 4: 投票 API 関数抽出 + fetch 改善

### Task 8: vote_grade.ts 作成（fetch credentials 追加 + internal_clients 層として実装）

**Files:**

- Create: `src/features/votes/internal_clients/vote_grade.ts`
- Create: `src/features/votes/internal_clients/vote_grade.test.ts`

- [ ] **Step 1: テストファイルを先に作成（TDD）**

```typescript
// src/features/votes/internal_clients/vote_grade.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

import { TaskGrade } from '$lib/types/task';

import { fetchMyVote, submitVote, fetchMedianVote } from './vote_grade';

beforeEach(() => {
  nock.cleanAll();
});

afterEach(() => {
  nock.cleanAll();
});

describe('fetchMyVote', () => {
  test('returns grade when server responds with a voted grade', async () => {
    nock('http://localhost')
      .get('/problems/getMyVote')
      .query({ taskId: 'abc_a' })
      .reply(200, { grade: TaskGrade.Q11 });

    const result = await fetchMyVote('abc_a');

    expect(result).toBe(TaskGrade.Q11);
  });

  test('returns null when server responds with null grade', async () => {
    nock('http://localhost')
      .get('/problems/getMyVote')
      .query({ taskId: 'abc_a' })
      .reply(200, { grade: null });

    const result = await fetchMyVote('abc_a');

    expect(result).toBeNull();
  });

  test('returns null when server responds with non-ok status', async () => {
    nock('http://localhost').get('/problems/getMyVote').query({ taskId: 'abc_a' }).reply(401);

    const result = await fetchMyVote('abc_a');

    expect(result).toBeNull();
  });
});

describe('submitVote', () => {
  test('returns true when server responds with ok status', async () => {
    const formData = new FormData();
    formData.append('taskId', 'abc_a');
    formData.append('grade', TaskGrade.Q11);

    nock('http://localhost').post('/votes?/voteAbsoluteGrade').reply(200, { success: true });

    const result = await submitVote(new URL('http://localhost/votes?/voteAbsoluteGrade'), formData);

    expect(result).toBe(true);
  });

  test('returns false when server responds with error status', async () => {
    const formData = new FormData();

    nock('http://localhost').post('/votes?/voteAbsoluteGrade').reply(500);

    const result = await submitVote(new URL('http://localhost/votes?/voteAbsoluteGrade'), formData);

    expect(result).toBe(false);
  });

  test('returns false when request is aborted', async () => {
    const formData = new FormData();
    const controller = new AbortController();
    controller.abort();

    const result = await submitVote(
      new URL('http://localhost/votes?/voteAbsoluteGrade'),
      formData,
      controller.signal,
    );

    expect(result).toBe(false);
  });
});

describe('fetchMedianVote', () => {
  test('returns grade when server responds with a median grade', async () => {
    nock('http://localhost')
      .get('/problems/getMedianVote')
      .query({ taskId: 'abc_a' })
      .reply(200, { grade: TaskGrade.Q10 });

    const result = await fetchMedianVote('abc_a');

    expect(result).toBe(TaskGrade.Q10);
  });

  test('returns null when server responds with null grade', async () => {
    nock('http://localhost')
      .get('/problems/getMedianVote')
      .query({ taskId: 'abc_a' })
      .reply(200, { grade: null });

    const result = await fetchMedianVote('abc_a');

    expect(result).toBeNull();
  });

  test('returns null when server responds with non-ok status', async () => {
    nock('http://localhost').get('/problems/getMedianVote').query({ taskId: 'abc_a' }).reply(500);

    const result = await fetchMedianVote('abc_a');

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: テスト実行（FAIL 確認）**

```bash
pnpm test:unit -- vote_grade
```

Expected: `vote_grade.ts` が存在しないため import エラー

- [ ] **Step 3: vote_grade.ts を実装**

```typescript
// src/features/votes/internal_clients/vote_grade.ts
import type { TaskGrade } from '$lib/types/task';

/**
 * Fetches the current user's vote grade for a given task.
 * @returns The voted grade, or null if not voted or request fails.
 */
export async function fetchMyVote(taskId: string): Promise<TaskGrade | null> {
  try {
    const response = await fetch(`/problems/getMyVote?taskId=${encodeURIComponent(taskId)}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return (data.grade as TaskGrade) ?? null;
  } catch {
    return null;
  }
}

/**
 * Submits a vote via POST to the given action URL.
 * @param signal - Optional AbortSignal to cancel an in-flight request.
 * @returns true if the server responded with ok status, false otherwise.
 */
export async function submitVote(
  action: URL,
  formData: FormData,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const response = await fetch(action, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal,
    });

    return response.ok;
  } catch {
    // AbortError or network error
    return false;
  }
}

/**
 * Fetches the current median vote grade for a given task.
 * @returns The median grade, or null if not enough votes or request fails.
 */
export async function fetchMedianVote(taskId: string): Promise<TaskGrade | null> {
  try {
    const response = await fetch(`/problems/getMedianVote?taskId=${encodeURIComponent(taskId)}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return (data.grade as TaskGrade) ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: テスト実行（PASS 確認）**

```bash
pnpm test:unit -- vote_grade
```

Expected: 9件 PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/votes/internal_clients/vote_grade.ts src/features/votes/internal_clients/vote_grade.test.ts
git commit -m "feat: extract fetchMyVote, submitVote, fetchMedianVote to vote_grade service with credentials: same-origin"
```

---

### Task 9: VotableGrade.svelte を vote_grade.ts 利用 + AbortController 連打対策

**Files:**

- Modify: `src/features/votes/components/VotableGrade.svelte`

- [ ] **Step 1: import を追加し、vote_grade.ts の関数で既存 fetch を置換**

`<script>` の import セクションに追加:

```typescript
import { fetchMyVote, submitVote, fetchMedianVote } from '$features/votes/internal_clients/vote_grade';
```

`onTriggerClick` 関数を置換（fetch 直接呼び出しを `fetchMyVote` に変更）:

```typescript
// 変更前
async function onTriggerClick() {
  if (!isLoggedIn || isAtCoderVerified === false || isOpening) return;
  isOpening = true;
  try {
    const res = await fetch(
      `/problems/getMyVote?taskId=${encodeURIComponent(taskResult.task_id)}`,
      {
        headers: { Accept: 'application/json' },
      },
    );
    if (res.ok) {
      const data = await res.json();
      votedGrade = data.grade;
    }
  } catch (err) {
    console.error(err);
  } finally {
    isOpening = false;
  }
}

// 変更後
async function onTriggerClick() {
  if (!isLoggedIn || isAtCoderVerified === false || isOpening) {
    return;
  }
  isOpening = true;
  try {
    votedGrade = await fetchMyVote(taskResult.task_id);
  } catch (err) {
    console.error(err);
  } finally {
    isOpening = false;
  }
}
```

- [ ] **Step 2: AbortController を追加し handleClick で連打対策**

`let isOpening = $state(false);` の直後に追加:

```typescript
let voteAbortController: AbortController | null = null;
```

`handleClick` 関数を変更:

```typescript
// 変更前
async function handleClick(voteGrade: string): Promise<void> {
  selectedVoteGrade = getTaskGrade(voteGrade);
  showForm = true;
  await tick();
  formElement?.requestSubmit();
}

// 変更後
async function handleClick(voteGrade: string): Promise<void> {
  // Cancel any in-flight vote request before starting a new one.
  voteAbortController?.abort();
  voteAbortController = new AbortController();
  selectedVoteGrade = getTaskGrade(voteGrade);
  showForm = true;
  await tick();
  formElement?.requestSubmit();
}
```

- [ ] **Step 3: handleSubmit の fetch を submitVote / fetchMedianVote に置換し signal を渡す**

```typescript
// 変更前
const handleSubmit = () => {
  return ({ formData, action, cancel }: EnhanceForVote) => {
    cancel();

    fetch(action, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('vote failed');

        votedGrade = selectedVoteGrade ?? null;

        try {
          const taskId = formData.get('taskId') as string;
          const medianRes = await fetch(
            `/problems/getMedianVote?taskId=${encodeURIComponent(taskId)}`,
            { headers: { Accept: 'application/json' } },
          );
          if (medianRes.ok) {
            const data = await medianRes.json();
            if (data?.grade && taskResult.grade === TaskGrade.PENDING) displayGrade = data.grade;
          }
        } catch (err) {
          console.error('Failed to fetch median after vote', err);
        }
      })
      .catch((error) => {
        console.error('Failed to update submission status: ', error);
        errorMessageStore.setAndClearAfterTimeout(FAILED_TO_UPDATE_VOTE_STATUS, 10000);
      })
      .finally(() => {
        resetDropdown();
      });

    return () => {};
  };
};

// 変更後
const handleSubmit = () => {
  return ({ formData, action, cancel }: EnhanceForVote) => {
    cancel();

    const signal = voteAbortController?.signal;

    submitVote(action, formData, signal)
      .then(async (succeeded) => {
        if (!succeeded) {
          throw new Error('vote failed');
        }

        votedGrade = selectedVoteGrade ?? null;

        const taskId = formData.get('taskId') as string;
        const medianGrade = await fetchMedianVote(taskId);
        if (medianGrade !== null && taskResult.grade === TaskGrade.PENDING) {
          displayGrade = medianGrade;
        }
      })
      .catch((error) => {
        console.error('Failed to update submission status: ', error);
        errorMessageStore.setAndClearAfterTimeout(FAILED_TO_UPDATE_VOTE_STATUS, 10000);
      })
      .finally(() => {
        resetDropdown();
      });

    return () => {};
  };
};
```

- [ ] **Step 4: 型チェック**

```bash
pnpm check
```

Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/features/votes/components/VotableGrade.svelte
git commit -m "refactor: use vote_grade.ts in VotableGrade and add AbortController for rapid-click protection"
```

---

## Phase 5: E2E テスト修正

### Task 10: votes.spec.ts セレクタ修正 + 初期状態対応

**Files:**

- Modify: `e2e/votes.spec.ts`

現在の誤ったセレクタと正しい値の対応:

| 現在の値                                                 | 正しい値                       | 理由                                                  |
| -------------------------------------------------------- | ------------------------------ | ----------------------------------------------------- |
| `getByRole('heading', { name: 'グレード投票' })`         | `'投票'`                       | `votes/+page.svelte` の `<HeadingOne title="投票" />` |
| `getByRole('columnheader', { name: '問題' })`            | `'問題名'`                     | `<TableHeadCell>問題名</TableHeadCell>`               |
| `getByRole('columnheader', { name: 'コンテスト' })`      | `'出典'`                       | `<TableHeadCell>出典</TableHeadCell>`                 |
| `getByPlaceholder('問題名・問題ID・コンテストIDで検索')` | `'問題名・問題ID・出典で検索'` | `<Input placeholder="問題名・問題ID・出典で検索">`    |

- [ ] **Step 1: heading セレクタを修正（2箇所: lines 17, 36）**

```typescript
// 変更前
await expect(page.getByRole('heading', { name: 'グレード投票' })).toBeVisible(...)

// 変更後
await expect(page.getByRole('heading', { name: '投票' })).toBeVisible(...)
```

- [ ] **Step 2: columnheader セレクタを修正（3箇所: lines 24, 27, 65）**

```typescript
// 変更前
await expect(page.getByRole('columnheader', { name: '問題' })).toBeVisible(...)
await expect(page.getByRole('columnheader', { name: 'コンテスト' })).toBeVisible(...)

// 変更後
await expect(page.getByRole('columnheader', { name: '問題名' })).toBeVisible(...)
await expect(page.getByRole('columnheader', { name: '出典' })).toBeVisible(...)
```

- [ ] **Step 3: placeholder セレクタを修正（line 43）**

```typescript
// 変更前
const searchInput = page.getByPlaceholder('問題名・問題ID・コンテストIDで検索');

// 変更後
const searchInput = page.getByPlaceholder('問題名・問題ID・出典で検索');
```

- [ ] **Step 4: navigateToFirstVoteDetailPage に初期状態スキップを追加**

`navigateToFirstVoteDetailPage` でタスクが存在しない場合にテストをスキップする:

```typescript
async function navigateToFirstVoteDetailPage(page: Page): Promise<void> {
  await page.goto(VOTES_LIST_URL);
  await expect(page.getByRole('columnheader', { name: '問題名' })).toBeVisible({
    timeout: TIMEOUT,
  });

  const firstLink = page.locator('table').getByRole('link').first();
  const hasTask = await firstLink.isVisible();
  if (!hasTask) {
    // No tasks in DB — skip navigation-dependent tests.
    return;
  }

  await firstLink.click();
  await expect(page).toHaveURL(/\/votes\/.+/, { timeout: TIMEOUT });
}
```

また、`navigateToFirstVoteDetailPage` を使う各テストに `test.skip` 条件を追加:

```typescript
test('can view the task detail page without redirect', async ({ page }) => {
  await navigateToFirstVoteDetailPage(page);
  const onDetailPage = page.url().match(/\/votes\/.+/);
  test.skip(!onDetailPage, 'no tasks available in DB');
  // ...
});
```

- [ ] **Step 5: E2E テスト実行（ローカル環境で確認）**

```bash
pnpm test:e2e -- votes
```

Expected: セレクタ起因の FAIL がなくなる

- [ ] **Step 6: コミット**

```bash
git add e2e/votes.spec.ts
git commit -m "fix: correct stale selectors in votes E2E tests and add initial state skip conditions"
```

---

## Phase 6: DB 制約追加

### Task 11: CHECK 制約追加（count >= 0 と grade != 'PENDING'）

**Files:**

- Modify: `prisma/schema.prisma` (コメント追加)
- Create: migration (2ステップで作成・適用)
- Modify: `prisma/ERD.md`

> ⚠️ Prisma は `@@check` をサポートしていない。migration.sql を手動編集してから適用する。

- [ ] **Step 1: migration を作成のみ（適用しない）**

```bash
pnpm exec prisma migrate dev --create-only --name add_vote_grade_check_constraints
```

Expected: `prisma/migrations/YYYYMMDD.../migration.sql` が生成される

- [ ] **Step 2: 生成された migration.sql に CHECK 制約を手動追加**

生成された `migration.sql` の末尾に追加:

```sql
-- VotedGradeCounter.count must never go negative (application guard + DB last line of defense)
ALTER TABLE "VotedGradeCounter" ADD CONSTRAINT "votedgradecounter_count_non_negative"
  CHECK (count >= 0);

-- VoteGrade.grade must not be PENDING (only non-pending grades are valid votes)
ALTER TABLE "VoteGrade" ADD CONSTRAINT "votegrade_grade_not_pending"
  CHECK (grade != 'PENDING');

-- VotedGradeCounter.grade must not be PENDING
ALTER TABLE "VotedGradeCounter" ADD CONSTRAINT "votedgradecounter_grade_not_pending"
  CHECK (grade != 'PENDING');

-- VotedGradeStatistics.grade must not be PENDING (median must be a real grade)
ALTER TABLE "VotedGradeStatistics" ADD CONSTRAINT "votedgradestatistics_grade_not_pending"
  CHECK (grade != 'PENDING');
```

- [ ] **Step 3: migration を適用**

```bash
pnpm exec prisma migrate dev
```

Expected: migration が適用される（エラーなし）

- [ ] **Step 4: schema.prisma に dual-enforcement コメントを追加**

`VotedGradeCounter` の `count` フィールドにコメントを追加:

```prisma
// count is also constrained by CHECK (count >= 0) in migration SQL (DB last line of defense).
// Application layer guards this via decrementOldGradeCounter (WHERE count > 0).
count     Int
```

`VoteGrade.grade`, `VotedGradeCounter.grade`, `VotedGradeStatistics.grade` にコメントを追加:

```prisma
// CHECK (grade != 'PENDING') enforced in migration SQL. Application layer uses NON_VOTABLE_GRADES guard.
grade     TaskGrade
```

- [ ] **Step 5: ERD.md に CHECK 制約を追記**

`prisma/ERD.md` の該当モデル箇所に追記:

```markdown
%% CHECK constraint: votedgradecounter_count_non_negative — count >= 0
%% CHECK constraint: votegrade_grade_not_pending — grade != 'PENDING'
%% CHECK constraint: votedgradecounter_grade_not_pending — grade != 'PENDING'
%% CHECK constraint: votedgradestatistics_grade_not_pending — grade != 'PENDING'
```

- [ ] **Step 6: コミット**

```bash
git add prisma/schema.prisma prisma/migrations/ prisma/ERD.md
git commit -m "feat: add CHECK constraints for vote grade models (count >= 0, grade != PENDING)"
```

---

## Phase 7: rules/ 更新

### Task 12: .claude/rules/ に新規規約を追加

**Files:**

- Modify: `.claude/rules/svelte-components.md`
- Modify: `.claude/rules/prisma-db.md`
- Modify: `.claude/rules/coding-style.md`
- Modify: `.claude/rules/testing.md`

- [ ] **Step 1: svelte-components.md に SSR 安全性・{#each} キー式ルールを追加**

`svelte-components.md` の末尾に追加:

```markdown
## SSR Safety: Non-Deterministic IDs

Do not use `crypto.randomUUID()` or `Math.random()` in component initialization code that runs during SSR. These produce different values on server and client, causing hydration mismatches. Derive component IDs deterministically from prop values (e.g. `const componentId = item.task_id`).

## `{#each}` — Key Expression Required

Every `{#each}` block must include a key expression `(item.id)`. Keyless `{#each}` causes incorrect DOM reuse and hard-to-debug update bugs. Prefer a unique domain field; fall back to the index `(i)` only when no unique field exists.
```

- [ ] **Step 2: prisma-db.md に FK @relation・DB 値域制約ルールを追加**

`prisma-db.md` の末尾に追加:

````markdown
## FK Relations: Always Define @relation

Any field that references another model's ID must have an explicit `@relation` defined. Without `@relation`, Prisma does not generate FK constraints automatically, leading to referential integrity gaps.

```prisma
// Bad: FK without @relation
userId String

// Good: explicit @relation generates FK constraint
userId String
user   User @relation(fields: [userId], references: [id])
```
````

## DB-Level Value Constraints

Add `CHECK` constraints (via manual migration SQL) for:

- `count` fields that must be non-negative (`count >= 0`)
- Enum fields where specific values are invalid at the DB level (e.g. `grade != 'PENDING'`)

Document every `CHECK` constraint in `prisma/ERD.md` — it is the only place they are visible outside migration SQL.

````

- [ ] **Step 3: coding-style.md に load 関数・auth 監査・success フラグ・Dead Code ルールを追加**

`coding-style.md` の末尾に追加:

```markdown
## `+page.server.ts` load() Error Handling

Wrap calls to service functions in try-catch and return safe default values on failure, preventing a single service error from crashing the entire page.

## Auth: Action Audit

When adding an auth guard to one action in `+page.server.ts`, audit all other actions in the same file. Asymmetric guards (some actions protected, others not) are a recurring pattern of vulnerability.

## Auth: success Flag and message Consistency

When an action returns `success: false`, the `message` and `message_type` must also reflect failure. A success flag contradicting the message message is a silent bug.

## Dead Code Deletion: Three-Condition Rule

Before deleting a function, grep the full project for callers. Deletion is safe only when all three conditions hold: (1) zero callers, (2) a replacement implementation exists, (3) any fields this function wrote to are also being deleted.
```

- [ ] **Step 4: testing.md に vi.stubEnv ルールを追加**

`testing.md` の末尾に追加:

````markdown
## Environment Variable Stubs

Use `vi.stubEnv(key, value)` + `vi.unstubAllEnvs()` instead of manually assigning `process.env[key]` and deleting it in cleanup. `vi.stubEnv` syncs `import.meta.env` as well and accurately restores the original value:

```typescript
// Bad
beforeEach(() => {
  process.env.MY_URL = 'https://example.com';
});
afterEach(() => {
  delete process.env.MY_URL;
});

// Good
beforeEach(() => {
  vi.stubEnv('MY_URL', 'https://example.com');
});
afterEach(() => {
  vi.unstubAllEnvs();
});
```
````

````

- [ ] **Step 5: コミット**

```bash
git add .claude/rules/
git commit -m "docs: add new coding rules derived from PR #3316 review (SSR, FK, auth, env stubs)"
````

---

## 検証方法

```bash
# 単体テスト（全件）
pnpm test:unit

# 型チェック
pnpm check

# lint
pnpm lint

# E2E テスト（votes 関連）
pnpm test:e2e -- votes

# フォーマット（コミット前）
pnpm format
```

### 動作確認チェックリスト

- [ ] `AtCoderVerificationForm`: 文字列生成ボタン押下中に Spinner が表示され、二重送信不可
- [ ] `AtCoderVerificationForm`: クリップボードアイコンクリック後にチェックマークアニメーション表示
- [ ] `AtCoderVerificationForm`: 「本人確認」と「リセット」ボタン間に適切な隙間
- [ ] `VotableGrade`: グレードを連打しても最後のリクエストのみ処理される
- [ ] `votes/[slug]`: 投票閾値ツールチップが定数参照（`MIN_VOTES_FOR_STATISTICS`）に基づいて表示
- [ ] vote_management: 存在しない taskId で `setTaskGrade` を呼んでも 500 ではなく `{ success: false }` が返る
- [ ] DB: `VotedGradeCounter.count` に負の値を INSERT しようとすると CHECK 制約違反エラー
