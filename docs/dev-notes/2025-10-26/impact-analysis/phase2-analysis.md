# Phase 2: 新キー構造の実装詳細と影響分析

調査日: 2025-10-26

対象: 新しいキー構造 (`contestId:taskId`) の導入による詳細な技術分析

---

## 1. 既存の新規型定義とユーティリティ

### 1.1 型定義（既に実装済み）

**ファイル**: `src/lib/types/contest_task_pair.ts`

```typescript
export type ContestTaskPairKey = `${string}:${string}`; // "contest_id:task_id"
export type TaskMapByContestTaskPair = Map<ContestTaskPairKey, Task>;
export type TaskResultMapByContestTaskPair = Map<ContestTaskPairKey, TaskResult>;
```

### 1.2 ユーティリティ関数（既に実装済み）

**ファイル**: `src/lib/utils/contest_task_pair.ts`

```typescript
export function createContestTaskPairKey(contestId: string, taskId: string): ContestTaskPairKey;
```

- エラーハンドリング付きで `"contestId:taskId"` 形式のキーを生成

### 1.3 既存のマージ機能

**ファイル**: `src/lib/services/tasks.ts`

```typescript
export async function getMergedTasksMap(): Promise<TaskMapByContestTaskPair>;
```

- ContestTaskPair テーブルのデータを使って、複数 contestId に対応する Task を Map として返却
- キー形式: `ContestTaskPairKey` （`"contestId:taskId"`）
- 時間計算量: O(N + M)

---

## 2. TaskResult オブジェクトの構造分析

### 2.1 型定義

**ファイル**: `src/lib/types/task.ts`

```typescript
export interface Task {
  contest_type?: ContestType;
  contest_id: string; // ✅ 既に含まれている
  task_table_index: string;
  task_id: string;
  title: string;
  grade: string;
}

export interface TaskResult extends Task {
  user_id: string;
  status_name: string;
  status_id: string;
  submission_status_image_path: string;
  submission_status_label_name: string;
  is_ac: boolean;
  updated_at: Date;
}

export type TaskResults = TaskResult[];
```

### 2.2 重要な発見

✅ **TaskResult は既に `contest_id` を含んでいる**

- 子孫コンポーネントでも `taskResult.contest_id` と `taskResult.task_id` で一意に識別可能
- 例: `src/lib/components/TaskList.svelte` (行92): `id={taskResult.contest_id + '-' + taskResult.task_id}`

---

## 3. Map 変換の詳細調査

### 3.1 Map 変換が発生している箇所

| ファイル                                  | 行番号  | 処理内容                                         | 変換回数 |
| ----------------------------------------- | ------- | ------------------------------------------------ | -------- |
| `src/lib/components/TaskTable.svelte`     | 126-132 | `TaskResults[]` → `Map<string, TaskResult>`      | 1回      |
| `src/lib/components/TaskGradeList.svelte` | 18-33   | `TaskResults[]` → `Map<TaskGrade, TaskResult[]>` | 1回      |

### 3.2 TaskTable.svelte での Map 変換詳細

**コード**:

```typescript
let taskResultsMap = $derived(() => {
  return taskResults.reduce((map: Map<string, TaskResult>, taskResult: TaskResult) => {
    if (!map.has(taskResult.task_id)) {
      map.set(taskResult.task_id, taskResult); // キー: taskId のみ
    }
    return map;
  }, new Map<string, TaskResult>());
});
```

**問題点**:

- キーが `taskId` のみで、同一 taskId 異なる contestId の場合に衝突する
- 行 152 で `taskIndicesMap().get(updatedTask.task_id)` で参照
- **複数回の変換はない**（1回のみ）

### 3.3 TaskGradeList.svelte での Map 変換

**コード**:

```typescript
let taskResultsForEachGrade = $state(new Map());

run(() => {
  taskResultsForEachGrade = new Map();
  taskGradeValues.map((grade) => {
    taskResultsForEachGrade.set(
      grade,
      taskResults.filter((taskResult: TaskResult) => taskResult.grade === grade),
    );
  });
});
```

**特徴**:

