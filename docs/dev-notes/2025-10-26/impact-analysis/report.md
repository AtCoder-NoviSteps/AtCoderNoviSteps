# ContestTaskPair キー形式変更 - 影響範囲分析最終レポート

**作成日**: 2025-10-26

**更新日**: 2025-11-01

**対象ブランチ**: #2750

**目的**: `contestId:taskId` 形式へのキー統一による全影響範囲の把握と計画策定

---

## I. エグゼクティブサマリー

### 修正の理由と背景

同一の `taskId` で登録されている問題が、異なる `contestId` で出題されている場合がある。データベースの `Task` テーブルの `taskId` unique 制約を維持しながら、これに対応するため **`ContestTaskPair` テーブル** を導入。

**新キー形式**: `"contestId:taskId"` （テンプレートリテラル型: `ContestTaskPairKey`）

### 関連ドキュメント

- [Contest-Task Pair Mapping 実装計画](../../2025-09-23/contest-task-pair-mapping/plan.md) - DB 設計・型定義の決定
- [contest_task_pairs データ投入処理](../../2025-10-22/add-contest-task-pairs-to-seeds/plan.md) - Seed データ投入実装
- [getMergedTasksMap リファクタリング教訓](../../2025-10-25/refactor-getMergedTasksMap/lesson.md) - ベストプラクティス・テスト設計

---

## II. 影響範囲の全体像

### 修正対象の階層構造

```text
レイヤ0: サービス層
├─ src/lib/services/task_results.ts
│  ├─ getTaskResults() 🔴 必須
│  ├─ getTasksWithTagIds() 🔴 必須
│  ├─ getTaskResultsByTaskId() 🟡 オプション
│  ├─ getTaskResultsOnlyResultExists() 🟡 オプション
│  └─ mergeTaskAndAnswer() 📋 確認

レイヤ1: ページサーバー層
├─ src/routes/problems/+page.server.ts ✅ 配列のまま（変更不要）
├─ src/routes/problems/[slug]/+page.server.ts ✅ 単一参照（変更不要）
├─ src/routes/workbooks/[slug]/+page.server.ts 🟡 互換性維持（将来対応）
└─ src/routes/users/[username]/+page.server.ts ✅ 間接的（変更不要）

レイヤ2: コンポーネント層
├─ src/lib/components/TaskTable.svelte 🔴 必須
├─ src/lib/components/TaskGradeList.svelte ✅ グレード別フィルタ（変更不要）
├─ src/lib/components/TaskList.svelte ✅ 複合キー既使用（変更不要）
├─ src/lib/components/TaskTableBodyCell.svelte ✅ 参照のみ（変更不要）
├─ src/lib/components/TaskListSorted.svelte ✅ 配列走査（変更不要）
└─ src/lib/components/UpdatingModal.svelte 📋 確認

レイヤ3: ユーティリティ層
├─ src/lib/utils/task.ts ✅ 非依存
├─ src/lib/utils/contest.ts ✅ 非依存
├─ src/lib/utils/contest_task_pair.ts ✅ キーヘルパー
└─ src/lib/utils/account_transfer.ts 📋 taskId 依存

レイヤ4: テスト層
├─ src/test/lib/utils/contest_task_pair.test.ts ✅ キー関数テスト
└─ src/test/lib/services/task_results.test.ts ✅ TaskResults のCRUD に関するテスト
```

---

## III. 直接的な修正対象（必須）

### 3.0 サービス層：getTaskResults()（優先度 最高）

**ファイル**: `src/lib/services/task_results.ts` (行 29-37)

**現状**:

```typescript
export async function getTaskResults(userId: string): Promise<TaskResults> {
  const tasks = await getTasks(); // ← 古い
  const answers = await answer_crud.getAnswers(userId);
  return await relateTasksAndAnswers(userId, tasks, answers);
}
```

**問題点**:

- `/problems` ページの **メイン取得関数**（最優先で修正が必要）
- ContestTaskPair に対応していない（`getTasks()` では含まれない）
- `relateTasksAndAnswers()` が重複排除の対象

**修正内容**:

1. `getTasks()` → `getMergedTasksMap()` に変更
2. `relateTasksAndAnswers()` を削除し、`mergeTaskAndAnswer()` を直接使用
3. `[...map.values()]` でスプレッド演算子を使用

