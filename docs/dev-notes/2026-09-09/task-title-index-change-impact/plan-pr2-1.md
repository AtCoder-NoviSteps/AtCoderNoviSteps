# PR2.1 — DB に無い 10 コンテストを入れる

前提・共通の決定・データ移行の手順は [plan.md](./plan.md)。スプレッドシートとの対応は [investigation.md](./investigation.md#db-に無いコンテスト)。

**状態**: 未着手。必要な情報（問題番号・contest_id・CSV の作り方）は 2026-10-24 にメンテナから受け取った。PR2 / PR2.5 と前後してよい。

## 範囲

メンテナのスプレッドシートにあって、seed にも本番にも無いもの。

| コンテスト                            | contest_id                   | 問題（task_id）                            | 入手元  | 本番への入れ方                        |
| ------------------------------------- | ---------------------------- | ------------------------------------------ | ------- | ------------------------------------- |
| JAG 夏合宿 2026 Day1〜3               | `JAGSummer2026-day1`〜`day3` | 3684〜3719（各 12 問、A〜L）               | AOJ     | Supabase の CSV（既存の合宿系と同じ） |
| JAG 夏合宿 2025 Day1〜3               | `JAGSummer2025-day1`〜`day3` | 3648〜3683（各 12 問、A〜L）               | AOJ     | 同上                                  |
| JAG 夏合宿 2018 Day2（有志）          | `jag2018summer-day2`         | `jag2018summer_day2_a`〜`k`（11 問）       | AtCoder | 管理画面の AtCoder 取り込み           |
| JAG 夏合宿 2017 Day1（有志）          | `jag2017summer-day1`         | `jag2017summer_day1_a`〜`k`（11 問）       | AtCoder | 同上                                  |
| JAG 夏合宿 2015 Day3（過去問）        | `jag2015summer-day3`         | `icpc2015summer_day3_a`〜`j`（10 問）      | AtCoder | 同上                                  |
| JAG 夏合宿 2013 Day2 WarmUp（過去問） | `jag2013summer-warmingup`    | `icpc2013summer_warmingUp_a`〜`j`（10 問） | AtCoder | 同上                                  |

計 114 問（AOJ 72、AtCoder 42）。いずれもスプレッドシートの問題名と記号の位置ごとに一致した（目視）。

- AOJ の 6 コンテストは問題 ID が連番で、欠落も無い。記号は基本ルールと一致する。メンテナから受け取った値は `prisma/tasks.ts` と同じ形（`id` / `contest_id` / `problem_index` / `name` / `title`）で、title は素
- AtCoder の 4 コンテストは AtCoder Problems の値で、title は `A. …` の形。2015 / 2013 の task_id は `icpc…` で始まるが、分類と URL はどちらも contest_id で決まるので影響しない

関係する決定: M17（[plan.md](./plan.md#決定事項)）。

## タスク

| #     | 内容                                                | 補足                                                                                        |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 2.1-0 | `ATCODER_JAG` を新設する                            | [下記](#atcoder_jag)。`add-contest-table-provider` の Layer 1–3                             |
| 2.1-1 | in AtCoder の 4 コンテストを seed に追加する        | 上の値。本番は管理画面の AtCoder 取り込みで入る（分類されれば skip されない）               |
| 2.1-2 | 2025 / 2026 夏合宿の 6 コンテストを seed に追加する | メンテナから受け取った値をそのまま使う                                                      |
| 2.1-3 | staging / production に Supabase の CSV で入れる    | **その環境に PR2 の移行を適用した後**に入れる。[下記](#csv)                                 |
| 2.1-4 | テスト                                              | 分類・優先度・ラベル（Layer 3）。seed の記号の検査（PR2 で広げたもの）に 2025 / 2026 を足す |

**クロスレビューが必須**（enum の追加は DB schema の変更）。

## ATCODER_JAG

| 場所                                          | 変更                                                             |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `prisma/schema.prisma` の `ContestType` enum  | `UNIVERSITY` の直前に追加し、マイグレーションを作る              |
| `src/lib/contests/types/contest.ts`           | `ContestType` に同じ位置で追加                                   |
| `contestTypePriorities`（`priority.ts`）      | 18 にして、`UNIVERSITY` 以降を +1 ずつずらす。JSDoc の範囲も直す |
| `CLASSIFICATION_RULES`（`classification.ts`） | `UNIVERSITY` の規則の直前に、下の 4 つと完全一致する規則を置く   |
| `prefixes.ts`                                 | `ATCODER_JAG`（contest_id → ラベル、下表）                       |
| `LABEL_GENERATORS`（`labels/index.ts`）       | `ATCODER_JAG` の map からラベルを引く                            |

| contest_id                | ラベル（出典欄）              |
| ------------------------- | ----------------------------- |
| `jag2018summer-day2`      | `JAG 夏合宿 2018 Day2`        |
| `jag2017summer-day1`      | `JAG 夏合宿 2017 Day1`        |
| `jag2015summer-day3`      | `JAG 夏合宿 2015 Day3`        |
| `jag2013summer-warmingup` | `JAG 夏合宿 2013 Day2 WarmUp` |

ラベルに（有志）は付けない。PR2.5 のテーブル名でだけ、2018 Day2 と 2017 Day1 に `（有志）` を付ける（M16）。

- 優先度をずらすので、`src/test/lib/utils/task.test.ts` の優先度の差の期待値のうち、ずれた項目を含むものを直す
- 4 つの contest_id は小文字の `jag…` で始まるので、`regexForJag`（大文字の `JAG(Prelim|…)`）にも `AojGenerator` の `startsWith('ICPC')` にも当たらない。`getTaskUrl` は AtCoder の URL を作る

却下した方針:

| 案                         | 却下理由                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `jag` の前方一致で分類する | AtCoder Problems の `JAG2013Spring` / `JAG2014Spring` は AOJ の `JAGSpring2013` / `2014` と同じコンテストで、問題が二重に入る |
| `OTHERS` に入れる          | メンテナの判断で専用の ContestType にした                                                                                     |
| `AOJ_JAG` に入れる         | 出典欄の AOJ 分岐（`…（AOJ）`）や `getTaskUrl` が AOJ を前提に動く                                                            |

## CSV

既存の合宿系と同じく、メンテナが別プロジェクトのスクリプトで作る。

- `id` は `sha256(contest_id + title)`（16 進。既存の合宿系と同じ規則）。管理画面の取り込みは `sha256(contest_id + task_id)` で規則が違うが、`Task.id` を再計算して引く箇所は無いので問題ない（[根拠](./investigation.md#id-の採番規則が経路ごとに違う)）
- `contest_type` は `AOJ_JAG`、`task_table_index` は記号、`title` は素（受け取った値のまま）
- `updated_at` は DB に既定値が無い（`@updatedAt` は Prisma 側の実装）ので、CSV に含まれていることを確かめる。`created_at` / `grade` / `atcoder_problems_difficulty` には既定値がある
- 投入は `invalidateTaskCaches()` を経ないので、反映はキャッシュの TTL（1 時間）の後になる

却下した方針:

| 案                                                         | 却下理由                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 移行の前に、既存の合宿系と同じ形（問題 ID のまま）で入れる | PR2 の移行 SQL の件数の想定値が、投入の有無で変わる。記号付きで入れれば移行と独立する                    |
| 管理画面の取り込みに合宿系を足す                           | AOJ API が合宿系を返すか、`abbr` が `JAGSummer2025-day1` の形になるかが未確認。年 1 回の追加に対して重い |
| `id` を取り込みと同じ規則にそろえる                        | 既存の合宿系と規則が分かれる。`id` を再計算する箇所が無いので、そろえる利点が無い                        |
