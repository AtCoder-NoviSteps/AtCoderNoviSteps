# ICPC 国内予選テーブル: プレフィックス累積バグ修正

Issue: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3636

## Context（なぜ直すか）

ICPC 国内予選テーブルで回答（提出ステータス）を更新するたびに、問題タイトルのプレフィックスが
`A. A. A. (タイトル)` のように累積する。本来は `A. (タイトル)` の1つだけであるべき。

### 根本原因（データフロー）

1. [TaskTable.svelte:70](../../../../src/features/tasks/components/contest-table/TaskTable.svelte#L70)
   `contestTableMaps = $derived(prepareContestTablesMap(providers))` は内部で `taskResults` を読む（L88）。
   Svelte 5 の `$derived` は関数内部の reactive read も追跡するため、`taskResults` 変更時に
   **再実行され `generateTable` が走る**。
2. [aoj_icpc_providers.ts:38](../../../../src/features/tasks/utils/contest-table/aoj_icpc_providers.ts#L38)
   の `{ ...taskResult, title: \`${letter}. ${taskResult.title}\` }` がプレフィックス付きの**新オブジェクト**を生成。
3. このオブジェクトがテンプレート L286-303 経由で `TaskTableBodyCell` → `UpdatingDropdown` に渡る。
4. 回答更新時 `UpdatingDropdown.updateTaskResult` は `{ ...taskResult, ...status }`（[L160](../../../../src/lib/components/SubmissionStatus/UpdatingDropdown.svelte#L160)）
   で spread するため title `"A. title"` を保持。
5. handleUpdateTaskResult L189-191 が、このプレフィックス付きオブジェクトを
   **ソース `taskResults` 配列に書き戻す**。
6. 次の再生成で `generateTable` が `"A. title"` を読み `"A. A. title"` を生成。更新ごとに累積。

**本質**: 表示用の整形（プレフィックス付与）を「再計算ループに乗った可変パイプライン（generateTable）」で行い、
その整形済みオブジェクトが更新の書き戻しでソースに還流している。AtCoder 系が壊れないのは、プレフィックスが
**不変のソース（DB title）**由来でループ外にあるため。ICPC だけがこの非対称により累積する。

## 方針: 案B — 表示時整形（データは常に pristine）

整形を**描画ループにもデータパイプラインにも入れず、読み取り専用の葉（cell）の表示文字列でのみ**付与する。
`generateTable` は title を一切変更せず素の `TaskResult` を格納するため、書き戻しても整形が還流せず累積が
**構造的に発生しなくなる**（dedup 処理もフラグも不要）。`removeTaskIndexFromTitle` と対称の素直な設計。

letter はコンテスト内で**位置依存**（全問題集合から算出）のため cell 単独では計算できず、provider が出す。
ICPC の `task_table_index` は AOJ の数値ID（`'1664'`）であって letter（`'A'`）ではない点に注意
（＝`removeTaskIndexFromTitle` の単純な逆操作では実装できない）。

### 不採用案

- **案A: `generateTable` を冪等化（strip-then-readd）**: 同じ letter の先行プレフィックスを除去してから付け直す。
  累積を整形地点で後追い検知する**力技**。ソース title はメモリ上 `"A. name"` のまま汚染が残り、
  表示整形をデータパイプラインに残す設計上の問題も未解決。
- **案C: 書き戻し時に title を保持（`{ ...updatedTask, title: taskResults[index].title }`）**: 1行で済むが、
  **汎用**の更新ハンドラが「title は generateTable が付け直すので書き戻すな」という ICPC 由来の表示事情を
  暗黙に知る結合が生じ、トリッキー。将来 title 以外の表示派生フィールドが増えると取りこぼす。
- **初期化フラグ**: `TaskResult` に「整形済み」フラグを持たせ二重付与を防ぐ。表示用の状態をドメイン型に
  持ち込み型を汚す。本質は案Aと同じ後追い検知で、汚染もループ外に出ない。

## 変更点

### 1. provider に `getTaskLabels` を追加（interface / base / ICPC）

- `ContestTableProvider` interface（[contest_table_provider.ts](../../../../src/features/tasks/types/contest-table/contest_table_provider.ts)）に追加:
  ```typescript
  // Positional display labels for cells (contestId -> task_table_index -> letter).
  // Empty for providers that show the index in the column header instead.
  getTaskLabels(filteredTaskResults: TaskResults): Record<string, Record<string, string>>;
  ```
- `ContestTableProviderBase` はデフォルトで `{}` を返す（既存 provider は表示挙動不変）。
- `AojIcpcPrelimProvider` が override: `buildAojIcpcLetterMap` から `{ [this.contestId]: { index: letter, ... } }` を返す。

### 2. ICPC `generateTable` から整形を除去（provider 層）

[aoj_icpc_providers.ts](../../../../src/features/tasks/utils/contest-table/aoj_icpc_providers.ts) の
generateTable は title を変更せず素の `TaskResult` を格納（キー・並びは現状維持）:

```typescript
for (const taskResult of filtered) {
  table[this.contestId][taskResult.task_table_index] = taskResult;
}
```

L26-27 のコメントも実態に合わせ更新。

### 3. ICPC 表示整形は AOJ 固有 util として `aoj_icpc_labels.ts` に追加

本当に新しいのは「AOJ ICPC の位置ラベルを title へ前置する」狭い・AOJ 固有の処理だけ。汎用名の関数に
束ねない（残りの raw / strip 分岐は既存で、汎用に見せかけない）。`removeTaskIndexFromTitle` は7箇所・複数 feature で
使う真に汎用な util で責務の広さが異なるため、そこには混ぜない。

`aoj_icpc_labels.ts`（ICPC のラベル**値**生成 `buildAojIcpcLetterMap` と同居 = 責務一致）に追加:

```typescript
// Prepend the assigned positional letter to an ICPC title for inline display (e.g. "A. name").
export function formatAojIcpcTitle(title: string, letter: string): string {
  return `${letter}. ${title}`;
}
```

3分岐の組み立て自体は汎用 util に切り出さず、cell の `$derived displayTitle` で持つ（表示分岐はコンポーネントの責務）。

### 4. ProviderData / cell へ letter を配線

- [TaskTable.svelte](../../../../src/features/tasks/components/contest-table/TaskTable.svelte): `ProviderData` に
  `taskLabels: Record<string, Record<string, string>>` を追加し、`prepareContestTable` で
  `provider.getTaskLabels(filteredTaskResults)` をセット。テンプレートで
  `{@const taskLabel = contestTable.taskLabels[contestId]?.[taskTableHeaderId]}` を引き、cell に prop で渡す。
- [TaskTableBodyCell.svelte](../../../../src/features/tasks/components/contest-table/TaskTableBodyCell.svelte):
  `taskLabel?: string` prop を追加。`$derived displayTitle` を `<script>` に置き、
  `taskLabel ? formatAojIcpcTitle(title, taskLabel) : isShownTaskIndex ? title : removeTaskIndexFromTitle(title, task_table_index)`
  を組み立て、`description={displayTitle}` を渡す。

## テスト（TDD: 先に書いて失敗を確認）

- **`aoj_icpc_labels.test.ts`（新規 `formatAojIcpcTitle`）**: `('Amidakuji', 'B')` → `'B. Amidakuji'`。
- **`aoj_icpc_providers.test.ts`（`getTaskLabels`）**: 数値ID昇順で A–H を割当て、`{ ICPCPrelim2023: { '1664': 'A', ... } }` を返す。
  cell の3分岐は薄い表示ロジックなので Vitest は省略し、手動/E2E（検証手順3）でカバー。
- **`aoj_icpc_providers.test.ts`（`generateTable` 既存テスト改修）**: 現行の `'A. ...'` を期待する assert（L183-195）を
  **素タイトルを格納する**前提に修正。再入力しても title 不変（構造的冪等）を1ケース追加。
- **`contest_table_provider_base.test.ts`**: `getTaskLabels` がデフォルトで `{}` を返す。

## 検証

1. `pnpm test:unit`（上記対象ファイル）— 新規・改修テストが先に失敗 → 実装後に全通過。
2. `pnpm test:unit` 全体でリグレッションなし。
3. `pnpm dev` で /problems → ICPC 国内予選テーブルを開き、同一問題の回答を複数回更新。
   タイトルが `A. (名前)` のまま（`A. A. ...` にならない）ことを目視確認。AtCoder 系テーブルの表示が不変なことも確認。
4. `pnpm check` / `pnpm lint`（必要なら `pnpm format`）。