**修正後**:

```typescript
export async function getTaskResults(userId: string): Promise<TaskResults> {
  // ⭐ Step 1: getMergedTasksMap() で ContestTaskPair に対応
  const mergedTasksMap = await getMergedTasksMap();
  const tasks = [...mergedTasksMap.values()]; // スプレッド演算子で配列化

  // ⭐ Step 2: 答えを taskId でキー化（contest_id は不要）
  const answers = await answer_crud.getAnswers(userId);
  const isLoggedIn = userId !== undefined;

  // ⭐ Step 3: mergeTaskAndAnswer で直接統合（重複排除）
  return tasks.map((task: Task) => {
    const answer = isLoggedIn ? answers.get(task.task_id) : null;
    return mergeTaskAndAnswer(userId, task, answer);
  });
}
```

**重要ポイント**:

- `answers` は `Map<taskId, TaskAnswer>` なので、taskId のみでキー化 ✅
- 同じ taskId で複数 contestId がある場合でも、**ユーザーの解答は1つ**（問題の仕様）
- `relateTasksAndAnswers()` は不要になるため削除可能

---

### 3.1 サービス層：relateTasksAndAnswers()（削除対象）

**ファイル**: `src/lib/services/task_results.ts` (行 145-170)

**現状**: `getTaskResults()` と`getTasksWithTagIds()` 内でのみ使用

**修正**: 関数を削除（`getTaskResults()` に統合）

---

### 3.2 サービス層：getTasksWithTagIds()（更新対象）

**ファイル**: `src/lib/services/task_results.ts`

**関連**: `/problems?tags=...` ページでの動作

**現状**:

```typescript
export async function getTasksWithTagIds(
  tagIds_string: string,
  userId: string,
): Promise<TaskResults> {
  const tagIds = tagIds_string.split(',');
  const taskIdByTagIds = await db.taskTag.groupBy({...});
  const taskIds = taskIdByTagIds.map((item) => item.task_id);

  const tasks = await db.task.findMany({...});  // ← DB 直接クエリ
  const answers = await answer_crud.getAnswers(userId);

  return await relateTasksAndAnswers(userId, tasks, answers);
}
```

**問題点**:

- `relateTasksAndAnswers()` を使用（削除対象）
- ContestTaskPair に非対応
- タグフィルタ後のタスクで同一 taskId 複数 contestId に対応していない

**修正内容（`getMergedTasksMap(tasks?)` 拡張版を使用）**:

1. `getMergedTasksMap()` をオプショナルパラメータで拡張（`tasks?: Task[]`）
2. タグフィルタ後のタスク配列を `getMergedTasksMap(filteredTasks)` に渡す
3. ヘルパー関数 `createTaskResults()` で統一マージ

**修正後の実装パターン**:

```typescript
// Step 1: ヘルパー関数を追加
async function createTaskResults(userId: string, tasks: Tasks): Promise<TaskResults> {
  const answers = await answer_crud.getAnswers(userId);
  const isLoggedIn = userId !== undefined;

  return tasks.map((task: Task) => {
    const answer = isLoggedIn ? answers.get(task.task_id) : null;
    return mergeTaskAndAnswer(userId, task, answer);
  });
}

// Step 2: getTasksWithTagIds() を修正
export async function getTasksWithTagIds(
  tagIds_string: string,
  userId: string,
): Promise<TaskResults> {
  const tagIds = tagIds_string.split(',');

  // タグから task_id を抽出
  const taskIdByTagIds = await db.taskTag.groupBy({
    by: ['task_id'],
    where: { tag_id: { in: tagIds } },
    having: { task_id: { _count: { equals: tagIds.length } } },
  });

  const taskIds = taskIdByTagIds.map((item) => item.task_id);

  if (taskIds.length === 0) {
    return [];
  }

  // 該当する task_id のみ DB から取得
  const filteredTasks = await db.task.findMany({
    where: { task_id: { in: taskIds } },
  });

  // ⭐ getMergedTasksMap(filteredTasks) にフィルタ済みタスクを渡す
  const mergedTasksMap = await getMergedTasksMap(filteredTasks);
  const tasks = [...mergedTasksMap.values()];

  // createTaskResults でタスクと回答を統合
  return await createTaskResults(userId, tasks);
}
```

