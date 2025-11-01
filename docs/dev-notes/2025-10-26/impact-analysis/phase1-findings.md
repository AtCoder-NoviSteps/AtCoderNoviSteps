# Phase 1: 直接的な依存関係の調査結果

調査日: 2025-10-26

対象: `getTaskResults()` と `getTasksWithTagIds()` の呼び出し元と `Map<string, TaskResult>` の利用箇所

---

## 1. 起点となる関数の呼び出し元

### 1.1 getTaskResults() - 呼び出し元

| ファイル                                      | 行番号 | コンテキスト                                                                            |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| `src/routes/problems/+page.server.ts`         | 26     | `taskResults: (await crud.getTaskResults(session?.user.userId)) as TaskResults,`        |
| `src/routes/users/[username]/+page.server.ts` | 33     | `const taskResultsMap = await taskResultService.getTaskResultsOnlyResultExists(...)`    |
| `src/routes/workbooks/+page.server.ts`        | 39     | `const taskResultsByTaskId = await taskResultsCrud.getTaskResultsOnlyResultExists(...)` |

### 1.2 getTasksWithTagIds() - 呼び出し元

| ファイル                              | 行番号 | コンテキスト                                                                                 |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `src/routes/problems/+page.server.ts` | 20     | `taskResults: (await crud.getTasksWithTagIds(tagIds, session?.user.userId)) as TaskResults,` |

**修正が必要な理由**:

- `relateTasksAndAnswers()` を使用（削除対象）
- ContestTaskPair に非対応（タグフィルタ後のタスクで同一 taskId 複数 contestId に対応していない）
- `/problems?tags=...` ページで複数コンテストの同じ問題が表示されない

**修正方法**:

