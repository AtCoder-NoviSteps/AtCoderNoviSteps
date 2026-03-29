# AtCoder 認証済みユーザーのみ投票可能にする 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AtCoderアカウント認証済みのユーザーのみグレード投票を行えるようにし、未認証ユーザーをプロフィール編集ページへ誘導する。

**Architecture:** 既存の `locals.user.is_validated`（`hooks.server.ts` で注入済み）を活用してサーバーサイドで投票を拒否し、クライアント側 UI でも認証状態に応じた表示に切り替える。未認証時に表示する「認証が必要」プロンプトは投票に関わる 2 箇所（`/votes/[slug]` 詳細ページ・`/problems` 一覧の `VotableGrade` ドロップダウン）に追加する。さらに無効化されていた AtCoder 認証タブを `/users/edit` ページで再度有効化する。

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes, TypeScript, Flowbite Svelte, Vitest (unit), Playwright (e2e)

---

## ファイル変更一覧

| 操作 | ファイル                                                               | 変更内容                                                     |
| ---- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| 修正 | `src/lib/constants/navbar-links.ts`                                    | `EDIT_PROFILE_PAGE` 定数を追加                               |
| 修正 | `src/lib/components/AtCoderUserValidationForm.svelte`                  | `$bindable` を除去、editable input を local `$state` で管理  |
| 修正 | `src/routes/users/edit/+page.svelte`                                   | AtCoder タブを再有効化、タブ選択を `$derived` で制御         |
| 修正 | `src/features/votes/actions/vote_actions.ts`                           | `locals.user?.is_validated` チェックを追加 (FORBIDDEN 403)   |
| 修正 | `src/routes/votes/[slug]/+page.server.ts`                              | `isAtCoderVerified` を load 戻り値に追加                     |
| 修正 | `src/routes/votes/[slug]/+page.svelte`                                 | 未認証ユーザーへの誘導 UI を追加                             |
| 修正 | `src/routes/problems/+page.server.ts`                                  | `isAtCoderVerified` を load 戻り値に追加                     |
| 修正 | `src/routes/problems/+page.svelte`                                     | `isAtCoderVerified` を `TaskTable` に渡す                    |
| 修正 | `src/features/tasks/components/contest-table/TaskTable.svelte`         | `isAtCoderVerified` prop を追加し `TaskTableBodyCell` に渡す |
| 修正 | `src/features/tasks/components/contest-table/TaskTableBodyCell.svelte` | `isAtCoderVerified` prop を追加し `VotableGrade` に渡す      |
| 修正 | `src/features/votes/components/VotableGrade.svelte`                    | `isAtCoderVerified` prop を追加し未認証時に誘導 UI を表示    |
| 修正 | `src/features/votes/services/vote_grade.test.ts`                       | 未認証ユーザーの投票を拒否するテストを追加                   |

---

## フェーズ概要

| フェーズ | 内容                                                                    | リスク               |
| -------- | ----------------------------------------------------------------------- | -------------------- |
| Phase 1  | `EDIT_PROFILE_PAGE` 定数追加                                            | 低                   |
| Phase 2  | `AtCoderUserValidationForm` のリファクタリングと認証タブの再有効化      | 中（既存 UI 修正）   |
| Phase 3  | `vote_actions.ts` にサーバーサイド認証チェックを追加                    | 低                   |
| Phase 4  | `/votes/[slug]` ページへの認証チェックと UI 追加                        | 低                   |
| Phase 5  | `/problems` ページ・コンポーネントチェーンへの `isAtCoderVerified` 伝播 | 中（多ファイル変更） |

---

## 設計上の判断と却下した代替案

### `is_validated` の取得方法

- **採用**: `locals.user?.is_validated`（`hooks.server.ts` で DB から取得済みの値を再利用）
- **却下**: `vote_actions.ts` で直接 DB を呼ぶ → 不要な DB 呼び出しが増える

### AtCoderUserValidationForm の `$bindable` 除去

