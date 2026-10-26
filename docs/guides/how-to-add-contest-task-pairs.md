# ContestTaskPair 追加ガイド

同じ問題（`task_id`）を別のコンテストにも表示するための `ContestTaskPair` を追加するときのリファレンス。テーブル（Provider）側の実装は [how-to-add-contest-table-provider.md](./how-to-add-contest-table-provider.md) のパターン3を参照。

---

## いつ必要か

`Task.task_id` は一意で、`Task` 行が持つ `contest_id` は 1 つだけ（以下「本来のコンテスト」）。同じ問題が別のコンテストにも出題されているとき、その「別のコンテストでの登場」を 1 行ずつ `ContestTaskPair` に足す。

例: ABC042-125 と ARC058-103 の共有問題、ABS、鉄則本（`tessoku-book`）、アルゴリズムと数学（`math-and-algorithm`）、ABC-Like、`jsc2025advance-final`。

本来のコンテストと同じ `(contestId, taskId)` のペアは無視されるので、足す必要はない。

---

## 仕組み

`getMergedTasksMap()`（`src/lib/services/tasks.ts`）が `Task` 行と `ContestTaskPair` を合わせ、`"contestId:taskId"`（`ContestTaskPairKey`）をキーにした Map を作る。ペア 1 件ごとに `Task` を複製し、次の 4 項目を書き換える。

| 項目               | 値                                                              |
| ------------------ | --------------------------------------------------------------- |
| `contest_id`       | `pair.contestId`                                                |
| `contest_type`     | `classifyContest(pair.contestId)`                               |
| `task_table_index` | `pair.taskTableIndex`                                           |
| `title`            | 元の `title` の最初の `task_table_index` を新しい記号に置換する |

回答（`TaskAnswer`）は `(task_id, user_id)` 単位なので、どのコンテストの表から見ても同じ回答状況になる。

---

## 追加手順

1. **Task の存在**: `taskId` の問題が `prisma/tasks.ts`（本番は `task` テーブル）にあること。無いペアは seed が警告を出して飛ばし、`getMergedTasksMap()` も黙って捨てる
2. **分類**: `classifyContest(contestId)` が正しい `ContestType` を返すこと。`null` だとペアは黙って捨てられる
3. **データ**: `prisma/contest_task_pairs.ts` に行を足す。フィールド名は AtCoder Problems の `contest-problem.json` と同じ形で、DB の列名とは異なる
4. **テーブル**: 新しい表示先が必要なら Provider を追加する（[how-to-add-contest-table-provider.md](./how-to-add-contest-table-provider.md)）
5. **検証用・本番環境**: Supabase に CSV で取り込む（次節）

| `contest_task_pairs.ts` | DB 列（`contesttaskpair`） | 例             |
| ----------------------- | -------------------------- | -------------- |
| `contest_id`            | `contestId`                | `tessoku-book` |
| `problem_id`            | `taskId`                   | `typical90_s`  |
| `problem_index`         | `taskTableIndex`           | `C18`          |

---

## 検証用・本番環境への投入（Supabase CSV）

管理画面からは取り込めない。Supabase Dashboard の Table Editor で `contesttaskpair` テーブルを開き、CSV を Import する。

- `id`・`createdAt`・`updatedAt` は手元で生成して CSV に必ず含める。`id`（`@default(uuid())`）と `updatedAt`（`@updatedAt`）は Prisma Client 側で埋める値で、DB に既定値が無い。`createdAt` には DB 既定値（`CURRENT_TIMESTAMP`）があるが、Supabase の CSV 取り込みでは自動で入らなかった
- 日時は `YYYY-MM-DD HH:MM:SS.mmm`（ミリ秒まで）の形式で入れる
- 列名は DB と同じ camelCase にする（`contestId`, `taskId`, `taskTableIndex`）
- 取り込んだペアは、サーバーのメモリキャッシュ（`getCachedMergedTasksMap`、TTL 1 時間）が切れるまで表示に反映されないことがある。DB への直接書き込みでは `invalidateTaskCaches()` が呼ばれないため

`contest_id,problem_id,problem_index`（`contest_task_pairs.ts` と同じ形）の CSV から取り込み用の CSV を作る例（polars）:

```python
import uuid
from datetime import datetime, timedelta, timezone

import polars as pl

data_frame = pl.read_csv("contest_task_pairs.csv")

# Add UUID column with unique values for each row.
# Add createdAt and updatedAt columns with current timestamp.
JST = timezone(timedelta(hours=9))
current_time = datetime.now(tz=JST).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

data_frame = data_frame.with_columns(
    pl.Series("id", [str(uuid.uuid4()) for _ in range(len(data_frame))]),
    pl.lit(current_time).alias("createdAt"),
    pl.lit(current_time).alias("updatedAt"),
)
# Rename columns to camelCase.
data_frame = data_frame.rename(
    {
        "contest_id": "contestId",
        "problem_id": "taskId",
        "problem_index": "taskTableIndex",
    }
)

data_frame.write_csv("contest_task_pairs_for_import.csv")
```

---

## よくあるミス

1. **title の形式** — title の書き換えは `title.replace(元の記号, 新しい記号)` で、最初に一致した箇所を置き換える。`C. Iroha's Obsession` や `019. Pick Two（★6）` のように title が「記号. 」で始まる AtCoder の問題を前提にしている。記号で始まらない title（AOJ など）では、名前の途中が置き換わる
2. **外部キーは無い** — `ContestTaskPair` から `Task` への外部キーは無い。存在しない `taskId` も CSV で入ってしまい、エラーにならずに表示されない
3. **キーを分解しない** — `ContestTaskPairKey` は `contestId` と `taskId` を `:` で連結しただけなので、`split(':')` で元に戻せる保証は無い。必要なときは `TaskResult` の `contest_id` / `task_id` を使う

---

## 意思決定

- **`Task.task_id` の一意制約は維持**: 回答・問題集・投票など多くのテーブルが `task_id` を参照するため。同じ問題の別コンテストでの登場は、別テーブル（`ContestTaskPair`）で表す
- **キーは文字列 `"contestId:taskId"`**: JavaScript の `Map` は配列やオブジェクトを値で比較しないため、テンプレートリテラル型の文字列にした
- **問題集（workbooks）は `taskId` だけをキーにする**: 1 つの問題集に、同じ `taskId` が別のコンテストとして入ることは無いと判断した。入れたくなった場合は、`WorkBookTask` に `contest_id` を持たせ、`getTaskResultsByTaskId()` の Map キーと `/workbooks/[slug]` の参照を `createContestTaskPairKey()` に揃える
- **管理画面用のUIは作らない**: 追加は低頻度で、seed と Supabase の CSV で足りるため。`createContestTaskPair()` / `updateContestTaskPair()` は現在呼び出し元が無い
- **互換レイヤを挟まずに移行した**: 計画段階の `TaskMapAdapter` や Feature Flag は採用せず、`/problems` 系の Map キーを一度に `ContestTaskPairKey` へ切り替えた

---

**最終更新**: 2026-10-26