- `getMergedTasksMap(filteredTasks)` に タグフィルタ後のタスク配列を渡す
- ヘルパー関数 `createTaskResults()` で統一マージ
- 詳細は [`report.md` Section 3.2](report.md#32-サービス層gettagswithtaskids新規追加対象) を参照

---

## 1.3 その他の関連関数

| 関数名                      | ファイル                           | 状態     | 備考                                                                  |
| --------------------------- | ---------------------------------- | -------- | --------------------------------------------------------------------- |
| `createTaskResults()`       | `src/lib/services/task_results.ts` | 新規追加 | ヘルパー関数。`getTaskResults()` と `getTasksWithTagIds()` で共通使用 |
| `getMergedTasksMap(tasks?)` | `src/lib/services/tasks.ts`        | 拡張必要 | `tasks` パラメータを optional に拡張                                  |

---

## 2. Map<string, TaskResult> 利用箇所一覧

### 2.1 型定義

| ファイル                                            | 行番号     | 用途                                                                      |
| --------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `src/lib/types/contest_task_pair.ts`                | 25         | `TaskResultMapByContestTaskPairKey = Map<ContestTaskPairKey, TaskResult>` |
| `src/test/lib/utils/test_cases/account_transfer.ts` | 16, 96, 98 | テスト用サンプルデータ                                                    |
| `src/lib/utils/account_transfer.ts`                 | 16, 69     | アカウント転送用ユーティリティの型定義                                    |

### 2.2 サービス層での生成・操作

| ファイル                           | 行番号  | 関数名                             | 説明                                                                |
| ---------------------------------- | ------- | ---------------------------------- | ------------------------------------------------------------------- |
| `src/lib/services/tasks.ts`        | 41-65   | `getMergedTasksMap(tasks?)`        | ⭐ **新規拡張**: ContestTaskPair マップ。tasks パラメータで DI 対応 |
| `src/lib/services/task_results.ts` | -       | `createTaskResults()`              | ⭐ **新規追加**: Task 配列を answers とマージ。統一ポイント         |
| `src/lib/services/task_results.ts` | 88, 96  | `transferAnswers()`                | ソースユーザ・宛先ユーザの回答を Map として取得                     |
| `src/lib/services/task_results.ts` | 154-179 | `getTaskResultsOnlyResultExists()` | 回答ありのみ返すメソッド（Map 可能）                                |
| `src/lib/services/task_results.ts` | 190-231 | `getTaskResultsByTaskId()`         | 指定タスク ID のみ返すメソッド（workbooks 用）                      |

### 2.3 コンポーネント層での利用

| ファイル                                                | 行番号  | 用途                            | キー参照方法                      |
| ------------------------------------------------------- | ------- | ------------------------------- | --------------------------------- |
| `src/lib/components/TaskTables/TaskTable.svelte`        | 126-132 | TaskResults 配列から Map へ変換 | `taskResult.task_id` をキー       |
| `src/lib/components/TaskTables/TaskTable.svelte`        | 146-152 | Map での検索・インデックス操作  | `.get(taskId)` 直接参照           |
| `src/lib/components/TaskGradeList.svelte`               | 18-55   | 成績別に Map 作成               | `.get(taskGrade)` で グループ分け |
| `src/lib/components/WorkBooks/WorkBookBaseTable.svelte` | 33      | props 型として使用              | -                                 |
| `src/lib/components/WorkBooks/WorkBookList.svelte`      | 23-88   | workbook 別の TaskResults 集約  | `.get(workbookType)` でグループ化 |
| `src/lib/components/WorkBook/WorkBookForm.svelte`       | 46      | タスク情報参照                  | `.get(taskId)` 直接参照           |

### 2.4 ページ層での利用

| ファイル                                              | 行番号    | 用途                                            |
| ----------------------------------------------------- | --------- | ----------------------------------------------- |
| `src/routes/problems/+page.server.ts`                 | 4, 20, 26 | TaskResults を props として渡す（形式は Array） |
| `src/routes/problems/[slug]/+page.server.ts`          | 16, 31    | 単一タスク結果の取得・更新                      |
| `src/routes/workbooks/+page.svelte`                   | 70        | Map 形式で受け取り                              |
| `src/routes/workbooks/[slug]/+page.server.ts`         | 27        | Map 形式で返却                                  |
| `src/routes/workbooks/[slug]/+page.svelte`            | 44        | `.get(taskId)` で参照                           |
| `src/routes/(admin)/account_transfer/+page.server.ts` | 62        | `copyTaskResults()` でユーザ間転送              |

---

## 3. taskId をキーとした直接 Map アクセス

### 3.1 アクセスパターン一覧

| ファイル                                                     | 行番号 | パターン                                    | 説明                         |
| ------------------------------------------------------------ | ------ | ------------------------------------------- | ---------------------------- |
| `src/lib/services/task_results.ts`                           | 213    | `tasksMap.get(taskId)`                      | Task マップからタスク取得    |
| `src/lib/services/task_results.ts`                           | 220    | `answersMap.get(taskId)`                    | 回答マップから回答取得       |
| `src/lib/services/task_results.ts`                           | 223    | `taskResultsMap.set(taskId, taskResult)`    | 結果マップに結果を登録       |
| `src/lib/components/WorkBookTasks/WorkBookTasksTable.svelte` | 133    | `tasksMapByIds.get(taskId)`                 | コンポーネント内でタスク参照 |
| `src/lib/components/TaskTables/TaskTable.svelte`             | 152    | `taskIndicesMap().get(updatedTask.task_id)` | インデックスマップから参照   |
| `src/routes/workbooks/[slug]/+page.svelte`                   | 44     | `taskResults?.get(taskId)`                  | ページ内で結果参照           |

---

## 4. task_results サービス層の全体像

### 4.1 他からインポートされる関数一覧

```text
src/routes/problems/+page.server.ts
  ├─ getTaskResults()
  ├─ getTasksWithTagIds()
  └─ updateTaskResult()

src/routes/problems/[slug]/+page.server.ts
  ├─ getTaskResult()
  └─ updateTaskResult()

src/routes/users/[username]/+page.server.ts
  └─ getTaskResultsOnlyResultExists()

src/routes/workbooks/+page.server.ts
  └─ getTaskResultsOnlyResultExists()

src/routes/workbooks/[slug]/+page.server.ts
  └─ getTaskResultsByTaskId()

src/routes/(admin)/account_transfer/+page.server.ts
  └─ copyTaskResults()
```

### 4.2 内部関数一覧

- `relateTasksAndAnswers()` - TaskResults 生成の中核
- `createDefaultTaskResult()` - デフォルト TaskResult 作成
- `transferAnswers()` - アカウント転送時の回答転送
- `mergeTaskAndAnswer()` - Task と Answer を統合

---

## 5. リスク区分

### 高リスク（必須修正）

- **`src/lib/services/task_results.ts`**
  - `getTaskResultsByTaskId()` - 直接 `taskId` をキーに利用（213, 220, 223 行）
  - `getTaskResultsOnlyResultExists()` - `taskId` を直接キーに登録（173 行）
  - `relateTasksAndAnswers()` - 配列返却用だが内部では taskId を利用

- **`src/routes/problems/+page.server.ts`**
  - `getTaskResults()` と `getTasksWithTagIds()` の戻り値型が `TaskResults` (Array)
  - しかし新構造では `Map<contestId:taskId, Task>` が必要

### 中リスク（間接的な影響）

- **`src/lib/components/TaskTables/TaskTable.svelte`**
  - TaskResults 配列を Map に変換（127行）
  - キーが taskId なので、新構造対応が必要

- **`src/routes/workbooks/[slug]/+page.svelte`**
  - 既に Map 型で受け取り `.get(taskId)` で参照（44行）
  - キー構造の変更が必要

### 低リスク（読み取りのみ）

- `src/routes/problems/[slug]/+page.server.ts`
  - 単一タスク参照なので、現在の構造でも対応可能かもしれない

---

## 6. 推奨される修正優先順序

1. **Phase 2**: サービス層（`src/lib/services/task_results.ts`）を修正
   - `getTaskResultsByTaskId()` - キー形式を変更
   - `getTaskResultsOnlyResultExists()` - キー形式を変更
   - ヘルパー関数を新構造対応に改修

2. **Phase 3**: ページサーバー層（`src/routes/*/+page.server.ts`）を修正
   - `/problems` ページ：戻り値型の見直し
   - `/workbooks` ページ：キー形式の一貫性確認

3. **Phase 4**: コンポーネント層（`src/lib/components/*`）を修正
   - TaskTable での Map 変換処理
   - workbooks での参照処理

4. **Phase 5**: ユーティリティ層（`src/lib/utils/account_transfer.ts`）を修正
   - アカウント転送の型・ロジック調整

---

## 7. 既知の新しい型定義

| 型名                                | ファイル                             | 説明                          |
| ----------------------------------- | ------------------------------------ | ----------------------------- |
| `TaskResultMapByContestTaskPairKey` | `src/lib/types/contest_task_pair.ts` | 新しいキー形式用の Map 型     |
| `ContestTaskPairKey`                | `src/lib/types/contest_task_pair.ts` | `contestId:taskId` 形式のキー |

---

## 8. 次のステップ（Phase 2 候補）

- [ ] `src/lib/services/tasks.ts` の `getMergedTasksMap()` 実装内容確認
- [ ] ContestTaskPair テーブルの実装内容確認
- [ ] `/problems` ページの現在の TaskResults 返却形式を詳細確認
- [ ] `/workbooks` との互換性要件の最終確認
