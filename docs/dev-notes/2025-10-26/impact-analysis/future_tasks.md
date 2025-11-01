# 後続タスク：ContestTaskPair キー形式変更（Workbooks 対応）

**作成日**: 2025-10-26
**対象**: `/workbooks`, `/workbooks/[slug]` ページの互換性対応
**優先度**: 低（後続フェーズ）

---

## 概要

`pre_plan.md` では `/problems` ページの `/problems` ページ対応を優先としていますが、以下の点から workbooks ページの互換性対応も実装が必要になる可能性があります：

1. **`getTaskResultsByTaskId()` の戻り値型変更**
   - 現在: `Map<string, TaskResult>` (キー: `taskId` のみ)
   - 新: `Map<ContestTaskPairKey, TaskResult>` (キー: `"contestId:taskId"`)
   - workbooks ページがこの関数を呼び出すため、型の一貫性維持が必要

2. **`getTaskResultsOnlyResultExists()` の修正**
   - `mergeTaskAndAnswer()` への統合（冗長排除）
   - `with_map=true` の場合、キー形式を composite key に変更

3. **ページ側の修正**
   - `src/routes/workbooks/[slug]/+page.server.ts`
   - `src/routes/workbooks/[slug]/+page.svelte`

---

## Phase 3-A: `getTaskResultsByTaskId()` と呼び出し元の修正

### Step 3-A-1: `getTaskResultsByTaskId()` 修正

**ファイル**: `src/lib/services/task_results.ts` (行 190-231)

**現在のコード**:

```typescript
export async function getTaskResultsByTaskId(
  workBookTasks: WorkBookTasksBase,
  userId: string,
): Promise<Map<string, TaskResult>> {
  const startTime = Date.now();

  // ... (処理)

  const taskResultsMap = new Map<string, TaskResult>();

  for (const taskId of taskIds) {
    const task = tasksMap.get(taskId);
    if (!task) continue;

    const answer = answersMap.get(taskId);
    const taskResult = mergeTaskAndAnswer(task, userId, answer);

    taskResultsMap.set(taskId, taskResult); // ← キー: taskId のみ
  }

  return taskResultsMap;
}
```

**修正後のコード**:

```typescript
export async function getTaskResultsByTaskId(
  workBookTasks: WorkBookTasksBase,
  userId: string,
): Promise<TaskResultMapByContestTaskPair> {
  // ← 戻り値型変更
  const startTime = Date.now();

  // ... (処理は同じ)

  const taskResultsMap = new Map<ContestTaskPairKey, TaskResult>();

  for (const taskId of taskIds) {
    const task = tasksMap.get(taskId);
    if (!task) continue;

    const answer = answersMap.get(taskId);
    const taskResult = mergeTaskAndAnswer(task, userId, answer);

    // キー形式を "contestId:taskId" に変更
    const key = createContestTaskPairKey(task.contest_id, taskId);
    taskResultsMap.set(key, taskResult);
  }

  return taskResultsMap;
}
```

**必要なインポート追加**:

```typescript
import type {
  ContestTaskPairKey,
  TaskResultMapByContestTaskPair,
} from '$lib/types/contest_task_pair';
import { createContestTaskPairKey } from '$lib/utils/contest_task_pair';
```

#### チェックリスト

- [ ] 関数の戻り値型を `TaskResultMapByContestTaskPair` に変更
- [ ] Map の型定義を `Map<ContestTaskPairKey, TaskResult>` に変更
- [ ] ループ内で `createContestTaskPairKey()` を使用してキー生成
- [ ] `task.contest_id` が null でないことを確認
- [ ] インポート追加

---

### Step 3-A-2: ページサーバー側の修正

**ファイル**: `src/routes/workbooks/[slug]/+page.server.ts`

#### 修正前

```typescript
const taskResults: Map<string, TaskResult> = await taskResultsCrud.getTaskResultsByTaskId(
  workBook.workBookTasks,
  loggedInUser?.id as string,
);
```

#### 修正後

```typescript
const taskResults: TaskResultMapByContestTaskPair = await taskResultsCrud.getTaskResultsByTaskId(
  workBook.workBookTasks,
  loggedInUser?.id as string,
);
```

**インポート追加**:

```typescript
import type { TaskResultMapByContestTaskPair } from '$lib/types/contest_task_pair';
```

#### チェックリスト

- [ ] 型定義を `TaskResultMapByContestTaskPair` に変更
- [ ] インポート追加

---

### Step 3-A-3: ページコンポーネント側の修正

**ファイル**: `src/routes/workbooks/[slug]/+page.svelte`

#### 現在のコード

```svelte
<script lang="ts">
  // ...
  let taskResults: Map<string, TaskResult> = $state(new Map());

  // ...

  // どこかで使用される
  return taskResults?.get(taskId) as TaskResult;
</script>
```

#### 修正後

