# ICPC 地区予選 → ICPC アジア地区 ラベル変更

## Context

Issue #3680 に関連して、「ICPC 地区予選」の表示ラベルを「ICPC アジア地区」に変更する。国内予選（Prelim）は変更なし。表示ラベルの文字列置換のみで、ロジック・型・DB への影響はない。

## 変更対象

### プロダクションコード（4ファイル）

| ファイル                                                                  | 行      | 変更内容                                                      |
| ------------------------------------------------------------------------- | ------- | ------------------------------------------------------------- |
| `src/lib/utils/contest.ts`                                                | 738     | `Regional: ' 地区予選 '` → `' アジア地区 '`                   |
| `src/lib/clients/index.ts`                                                | 77      | `'AOJ - ICPC 地区予選'` → `'AOJ - ICPC アジア地区'`           |
| `src/features/tasks/utils/contest-table/aoj_icpc_providers.ts`            | 80, 91  | title・label の `ICPC 地区予選` → `ICPC アジア地区`           |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts` | 249-250 | groupName・buttonLabel の `ICPC 地区予選` → `ICPC アジア地区` |

### テストコード（4ファイル）

| ファイル                                                                       | 行            | 変更内容                                        |
| ------------------------------------------------------------------------------ | ------------- | ----------------------------------------------- |
| `src/test/lib/utils/test_cases/contest_name_labels.ts`                         | 132, 140      | expected の `地区予選` → `アジア地区`           |
| `src/test/lib/utils/test_cases/contest_name_and_task_index.ts`                 | 848, 883      | コメント・expected の `地区予選` → `アジア地区` |
| `src/features/tasks/utils/contest-table/aoj_icpc_providers.test.ts`            | 696, 743, 792 | expected の `ICPC 地区予選` → `ICPC アジア地区` |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts` | 314, 316      | expected の `ICPC 地区予選` → `ICPC アジア地区` |

## 手順

1. テストの期待値を先に変更（TDD: Red）
2. プロダクションコードを変更（Green）
3. `pnpm test:unit` で全テスト通過を確認
4. `pnpm format` で整形

## 対象外

- `ContestType.AOJ_ICPC` enum 値：変更なし
- `ICPCRegional` contest ID パターン：AOJ のデータ由来のため変更なし
- ariaLabel `'Filter ICPC Asia Regional'`：英語で既に Asia を含んでおり変更不要
- 国内予選（Prelim）関連：全て現状維持