- **採用**: 各入力値は hidden input + `value={prop}` で送信し、編集可能なフィールドのみ child の local `$state` で管理する
- **却後**: 親で `$effect` を使って `$state` を data に同期させる → AGENTS.md で `$state` + `$effect` より `$derived` を優先することが明示されているため不採用
- **却後**: 全フィールドを `$derived` にする → フォーム入力中に書き換えができなくなる

### タブ選択の制御方法

- **採用**: サーバー状態（`data.atcoder_username`, `data.atcoder_validationcode`, `data.is_validated`）から `$derived` でタブ開閉を決定する → フォーム送信後も正しいタブが表示される
- **却後**: `form?.is_tab_atcoder` フラグのみに依存する → ページリロード後に状態が失われる

### 未認証ユーザーへの誘導

- **採用**: クライアント UI で投票 UI を「認証が必要です」プロンプトに置き換え、`/users/edit` へのリンクを表示
- **却後**: 投票試行時にサーバーエラーのみを表示する → UX が悪い
- **却後**: `/users/edit` へ自動リダイレクト → 意図しないナビゲーションになる

---

## Phase 1: `EDIT_PROFILE_PAGE` 定数を追加

**Files:**

- Modify: `src/lib/constants/navbar-links.ts`

- [ ] **Step 1: 定数を追加する**

```typescript
// src/lib/constants/navbar-links.ts に追加
export const EDIT_PROFILE_PAGE = `/users/edit`;
```

- [ ] **Step 2: lint を実行して問題がないことを確認する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/lib/constants/navbar-links.ts
git commit -m "feat: add EDIT_PROFILE_PAGE constant"
```

---

## Phase 2: AtCoder 認証タブの修正と再有効化

**Files:**

- Modify: `src/lib/components/AtCoderUserValidationForm.svelte`
- Modify: `src/routes/users/edit/+page.svelte`

### 背景

`AtCoderUserValidationForm` の `$bindable` props がフォーム送信後のタブリセット不具合の原因。サーバーが権威的なデータソースなので、hidden input は `value={prop}` で送信すれば十分。編集可能な AtCoder ID フィールドのみ子コンポーネントの local `$state` で管理する。

### AtCoderUserValidationForm の変更

`username`・`atcoder_validationcode` の `$bindable()` を除去し、`atcoder_username` の編集可能部分は local `$state` で管理する。

- [ ] **Step 1: AtCoderUserValidationForm を修正する**

```svelte
<!-- src/lib/components/AtCoderUserValidationForm.svelte -->
<script lang="ts">
  import { Label, Input, P } from 'flowbite-svelte';
  import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard successfully');
    } catch (error) {
      // Fallback for older browsers that do not support the Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        console.log('Text copied fallback method');
      } catch (fallbackError) {
        console.error('Both Clipboard API and fallback failed:', error, fallbackError);
      }

      document.body.removeChild(textArea);
    }
  };

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  interface Props {
    username: string;
    atcoder_username: string;
    atcoder_validationcode: string;
    status: string;
  }

  let { username, atcoder_username, atcoder_validationcode, status }: Props = $props();

  // Editable only in 'nothing' step; server is authoritative after each action.
  let editableAtcoderId = $state(atcoder_username);

  const handleClick = () => {
    copyToClipboard(atcoder_validationcode);
  };
</script>