**`getMergedTasksMap()` の拡張（`src/lib/services/tasks.ts`）**:

```typescript
export async function getMergedTasksMap(tasks?: Tasks): Promise<TaskMapByContestTaskPair> {
  // tasks が渡された場合 → そのまま使用（タグフィルタ後など）
  // tasks が渡されない場合 → DB から取得（通常ケース）
  const tasksToMerge = tasks ?? (await getTasks());
  const contestTaskPairs = await getContestTaskPairs();

  // 既存のマージロジック
  const baseTaskMap = new Map<ContestTaskPairKey, Task>(
    tasksToMerge.map((task) => [createContestTaskPairKey(task.contest_id, task.task_id), task]),
  );

  // ContestTaskPair の処理...
  return baseTaskMap;
}
```

**重要ポイント**:

1. **責任の一箇所集約**: `getMergedTasksMap()` で全ての ContestTaskPair マージを管理
2. **DI 的設計**: `tasks` をオプショナルパラメータで注入可能 → テスト容易性向上
3. **`createTaskResults()` の再利用**: 重複コード排除、保守性向上

---

### 3.3 サービス層：getTaskResultsByTaskId()

**ファイル**: `src/lib/services/task_results.ts` (行 190-231)

**現状**:

```typescript
export async function getTaskResultsByTaskId(
  workBookTasks: WorkBookTasksBase,
  userId: string,
): Promise<Map<string, TaskResult>>; // ← キー: taskId のみ
```

**問題点**:

- キーが `taskId` のみなので、同一タスク異なるコンテストで衝突
- ContestTaskPair 対応なし
- 戻り値型が旧形式

**修正内容**:

1. キー形式を `"contestId:taskId"` に変更（`createContestTaskPairKey()` 使用）
2. 戻り値型を `TaskResultMapByContestTaskPair` に変更
3. Task オブジェクトから `contest_id` を確実に取得

**修正前後の例**:

```typescript
// Before
taskResultsMap.set(taskId, taskResult); // キー: "abc123"

// After
taskResultsMap.set(createContestTaskPairKey(task.contest_id, taskId), taskResult); // キー: "abc_contest:abc123"
```

**影響を受ける関数**:

- `mergeTaskAndAnswer()` - 直接呼び出し元
- `getTaskResultsByTaskId()` の呼び出し元（workbooks ページサーバー）

---

### 3.4 サービス層：mergeTaskAndAnswer()

**ファイル**: `src/lib/services/task_results.ts` (行 239-266)

**現状**:

```typescript
function mergeTaskAndAnswer(
  task: Task,
  userId: string,
  answer: TaskAnswer | null | undefined,
): TaskResult;
```

**確認項目**:

- ✅ `task` オブジェクトから `contest_id` が確実に取得できるか
- ✅ `createDefaultTaskResult()` で `contest_id` が保持されているか

**現在の状態**: ✅ 問題なし（`task.contest_id` は含まれている）

**重要**: この関数は以下の処理で統一ポイントとなるため、テスト対象として重要

---

### 3.5 サービス層：getTaskResultsOnlyResultExists()

**ファイル**: `src/lib/services/task_results.ts` (行 151-183)

**現状**:

```typescript
export async function getTaskResultsOnlyResultExists(
  userId: string,
  with_map: boolean = false,
): Promise<TaskResults | Map<string, TaskResult>>;
```

**修正内容**: `mergeTaskAndAnswer()` を使用して重複排除

```typescript
export async function getTaskResultsOnlyResultExists(
  userId: string,
  with_map: boolean = false,
): Promise<TaskResults | Map<string, TaskResult>> {
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
    taskResults.forEach((taskResult) => {
      const key = createContestTaskPairKey(taskResult.contest_id, taskResult.task_id);
      taskResultsMap.set(key, taskResult);
    });
    return taskResultsMap;
  }

  return taskResults;
}
```

**注意**: `with_map=true` の場合、キーを `"contestId:taskId"` に変更（workbooks との互換性）

---

**修正内容**:

1. キー形式を `"contestId:taskId"` に変更（`createContestTaskPairKey()` 使用）
2. 戻り値型を `TaskResultMapByContestTaskPair` に変更
3. Task オブジェクトから `contest_id` を確実に取得

**影響を受ける関数**:

- `mergeTaskAndAnswer()` - 直接呼び出し元
- `getTaskResultsOnlyResultExists` の呼び出し元（workbooks ページサーバー）

---

### 3.6 コンポーネント層：TaskTable.svelte

**ファイル**: `src/lib/components/TaskTable.svelte` (行 126-152)

**現状**:

```typescript
let taskResultsMap = $derived(() => {
  return taskResults.reduce((map: Map<string, TaskResult>, taskResult: TaskResult) => {
    if (!map.has(taskResult.task_id)) {
      map.set(taskResult.task_id, taskResult); // ← キー: taskId のみ
    }
    return map;
  }, new Map<string, TaskResult>());
});
```

**問題点**:

- キーが `taskId` のみで、同一タスク異なるコンテストで上書き
- 行 152 の参照で誤った TaskResult を取得する可能性

**修正内容**:

```typescript
let taskResultsMap = $derived(() => {
  return taskResults.reduce((map: Map<ContestTaskPairKey, TaskResult>, taskResult: TaskResult) => {
    const key = createContestTaskPairKey(taskResult.contest_id, taskResult.task_id);
    if (!map.has(key)) {
      map.set(key, taskResult);
    }
    return map;
  }, new Map<ContestTaskPairKey, TaskResult>());
});
```

**関連する参照箇所**:

- 行 152: `taskIndicesMap().get(updatedTask.task_id)` も同様に修正

---

## IV. 間接的に影響を受ける範囲（中リスク）

### 4.1 ページサーバー層

| ファイル                                      | 現状                           | 修正必要性  | 理由                                         |
| --------------------------------------------- | ------------------------------ | ----------- | -------------------------------------------- |
| `src/routes/problems/+page.server.ts`         | `TaskResults[]` 配列返却       | ❌ 不要     | コンポーネント側で Map 変換（1回のみ）       |
| `src/routes/problems/[slug]/+page.server.ts`  | 単一タスク参照                 | ❌ 不要     | taskId で一意に特定可能（単一問題ページ）    |
| `src/routes/users/[username]/+page.server.ts` | `TaskResults[]` 配列返却       | ❌ 不要     | TaskListSorted で配列走査のみ                |
| `src/routes/workbooks/[slug]/+page.server.ts` | `Map<string, TaskResult>` 返却 | 🟡 将来対応 | 現在は workbook 内 taskId が一意（互換性可） |

**判定根拠**:

- `/problems` ページは **複数の異なる contestId:taskId を表示** するため、ページサーバー側では Map 化不要（配列のままコンポーネント側で変換で十分）

### 4.2 workbooks ページ（互換性維持、将来対応予定）

**ファイル**: `src/routes/workbooks/[slug]/+page.server.ts` (行 27)

**現状**:

```typescript
const taskResults: Map<string, TaskResult> = await taskResultsCrud.getTaskResultsByTaskId(
  workBook.workBookTasks,
  loggedInUser?.id as string,
);
```

**ファイル**: `src/routes/workbooks/[slug]/+page.svelte` (行 44)

```typescript
return taskResults?.get(taskId) as TaskResult;
```

**判定**:

- ✅ 互換性維持可能 - Workbook 内では同一 taskId が複数 contestId を持たない
- 🟡 将来の拡張時に対応検討

**将来対応の検討項目**（メモ）:

```text
将来的に Workbook が複数 contestId:taskId ペアを持つようになった場合:
1. WorkbookTask に contest_id フィールド追加
2. getTaskResultsByTaskId() の呼び出しで contestId も渡す
3. ページコンポーネント側で createContestTaskPairKey() を使用
4. .get(taskId) → .get(createContestTaskPairKey(contestId, taskId))
```

---

## V. 深層の影響範囲（変更不要の確認）

### 5.1 コンポーネント層の詳細分析

