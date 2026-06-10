# AOJ_UNIVERSITY 新規タスクデータに基づく単体テスト追加

## 概要

PR #3603 で追加された `AOJ_UNIVERSITY` タスク（`prisma/tasks.ts` L11976〜）のうち、
既存テストでカバーされていない contest_id パターン 4 種に絞ってテストケースを追加する。
実装コードは変更しない。test_cases ファイルへのケース追加のみ。

## 設計方針

- テストフレームワーク: 既存の `contest.test.ts` / `task.test.ts` が `.forEach` でテストケースを回す構造。
  test_cases ファイルにケースを足すだけで自動的にカバー対象が増える。
- 追加対象: 既存テストとの差分が生じる「パターンとして新しい」ケースのみ。
  年の違いだけのバリエーションは追加しない。

## カバレッジ分析

### 既にカバー済み（追加不要）

| contest_id                      | 根拠                                                    |
| ------------------------------- | ------------------------------------------------------- |
| `AOJ-RUPC2018-in-ACPC2018-day1` | contest_type / labels / task_index / url 全てテスト済み |
| `AOJ-HUPC2020-in-HUPC2020-day1` | 同上                                                    |
| `AOJ-UAPC2019-in-RUPC2019-day2` | 同上                                                    |

### 未カバーの新パターン（4 種）

| #   | パターン                                                           | 代表 contest_id                 | 追加が必要な関数                                                               |
| --- | ------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| 1   | **OUPC**（新大学略称）                                             | `AOJ-OUPC2012-in-RUPC2012-day2` | classifyContest / getContestNameLabel / addContestNameToTaskIndex / getTaskUrl |
| 2   | **RUPC-in-RUPC**（同大学が親イベント）                             | `AOJ-RUPC2018-in-RUPC2018-day1` | getContestNameLabel / addContestNameToTaskIndex                                |
| 3   | **HUPC-in-RUPC**（異大学ペアの新組合せ）                           | `AOJ-HUPC2014-in-RUPC2014-day3` | getContestNameLabel / addContestNameToTaskIndex                                |
| 4   | **UAPC-in-ACPC**（UAPC→ACPC 置換で両側が ACPC になるエッジケース） | `AOJ-UAPC2015-in-ACPC2015-day2` | getContestNameLabel / addContestNameToTaskIndex                                |

> classifyContest / getTaskUrl は正規表現 `/^AOJ-[A-Z]+PC\d{4}/` で
> RUPC・HUPC・UAPC を既にカバー。OUPC のみ新略称なのでこの 2 関数だけ追加。

## 期待値

### classifyContest()

| contest_id                      | expected                     |
| ------------------------------- | ---------------------------- |
| `AOJ-OUPC2012-in-RUPC2012-day2` | `ContestType.AOJ_UNIVERSITY` |

### getContestNameLabel()（= getAojUniversityContestLabel の変換結果）

| contest_id                      | expected                          | 備考                    |
| ------------------------------- | --------------------------------- | ----------------------- |
| `AOJ-OUPC2012-in-RUPC2012-day2` | `（OUPC 2012 in RUPC 2012 Day2）` | 新略称                  |
| `AOJ-RUPC2018-in-RUPC2018-day1` | `（RUPC 2018 in RUPC 2018 Day1）` | 同大学が親              |
| `AOJ-HUPC2014-in-RUPC2014-day3` | `（HUPC 2014 in RUPC 2014 Day3）` | 異大学ペア、day3        |
| `AOJ-UAPC2015-in-ACPC2015-day2` | `（ACPC 2015 in ACPC 2015 Day2）` | UAPC→ACPC で両側が ACPC |

### addContestNameToTaskIndex()

task_table_index は tasks.ts の実際の problem_index を使用。

| contest_id                      | taskTableIndex | expected                                  |
| ------------------------------- | -------------- | ----------------------------------------- |
| `AOJ-OUPC2012-in-RUPC2012-day2` | `2352`         | `AOJ 2352（OUPC 2012 in RUPC 2012 Day2）` |
| `AOJ-RUPC2018-in-RUPC2018-day1` | `2880`         | `AOJ 2880（RUPC 2018 in RUPC 2018 Day1）` |
| `AOJ-HUPC2014-in-RUPC2014-day3` | `2581`         | `AOJ 2581（HUPC 2014 in RUPC 2014 Day3）` |
| `AOJ-UAPC2015-in-ACPC2015-day2` | `1566`         | `AOJ 1566（ACPC 2015 in ACPC 2015 Day2）` |

### getTaskUrl()

| contest_id                      | taskId | expected                |
| ------------------------------- | ------ | ----------------------- |
| `AOJ-OUPC2012-in-RUPC2012-day2` | `2352` | `${AOJ_TASKS_URL}/2352` |

## 変更ファイル

| ファイル                                                       | 追加先                     | 追加件数     |
| -------------------------------------------------------------- | -------------------------- | ------------ |
| `src/test/lib/utils/test_cases/contest_type.ts`                | `aojUniversityContestData` | 1 件（OUPC） |
| `src/test/lib/utils/test_cases/contest_name_labels.ts`         | `aojUniversity` 配列       | 4 件         |
| `src/test/lib/utils/test_cases/contest_name_and_task_index.ts` | `AOJ_UNIVERSITY_TEST_DATA` | 4 件         |
| `src/test/lib/utils/test_cases/task_url.ts`                    | `aojUniversityContests`    | 1 件（OUPC） |

`contest.test.ts` / `task.test.ts` は変更不要（forEach で自動ピックアップ）。

## 却下した代替案

- 年違いのバリエーション（RUPC2012 vs RUPC2013 など）: 同一パターンのため追加しない（YAGNI）
- `compareByContestIdAndTaskId` への AOJ_UNIVERSITY ケース追加:
  優先度 25 は既存 AOJ 系テストで間接的に確認済みのため対象外

## 検証

```bash
pnpm test:unit
```

`contest.test.ts` と `task.test.ts` の aojUniversity ブロックが全パス。