- グレードごとに配列を集約（Map ではなく配列を保持）
- Map 変換は1回のみ

---

## 4. サービス層（task_results.ts）の Map 操作分析

### 4.1 getTaskResultsByTaskId() 関数

**実装**:

```typescript
export async function getTaskResultsByTaskId(
  workBookTasks: WorkBookTasksBase,
  userId: string,
): Promise<Map<string, TaskResult>>;
```

**処理フロー**:

1. taskIds 抽出
2. バルクフェッチ（Task, Answer）
3. 内部 Map 作成（キー: `taskId`）
4. Map で返却

**問題点**:

- キーが `taskId` のみ
- ContestTaskPair 対応なし

### 4.2 getTaskResultsOnlyResultExists() 関数

**実装**:

```typescript
export async function getTaskResultsOnlyResultExists(
  userId: string,
  with_map: boolean = false,
): Promise<TaskResults | Map<string, TaskResult>>;
```

**特徴**:

- 配列またはMap を返却可能
- キーが `taskId` のみ
- with_map 引数で制御

### 4.3 getTaskResults() と getTasksWithTagIds() 関数

| 関数名                 | 戻り値型        | キー形式 | 備考                                                                               |
| ---------------------- | --------------- | -------- | ---------------------------------------------------------------------------------- |
| `getTaskResults()`     | `TaskResults[]` | N/A      | 配列で返却、**内部的に `getMergedTasksMap()` を使用**                              |
| `getTasksWithTagIds()` | `TaskResults[]` | N/A      | 配列で返却、**タグフィルタ後のタスクを `getMergedTasksMap(filteredTasks)` に渡す** |

**用途**: `/problems` ページ（配列のまま受け取り）

**getTaskResults() 実装の重要変更**:

- 旧: `getTasks()` + answers マップをマージ
- 新: `getMergedTasksMap()` で `"contestId:taskId"` キー形式の Task を取得 → answers とマージ
- 効果: ContestTaskPair に対応した Task を `/problems` ページで使用可能に

**getTasksWithTagIds() 実装の重要変更**:

- 旧: DB から直接タグフィルタしたタスク → `relateTasksAndAnswers()` でマージ
- 新: DB からタグフィルタしたタスク → **`getMergedTasksMap(filteredTasks)` に渡す** → `createTaskResults()` でマージ
- 効果:
  1. タグフィルタ後の **ContestTaskPair マージ** に対応
  2. 同一 taskId で複数 contestId の場合、全ての (contestId, taskId) ペアが表示される
  3. `/problems?tags=...` で複数コンテストの同じ問題がタグフィルタで表示可能

**`getMergedTasksMap(tasks?)` の拡張（DI 的設計）**:

```typescript
export async function getMergedTasksMap(tasks?: Task[]): Promise<TaskMapByContestTaskPair> {
  const tasksToMerge = tasks ?? (await getTasks());
  // 既存のマージロジック
  return mergeWithContestTaskPairs(tasksToMerge);
}
```

- ✅ `tasks` 未指定: 通常ケース（全タスク取得）
- ✅ `tasks` 指定: タグフィルタ後など、特定タスクセットのマージ
- ✅ テスト容易性向上（Mock Task 配列を注入可能）

---

## 5. コンポーネント層での contest_id 利用パターン

### 5.1 contest_id を利用しているコンポーネント

| ファイル                           | 用途       | キー                                    | 備考             |
| ---------------------------------- | ---------- | --------------------------------------- | ---------------- |
| `TaskList.svelte:92`               | ID属性     | `contest_id + '-' + task_id`            | 既に複合キー使用 |
| `TaskList.svelte:105, 117`         | URL/表示   | contest_id と task_id を別々に使用      | -                |
| `TaskTableBodyCell.svelte:49`      | URL        | `getTaskUrl(contest_id, task_id)`       | -                |
| `TaskSearchBox.svelte:48, 211-212` | 検索・表示 | `getTaskUrl(contest_id, task_id)`       | -                |
| `TaskGradeList.svelte`             | フィルタ   | grade でグループ化（contest_id 未使用） | -                |

### 5.2 重要な発見