```svelte
<script lang="ts">
  import { createContestTaskPairKey } from '$lib/utils/contest_task_pair';
  import type { TaskResultMapByContestTaskPair } from '$lib/types/contest_task_pair';

  // ...
  let taskResults: TaskResultMapByContestTaskPair = $state(new Map());

  // ...

  // workbook に含まれるタスクから contestId を取得
  // または workbookTask から取得可能か確認
  const key = createContestTaskPairKey(workbook.contest_id, taskId);
  // または
  const key = createContestTaskPairKey(taskResult.contest_id, taskId);

  return taskResults?.get(key) as TaskResult;
</script>
```

**⚠️ 注意**: workbook/[slug] で `contestId` を確実に取得できるか詳細な調査が必要

#### チェックリスト

- [ ] 型定義を `TaskResultMapByContestTaskPair` に変更
- [ ] `.get(taskId)` を `.get(createContestTaskPairKey(...))` に変更
- [ ] `contestId` の取得元を確定
- [ ] インポート追加

---

## Phase 3-B: `getTaskResultsOnlyResultExists()` 修正（オプション）

### Step 3-B-1: `getTaskResultsOnlyResultExists()` 修正

**ファイル**: `src/lib/services/task_results.ts` (行 154-179)

**現在のコード**:

```typescript
export async function getTaskResultsOnlyResultExists(
  userId: string,
  with_map: boolean = false,
): Promise<TaskResults | Map<string, TaskResult>> {
  // ... (処理)

  if (with_map) {
    return taskResultsMap; // Map<string, TaskResult> で返却
  } else {
    return taskResultsWithAnswer; // TaskResults[] で返却
  }
}
```

**修正後**:

```typescript
export async function getTaskResultsOnlyResultExists(
  userId: string,
  with_map: boolean = false,
): Promise<TaskResults | TaskResultMapByContestTaskPair> {
  const tasks = await getTasks();
  const answers = await answer_crud.getAnswers(userId);

  const tasksHasAnswer = tasks.filter((task) => answers.has(task.task_id));

  // ⭐ mergeTaskAndAnswer を使用（重複排除）
  const taskResults = tasksHasAnswer.map((task: Task) => {
    const answer = answers.get(task.task_id);
    return mergeTaskAndAnswer(userId, task, answer);
  });

  if (with_map) {
    const taskResultsMap = new Map<ContestTaskPairKey, TaskResult>();
    taskResults.forEach((tr) => {
      const key = createContestTaskPairKey(tr.contest_id, tr.task_id);
      taskResultsMap.set(key, tr);
    });
    return taskResultsMap;
  }

  return taskResults;
}
```

**重要ポイント**:

1. `mergeTaskAndAnswer()` を使用して重複排除
2. `with_map=true` の場合、キーを `"contestId:taskId"` に変更
3. 型を `TaskResultMapByContestTaskPair` に変更

#### チェックリスト

- [ ] `map()` で `mergeTaskAndAnswer()` を使用
- [ ] `with_map=true` の場合、キーを composite key に
- [ ] 型定義を更新
- [ ] インポート追加

---

### Step 3-B-2: 呼び出し元の確認と修正

**使用箇所調査**:

```bash
grep -r "getTaskResultsOnlyResultExists" src/ --include="*.ts" --include="*.svelte"
```

見つかった呼び出し元の型を確認し、必要に応じて修正。

#### チェックリスト

- [ ] 呼び出し元を grep で検索
- [ ] `with_map=true` で呼ばれている箇所を確認
- [ ] 型を `TaskResultMapByContestTaskPair` に更新

---

## Phase 3-C: テスト追加

### Step 3-C-1: workbooks 関連テスト追加

**ファイル**: `src/test/lib/services/task_results.test.ts` (既存ファイルに追加)

```typescript
describe('getTaskResultsByTaskId', () => {
  // ✅ テストケース 1: 戻り値型
  it('should return Map<ContestTaskPairKey, TaskResult>', async () => {
    // Arrange
    const mockWorkbookTasks = [...];
    const mockUserId = 'test_user_123';

    // Act
    const result = await getTaskResultsByTaskId(mockWorkbookTasks, mockUserId);

    // Assert
    expect(result).toBeInstanceOf(Map);
  });

  // ✅ テストケース 2: キー形式
  it('should use "contestId:taskId" format as key', async () => {
    const entries = Array.from(result.entries());
    entries.forEach(([key, _]) => {
      expect(key).toMatch(/.*:.*$/);  // "xxx:yyy" 形式
    });
  });

  // ✅ テストケース 3: 複数 contestId 対応
  it('should handle multiple contestIds with same taskId', async () => {
    const key1 = createContestTaskPairKey('abc101', 'arc099_a');
    const key2 = createContestTaskPairKey('arc099', 'arc099_a');

    expect(key1).not.toBe(key2);
  });

  // ✅ テストケース 4: 空配列
  it('should return empty map for empty workbook tasks', async () => {
    const result = await getTaskResultsByTaskId([], mockUserId);
    expect(result.size).toBe(0);
  });
});

describe('getTaskResultsOnlyResultExists', () => {
  // ✅ テストケース 5: with_map=false
  it('should return TaskResults array when with_map=false', async () => {
    const result = await getTaskResultsOnlyResultExists('user_123', false);
    expect(Array.isArray(result)).toBe(true);
  });

  // ✅ テストケース 6: with_map=true キー形式
  it('should return Map with composite key when with_map=true', async () => {
    const result = await getTaskResultsOnlyResultExists('user_123', true);
    expect(result).toBeInstanceOf(Map);

    const entries = Array.from(result.entries());
    entries.forEach(([key, _]) => {
      expect(key).toMatch(/.*:.*$/);
    });
  });

  // ✅ テストケース 7: mergeTaskAndAnswer 統合確認
  it('should use mergeTaskAndAnswer for all results', async () => {
    const result = await getTaskResultsOnlyResultExists('user_123', false);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((tr) => {
      // TaskResult が正しくマージされていることを確認
      expect(tr.contest_id).toBeDefined();
      expect(tr.task_id).toBeDefined();
    });
  });
});
```