| コンポーネント               | 用途                     | contest_id 利用                             | 修正    |
| ---------------------------- | ------------------------ | ------------------------------------------- | ------- |
| **TaskList.svelte**          | グレード別表示           | ✅ 既に複合キー使用（id属性）               | ❌ 不要 |
| **TaskTableBodyCell.svelte** | セル内タスク表示         | ✅ `getTaskUrl(contest_id, task_id)`        | ❌ 不要 |
| **TaskGradeList.svelte**     | グレード別フィルタ       | ⚠️ 不使用（grade でフィルタのみ）           | ❌ 不要 |
| **TaskListSorted.svelte**    | ユーザープロフィール表示 | ✅ 配列走査 + `addContestNameToTaskIndex()` | ❌ 不要 |
| **UpdatingModal.svelte**     | 状態更新ダイアログ       | 📋 確認必要                                 | ?       |

### 5.2 UpdatingModal.svelte の確認

**確認内容**: taskId をキーに何かしているか？

→ **調査待機中**（現在の情報では影響なしと推測）

### 5.3 ユーティリティ層の詳細分析

**`src/lib/utils/task.ts` の主要関数**:

| 関数                            | taskId キー依存                    | 修正    |
| ------------------------------- | ---------------------------------- | ------- |
| `getTaskUrl(contestId, taskId)` | ❌ 両方を個別に受け取る            | ❌ 不要 |
| `removeTaskIndexFromTitle()`    | ❌ title 操作のみ                  | ❌ 不要 |
| `compareByContestIdAndTaskId()` | ❌ 比較関数（両方を使用）          | ❌ 不要 |
| `getTaskTableHeaderName()`      | ❌ contestType と task_table_index | ❌ 不要 |
| `calcGradeMode()`               | ❌ grade のみ                      | ❌ 不要 |
| その他（色・ラベル関数）        | ❌ grade 依存                      | ❌ 不要 |

→ **全て変更不要** ✅（taskId をキーに使っていない）

**`src/lib/utils/contest.ts` の主要関数**:

| 関数                          | taskId キー依存                | 修正    |
| ----------------------------- | ------------------------------ | ------- |
| `classifyContest()`           | ❌ contestId のみ              | ❌ 不要 |
| `getContestNameLabel()`       | ❌ contestId のみ              | ❌ 不要 |
| `addContestNameToTaskIndex()` | ❌ contestId と taskTableIndex | ❌ 不要 |
| その他                        | ❌ contestId 関連              | ❌ 不要 |

→ **全て変更不要** ✅

---

## VI. テスト戦略

### 6.1 既存テストの影響範囲

**テスト対象**: `src/test/lib/utils/contest_task_pair.test.ts`

```typescript
// ✅ このテストは変更不要（キー生成関数のテスト）
// 29個のテストケース全成功
```

**影響を受けないテスト**:

- ユーティリティテスト（task.ts, contest.ts など）
- Zod スキーマテスト
- Store テスト
- クライアントテスト

### 6.2 修正に伴い新規作成が必要なテスト

**📋 新規テスト: `src/test/lib/services/task_results.test.ts`**

```typescript
describe('getTaskResultsByTaskId', () => {
  // テストケース候補:
  // 1. 戻り値が Map<ContestTaskPairKey, TaskResult> か確認
  // 2. キーが "contestId:taskId" 形式か確認
  // 3. 複数 contestId を持つ同一 taskId が衝突しないか確認
  // 4. 空配列入力時の挙動確認
  // 5. 存在しない taskId のスキップ確認
});

describe('mergeTaskAndAnswer', () => {
  // テストケース候補:
  // 1. contest_id が正確に保持されているか確認
  // 2. アンサーなしの場合のデフォルト値確認
  // 3. アンサーありの場合のマージ確認
});
```

### 6.3 目視テストチェックリスト

#### ✅ `/problems` ページでの確認

| 項目                    | チェック内容                                       | 優先度 |
| ----------------------- | -------------------------------------------------- | ------ |
| 複数コンテスト表示      | 同一タスクが複数コンテスト欄に表示されるか         | 🔴 高  |
| タスク選択更新          | 一つ選択して更新すると、正しいセルのみ更新されるか | 🔴 高  |
| ブラウザ F12 コンソール | エラーなく実行されるか                             | 🔴 高  |
| ソート順序              | contestId 降順 → taskId 昇順で正しくソートされるか | 🟡 中  |

#### ✅ `/workbooks/[slug]` ページでの確認

