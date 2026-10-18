# bogosort / みんなのプロコン 2019 の問題追加（#4158）

## 概要

[#4158](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/4158) で、以下 3 コンテストの問題（計 34 問）を追加する。

| contest_id              | ContestType  | 表示名                                | 問題数    |
| ----------------------- | ------------ | ------------------------------------- | --------- |
| `yahoo-procon2019-qual` | `ARC_LIKE`   | みんなのプロコン 2019                 | 6（A–F）  |
| `bogosortcontest_div1`  | `UNIVERSITY` | bogosort Programming Contest (Div. 1) | 14（A–N） |
| `bogosortcontest_div2`  | `UNIVERSITY` | bogosort Programming Contest (Div. 2) | 14（A–N） |

参考 PR：[#4143](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/4143)（ARC-Like 3 件の追加。`prefixes.ts` + `contest_type.ts` + `prisma/tasks.ts`）。
本件は bogosort を `UNIVERSITY` に入れるため、#4143 の手順に加えて大学コンテストのラベル生成の修正が必要になる。

## 決定事項

| 項目                     | 決定                                                                      |
| ------------------------ | ------------------------------------------------------------------------- |
| bogosort の区分          | div1 / div2 とも `UNIVERSITY`（NoviSteps としての扱い。ユーザー確認済み） |
| yahoo の区分             | `ARC_LIKE`（Issue の指定どおり）                                          |
| 表示名                   | 上表のとおり（ユーザー確認済み）                                          |
| `yahoo-procon2019-final` | スコープ外（YAGNI）                                                       |

## 事前調査：ID・問題名の重複確認

`prisma/tasks.ts` の既存 2,419 行と新規 34 行を突き合わせた（`tsx` スクリプトで確認）。

- `task_id`（`Task.task_id`、`@unique`）：既存との重複なし。新規 34 件の中でも重複なし。
- hash id：管理画面のインポート（[+page.server.ts](<../../../../src/routes/(admin)/tasks/+page.server.ts>)）は `Task.id = sha256(contest_id + task.id)` で採番する。連結前の文字列も含めて既存・新規の間で衝突なし。
  - シード（`prisma/seed.ts`）は fabbrica の自動採番で `Task.id` を作るため、hash の衝突は起こらない。
- `prisma/contest_task_pairs.ts` / `prisma/tasks_for_production.ts`：bogosort・yahoo への言及なし。
- 既存問題との同名：なし（`Path`・`Pass` なども既存に同名なし）。
- 新規の中での同名：div1 と div2 の共通問題が 3 組ある。いずれも problems.json 上で `id` が別なので、別の Task として登録する。`ContestTaskPair` は 1 つの問題 ID が複数コンテストに出る場合の仕組みなので、今回は使わない。
  - `Go Robots`：`bogosortcontest_div2_h` / `bogosortcontest_div1_d`
  - `Consecutive Pairs`：`bogosortcontest_div2_k` / `bogosortcontest_div1_l`
  - `K-Independent Matrix`：`bogosortcontest_div2_l` / `bogosortcontest_div1_e`
- 制約：本番 DB の内容は確認できない。ただし `task_id` は `@unique` なので、万一重複していても DB 側で登録が拒否される。

## 設計の根拠

- 分類：`UNIVERSITY` は `atCoderUniversityPrefixes.some((prefix) => id.startsWith(prefix))` によるプレフィックス一致で判定する（[classification.ts](../../../../src/lib/contests/utils/classification.ts)）。`ATCODER_UNIVERSITIES` にキーを足せば分類できるので、判定ロジックは変更しない。
  - 先に評価される `CONTEST_TYPES_BY_ID` と、`UNIVERSITY` より前のルール（`abc\d{3}`、`past`、`joi`、`ABC_LIKE`、`ARC_LIKE`、`AGC_LIKE` など）に `bogosortcontest_*` がマッチしないことを確認済み。
  - `yahoo-procon2019-qual` も `ARC_LIKE` より前のルールにマッチしない。`ATCODER_OTHERS` / `ATCODER_UNIVERSITIES` のプレフィックスにも先頭が `yahoo` のものはない。
- ラベル：`getAtCoderUniversityContestLabel` は `^(ku|qu|ut|tt|tu|wu)pc\d{4}$` にしかマッチしない（[universities.ts](../../../../src/lib/contests/utils/labels/universities.ts)）。このままだと `null` が返り、表示は `BOGOSORTCONTEST_DIV1` になる。そこで、正規表現に合わない ID は `ATCODER_UNIVERSITIES` を完全一致で引くフォールバックを追加する。`OTHERS` の `generateOthersLabel` と同じやり方。
  - 既存キー（`kupc` → `KUPC` など）が完全一致で引かれるのは、年のない ID が渡されたときだけ。その場合も結果は従来の大文字化フォールバックと同じなので、既存の表示は変わらない。
  - ただし関数単体の戻り値は変わる（`ttpc` / `tupc`：`null` → `'TTPC'` / `'TUPC'`）。実装中に既存テストとの矛盾が分かったため、ユーザーに確認した上で期待値を更新した。
  - `constructor` などのプロトタイプのプロパティを拾わないよう、`Object.hasOwn` で判定する。
- yahoo のラベル：`ARC_LIKE` にはラベル生成関数がないため、表示は `YAHOO-PROCON2019-QUAL` になる。既存の ARC-Like と同じ扱いなので変更しない（#4143 と同じ判断）。
- 問題名からの表示（`task_index_label`）は `getContestNameLabel` を使うので、ラベルを直せば `bogosort Programming Contest (Div. 1) - A` のように表示される。

### 採用しなかった案

- `bogosortcontest` を 1 キーにしてプレフィックス一致で両 Div を拾う：分類はできるが、ラベルで Div を区別できない。結局 ID ごとの対応表が必要になるので不採用。
- 大学コンテストの正規表現を広げる：bogosort は `xxpc{年}` の形ではないので、正規表現で表すと不自然になる。不採用。
- ラベル専用の辞書を別に作る：`ATCODER_OTHERS` が分類用プレフィックスと表示名を 1 つの辞書で兼ねている前例があり、辞書を増やす理由がない（YAGNI）。不採用。
- `OTHERS` や `ARC_LIKE` / `ABC_LIKE` に分類する：ユーザーの判断で `UNIVERSITY` に決定。

## 主要な関数の変更後シグネチャ

シグネチャは変えず、振る舞いだけを広げる。

```typescript
// src/lib/contests/utils/labels/universities.ts
import { ATCODER_UNIVERSITIES } from '../prefixes';

export function getAtCoderUniversityContestLabel(contestId: string): string | null {
  if (regexForAtCoderUniversity.test(contestId)) {
    return contestId.replace(/* 既存のまま */);
  }

  return Object.hasOwn(ATCODER_UNIVERSITIES, contestId) ? ATCODER_UNIVERSITIES[contestId] : null;
}
```

## Phase 1：分類（テスト → 実装）

レイヤー：Utilities（`src/lib/contests/utils/prefixes.ts`）+ テストデータ（`src/lib/contests/fixtures/contest_type.ts`）。

1. [contest_type.ts](../../../../src/lib/contests/fixtures/contest_type.ts) にテストケースを追加する。
   - `universityContestIds` の末尾に `'bogosortcontest_div1'`、`'bogosortcontest_div2'` を追加する（期待値 `ContestType.UNIVERSITY`）。
   - `arcLike` の `diverta2019-2` の後（`keyence2019` の前）に追加する。
     ```typescript
     createTestCaseForContestType('みんなのプロコン 2019')({
       contestId: 'yahoo-procon2019-qual',
       expected: ContestType.ARC_LIKE,
     }),
     ```
2. `pnpm test:unit src/lib/contests/utils/classification.test.ts` で失敗すること（Red）を確認する。
3. [prefixes.ts](../../../../src/lib/contests/utils/prefixes.ts) に追加する。
   - `ARC_LIKE`：`'yahoo-procon2019-qual': 'みんなのプロコン 2019'`（`diverta2019-2` の後、`keyence2019` の前）
   - `ATCODER_UNIVERSITIES`：`bogosortcontest_div1: 'bogosort Programming Contest (Div. 1)'`、`bogosortcontest_div2: 'bogosort Programming Contest (Div. 2)'`
   - `ATCODER_UNIVERSITIES` の上にある HACK コメント（「As of September 2025, KUPC, QUPC, ...」）を現状に合わせて更新する。
4. テストが通ること（Green）を確認する。

## Phase 2：大学コンテスト系ラベルのフォールバック（テスト → 実装）

レイヤー：Utilities（`src/lib/contests/utils/labels/universities.ts`）。

1. [universities.test.ts](../../../../src/lib/contests/utils/labels/universities.test.ts) に describe を追加する。
   - テスト名：`expected to return the registered name for contests listed in ATCODER_UNIVERSITIES`
     - `['bogosortcontest_div1', 'bogosort Programming Contest (Div. 1)']`
     - `['bogosortcontest_div2', 'bogosort Programming Contest (Div. 2)']`
     - `['ttpc', 'TTPC']`、`['tupc', 'TUPC']`（既存の null 側から移動）
   - null 側には `utpc24`、`xxpc2024` など辞書にない ID を残す。
   - `bogosortcontest_div3`、`constructor` が `null` になるケースを null 側に追加する。
2. 失敗すること（Red）を確認する。
3. `getAtCoderUniversityContestLabel` に辞書フォールバックを追加し、TSDoc（正規表現の説明、`null` を返す条件）を更新する。
4. `pnpm test:unit src/lib/contests/` が通ること（Green）を確認する。`task_index_label.test.ts` の大学系ケースが壊れていないことも確認する。

## Phase 3：問題データ（`prisma/tasks.ts`）

レイヤー：DB シード。分岐を含まないデータ追加なので、テストファーストは省略する。

- `id` / `contest_id` / `problem_index` / `name` / `title` はユーザー提供の problems.json の値をそのまま使う。`grade` は付けない（既存の同種追加と同じ）。
- 行数が多いので、ユーザー提供の JSON からスクリプトで生成して貼り付ける。
- 挿入位置：
  - `yahoo-procon2019-qual`：ARC-Like ブロックの `tenka1-2019` の後、`caddi2018` の前（開催日の新しい順）。
  - `bogosortcontest_div1` → `bogosortcontest_div2`：現在 `UNIVERSITY` のブロックはないので、`fps-24` ブロックの後、`s8pc-4`（OTHERS）の前に新しく置く（優先度順に並んでいる既存の並びに合わせる）。両 Div は同時開催なので Div. 1 を先にする。
- 各コンテスト内は問題番号の降順（N → A、F → A）。
- `grep -c` で件数を確認する：yahoo 6、div1 14、div2 14。

## Phase 4：検証

- `pnpm format`、`pnpm lint`、`pnpm check`、`pnpm test:unit`、`git diff --check` を実行する。
- クロスレビュー：対象外。手で編集するファイルは 5 件（`prefixes.ts`、`universities.ts`、`universities.test.ts`、`contest_type.ts`、`tasks.ts`）で、認証・スキーマ・公開インターフェースの変更もない（`getAtCoderUniversityContestLabel` はシグネチャを変えず、返せる値を増やすだけ）。
