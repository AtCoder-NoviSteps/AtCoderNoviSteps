# Phase 1 詳細計画：workbooks の tasks 取得を「参照タスク × grade のみ」に絞る

> 親プラン: `docs/dev-notes/2026-06-13/sveltekit-caching/plan.md` の「### Phase 1」を具体化したもの。

## Context

Vercel の Function Duration / Fast Origin Transfer が約1.5倍に増加。原因の一つが
`/workbooks` の load にある **2段階の過剰取得**。

**主因（タブ非依存）**：load は [getTasksByTaskId()](src/lib/services/tasks.ts#L127) で
**全タスク・全カラムを無条件取得**（`db.task.findMany()`、本番≈9000問・≈2.6MB）して SSR に載せている。
だが返り値 `tasksMapByIds` の用途は grade 算出（`calcWorkBookGradeModes`）だけ。
この無駄はどのタブ（CURRICULUM / SOLUTION / CREATED_BY_USER）でも発生する。

**追加分（タブ依存）**：その grade 算出結果が描画されるのは **CURRICULUM タブだけ**
（SOLUTION / CREATED_BY_USER では未使用）。よってタスク取得が必要なのは CURRICULUM のみ。

→ 本 Phase 後のタブ別の取得：

| タブ            | 取得                                                                  | 削減                                                                                               |
| --------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| CURRICULUM      | grade で絞られた表示中問題集の参照タスク（**数十件**）の `grade` のみ | 全9000件 → 数十件（**行削減**が主役。カラム削減のみでは約60%減どまり、行削減込みで97.4%減）        |
| SOLUTION ALL    | **取得なし（空 Map）**                                                | 全9000件（≈2.6MB）→ **0**。本番2000+問を参照するビューだが gradeModes 未使用のため参照取得すら不要 |
| CREATED_BY_USER | **取得なし（空 Map）**                                                | 全9000件 → **0**                                                                                   |

ローカル実測の SOLUTION ALL ビュー 657.5KB → 16.8KB（97.4%減）は「参照取得を全タブで行った場合
（タブゲート無し）」の中間値。本 Phase の CURRICULUM ゲートでは SOLUTION ALL は **≈0** になり、
むしろ最大の削減対象。「数十件」で行削減が効くのは唯一タスクを取得する **CURRICULUM タブに限った話**。

## 批判的レビューで確定した事実（重要）

`workbooks/+page.server.ts` が返す `tasksMapByIds` の唯一の消費先は
[+page.svelte:39](src/routes/workbooks/+page.svelte#L39) の
`calcWorkBookGradeModes(workbooks, tasksMapByIds)` のみ。

- `calcWorkBookGradeModes`（[utils/workbooks.ts:83](src/features/workbooks/utils/workbooks.ts#L83)）は
  参照タスクの **`.grade` しか読まない**。
- その出力 `gradeModesEachWorkbook` は **CURRICULUM タブの `WorkBookList` にしか渡らない**
  （[+page.svelte:115](src/routes/workbooks/+page.svelte#L115)）。SOLUTION / CREATED_BY_USER では未使用。
- 一覧の各セル（`WorkbookProgressCell` / `WorkbookCompletionCell` / `AcceptedCounter`）は
  `workbook.workBookTasks`（埋め込み済み taskId/priority/comment）＋ `taskResultsByTaskId` のみで成立。
  **タスクの title/grade マップは不要。**
- create / edit / detail ページは別途 `getTasksByTaskId()` を呼ぶ（[create/+page.server.ts:31](src/routes/workbooks/create/+page.server.ts#L31),
  [edit/[slug]/+page.server.ts:45](src/routes/workbooks/edit/[slug]/+page.server.ts#L45)）。**本 Phase のスコープ外。**
- 解答状況の繋ぎ込みは `tasksMapByIds` とは別経路：`taskResultsByTaskId`
  （[getTaskResultsOnlyResultExists()](src/lib/services/task_results.ts#L129)、自前で `getTasks()`＋`getAnswers()` を結合）を
  [buildTaskResultsByWorkBookId](src/features/workbooks/utils/workbooks.ts#L118) が `workBookTasks[].taskId` で O(1) 引きする。
  → `tasksMapByIds` を細らせても繋ぎ込み・O(1) 結合は無傷。
- 削減効果は主に **Transfer（SSR payload）**。`getTaskResultsOnlyResultExists` 内の `getTasks()`
  （[task_results.ts:136](src/lib/services/task_results.ts#L136)）が全件スキャンを続けるため、Function Duration の削減は部分的（残タスク TODO）。

→ 結論：list load のタスクマップは **CURRICULUM タブ ＋ ログイン時のみ** 構築すればよく、
値は **grade のみ** で足りる。

## 決定事項（ユーザー確認済み）

1. **取得スコープ**：`tab === CURRICULUM` のときだけ参照タスクを取得（他タブは空 Map）。
   既存の `availableCategories` / `solutionCategoryMap` の三項演算ゲートと同じ書式に揃える。
2. **匿名スキップ**：軽量なので Phase 1 に統合。取得条件に `&& loggedInUser` を加える
   （匿名は `{#if loggedInUser}` で何も描画しないため）。**包括的な匿名 early-return は Phase 2 のまま**。
3. **テスト**：純粋ヘルパー `buildTaskIdsFromWorkbooks` を抽出し util テストを優先。
   load 統合テスト（`fetches only tasks referenced by displayed workbooks`）は **後続 TODO** に積む。

## 実装ステップ（layer 別・TDD）

### Step 1 — utils：参照タスクID収集ヘルパー（テスト先行）

`src/features/workbooks/utils/workbooks.ts` に追加：

```typescript
/**
 * Builds the list of unique task IDs that the given workbooks reference via their workBookTasks.
 * Used to fetch only the tasks actually displayed, instead of all tasks.
 *
 * @returns Unique task IDs (deduplicated across all workbooks).
 */
export function buildTaskIdsFromWorkbooks(
  workbooks: { workBookTasks: WorkBookTaskBase[] }[],
): string[] {
  return Array.from(
    new Set(workbooks.flatMap((workbook) => workbook.workBookTasks.map((task) => task.taskId))),
  );
}
```

テスト：`src/features/workbooks/utils/workbooks.test.ts` に describe を追加。

- `returns unique task ids deduplicated across workbooks`（複数 workbook・重複 taskId を1つに）
- `returns empty array for empty workbooks`
- `returns empty array when workbooks have no tasks`

### Step 2 — service：型narrowで grade-only マップを許容

`calcWorkBookGradeModes`（[utils/workbooks.ts:83](src/features/workbooks/utils/workbooks.ts#L83)）の
第2引数を `Map<string, Task>` → `Map<string, Pick<Task, 'grade'>>` に狭める
（実際に読むのは `.grade` のみ）。

- 既存呼び出し [initializers.ts:62](src/features/workbooks/services/workbook_placements/initializers.ts#L62) は
  `Map<string, Task>` を渡すが、より広い型なので代入可。変更不要。
- 既存テストの `Map<string, Task>` 引数もそのまま通る（assignable）。
- `getTasksWithSelectedTaskIds`（[tasks.ts:104](src/lib/services/tasks.ts#L104)）は変更なし（既存の5カラム projection を再利用）。

### Step 3 — route：load を参照タスク取得に差し替え

`src/routes/workbooks/+page.server.ts`：

- import を `getTasksByTaskId` → `getTasksWithSelectedTaskIds` ＋ `buildTaskIdsFromWorkbooks` に変更。
- `tasksMapByIds` は workbooks に依存するため `Promise.all` から外し、**2段構成**にする。
  Map 構築は分岐させず、参照 ID リストだけを条件で決める（非該当タブ・匿名は空配列）。
  `getTasksWithSelectedTaskIds` は空配列なら DB を叩かず即 `[]` を返す
  （[tasks.ts:107](src/lib/services/tasks.ts#L107)）ため、後段は線形に書ける：

```typescript
const [workbooks, availableCategories, solutionCategoryMap, taskResultsByTaskId] =
  await Promise.all([
    fetchWorkbooksByTab(tab, selectedGrade, selectedCategory, !!adminUser),
    tab === WorkBookTab.SOLUTION
      ? getAvailableSolutionCategories(!!adminUser)
      : Promise.resolve([]),
    tab === WorkBookTab.SOLUTION && selectedCategory === ALL_SOLUTION_CATEGORIES
      ? getSolutionCategoryMapByWorkbookId(!!adminUser)
      : Promise.resolve(new Map<number, SolutionCategory>()),
    loggedInUser
      ? taskResultsCrud.getTaskResultsOnlyResultExists(loggedInUser.id, true)
      : Promise.resolve(new Map()),
  ]);

// Grade modes are only displayed on the CURRICULUM tab for logged-in users.
// For other tabs / anonymous, the id list is empty and getTasksWithSelectedTaskIds
// returns [] without a query (see tasks.ts guard), so tasksMapByIds becomes an empty Map.
const referencedTaskIds =
  tab === WorkBookTab.CURRICULUM && loggedInUser ? buildTaskIdsFromWorkbooks(workbooks) : [];
const referencedTasks = await taskCrud.getTasksWithSelectedTaskIds(referencedTaskIds);
const tasksMapByIds = new Map(referencedTasks.map((task) => [task.task_id, { grade: task.grade }]));
```

- `return { ... tasksMapByIds ... }` はキーそのまま。すべて try-catch 内（既存ルール準拠）。
- **トレードオフ**：CURRICULUM ログイン時のみ tasks 取得が workbooks の後段（1往復シーケンシャル）に
  なる。クエリは `task_id IN (...)` の小さな取得なので増分レイテンシは小。
  payload と DB 負荷の大幅削減と引き換えに許容する。
- **可読性メモ**：Map 構築を三項で分岐させず「参照 ID 決定（三項1つ）→ 取得 → Map 化」の線形に。
  `const` を維持でき、非該当タブは空配列ガードで自然に空 Map になる。

### Step 4 — component：+page.svelte のキャスト型を更新

`src/routes/workbooks/+page.svelte:36`：

```typescript
const tasksMapByIds = $derived(data.tasksMapByIds as Map<string, Pick<Task, 'grade'>>);
```

`Task` の全 import が他で使われていなければ調整（`TaskGrade` は既存 import）。

## 検証

1. `pnpm test:unit`：新規ヘルパーテストと既存 `workbooks.test.ts` が green。
2. `pnpm check`：型 narrow（Step 2/4）でエラーが出ないこと。
3. 手動：dev で `/workbooks?tab=curriculum`（ログイン）を開き、
   - grade バッジ表示が従来どおり（回帰なし）。
   - ネットワーク/SSR payload の `tasksMapByIds` が task_id＋grade のみに縮小していること。
   - SOLUTION / CREATED_BY_USER タブ、および匿名アクセスで `tasksMapByIds` が空 Map になること。
4. `pnpm format` 後コミット。

## 残タスク（後続 TODO）

- [ ] **load 統合テスト**：`+page.server.ts` の load を service mock で検証
      （`fetches only tasks referenced by displayed workbooks` / 非 CURRICULUM・匿名で空 Map）。
      route load テストは repo に前例がないため、別タスクとして mock 基盤込みで起票。
- [ ] 本番相当データ（問題集150件規模）で payload 再計測 → Phase 5 要否判断の材料に。
- [ ] **（スコープ外・別問題）list load の全タスク二重スキャン**：現状 load は全タスク取得を2回走らせている
      — `getTasksByTaskId`（本 Phase で参照タスク化）と [getTaskResultsOnlyResultExists()](src/lib/services/task_results.ts#L129)
      内部の `getTasks()`（[task_results.ts:136](src/lib/services/task_results.ts#L136)）。後者は出力こそ「回答済みのみ」に
      絞られるが DB は全タスクスキャン。Function Duration 寄与あり。Phase 4 のキャッシュ層、または
      `getTaskResultsOnlyResultExists` の取得方法見直しで対応を検討（本 Phase では触らない）。

## 理解の補足（レビュー中の QA ログ）

実装詳細を忘れていた箇所の確認結果。再発防止のため記録。

- **Q. `tasksMapByIds` は workbook ↔ 解答状況の繋ぎ込みに必須では？**
  A. 違う。繋ぎ込みは **`workbook.workBookTasks`（埋め込み済み）＋ `taskResultsByTaskId`** の2源だけで成立
  （[buildTaskResultsByWorkBookId](src/features/workbooks/utils/workbooks.ts#L118)、進捗/完了/カウンタ各セル）。
  `tasksMapByIds` は grade バッジ算出（`calcWorkBookGradeModes`、CURRICULUM のみ）専用。
- **Q. `taskResults` 生成の O(1)/O(N+M) 高速化に `tasksMapByIds` を使っているのでは？**
  A. 違う。高速化用の Map は [getTaskResultsOnlyResultExists()](src/lib/services/task_results.ts#L129) が
  **自前の `getTasks()` ＋ `getAnswers()`** で構築する `taskResultsByTaskId`（`with_map=true` の戻り値）。
  `getTasksByTaskId`／`tasksMapByIds` は無関係。
- **Q. 個別ページ（detail / create / edit）と関係する？**
  A. 無関係。それらは独自に load・`getTasksByTaskId` を持つ。本 Phase は list ページの load のみ。
- **Q. 削減が見込めるのは SOLUTION / CREATED_BY_USER だけ（CURRICULUM は計算で使うから減らない）では？**
  A. 違う。削減は2段構造で、**1段目（全件→参照タスクのみ）が全タブ共通の本丸**。
  CURRICULUM も 9000件 → 数十件に桁違いで減る（ゼロにはならないだけ）。
  SOLUTION / CREATED_BY_USER はさらに 2段目（参照→ゼロ）で空 Map になる。
  「削減＝他2タブだけ」は1段目を見落とした過小評価。
- **Q. これで Function Duration も消える？**
  A. 主に減るのは **Transfer（SSR payload）**。Duration は CURRICULUM ログイン時に
  `getTaskResultsOnlyResultExists` 内の `getTasks()` 全件スキャンが残るため**部分的**（残タスク TODO 参照）。

→ いずれも `tasksMapByIds` を細らせても繋ぎ込み・解答状況表示・O(1) 結合は無傷。

## 却下した代替案

- **全タブで参照タスク取得（plan 原文）**：SOLUTION/CREATED_BY_USER は gradeModes 未使用と確認済みのため、
  CURRICULUM ゲートでさらに削減。
- **grade 専用の新 getter 追加**：既存 `getTasksWithSelectedTaskIds` を再利用し、
  クライアント送出マップを grade-only に projection すれば十分（行数削減が本丸、カラムは副次）。
- **`getTasksByTaskId` 自体の改修**：create/edit/admin が依存。list 固有の最適化に留め副作用を避ける。