| 項目       | チェック内容                       | 優先度 |
| ---------- | ---------------------------------- | ------ |
| 互換性確認 | 既存 workbook ページが動作するか   | 🟡 中  |
| 状態更新   | タスク状態更新が正しく反映されるか | 🟡 中  |

#### ✅ ユーザープロフィール (`/users/[username]`)

| 項目     | チェック内容                   | 優先度 |
| -------- | ------------------------------ | ------ |
| 配列表示 | タスク一覧が正しく表示されるか | 🟡 中  |

---

## VII. リスク評価と対策

### 7.1 リスク高 - 直接キー依存

**対象**: `TaskTable.svelte` の `taskResultsMap`

| リスク | 内容                                  | 対策                                   |
| ------ | ------------------------------------- | -------------------------------------- |
| 🔴 高  | 同一 taskId の複数 contestId で上書き | キー形式を `"contestId:taskId"` に統一 |
| 🔴 高  | 行 152 の参照で誤ったタスク取得       | `taskIndicesMap` も同時に修正          |
| 🟡 中  | 型安全性の欠落                        | `ContestTaskPairKey` 型を明示的に使用  |

### 7.2 リスク中 - サービス層

**対象**: `getTaskResultsByTaskId()`

| リスク | 内容                             | 対策                                                     |
| ------ | -------------------------------- | -------------------------------------------------------- |
| 🟡 中  | workbooks ページで戻り値型が変更 | Map の値の取得箇所で `createContestTaskPairKey()` を使用 |
| 🟡 中  | `task.contest_id` の null 確認   | mergeTaskAndAnswer() で確認済み                          |

### 7.3 リスク低 - その他

**判定**: ユーティリティ層、ページサーバー層は変更不要 → リスク低

---

## VIII. 修正順序と実装フロー（pre_plan.md）

実装前計画ドキュメント: `docs/dev-notes/2025-10-26/impact-analysis/pre_plan.md` を参照

**推奨実装順序**:

1. **Phase 1-A: サービス層**
   - `mergeTaskAndAnswer` - `relateTasksAndAnswers` のメソッドの代わりに共通して利用
   - `getTaskResults()` - キー形式変更、戻り値型変更
   - `getTaskResultsByTaskId()` - キー形式変更、戻り値型変更
   - テスト作成（新規）

2. **Phase 1-B: コンポーネント層**
   - `TaskTable.svelte` - `taskResultsMap` キー形式変更
   - `taskIndicesMap` も同時修正
   - 型インポート追加（`ContestTaskPairKey`, `createContestTaskPairKey`）

3. **Phase 2: 互換性確認**
   - `/problems` ページでの目視テスト
   - `/workbooks` ページでの互換性確認
   - ユーザープロフィール確認

4. **Phase 3: オプション修正**
   - `getTaskResultsOnlyResultExists()` - with_map=true 時のキー形式
   - workbooks への将来対応検討（メモ記載のみ）

---

## IX. 影響を受けないモジュール

**以下の項目は変更不要**:

✅ ユーティリティ層全体

- `src/lib/utils/task.ts`
- `src/lib/utils/contest.ts`
- `src/lib/utils/account_transfer.ts`（タスク間の転送なので taskId ベース）

✅ コンポーネント層（大部分）

- `TaskList.svelte`
- `TaskTableBodyCell.svelte`
- `TaskGradeList.svelte`
- `TaskListSorted.svelte`

✅ ページサーバー層（大部分）

- `src/routes/problems/+page.server.ts`
- `src/routes/problems/[slug]/+page.server.ts`
- `src/routes/users/[username]/+page.server.ts`

✅ テスト層

- 既存テスト全て（新規テスト作成が必要）

---

## X. 補足事項と将来への備考

### 10.1 ContestTaskPair テーブルについて

**現状**: seed.ts で 13 個のペアが投入済み

**参考資料**:

- Prisma スキーマ: `prisma/schema.prisma` の `model ContestTaskPair`
- データ: `prisma/contest_task_pairs.ts`

### 10.2 キーヘルパー関数

**ファイル**: `src/lib/utils/contest_task_pair.ts`

```typescript
export function createContestTaskPairKey(contestId: string, taskId: string): ContestTaskPairKey;
```

