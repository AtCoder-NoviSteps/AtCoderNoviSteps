# AOJ問題追加: Namori Counting (issue #3811)

## 概要

issue #3811 は AOJ (Aizu Online Judge) 問題 [3369番 Namori Counting](https://onlinejudge.u-aizu.ac.jp/problems/3369) をタスクマスターに追加するタスク。基盤（`AOJ_UNIVERSITY` contest type、`AojGenerator`、ラベル整形ロジックなど）は PR #3631 およびそれ以前の feat コミット（`05eaa37b`）で実装済みのため、今回は以下のみが必要:

1. `prisma/tasks.ts` への1件のシードデータ追加
2. 追加により新たに露出するテストパターン（`AOJ-{ABBR}{YEAR}-in-{PARENT}{YEAR}-day{N}` の新しい大学ペア）に対する回帰テストの追加

ユーザー提供のタスクデータ:

```ts
{
  id: '3369',
  contest_id: 'AOJ-HUPC2023-in-OUPC2023-day2',
  problem_index: '3369',
  name: 'Namori Counting',
  title: '3369. Namori Counting',
},
```

`grade` は未指定（既存の多くのAOJエントリと同様。`prisma/seed.ts` の `getTaskGrade(undefined)` は `undefined` を返し、Prisma スキーマ側の `@default(PENDING)` が適用される — 既存コードの挙動どおりで変更不要）。

## 設計判断

`AOJ-HUPC2023-in-OUPC2023-day2` の contest_id は:

- **正規表現レベル**では新パターンではない（`regexForAojUniversity = /^AOJ-[A-Z]+PC\d{4}/`（`src/lib/utils/contest.ts`）は `HUPC` プレフィックスを既に `AOJ-HUPC2020-in-HUPC2020-day1` でカバー済み）→ `classifyContest()` の分類ロジックおよび `AojGenerator.canHandle()` の URL 生成ロジックは変更・追加テスト不要
- **ラベル整形の具体的な大学ペア（HUPC が OUPC 主催枠で開催）としては初出** → `getAojUniversityContestLabel()` の文字列変換結果を検証する2ファイルにのみテストケース追加が必要

この判断は PR #3631 で確立された前例（新規12タスク中、正規表現上「真に新しい略称」だった OUPC のみ `contest_type.ts` / `task_url.ts` に追加し、ラベル整形の新パターン4件は `contest_name_labels.ts` / `contest_name_and_task_index.ts` にのみ追加）に整合する。

### 却下した代替案

- **4ファイル全てにテストケースを追加する**: 網羅性は上がるが、`contest_type.ts` / `task_url.ts` は正規表現の分岐網羅が目的であり、既にカバー済みのプレフィックスに対する冗長なテストデータ追加は PR #3631 の設計方針と矛盾するため却下。
- **PR #3631 で指摘された既存3パターン（RUPC-in-RUPC, HUPC-in-RUPC, UAPC-in-ACPC）の未反映ギャップも同時に解消する**: issue #3811 のスコープ外であり、無関係な差分が混ざるとレビューコストが上がるため却下（ユーザー判断によりスコープ外と確定）。

## フェーズ

### Phase 1: テストケース追加（低リスク・純粋関数のテストのみ）

対象: `src/test/lib/utils/test_cases/contest_name_labels.ts`, `src/test/lib/utils/test_cases/contest_name_and_task_index.ts`

`getAojUniversityContestLabel()` によるラベル導出:

`AOJ-HUPC2023-in-OUPC2023-day2` → (`AOJ-`除去) `HUPC2023-in-OUPC2023-day2` → (略称+年の間にスペース) `HUPC 2023-in-OUPC 2023-day2` → (`-in-` → ` in `) `HUPC 2023 in OUPC 2023-day2` → (`-dayN` → ` DayN`) `HUPC 2023 in OUPC 2023 Day2` → `（HUPC 2023 in OUPC 2023 Day2）`

`contest_name_labels.ts` の `aojUniversity` 配列末尾に追加:

```ts
createTestCaseForContestNameLabel('AOJ, HUPC 2023 in OUPC 2023 Day2')({
  contestId: 'AOJ-HUPC2023-in-OUPC2023-day2',
  expected: '（HUPC 2023 in OUPC 2023 Day2）',
}),
```

`contest_name_and_task_index.ts` の `AOJ_UNIVERSITY_TEST_DATA` 配列末尾に追加:

```ts
{
  contestId: 'AOJ-HUPC2023-in-OUPC2023-day2',
  taskTableIndex: '3369',
  expected: 'AOJ 3369（HUPC 2023 in OUPC 2023 Day2）',
},
```

`pnpm test:unit` を実行し、既存ロジックのままテストが通ることを確認する（純粋関数は既に汎用正規表現・置換ルールで対応済みのため、実装変更なしでグリーンになる想定）。

### Phase 2: シードデータ追加

対象: `prisma/tasks.ts`

配列末尾（`id: '2496'` のエントリ直後、閉じ括弧 `];` の前）に以下を追加:

```ts
{
  id: '3369',
  contest_id: 'AOJ-HUPC2023-in-OUPC2023-day2',
  problem_index: '3369',
  name: 'Namori Counting',
  title: '3369. Namori Counting',
},
```

## 検証手順

1. `pnpm test:unit` — `src/test/lib/utils/contest.test.ts` の `aojUniversity` ケース群が全てパスすることを確認
2. `pnpm lint` / `pnpm check` — 型・フォーマットエラーがないことを確認
3. （任意）`pnpm db:seed` 実行後、`Task` テーブルに `task_id: '3369'` が `contest_type: AOJ_UNIVERSITY`, `task_table_index: '3369'`, `title: '3369. Namori Counting'` として登録されていることを確認。スキーマ変更なしのため `prisma generate` は不要

## 実装しない/含めないもの

- `contest_type.ts` / `task_url.ts` への追加（上記設計判断により不要）
- 既存の3パターンギャップ（RUPC-in-RUPC, HUPC-in-RUPC, UAPC-in-ACPC）の解消（スコープ外）
- 新規migrationやschema変更（不要）
