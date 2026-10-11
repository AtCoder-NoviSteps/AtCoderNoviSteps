# ARC-Like コンテスト 3 件の追加（#4140）

## 概要

[#4140](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/4140) で、以下 3 コンテストの問題を追加する。
いずれも ARC 相当（`ContestType.ARC_LIKE`）として分類する。

- `nikkei2019-2-qual`（第二回全国統一プログラミング王決定戦予選）
- `ddcc2020-qual`（DISCO presents ディスカバリーチャンネル コードコンテスト2020 予選）
- `diverta2019-2`（diverta 2019 Programming Contest 2）

参考 PR：[#3951](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/3951)（コンテスト名マッピング + `prisma/tasks.ts` + テストケースの追加）。
#3951 以降、コンテスト関連のユーティリティは `src/lib/utils/contest.ts` から `src/lib/contests/utils/` へ、テストケースは `src/lib/contests/fixtures/` へ移動している。

## 決定事項

| 項目                | 決定                                                    |
| ------------------- | ------------------------------------------------------- |
| `prisma/tasks.ts`   | 各コンテストの全問題を追加                              |
| `ARC_LIKE` の表示名 | 公式の日本語名（既存の `nikkei2019-qual` と同じ書き方） |
| 本戦（`*-final`）   | スコープ外（YAGNI）                                     |

## 設計の根拠

- `ARC_LIKE` は `arcLikePrefixes.has(id)` による完全一致で判定する（[classification.ts](../../../../src/lib/contests/utils/classification.ts)）。既存の `diverta2019` キーでは `diverta2019-2` にマッチしないため、3 件ともキーを追加する必要がある。
- `ARC_LIKE` にはラベル生成関数がないため、表示ラベルはコンテスト ID の大文字化（例：`DDCC2020-QUAL`）になる。既存の ARC-Like と同じ扱いなので、ラベル生成側は変更しない。
- 分類ルールは先にマッチしたものが優先される。新しい ID が `ARC_LIKE` より前のルール（`abc\d{3}`、`past`、`joi` などのプレフィックス）にマッチしないことを確認済み。

### 採用しなかった案

- `ARC_LIKE` をプレフィックス一致に変更する：`diverta2019` などのキーで想定外の ID まで拾ってしまうため不採用。完全一致の方針を維持する。
- ARC-Like 用のラベル生成関数を追加する：本件の要件外で、既存の ARC-Like コンテストの表示も変わってしまうため不採用。

## Phase 1：分類（テスト → 実装）

レイヤー：Utilities（`src/lib/contests/utils/`）+ テストデータ（`src/lib/contests/fixtures/`）。

1. [contest_type.ts](../../../../src/lib/contests/fixtures/contest_type.ts) の `arcLike` に 3 件を追加する（`nikkei2019-qual` の後、`acl1` の前）。
   ```typescript
   createTestCaseForContestType('NIKKEI2019-2 QUAL')({
     contestId: 'nikkei2019-2-qual',
     expected: ContestType.ARC_LIKE,
   }),
   createTestCaseForContestType('DDCC2020 QUAL')({
     contestId: 'ddcc2020-qual',
     expected: ContestType.ARC_LIKE,
   }),
   createTestCaseForContestType('diverta 2019 Programming Contest 2')({
     contestId: 'diverta2019-2',
     expected: ContestType.ARC_LIKE,
   }),
   ```
2. `pnpm test:unit src/lib/contests/utils/classification.test.ts` を実行し、失敗すること（Red）を確認する。
3. [prefixes.ts](../../../../src/lib/contests/utils/prefixes.ts) の `ARC_LIKE` に以下を追加する（開催順に並べる）。
   ```typescript
   'diverta2019-2': 'diverta 2019 Programming Contest 2',
   'nikkei2019-2-qual': '第二回全国統一プログラミング王決定戦予選',
   'ddcc2020-qual': 'DISCO presents ディスカバリーチャンネル コードコンテスト2020 予選',
   ```
4. テストが通ること（Green）を確認する。

## Phase 2：問題データ（`prisma/tasks.ts`）

レイヤー：DB シード。分岐を含まないデータ追加なので、テストファーストは省略する。

- ARC-Like ブロックの `acl1` の後、`tenka1-2019` の前に、開催日の新しい順で追加する：`ddcc2020-qual` → `nikkei2019-2-qual` → `diverta2019-2`。
- 各ブロックの中は既存と同じく問題番号の降順（F → A）で並べる。
- `id` / `problem_index` / `name` / `title` は [problems.json](https://kenkoooo.com/atcoder/resources/problems.json) の値をそのまま使う。
  - `ddcc2020-qual`：A〜F（ユーザー提供の値で確定済み）
  - `diverta2019-2`：A〜F（ユーザー提供の値で確定済み）
  - `nikkei2019-2-qual`：A〜F（ユーザー提供の値で確定済み）

## Phase 3：検証

- `pnpm format`、`pnpm lint`、`pnpm check`、`pnpm test:unit`、`git diff --check` を実行する。
- クロスレビュー：対象外（手で編集するファイルは 3 件で、認証・スキーマ・公開インターフェースの変更もない）。