- ✅ 検証付き（空文字列チェック）
- ✅ テスト済み（29 ケース全成功）
- ✅ 形式: `"contestId:taskId"`

### 10.3 Workbook の将来対応への考慮

**メモ**: workbooks ページは現在互換性を維持できるが、将来的に以下の要件が出た場合は拡張が必要:

- 同一 workbook で同じ taskId が異なる contestId で出題される
- タスク表示に contestId による区別が必要

この場合のアクションアイテム:

1. `WorkbookTask` テーブルに `contest_id` フィールド検討
2. `getTaskResultsByTaskId()` の呼び出しで contestId を明示的に渡す
3. ページコンポーネント側で Map キー生成ロジック更新

### 10.4 デリミタ文字の注意

**重要**: キー形式が `"contestId:taskId"` なため、以下に注意:

⚠️ **問題の例**: `contestId = "abc:123"` の場合

- 生成されるキー: `"abc:123:task_a"`
- `split(':')` で分割すると誤る可能性

**対策**: キーからの復元が必要な場合は、`split(':')` ではなく **最後のコロンで分割** するか、**キー生成時にバリデーション** を強化

---

## XI. 参考：既存文書との関連性

### 文献参照表

| タイトル                                                                                        | 目的               | 参照ポイント                                        |
| ----------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------- |
| [Contest-Task Pair Mapping 実装計画](../../2025-09-23/contest-task-pair-mapping/plan.md)        | DB 設計・型定義    | キー形式の決定、`TaskResultMapByContestTaskPair` 型 |
| [contest_task_pairs データ投入処理](../../2025-10-22/add-contest-task-pairs-to-seeds/plan.md)   | Seed データ        | 既投入済みの 13 ペア                                |
| [getMergedTasksMap リファクタリング教訓](../../2025-10-25/refactor-getMergedTasksMap/lesson.md) | ベストプラクティス | 関数型プログラミング、テスト設計                    |

### 推奨される読む順序

1. 本レポート（全体像把握）
2. Phase 2 詳細分析（現状確認）
3. Phase 1 調査結果（呼び出し元把握）
4. pre_plan.md（実装計画）
5. 関連文書（技術詳細）

---

## XII. サマリーテーブル

### 修正対象サマリー

| レイヤ         | ファイル           | 関数/箇所                          | 修正内容                                    | 優先度  |
| -------------- | ------------------ | ---------------------------------- | ------------------------------------------- | ------- |
| サービス       | `task_results.ts`  | `getTaskResults()`                 | getMergedTasksMap + mergeTaskAndAnswer 統合 | 🔴 1    |
| サービス       | `task_results.ts`  | `getTasksWithTagIds()`             | getMergedTasksMap + mergeTaskAndAnswer 統合 | 🔴 1    |
| サービス       | `task_results.ts`  | `relateTasksAndAnswers()`          | 削除（getTaskResults に統合）               | � 1     |
| サービス       | `task_results.ts`  | `getTaskResultsByTaskId()`         | キー + 戻り値型                             | 🔴 1    |
| サービス       | `task_results.ts`  | `getTaskResultsOnlyResultExists()` | mergeTaskAndAnswer 統合                     | � 2     |
| コンポーネント | `TaskTable.svelte` | `taskResultsMap`                   | キー形式                                    | 🔴 1    |
| コンポーネント | `TaskTable.svelte` | `taskIndicesMap`                   | キー形式                                    | � 1     |
| テスト         | `(new)`            | `task_results.test.ts`             | 新規作成                                    | 🟡 並行 |

### 非修正確認サマリー

✅ ユーティリティ層（12 関数以上）
✅ ページサーバー層（大部分）
✅ その他コンポーネント（8 個以上）
✅ テスト層（既存テスト）

---

## レポート終了

---

## 追加: ファイル統計

- **対象ファイル総数**: 約 220 ファイル
- **修正必須**: 2-4 ファイル（サービス + コンポーネント）
- **修正推奨**: 1 ファイル（テスト新規）
- **修正不要**: 200+ ファイル
- **修正予定**: 0 ファイル（互換性維持ため）

**実装工数（概算）**: 2-3 時間（修正 + テスト + 目視確認）