✅ コンポーネント層は既に `contest_id` と `task_id` を併用している

- ID 属性や URL 生成で複合キーを使用
- キー統一による影響は **コンポーネント側では最小限**

---

## 6. 新キー構造の導入戦略（ユーザー回答に基づく）

### 6.1 方針確認（ユーザー回答より）

**Q1**: TaskResult で contestId:taskId が一意に識別できるのなら、そのままが望ましい

- **判定**: ✅ TaskResult は `contest_id` を含むので識別可能
- **結論**: **コンポーネント層の大きな変更は不要**

**Q2**: workbook 内は taskId のみで十分

- **判定**: ✅ 確認（workbook 内は同一 taskId は複数 contestId を持たない）
- **結論**: `/workbooks` は **互換性維持（現状のまま）** ← 将来拡張可能性あり

**Q3**: オプションB選択（新型 `TaskResultMapByContestTaskPair` を使用）

- **対象**: `getTaskResultsByTaskId()` など Map 返却関数

**Q4**: 配列のまま、複数回変換なら server 時点で Map

- **判定**: ✅ 複数回変換なし（TaskTable で1回のみ）
- **結論**: **配列のまま配信し、コンポーネント側で1回変換** で OK

---

## 7. 詳細な修正対象箇所

### 7.1 必須修正（新キー構造対応）

#### ✅ サービス層

| ファイル                           | 関数                               | 修正内容                                                                           | 優先度 |
| ---------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| `src/lib/services/task_results.ts` | `getTaskResultsByTaskId()`         | キーを `"contestId:taskId"` に変更、戻り値型を `TaskResultMapByContestTaskPair` に | 🔴 高  |
| `src/lib/services/task_results.ts` | `mergeTaskAndAnswer()`             | task から contest_id を確実に取得                                                  | 🔴 高  |
| `src/lib/services/task_results.ts` | `getTaskResultsOnlyResultExists()` | with_map=true の場合、キーを `"contestId:taskId"` に                               | 🟡 中  |

#### ❌ ページサーバー層（変更不要）

| ファイル                                     | 理由                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| `src/routes/problems/+page.server.ts`        | `TaskResults[]` 配列のままで OK（コンポーネント側で変換） |
| `src/routes/problems/[slug]/+page.server.ts` | 単一タスク参照なので変更不要                              |

#### 🟡 コンポーネント層（最小限の変更）

| ファイル                                      | 変更内容                                 | 理由                                               |
| --------------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| `src/lib/components/TaskTable.svelte:126-132` | Map のキーを `"contestId:taskId"` に変更 | taskId のみキーだと同一タスク複数 contestId で衝突 |
| `src/lib/components/TaskGradeList.svelte`     | 変更不要                                 | グレード別フィルタは contest_id 無関係             |

#### 🟡 workbook 層（互換性維持、将来対応予定）

| ファイル                                      | 現状                                     | 将来対応                                      |
| --------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| `src/routes/workbooks/[slug]/+page.server.ts` | `Map<string, TaskResult>` (キー: taskId) | 可能性: `Map<"contestId:taskId", TaskResult>` |
| `src/routes/workbooks/[slug]/+page.svelte`    | `.get(taskId)` で参照                    | 要見直し                                      |

---

## 8. /workbooks ページの詳細分析

### 8.1 現状

**ファイル**: `src/routes/workbooks/[slug]/+page.server.ts` (行27)

```typescript
const taskResults: Map<string, TaskResult> = await taskResultsCrud.getTaskResultsByTaskId(
  workBook.workBookTasks,
  loggedInUser?.id as string,
);
```

**ファイル**: `src/routes/workbooks/[slug]/+page.svelte` (行44)

```typescript
return taskResults?.get(taskId) as TaskResult;
```

### 8.2 互換性維持の理由

- Workbook は特定の問題集に紐付いており、同じ taskId は複数の contestId を持たない
- 現在のキー形式（taskId のみ）で十分機能
- 将来的に「同一問題を複数コンテストバージョンで提供」するまでは対応不要

### 8.3 将来対応時の計画（メモ）

