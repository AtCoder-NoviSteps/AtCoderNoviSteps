# Round ラベルの全問AC時の背景色変更

## 概要

Issue: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3270

コンテストテーブルの Round ラベルセルについて、そのコンテスト行の全問が AC 系（`is_ac === true`）の場合に
ステータスの内訳に応じて背景色を変更する。

| 条件                                                   | 背景色                                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 全問 `is_ac === true` かつ 1問以上 `ac_with_editorial` | 解説AC背景色 (`bg-atcoder-ac-with_editorial-background dark:bg-atcoder-ac-with_editorial-background_dark`) |
| 全問 `is_ac === true` かつ 全問 `ac`                   | AC背景色（緑）(`bg-atcoder-ac-background dark:bg-atcoder-ac-background_dark`)                              |
| それ以外（未AC あり、または未ログイン）                | グレー (`bg-gray-50 dark:bg-gray-800`)                                                                     |

## 前提

- 対象はログインユーザーのみ（未ログイン時は従来の `bg-gray-50 dark:bg-gray-800` を維持）
- 解説AC（`ac_with_editorial`）は `is_ac === true` だが、全問 AC であっても 1 問でも解説AC が混じれば解説AC背景色を優先する
- `areAllTasksAccepted` の既存テストが通っているので、ユーティリティ側の追加テストは不要

## 設計メモ

### データの取り出し方

`contestTable.innerTaskTable[contestId]` は `Record<string, TaskResult>` 。
`generateTable` は実際に存在するタスク結果のみを挿入するため、
`Object.values(...)` で取得した配列に `undefined` は含まれない。

```typescript
const rowTasks: TaskResult[] = Object.values(contestTable.innerTaskTable[contestId]);
areAllTasksAccepted(rowTasks, rowTasks);
// 第1引数(acceptedTasks)を内部で is_ac フィルタ、第2引数(allTasks)をカウント
// 既存テストでも同一配列を両引数に渡すパターンが使われている
```

### ヘルパー関数

`isLoggedIn` はコンポーネント prop のクロージャ参照。
全問 AC 判定後、`tasks.some()` で解説AC の有無を確認して背景色を分岐する。

```typescript
function getRoundLabelClasses(contestTable: ProviderData, contestId: string): string {
  const tasks = Object.values(contestTable.innerTaskTable[contestId]);
  const bgColor = getRoundLabelBgColor(tasks);

  return `w-full ${contestTable.displayConfig.roundLabelWidth} truncate px-2 py-2 text-center ${bgColor}`;
}

function getRoundLabelBgColor(tasks: TaskResult[]): string {
  if (!isLoggedIn || !areAllTasksAccepted(tasks, tasks)) {
    return 'bg-gray-50 dark:bg-gray-800';
  }

  const hasEditorial = tasks.some((task) => task.status_name === 'ac_with_editorial');
  return getBackgroundColorFrom(hasEditorial ? 'ac_with_editorial' : 'ac');
}
```

`getRoundLabelBgColor` を独立した関数に切り出すことでテストが書きやすくなる
（ただし `isLoggedIn` をクロージャで参照しているため、引数として渡す設計でも可）。

## バグ報告と調査（2026-03-18）

### 症状

ステータスを「挑戦中（WA）→ 解説AC」に変更しても、Round ラベルの背景がリアクティブに緑にならない。
リロードすると緑になる（= DB には正しく保存されている）。
「挑戦中（WA）→ AC」は即時反映される。

### 原因

`src/lib/components/SubmissionStatus/UpdatingDropdown.svelte` の楽観的更新関数 `updateTaskResult` に誤りがある。

```typescript
// 誤り（line 161）
is_ac: submissionStatus.innerName === 'ac',
```

`ac_with_editorial` を選択すると `'ac_with_editorial' === 'ac'` が `false` になるため、
楽観的更新後の `TaskResult` は `is_ac: false` のまま。

`getRoundLabelClasses` 内の `areAllTasksAccepted` は `is_ac` を参照するため、
全問 ac_with_editorial でも `false` を返し → ラベルが灰色のまま。

リロードすれば DB から `is_ac: true`（`submission_statuses` の `is_AC: true`）が読まれるため正しく緑になる。

### 対処

`submission_statuses`（同ファイルで既に import 済み）から `is_AC` を参照する。

```typescript
// 修正後
is_ac:
  submission_statuses.find((status) => status.status_name === submissionStatus.innerName)?.is_AC ??
  false,
```

### 修正ファイル

- `src/lib/components/SubmissionStatus/UpdatingDropdown.svelte`（line 161）✅ 修正済み

---

## TODO

- [x] `src/features/tasks/components/contest-table/TaskTable.svelte`
  - [x] `areAllTasksAccepted` を `$lib/utils/task` から import に追加
  - [x] `getRoundLabelClasses(contestTable, contestId)` ヘルパー関数を追加（`getBodyCellClasses` の隣）
  - [x] `TableBodyCell`（Round ラベル）の `class` を `getRoundLabelClasses(contestTable, contestId)` に差し替え
- [x] 仕様変更: 解説AC混在時の背景色分岐
  - [x] `getRoundLabelClasses` 内の分岐を `getRoundLabelBgColor` ヘルパーに切り出す
  - [x] 全問 AC かつ解説ACあり → `getBackgroundColorFrom('ac_with_editorial')` に変更
  - [x] 全問 AC かつ解説ACなし → `getBackgroundColorFrom('ac')` を維持
- [x] 動作確認
  - [x] ログインユーザーで全問AC済み（AC のみ）のコンテスト行のラベルが緑背景になること
  - [x] ログインユーザーで全問AC済み（解説ACあり）のコンテスト行のラベルが解説AC背景色になること
  - [x] 未AC・未ログインでは従来色（グレー）のままであること
- [x] `pnpm format` を実行（変更なし）
- [x] `pnpm test:unit` — 1908/1909 passed（失敗1件は既存フレイキーテスト: `expects to handle large arrays efficiently`、今回の変更と無関係）
