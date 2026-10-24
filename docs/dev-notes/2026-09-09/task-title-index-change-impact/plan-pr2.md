# PR2 — JAG 合宿系と JAG 模擬地区を問題記号にする（66 コンテスト / 625 問）

前提・共通の決定・データ移行の手順は [plan.md](./plan.md)。照合結果は [investigation.md](./investigation.md#1-pr2-の照合2026-10-24)。

**状態**: 未着手。着手前の確認（Q1 / Q2）は 2026-10-24 に回答済み。残りは [着手前にすること](#着手前にすること)。

## 範囲

| 範囲                 | コンテスト / 問題 | 所在                          | 今の `title`                | 取り込みの経路                               |
| -------------------- | ----------------- | ----------------------------- | --------------------------- | -------------------------------------------- |
| JAG 夏 / 冬 / 春合宿 | 50 / 467          | seed・staging・本番           | `'2389. …'`（問題 ID 付き） | 無い（`JagRound` は PRELIM / REGIONAL のみ） |
| JAG 模擬地区         | 16 / 158          | 本番のみ（staging は 2 / 16） | 素                          | 管理画面（今は問題 ID のまま入る）           |

PR2 の時点では、この範囲のコンテスト表はまだ無い（PR2.5 で足す）。表示は問題一覧の出典欄（例: `JAG 夏合宿 2024 Day3 - H（AOJ）`）と title で確かめる。

関係する決定: M2 / M6 / M8 / M9 / M12 / M13 / M14 / M18 / M19（[plan.md](./plan.md#決定事項)）。

## 起きること

| 変更                            | 起きること                                                                                             | 対処               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------ |
| `task_table_index` の値が変わる | 既存レコードは自動更新されない（seed も取り込みも「既存なら skip」）                                   | 移行 UPDATE        |
| 合宿系の title の問題 ID        | index だけ記号にすると `removeTaskIndexFromTitle` が空振りし、`'2389. …'` が出典欄やセルにそのまま出る | title も直す（M9） |
| 基本ルールで記号がずれる        | 8 コンテストで先頭・途中に欠落がある（[照合結果](./investigation.md#記号の補正が要るコンテスト)）      | 補正（M13）        |

- 一意性は壊れない。`id` / `task_id` は `problem_index` を入力にしておらず、FK もすべて `task_id` を参照する（[根拠](./investigation.md#一意性は壊れない)）
- 模擬地区の title にプレフィックスは無い（本番・staging とも 0 行）。ただし本番の 3355 だけ、title の末尾にタブがある（M19）

## タスク

| #   | 内容                                                                                   | 補足                                                                                                                              |
| --- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 2-0 | 対応表の生成と照合                                                                     | [下記](#2-0-照合)                                                                                                                 |
| 2-1 | seed に模擬地区 158 問を追加する（M12）                                                | SQL B の値（grade も本番のまま。3355 の title は trim する）。最初は本番と同じ形（index = 問題 ID）で入れ、2-0 の照合の入力にする |
| 2-2 | 取り込みで、JAG は全 round で記号を付ける（M14）                                       | `AojChallengesApiClient` の `usesProblemLetters` を `contestType === 'ICPC' \|\| contestType === 'JAG'` にする                    |
| 2-3 | `prisma/tasks.ts` の 625 件の `problem_index` と、合宿系 467 件の `title` を書き換える | 2-0 の出力で置き換える                                                                                                            |
| 2-4 | 移行 SQL                                                                               | [下記](#移行-sql)                                                                                                                 |
| 2-5 | テスト                                                                                 | [下記](#テスト)                                                                                                                   |
| 2-6 | 手順書                                                                                 | `add-tasks` の「ICPC / JAG 模擬国内の `problem_index` は問題記号にする」を JAG 全体に広げる                                       |
| 2-7 | 照合スクリプトを削除する                                                               | 追加とは別のコミットにし、git の履歴から辿れるようにする                                                                          |

**クロスレビューが必須**（データ移行）。

## 着手前の確認（2026-10-24 に回答済み）

Q1: SQL A を本番と staging で流した結果。

| kind     | 本番（コンテスト / 問題） | staging（コンテスト / 問題） | index が問題 ID のまま | title が問題 ID 付き |
| -------- | ------------------------- | ---------------------------- | ---------------------- | -------------------- |
| Regional | 16 / 158                  | **2 / 16**                   | 全行                   | 0 行                 |
| Spring   | 4 / 42                    | 4 / 42                       | 全行                   | 全行                 |
| Summer   | 36 / 338                  | 36 / 338                     | 全行                   | 全行                 |
| Winter   | 10 / 87                   | 10 / 87                      | 全行                   | 全行                 |

- 本番は想定どおり。移行 SQL の想定値は (1) 625、(2) 45、(3) 467 で確定した
- **staging の模擬地区は 2 / 16 しか無い**。このままでは (1) が 483 になり RAISE する。[取り込みでそろえる](#着手前にすること)

Q2: SQL B の結果（本番の模擬地区 158 問）を受け取った。2-1 の seed の元にする。

- grade が PENDING でないものが 6 問（2251 D3、2594 D3、2736 D5、2858 D1、2863 D2、2865 D4）
- 3355 の title の末尾にタブがある（`Most distant point from the stations\t`）。今の取り込みは `trim()` するので、それ以前に入った行と見られる（M19）

```sql
-- SQL A: state of the PR2 scope (run on production and staging).
SELECT substring(contest_id FROM '^JAG(Summer|Winter|Spring|Regional)') AS kind,
       count(DISTINCT contest_id) AS contests,
       count(*) AS tasks,
       count(*) FILTER (WHERE task_table_index = task_id) AS index_is_problem_id,
       count(*) FILTER (WHERE starts_with(title, task_id || '. ')) AS title_has_id_prefix
FROM task
WHERE contest_type = 'AOJ_JAG'
  AND contest_id ~ '^JAG(Summer|Winter|Spring|Regional)'
GROUP BY kind
ORDER BY kind;

-- SQL B: JAG Regional tasks for the seed (production).
SELECT task_id, contest_id, task_table_index, title, grade
FROM task
WHERE contest_type = 'AOJ_JAG'
  AND contest_id LIKE 'JAGRegional%'
ORDER BY contest_id, task_id::int;
```

## 着手前にすること

| #   | 誰が     | 内容                                                                                                 | 理由                                                                                                                                                                                                             |
| --- | -------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | メンテナ | staging の管理画面から JAG REGIONAL を取り込み、SQL A で Regional が 16 / 158 になったことを確かめる | 件数チェックを staging で通すため。既存の 16 問は skip され、残りの 142 問が問題 ID のまま入る。**PR2 の PR を開く前**に、今のコードで行う。PR2 のコードで取り込むと基本ルールの記号が入り、2005 / 2013 がずれる |
| 2   | メンテナ | 本番で SQL D を流す                                                                                  | 3355 のほかにも前後に空白のある title があるかを確かめ、移行 SQL の (4) の範囲を決める                                                                                                                           |

```sql
-- SQL D: titles with leading or trailing whitespace (production).
SELECT task_id, contest_id, title
FROM task
WHERE title <> btrim(title, E' \t\r\n')
ORDER BY contest_id, task_id;
```

## 2-0 照合

PR1 のスクリプト（`git show 171bf3c9:docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_problem_letters.ts`）を次のように直して使う。

- 対象は `^JAG(Summer|Winter|Spring|Regional)` の 66 コンテスト / 625 問。件数が合わなければ止める。模擬地区は 2-1 で seed に足してから読む。PR2.1 の 10 コンテストは含めない
- 書き写しの元は 2026-10-24 のスクリーンショット（スプレッドシート 16 枚、行 2〜1025）
- PR1 では記号を基本ルールで付け、位置ごとに照合した。PR2 では先頭・途中の欠落（`absentLetters`）があるので、記号はスプレッドシートの位置（欠落を飛ばした位置）から決める。基本ルールと違うコンテストは別に出力し、移行 SQL の補正（`VALUES`）に使う
- 期待する出力: 補正が要るのは 8 コンテスト / 45 行（目視の暫定値）。合わなければ、どちらが正しいかを個別に確かめる
- 夏合宿 2010 Day2 の J（`Person responsible for problem description don't w`）は、スプレッドシートのセルだけでなく AOJ の title 自体も同じ所で切れている。前方一致の扱いは要らない

## 移行 SQL

骨組みのみ。補正の `VALUES`（45 行）は 2-0 の出力で埋める。(1)〜(3) の UPDATE を 1 つの DO ブロックに入れ、各件数を検査する（M13）。

```sql
DO $$
DECLARE
  updated_count integer;
BEGIN
  -- (1) Basic rule, as in PR1, for rows that still hold the AOJ problem id.
  WITH letters AS (
    SELECT task_id,
           chr(64 + row_number() OVER (
             PARTITION BY contest_id
             ORDER BY task_id::int
           )::int) AS letter
    FROM "task"
    WHERE contest_type = 'AOJ_JAG'
      AND contest_id ~ '^JAG(Summer|Winter|Spring|Regional)'
      -- Leaves rows that already have letters (PR2.1 data) untouched.
      AND task_table_index = task_id
  )
  UPDATE "task" AS t
  SET "task_table_index" = letters.letter
  FROM letters
  WHERE t."task_id" = letters.task_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  -- 0: empty DB (migrate reset), 467: seed without JAG Regional, 625: staging / production.
  IF updated_count NOT IN (0, 467, 625) THEN
    RAISE EXCEPTION 'basic rule: unexpected row count %', updated_count;
  END IF;

  -- (2) Overwrite every row of the contests that have problems missing from AOJ.
  UPDATE "task" AS t
  SET "task_table_index" = fixes.letter
  FROM (VALUES
    ('JAGSummer2006-day1', '2057', 'B')
    -- ... 45 rows in total
  ) AS fixes (contest_id, task_id, letter)
  WHERE t."task_id" = fixes.task_id
    AND t."contest_id" = fixes.contest_id
    AND t."contest_type" = 'AOJ_JAG';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  -- 32: training camps only, 45: training camps and JAG Regional.
  IF updated_count NOT IN (0, 32, 45) THEN
    RAISE EXCEPTION 'overrides: unexpected row count %', updated_count;
  END IF;

  -- (3) Strip the legacy "<problem id>. " prefix from titles (M9).
  UPDATE "task"
  SET "title" = substr("title", length("task_id") + 3)
  WHERE "contest_type" = 'AOJ_JAG'
    AND "contest_id" ~ '^JAG(Summer|Winter|Spring|Regional)'
    AND starts_with("title", "task_id" || '. ');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count NOT IN (0, 467) THEN
    RAISE EXCEPTION 'titles: unexpected row count %', updated_count;
  END IF;
END $$;

-- (4) Remove the trailing tab that only the production row has (M19).
UPDATE "task"
SET "title" = 'Most distant point from the stations'
WHERE "task_id" = '3355'
  AND "title" = E'Most distant point from the stations\t';
```

- **範囲は `contest_id` の接頭辞で絞る**。`AOJ_JAG` には PR1 で済んだ模擬国内も含まれる
- **件数の想定値に 0 を含める理由**: `prisma migrate reset`（ローカル）は空の DB にマイグレーションを流してから seed を入れる。開発者の既存 DB は合宿系だけを持ち、模擬地区は無い（467 / 32）
- **想定値**: 本番の SQL A で確定した（模擬地区の title にプレフィックスは無いので、(3) は 467 のまま）。staging は取り込みでそろえてから PR を開く
- **(4)**: 現在値を条件にしているので、タブの無い環境（ローカル、取り込み直後の staging）では 0 件で終わる。SQL D でほかにも見つかれば、ここを広げる
- **title の条件**: 「自分の `task_id` + `. `」で始まるものだけを対象にする。`~ '^[0-9]+\. '` だと他の数字で始まる title も消しうる。467 件すべてでプレフィックスが `task_id` と一致することは確認済み（[実測](./investigation.md#title-の持ち方が-aoj-内で割れている)）
- **`task_table_index = task_id` の条件**: PR2.1 の CSV（記号付き・素の title）が先に入っていても (1)(3) の対象にならない。PR2.1 との順序を問わないための保険
- `task_id::int` は安全（模擬地区の問題 ID も 2024〜3357 で数値）。1 コンテスト最大 14 問なので `chr(64 + n)` は A〜Z に収まる。SQL の読み方は [investigation.md](./investigation.md#sql-の読み方)

### ローカルと staging での確認

[共通の手順](./plan.md#手順)に加えて:

- ローカルの seed には模擬地区が無い（2-1 で足すのは記号付きの値）。PR2 のコードに切り替える前に、管理画面から JAG REGIONAL を取り込んでおく（index が問題 ID のまま、本番と同じ形で入る）。そうすればローカルでも 625 / 45 / 467 になる
- staging は、[着手前にすること](#着手前にすること)の 1 で 16 / 158 になったことを確かめてから PR を開く。件数が想定と一致しないと RAISE でデプロイが止まる
- 補正した 8 コンテストは「現在値 → 変更後」を全行見る
- 出典欄（問題一覧）で、合宿系・模擬地区が記号になり、title に問題 ID が出ていないこと

## テスト

- `src/lib/clients/aizu_online_judge/seed_problem_letters.test.ts` の範囲を 145 コンテスト / 1,257 問に広げる。補正していないコンテストは `assignProblemLetters` と一致し、補正した 8 コンテストは期待値を literal で書く（M18）。合宿系の title が `${problem id}. ` で始まらないことも見る
- `clients.test.ts`: JAG REGIONAL の取り込みで記号が付くこと。`usesProblemLetters` の JAG 条件を PRELIM だけに戻す変異を検出できること
- 書き換えたテストと追加したテストに `verify-test-strength` を当てる。期待値を新形式へ一括置換するとテストが仕様を検証しなくなるので、`testing.md` の Test integrity に従う
