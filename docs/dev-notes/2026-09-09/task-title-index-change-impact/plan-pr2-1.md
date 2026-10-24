# PR2.1 — DB に無い 10 コンテストを入れる

前提・共通の決定・データ移行の手順は [plan.md](./plan.md)。対象の一覧は [investigation.md](./investigation.md#db-に無いコンテスト)。

**状態**: 未着手。[着手前の確認](#着手前の確認)の Q3〜Q5 待ち。PR2 / PR2.5 と前後してよい。

## 範囲

メンテナのスプレッドシートにあって、seed にも本番にも無いもの。問題数はスプレッドシート上の値。

| 範囲                                                                      | コンテスト / 問題 | 入手元                      | 本番への入れ方                        |
| ------------------------------------------------------------------------- | ----------------- | --------------------------- | ------------------------------------- |
| 2025 / 2026 の夏合宿                                                      | 6 / 72            | AOJ                         | Supabase の CSV（既存の合宿系と同じ） |
| in AtCoder（夏合宿 2018 Day2 / 2017 Day1 / 2015 Day3 / 2013 Day2 WarmUp） | 4 / 42            | AtCoder（AtCoder Problems） | 管理画面の AtCoder 取り込み           |

関係する決定: M17（[plan.md](./plan.md#決定事項)）。

## タスク

| #     | 内容                                                | 補足                                                                                                           |
| ----- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 2.1-0 | `ATCODER_JAG` を新設する                            | [下記](#atcoder_jag)。`add-contest-table-provider` の Layer 1–3                                                |
| 2.1-1 | in AtCoder の 4 コンテストを seed に追加する        | AtCoder Problems の値（index は記号、title は `A. …`）。本番は管理画面で取り込む（分類されれば skip されない） |
| 2.1-2 | 2025 / 2026 夏合宿の 6 コンテストを seed に追加する | 記号と素の title で書き、スプレッドシートと照合する                                                            |
| 2.1-3 | staging / production に Supabase の CSV で入れる    | **その環境に PR2 の移行を適用した後**に入れる。[下記](#csv)                                                    |
| 2.1-4 | テスト                                              | 分類・優先度・ラベル（Layer 3）。seed の記号の検査に 2025 / 2026 を足す                                        |

**クロスレビューが必須**（enum の追加は DB schema の変更）。

## 着手前の確認

| #   | 依頼                                                                                                         | 使い道                                     |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Q3  | 2025 / 2026 夏合宿 6 コンテストの contest_id（`JAGSummer2025-day1` の形でよいか）と、各問題の AOJ の問題番号 | seed・CSV・PR2.5 の並び順の配列            |
| Q4  | in AtCoder の 4 コンテストの、AtCoder 上の contest_id                                                        | `ATCODER_JAG` の分類とラベル、PR2.5 の配列 |
| Q5  | 既存の合宿系を CSV で入れたときの列と、`id` の作り方（SQL C で確かめられる）                                 | CSV の作り方                               |

Q3 / Q4 の contest_id は PR2.5 でも使うので、PR2.5 を書く前に確定させる。

```sql
-- SQL C: whether existing ids follow the import's sha256(contest_id + task_id).
SELECT contest_id, task_id,
       id = encode(sha256(convert_to(contest_id || task_id, 'UTF8')), 'hex') AS is_import_hash
FROM task
WHERE contest_id IN ('JAGSummer2024-day3', 'JAGRegional2022')
ORDER BY contest_id, task_id
LIMIT 6;
```

## ATCODER_JAG

| 場所                                          | 変更                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `prisma/schema.prisma` の `ContestType` enum  | `UNIVERSITY` の直前に追加し、マイグレーションを作る                        |
| `src/lib/contests/types/contest.ts`           | `ContestType` に同じ位置で追加                                             |
| `contestTypePriorities`（`priority.ts`）      | 18 にして、`UNIVERSITY` 以降を +1 ずつずらす。JSDoc の範囲も直す           |
| `CLASSIFICATION_RULES`（`classification.ts`） | `UNIVERSITY` の規則の直前に、`ATCODER_JAG` の 4 つと完全一致する規則を置く |
| `prefixes.ts`                                 | `ATCODER_JAG`（contest_id → ラベル、例: `'JAG 夏合宿 2018 Day2'`）         |
| `LABEL_GENERATORS`（`labels/index.ts`）       | `ATCODER_JAG` の map からラベルを引く                                      |

- 優先度をずらすので、`src/test/lib/utils/task.test.ts` の優先度の差の期待値のうち、ずれた項目を含むものを直す
- in AtCoder の contest_id が `regexForJag` に当たらないことを確かめる。当たると `getTaskUrl` が AOJ の URL を作る。AtCoder の contest_id は小文字の `jag…` の見込みで、`regexForJag` は大文字の `JAG(Prelim|…)` で始まるので当たらない

却下した方針:

| 案                         | 却下理由                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `jag` の前方一致で分類する | AtCoder Problems の `JAG2013Spring` / `JAG2014Spring` は AOJ の `JAGSpring2013` / `2014` と同じコンテストで、問題が二重に入る |
| `OTHERS` に入れる          | メンテナの判断で専用の ContestType にした                                                                                     |
| `AOJ_JAG` に入れる         | 出典欄の AOJ 分岐（`…（AOJ）`）や `getTaskUrl` が AOJ を前提に動く                                                            |

## CSV

- `id` は取り込みと同じ `sha256(contest_id + task_id)`（16 進）にする。既存の合宿系の作り方は Q5 で確かめる
- `updated_at` は DB に既定値が無い（`@updatedAt` は Prisma 側の実装）ので、CSV に含める。`created_at` / `grade` / `atcoder_problems_difficulty` には既定値がある
- `contest_type` は `AOJ_JAG`、`task_table_index` は記号、`title` は素
- 投入は `invalidateTaskCaches()` を経ないので、反映はキャッシュの TTL（1 時間）の後になる

却下した方針:

| 案                                                         | 却下理由                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 移行の前に、既存の合宿系と同じ形（問題 ID のまま）で入れる | PR2 の移行 SQL の件数の想定値が、投入の有無で変わる。記号付きで入れれば移行と独立する                    |
| 管理画面の取り込みに合宿系を足す                           | AOJ API が合宿系を返すか、`abbr` が `JAGSummer2025-day1` の形になるかが未確認。年 1 回の追加に対して重い |