{#if status === 'nothing'}
  <ContainerWrapper>
    <FormWrapper action="?/generate" marginTop="">
      <h3 class="text-xl text-center mt-6 font-medium text-gray-900 dark:text-white">
        本人確認の準備中
      </h3>
      <P size="base" class="mt-6">AtCoder IDを入力し、本人確認用の文字列を生成してください。</P>
      <Input size="md" type="hidden" name="username" value={username} />
      <LabelWrapper labelName="ユーザ名" inputValue={username} />
      <Label class="flex flex-col gap-2">
        <span>AtCoder ID</span>
        <Input
          size="md"
          name="atcoder_username"
          placeholder="chokudai"
          bind:value={editableAtcoderId}
        />
      </Label>
      <SubmissionButton labelName="文字列を生成" />
    </FormWrapper>
  </ContainerWrapper>
{:else if status === 'generated'}
  <ContainerWrapper>
    <FormWrapper action="?/validate" marginTop="">
      <h3 class="text-xl text-center mt-6 font-medium text-gray-900 dark:text-white">本人確認中</h3>
      <P size="base" class="mt-6">
        AtCoderの所属欄に生成した文字列を貼り付けてから、「本人確認」ボタンを押してください。
      </P>
      <Input size="md" type="hidden" name="username" value={username} />
      <LabelWrapper labelName="ユーザ名" inputValue={username} />
      <Input size="md" type="hidden" name="atcoder_username" value={atcoder_username} />
      <LabelWrapper labelName="AtCoder ID" inputValue={atcoder_username} />
      <Input size="md" type="hidden" name="atcoder_validationcode" value={atcoder_validationcode} />
      <Label class="flex flex-col gap-2">
        <span>本人確認用の文字列</span>
        <div>
          <Input size="md" value={atcoder_validationcode}>
            {#snippet right()}
              <ClipboardCopy class="w-5 h-5" onclick={handleClick} />
            {/snippet}
          </Input>
        </div>
      </Label>
      <SubmissionButton labelName="本人確認" />
    </FormWrapper>
    <FormWrapper action="?/reset" marginTop="">
      <Input size="md" type="hidden" name="username" value={username} />
      <Input size="md" type="hidden" name="atcoder_username" value={atcoder_username} />
      <SubmissionButton labelName="リセット" />
    </FormWrapper>
  </ContainerWrapper>
{:else if status === 'validated'}
  <ContainerWrapper>
    <FormWrapper action="?/reset">
      <h3 class="text-xl text-center font-medium text-gray-900 dark:text-white">本人確認済</h3>
      <Input size="md" type="hidden" name="username" value={username} />
      <LabelWrapper labelName="ユーザ名" inputValue={username} />
      <Input size="md" type="hidden" name="atcoder_username" value={atcoder_username} />
      <LabelWrapper labelName="AtCoder ID" inputValue={atcoder_username} />
      <SubmissionButton labelName="リセット" />
    </FormWrapper>
  </ContainerWrapper>
{/if}
```

- [ ] **Step 2: `+page.svelte` を修正して AtCoder タブを再有効化する**

変更ポイント:

- `form` prop を追加（`svelte/valid-prop-names-in-kit-pages` では `data` と `form` のみ許可）
- `AtCoderUserValidationForm` のインポートをコメントアウト解除
- `status`・`shouldOpenAtCoderTab` を `$derived` で導出
- AtCoder タブの `open` prop を `shouldOpenAtCoderTab` で制御

```svelte
<!-- src/routes/users/edit/+page.svelte -->
<script lang="ts">
  import { Tabs, TabItem, Alert } from 'flowbite-svelte';

  import AtCoderUserValidationForm from '$lib/components/AtCoderUserValidationForm.svelte';
  import UserAccountDeletionForm from '$lib/components/UserAccountDeletionForm.svelte';
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';

  import { Roles } from '$lib/types/user';

  interface Props {
    data: {
      userId: string;
      username: string;
      role: Roles;
      isLoggedIn: boolean;
      atcoder_username: string;
      atcoder_validationcode: string;
      is_validated: boolean;
      message_type: string;
      message: string;
    };
    form: Record<string, unknown> | null;
  }

  let { data, form }: Props = $props();

  let role = data.role;
  let username = data.username;
  let message = data.message;
  let message_type = data.message_type;

  // Status is derived exclusively from server-authoritative data.
  // After each form action, SvelteKit re-runs load(), so data reflects the latest DB state.
  const status = $derived(
    data.is_validated
      ? 'validated'
      : data.atcoder_username.length > 0 && data.atcoder_validationcode.length > 0
        ? 'generated'
        : 'nothing',
  );

  // Open the AtCoder tab when the user is in any step of the verification flow.
  // Also check form?.is_tab_atcoder as extra safety in case load() hasn't reflected the action yet.
  const shouldOpenAtCoderTab = $derived(
    data.is_validated ||
      (data.atcoder_username.length > 0 && data.atcoder_validationcode.length > 0) ||
      form?.is_tab_atcoder === true,
  );

  const isGeneralUser = (userRole: Roles, userName: string) => {
    return userRole === Roles.USER && userName !== 'guest';
  };
</script>

{#if message_type === 'default'}
  <Alert>
    <span class="font-medium">Message:</span>
    {message}
  </Alert>
{:else if message_type === 'green'}
  <Alert color="green">
    <span class="font-medium">Success alert!</span>
    Change a few things up and try submitting again.
  </Alert>
{/if}

<div class="container mx-auto w-5/6 lg:w-3/4">
  <Tabs
    tabStyle="underline"
    contentClass="bg-white dark:bg-gray-800"
    ulClass="flex flex-wrap md:flex-nowrap md:gap-2 rtl:space-x-reverse items-start"
  >
    <!-- 基本情報 -->
    <TabItem open={!shouldOpenAtCoderTab}>
      {#snippet titleSlot()}
        <span class="text-lg">基本情報</span>
      {/snippet}
      <ContainerWrapper>
        <FormWrapper action="update">
          <LabelWrapper labelName="ユーザ名" inputValue={username} />
        </FormWrapper>
      </ContainerWrapper>
    </TabItem>

    <!-- AtCoder IDを利用した認証 -->
    <TabItem open={shouldOpenAtCoderTab}>
      {#snippet titleSlot()}
        <span class="text-lg">AtCoder IDを設定</span>
      {/snippet}
      <AtCoderUserValidationForm
        {username}
        atcoder_username={data.atcoder_username}
        atcoder_validationcode={data.atcoder_validationcode}
        {status}
      />
    </TabItem>

    <!-- アカウント削除 (ゲストを除いた一般ユーザのみ) -->
    {#if isGeneralUser(role, username)}
      <TabItem>
        {#snippet titleSlot()}
          <span class="text-lg">アカウント削除</span>
        {/snippet}
        <UserAccountDeletionForm {username} />
      </TabItem>
    {/if}
  </Tabs>
</div>
```

- [ ] **Step 3: lint と型チェックを実行する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
docker exec atcodernovisteps-web-1 pnpm check
```

期待: エラーなし

- [ ] **Step 4: コミットする**

```bash
git add src/lib/components/AtCoderUserValidationForm.svelte src/routes/users/edit/+page.svelte
git commit -m "feat: re-enable AtCoder verification tab on /users/edit"
```

---

## Phase 3: サーバーサイド認証チェックを vote_actions に追加

**Files:**

- Modify: `src/features/votes/actions/vote_actions.ts`
- Modify: `src/features/votes/services/vote_grade.test.ts` (テストのモック更新は不要 — actions テストは e2e で担う)

### 判断

`locals.user` は `hooks.server.ts` が DB から取得し注入する。`is_validated` は `boolean | null` で、`true` 以外はすべて未認証として扱う。

- [ ] **Step 1: `vote_actions.ts` に検証チェックを追加する**

```typescript
// セッションチェックの直後に追記
if (!locals.user?.is_validated) {
  return fail(FORBIDDEN, {
    message: 'AtCoderアカウントの認証が必要です。',
  });
}
```

完成形:

```typescript
import { fail } from '@sveltejs/kit';
import { TaskGrade } from '@prisma/client';

import { upsertVoteGradeTables } from '$features/votes/services/vote_grade';
import {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from '$lib/constants/http-response-status-codes';

const NON_VOTABLE_GRADES = new Set<string>([TaskGrade.PENDING]);

export const voteAbsoluteGrade = async ({
  request,
  locals,
}: {
  request: Request;
  locals: App.Locals;
}) => {
  const formData = await request.formData();
  const session = await locals.auth.validate();

  if (!session || !session.user || !session.user.userId) {
    return fail(UNAUTHORIZED, {
      message: 'ログインしていないか、もしくは、ログイン情報が不正です。',
    });
  }

  if (!locals.user?.is_validated) {
    return fail(FORBIDDEN, {
      message: 'AtCoderアカウントの認証が必要です。',
    });
  }

  const userId = session.user.userId;
  const taskIdRaw = formData.get('taskId');
  const gradeRaw = formData.get('grade');

  if (
    typeof taskIdRaw !== 'string' ||
    !taskIdRaw ||
    typeof gradeRaw !== 'string' ||
    !(Object.values(TaskGrade) as string[]).includes(gradeRaw) ||
    NON_VOTABLE_GRADES.has(gradeRaw)
  ) {
    return fail(BAD_REQUEST, { message: 'Invalid request parameters.' });
  }

  const taskId = taskIdRaw;
  const grade = gradeRaw as TaskGrade;

  try {
    await upsertVoteGradeTables(userId, taskId, grade);
  } catch (error) {
    console.error('Failed to vote absolute grade: ', error);
    return fail(INTERNAL_SERVER_ERROR, { message: 'Failed to record vote.' });
  }
};
```

- [ ] **Step 2: unit test を追加する**

`vote_actions.ts` のサービス層に直接テストを書くのは難しい（`locals` の mock が複雑なため）が、`vote_grade.ts` の service 層テストには影響しない。action レベルは e2e でカバーする。unit test は不要。

- [ ] **Step 3: lint・型チェック・unit tests を実行する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
docker exec atcodernovisteps-web-1 pnpm test:unit
```

期待: エラーなし、全テスト通過

- [ ] **Step 4: コミットする**

```bash
git add src/features/votes/actions/vote_actions.ts
git commit -m "feat: require AtCoder verification to cast a grade vote"
```

---

## Phase 4: `/votes/[slug]` ページに認証状態チェックと誘導 UI を追加

**Files:**

- Modify: `src/routes/votes/[slug]/+page.server.ts`
- Modify: `src/routes/votes/[slug]/+page.svelte`

- [ ] **Step 1: `+page.server.ts` に `isAtCoderVerified` を追加する**

```typescript
// load 戻り値に追加
return {
  task,
  myVote,
  counters,
  stats,
  isLoggedIn: session !== null,
  isAtCoderVerified: locals.user?.is_validated === true,
};
```

- [ ] **Step 2: `+page.svelte` に未認証ユーザー向け誘導 UI を追加する**

`{:else if data.isLoggedIn}` (未投票・ログイン済み) のブロックを分割し、AtCoder 未認証の場合は認証への誘導を表示する。

`EDIT_PROFILE_PAGE` は `$lib/constants/navbar-links` からインポートし、`<script>` 内で `editProfileHref` として事前計算する（`svelte/no-navigation-without-resolve` ルール対応）:

```svelte
import {EDIT_PROFILE_PAGE} from '$lib/constants/navbar-links'; // ... // @ts-expect-error svelte-check
TS2554: AppTypes declaration merging causes RouteId to resolve as string, requiring params. Runtime behavior
is correct. const editProfileHref = resolve(EDIT_PROFILE_PAGE);
```

```svelte
<!-- 投票UI の else if data.isLoggedIn ブロックを以下に置き換え -->
{:else if data.isLoggedIn && !data.isAtCoderVerified}
  <!-- AtCoder 未認証 -->
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
    <p class="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
      投票するにはAtCoderアカウントの認証が必要です。
    </p>
    <Button href={editProfileHref} color="yellow" size="sm">
      AtCoderアカウントを認証する
    </Button>
  </div>
{:else if data.isLoggedIn}
  <!-- 未投票・ログイン済み・認証済み → 投票フォーム -->
```

注意: `resolve` は既にインポート済み。`Button` は既に `flowbite-svelte` からインポート済み。

- [ ] **Step 3: lint・型チェックを実行する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
docker exec atcodernovisteps-web-1 pnpm check
```

- [ ] **Step 4: コミットする**

```bash
git add src/routes/votes/[slug]/+page.server.ts src/routes/votes/[slug]/+page.svelte
git commit -m "feat: show AtCoder verification prompt on vote detail page for unverified users"
```

---

## Phase 5: `/problems` 一覧ページの `VotableGrade` に認証状態を伝播

**Files:**

- Modify: `src/routes/problems/+page.server.ts`
- Modify: `src/routes/problems/+page.svelte`
- Modify: `src/features/tasks/components/contest-table/TaskTable.svelte`
- Modify: `src/features/tasks/components/contest-table/TaskTableBodyCell.svelte`
- Modify: `src/features/votes/components/VotableGrade.svelte`

### Props チェーン

```
+page.server.ts (isAtCoderVerified)
  → +page.svelte (data.isAtCoderVerified)
    → TaskTable (isAtCoderVerified prop)
      → TaskTableBodyCell (isAtCoderVerified prop)
        → VotableGrade (isAtCoderVerified prop)
```

- [ ] **Step 1: `problems/+page.server.ts` に `isAtCoderVerified` を追加する**

`+page.server.ts` の load 関数には `tagIds != null` と `else` の **2つの `return` 分岐** がある。両方に `isAtCoderVerified` を追加すること:

```typescript
// tagIds != null の場合
if (tagIds != null) {
  return {
    taskResults: (await task_crud.getTasksWithTagIds(tagIds, session?.user.userId)) as TaskResults,
    voteResults,
    isAdmin: isAdmin,
    isLoggedIn: isLoggedIn,
    isAtCoderVerified: locals.user?.is_validated === true,
  };
} else {
  return {
    taskResults: (await task_crud.getTaskResults(session?.user.userId)) as TaskResults,
    voteResults,
    isAdmin: isAdmin,
    isLoggedIn: isLoggedIn,
    isAtCoderVerified: locals.user?.is_validated === true,
  };
}
```

- [ ] **Step 2: `problems/+page.svelte` から `TaskTable` に渡す**

```svelte
let isAtCoderVerified: boolean = data.isAtCoderVerified; // contestTable snippet 内:
<TaskTable {taskResults} {isLoggedIn} {isAtCoderVerified} {voteResults} />
```

- [ ] **Step 3: `TaskTable.svelte` に `isAtCoderVerified` prop を追加して `TaskTableBodyCell` に渡す**

```typescript
interface Props {
  taskResults: TaskResults;
  isLoggedIn: boolean;
  isAtCoderVerified: boolean;
  voteResults: VoteStatisticsMap;
}
let { taskResults, isLoggedIn, isAtCoderVerified, voteResults }: Props = $props();
```

`TaskTableBodyCell` の呼び出し箇所:

```svelte
<TaskTableBodyCell {taskResult} {isLoggedIn} {isAtCoderVerified} {voteResults} ... />
```

- [ ] **Step 4: `TaskTableBodyCell.svelte` に `isAtCoderVerified` prop を追加して `VotableGrade` に渡す**

```typescript
interface Props {
  taskResult: TaskResult;
  isLoggedIn: boolean;
  isAtCoderVerified: boolean;
  isShownTaskIndex: boolean;
  voteResults: VoteStatisticsMap;
  onupdate?: (updatedTask: TaskResult) => void;
}
```

```svelte
<VotableGrade {taskResult} {isLoggedIn} {isAtCoderVerified} {estimatedGrade} />
```

- [ ] **Step 5: `VotableGrade.svelte` に `isAtCoderVerified` prop を追加して未認証時の UI を実装する**

Props に追加:

```typescript
interface Props {
  taskResult: TaskResult;
  isLoggedIn: boolean;
  isAtCoderVerified?: boolean;
  estimatedGrade?: string;
}
```

`EDIT_PROFILE_PAGE` を `$lib/constants/navbar-links` からインポートし、`<script>` 内で事前計算する:

```typescript
import { EDIT_PROFILE_PAGE } from '$lib/constants/navbar-links';
// ...
// @ts-expect-error svelte-check TS2554: AppTypes declaration merging causes RouteId to resolve as string, requiring params. Runtime behavior is correct.
const editProfileHref = resolve(EDIT_PROFILE_PAGE);
```

ログイン済み・未認証の場合のドロップダウンコンテンツ:

```svelte
{#if isLoggedIn && isAtCoderVerified !== false}
  <!-- 既存の投票ドロップダウン -->
  <Dropdown ...>
    {#each nonPendingGrades as grade (grade)}
      ...
    {/each}
    <DropdownDivider />
    <DropdownItem href={...}>詳細</DropdownItem>
  </Dropdown>
{:else if isLoggedIn}
  <!-- ログイン済み・未認証 → 認証誘導 -->
  <Dropdown triggeredBy={...} simple class="w-40 z-50 ...">
    <DropdownItem href={editProfileHref} class="rounded-md text-sm text-yellow-700 dark:text-yellow-300">
      AtCoder認証が必要です
    </DropdownItem>
  </Dropdown>
{:else}
  <!-- 未ログイン -->
  <Dropdown ...>
    <DropdownItem href={SIGNUP_PAGE} ...>アカウント作成</DropdownItem>
    <DropdownDivider />
    <DropdownItem href={LOGIN_PAGE} ...>ログイン</DropdownItem>
  </Dropdown>
{/if}
```

注意:

- `EDIT_PROFILE_PAGE` を `$lib/constants/navbar-links` からインポートする
- `isAtCoderVerified` がない（undefined）の場合は認証済みとして扱う（`isAtCoderVerified !== false` でチェック）
- `isAtCoderVerified` が `false` の場合のみ誘導を表示する

また、未認証ユーザーが誤って `onTriggerClick` でAPI呼び出しをしないよう、`isAtCoderVerified` も確認する:

```typescript
async function onTriggerClick() {
  if (!isLoggedIn || isAtCoderVerified === false || isOpening) return;
  // ...
}
```

- [ ] **Step 6: lint・型チェック・unit tests を実行する**

```bash
docker exec atcodernovisteps-web-1 pnpm lint
docker exec atcodernovisteps-web-1 pnpm check
docker exec atcodernovisteps-web-1 pnpm test:unit
```

期待: エラーなし、全テスト通過

- [ ] **Step 7: コミットする**

```bash
git add \
  src/routes/problems/+page.server.ts \
  src/routes/problems/+page.svelte \
  src/features/tasks/components/contest-table/TaskTable.svelte \
  src/features/tasks/components/contest-table/TaskTableBodyCell.svelte \
  src/features/votes/components/VotableGrade.svelte
git commit -m "feat: propagate isAtCoderVerified to VotableGrade dropdown on problems page"
```

---

## 動作確認チェックリスト

- [ ] 未ログインユーザー: 投票ドロップダウンに「アカウント作成」「ログイン」が表示される
- [ ] ログイン済み・未認証ユーザー: 投票ドロップダウンに「AtCoder認証が必要です」リンクが表示される
- [ ] ログイン済み・未認証ユーザー: `/votes/[slug]` で「AtCoderアカウントを認証する」ボタンが表示される
- [ ] ログイン済み・未認証ユーザー: フォームを直接送信しようとすると 403 が返る
- [ ] ログイン済み・認証済みユーザー: 通常通り投票ドロップダウンが表示され投票できる
- [ ] `/users/edit` の「AtCoder IDを設定」タブが開く
- [ ] 「文字列を生成」送信後、基本情報タブではなく AtCoder タブのまま表示が切り替わる
- [ ] 「本人確認」成功後、「本人確認済」が表示される
- [ ] 「リセット」後、「本人確認の準備中」に戻る