```
Workbook の拡張が必要になる場合:
1. WorkbookTask に contest_id を追加する検討
2. キー形式を "contestId:taskId" に移行
3. getTaskResultsByTaskId() の呼び出し箇所を確認
4. ページコンポーネント側の .get(taskId) を .get(createContestTaskPairKey(...)) に変更
```

---

## 9. アカウント転送機能への影響

**ファイル**: `src/lib/services/task_results.ts` (行88, 96)

```typescript
const sourceUserAnswers: Map<string, TaskResult> = await answer_crud.getAnswers(sourceUser.id);
const destinationUserAnswers: Map<string, TaskResult> = await answer_crud.getAnswers(
  destinationUser.id,
);
```

### 分析

- `answer_crud.getAnswers()` は `Map<string, TaskAnswer>` を返却（キー: taskId）
- **現在は変更不要**（答えの転送は taskId ベースで十分）
- 将来的に ContestTaskPair 対応時に見直し検討

---

## 10. 修正対象の一覧（まとめ）

### 🔴 必須修正（新キー対応）

1. **`src/lib/services/task_results.ts`**
   - `getTaskResults()`: getMergedTasksMap() と mergeTaskAndAnswer() を利用
   - `mergeTaskAndAnswer()`: contest_id 取得確認

2. **`src/lib/components/TaskTable.svelte`**
   - `taskResultsMap` の Map キーを `"contestId:taskId"` に変更
   - `taskIndicesMap` も同様に変更（参照箇所: 行152）

### 🟡 オプション（互換性を考慮）

3. **`src/lib/services/task_results.ts`**
   - `getTaskResultsByTaskId()`: キー形式 + 戻り値型変更
   - `getTaskResultsOnlyResultExists()`: with_map=true 時のキー形式

4. **`src/routes/workbooks/[slug]/+page.svelte`**
   - 現在は互換性維持（変更不要）
   - 将来の workbook 拡張時に対応

5. **`src/lib/utils/account_transfer.ts`**
   - 現在は taskId ベースで問題なし
   - 将来検討

---

## 11. リスク評価

### 11.1 リスク高：直接的なキー依存

- **TaskTable.svelte の taskResultsMap**
  - 理由: 同一 taskId の複数 contestId 対応時に衝突発生の可能性
  - 影響: 表示ロジック不正

### 11.2 リスク中：サービス層の Map 生成

- **getTaskResultsByTaskId()**
  - 理由: キー形式の変更は広範囲に影響
  - 影響: workbooks ページの動作確認が必要

### 11.3 リスク低：タイプセーフティ

- **型定義の追加**
  - `TaskResultMapByContestTaskPair` 使用により防止可能

---

## 12. テスト戦略

### 12.1 単体テスト対象

- `createContestTaskPairKey()` - 既存テスト確認
- `getMergedTasksMap()` - 既存テスト確認
- `getTaskResultsByTaskId()` - 新キー形式でのテスト必要

### 12.2 統合テスト対象

- `/problems` ページでの複数コンテスト表示
- `/workbooks` ページでの互換性確認
- アカウント転送機能での動作確認

### 12.3 既知の制約

- utils 以外はテストがほぼない
- 目視確認が必要な部分が多い

---

## 13. 次のステップ（Phase 3 候補）

- [ ] `src/lib/services/task_results.ts` の `getTaskResultsByTaskId()` 修正実装
- [ ] `src/lib/components/TaskTable.svelte` の Map キー変更実装
- [ ] `/problems` ページでの複数 contestId:taskId ペアの動作確認
- [ ] `/workbooks` ページの互換性確認
- [ ] 目視テスト実施

---

## 14. 参考情報

### 既存の複合キー使用例

**TaskList.svelte (行92)**:

```svelte
id={taskResult.contest_id + '-' + taskResult.task_id}
```

→ コンポーネント層は既に複合キーの概念を認識している

### 既存の新型定義

**contest_task_pair.ts**:

```typescript
export type ContestTaskPairKey = `${string}:${string}`;
export type TaskResultMapByContestTaskPair = Map<ContestTaskPairKey, TaskResult>;
```

→ 型システムとしての準備は完了している