#### チェックリスト

- [ ] テストケース追加
- [ ] テスト実行確認

---

## Phase 3-D: 目視テスト

### Step 3-D-1: `/workbooks` ページ確認

**URL**: `http://localhost:5174/workbooks`

#### 確認項目

| #   | 項目             | 期待値     | 確認方法       |
| --- | ---------------- | ---------- | -------------- |
| 1   | ページ表示       | 正常に表示 | ブラウザで確認 |
| 2   | workbook リスト  | 複数行表示 | UI 確認        |
| 3   | コンソールエラー | エラーなし | ブラウザ F12   |

#### チェックリスト

- [ ] ページ表示正常
- [ ] workbook リスト表示正常
- [ ] コンソールエラーなし

---

### Step 3-D-2: `/workbooks/[slug]` ページ確認

**URL**: `http://localhost:5174/workbooks/stack` (例)

#### 確認項目

| #   | 項目             | 期待値                              | 確認方法                |
| --- | ---------------- | ----------------------------------- | ----------------------- |
| 1   | ページ表示       | 正常に表示                          | ブラウザで確認          |
| 2   | タスク一覧       | 複数タスク表示                      | UI 確認                 |
| 3   | タスク状態更新   | 更新が反映                          | UI 操作                 |
| 4   | コンソールエラー | エラーなし                          | ブラウザ F12            |
| 5   | 複数 contestId   | 同一 taskId の複数 contestId を表示 | UI 確認（必要に応じて） |

#### チェックリスト

- [ ] ページ表示正常
- [ ] タスク一覧表示正常
- [ ] 状態更新機能正常
- [ ] コンソールエラーなし

---

## 実装チェックリスト

### ✅ Phase 3-A 完了（必須）

- [ ] `getTaskResultsByTaskId()` 戻り値型変更
- [ ] ページサーバー型更新
- [ ] ページコンポーネント型更新
- [ ] `contestId` 取得元確定
- [ ] インポート追加

### ✅ Phase 3-B 完了（オプション）

- [ ] `getTaskResultsOnlyResultExists()` 修正（判断後）
- [ ] 呼び出し元の型更新

### ✅ Phase 3-C 完了

- [ ] テスト追加
- [ ] テスト全成功

### ✅ Phase 3-D 完了

- [ ] `/workbooks` ページ確認
- [ ] `/workbooks/[slug]` ページ確認
- [ ] コンソールエラーなし

---

## 予想される実装工数

| フェーズ           | 項目                                              | 工数                         |
| ------------------ | ------------------------------------------------- | ---------------------------- |
| Phase 3-A-1        | `getTaskResultsByTaskId()` 修正                   | 20 分                        |
| Phase 3-A-2        | ページサーバー型更新                              | 5 分                         |
| Phase 3-A-3        | ページコンポーネント修正                          | 15 分                        |
| **Phase 3-A 小計** |                                                   | **40 分**                    |
| Phase 3-B-1        | `getTaskResultsOnlyResultExists()` 修正（判断後） | 15 分                        |
| Phase 3-B-2        | 呼び出し元修正                                    | 10 分                        |
| **Phase 3-B 小計** |                                                   | **25 分**（オプション）      |
| Phase 3-C          | テスト追加                                        | 15 分                        |
| Phase 3-D          | 目視テスト                                        | 20 分                        |
| **合計**           |                                                   | **1.5 時間（Phase 3-A～D）** |
| **合計（B 含む）** |                                                   | **2 時間**                   |

---

## 実装上の注意

### ⚠️ Workbook での contestId の取得

**問題**: workbook に複数の contestId が含まれる可能性がある

**調査項目**:

1. WorkBook テーブルに `contest_id` カラムがあるか
2. WorkBookTask テーブルに `contest_id` カラムがあるか
3. `/workbooks/[slug]/+page.svelte` でタスクを表示する際、どこから `contestId` を取得するか

**判定方法**: DB スキーマと実装を確認

---

## 関連ドキュメント

- `pre_plan.md`: `/problems` ページの実装計画（優先）
- `report.md`: 包括的な影響範囲分析
- `phase1-findings.md`: 初期調査結果
- `phase2-analysis.md`: 深い技術分析

---

**次ステップ**: `pre_plan.md` の実装完了後、このドキュメントに基づいて Phase 3-A～D を段階的に実装。
