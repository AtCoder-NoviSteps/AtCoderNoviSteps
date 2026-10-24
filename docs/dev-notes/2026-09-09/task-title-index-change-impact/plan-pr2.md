# PR2 — JAG 合宿系と JAG 模擬地区を問題記号にする（66 コンテスト / 625 問）

前提・共通の決定・データ移行の手順は [plan.md](./plan.md)。照合結果は [investigation.md](./investigation.md#1-pr2-の照合2026-10-24)。

**状態**: 未着手。[着手前の確認](#着手前の確認)の Q1 / Q2 待ち。

## 範囲

| 範囲                 | コンテスト / 問題 | 所在        | 今の `title`                | 取り込みの経路                               |
| -------------------- | ----------------- | ----------- | --------------------------- | -------------------------------------------- |
| JAG 夏 / 冬 / 春合宿 | 50 / 467          | seed と本番 | `'2389. …'`（問題 ID 付き） | 無い（`JagRound` は PRELIM / REGIONAL のみ） |
| JAG 模擬地区         | 16 / 158          | 本番のみ    | 素の見込み（Q1 で確かめる） | 管理画面（今は問題 ID のまま入る）           |

PR2 の時点では、この範囲のコンテスト表はまだ無い（PR2.5 で足す）。表示は問題一覧の出典欄（例: `JAG 夏合宿 2024 Day3 - H（AOJ）`）と title で確かめる。

関係する決定: M2 / M6 / M8 / M9 / M12 / M13 / M14 / M18（[plan.md](./plan.md#決定事項)）。

## 起きること

| 変更                            | 起きること                                                                                             | 対処               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------ |
| `task_table_index` の値が変わる | 既存レコードは自動更新されない（seed も取り込みも「既存なら skip」）                                   | 移行 UPDATE        |
| 合宿系の title の問題 ID        | index だけ記号にすると `removeTaskIndexFromTitle` が空振りし、`'2389. …'` が出典欄やセルにそのまま出る | title も直す（M9） |
| 基本ルールで記号がずれる        | 8 コンテストで先頭・途中に欠落がある（[照合結果](./investigation.md#記号の補正が要るコンテスト)）      | 補正（M13）        |

- 一意性は壊れない。`id` / `task_id` は `problem_index` を入力にしておらず、FK もすべて `task_id` を参照する（[根拠](./investigation.md#一意性は壊れない)）
- 模擬地区は管理画面の取り込み（`problem.name` をそのまま title にする）で本番に入っているので、title のプレフィックスは無い見込み

## タスク

| #   | 内容                                                                                   | 補足                                                                                                           |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 2-0 | 対応表の生成と照合                                                                     | [下記](#2-0-照合)                                                                                              |
| 2-1 | seed に模擬地区 158 問を追加する（M12）                                                | Q2 の値。最初は本番と同じ形（index = 問題 ID、素の title）で入れ、2-0 の照合の入力にする                       |
| 2-2 | 取り込みで、JAG は全 round で記号を付ける（M14）                                       | `AojChallengesApiClient` の `usesProblemLetters` を `contestType === 'ICPC' \|\| contestType === 'JAG'` にする |
| 2-3 | `prisma/tasks.ts` の 625 件の `problem_index` と、合宿系 467 件の `title` を書き換える | 2-0 の出力で置き換える                                                                                         |
| 2-4 | 移行 SQL                                                                               | [下記](#移行-sql)                                                                                              |
| 2-5 | テスト                                                                                 | [下記](#テスト)                                                                                                |
| 2-6 | 手順書                                                                                 | `add-tasks` の「ICPC / JAG 模擬国内の `problem_index` は問題記号にする」を JAG 全体に広げる                    |
| 2-7 | 照合スクリプトを削除する                                                               | 追加とは別のコミットにし、git の履歴から辿れるようにする                                                       |

**クロスレビューが必須**（データ移行）。

## 着手前の確認

| #   | 依頼                                           | 使い道                                                                                                             |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Q1  | 本番と staging で SQL A を流す                 | 件数チェックの想定値（合宿系 50 / 467、模擬地区 16 / 158）。index が問題 ID のままか。title のプレフィックスの有無 |
| Q2  | 本番で SQL B を流し、結果を JSON か CSV で渡す | 模擬地区 158 問の seed（M12）                                                                                      |

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

## 2-0 照合

PR1 のスクリプト（`git show 171bf3c9:docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_problem_letters.ts`）を次のように直して使う。

- 対象は `^JAG(Summer|Winter|Spring|Regional)` の 66 コンテスト / 625 問。件数が合わなければ止める。模擬地区は 2-1 で seed に足してから読む。PR2.1 の 10 コンテストは含めない
- 書き写しの元は 2026-10-24 のスクリーンショット（スプレッドシート 16 枚、行 2〜1025）
- PR1 では記号を基本ルールで付け、位置ごとに照合した。PR2 では先頭・途中の欠落（`absentLetters`）があるので、記号はスプレッドシートの位置（欠落を飛ばした位置）から決める。基本ルールと違うコンテストは別に出力し、移行 SQL の補正（`VALUES`）に使う
- 期待する出力: 補正が要るのは 8 コンテスト / 45 行（目視の暫定値）。合わなければ、どちらが正しいかを個別に確かめる
- 夏合宿 2010 Day2 の J（`Person responsible for problem description don't w`）は、スプレッドシートのセルだけでなく AOJ の title 自体も同じ所で切れている。前方一致の扱いは要らない

## 移行 SQL

骨組みのみ。補正の `VALUES`（45 行）は 2-0 の出力で埋める。3 つの UPDATE を 1 つの DO ブロックに入れ、各件数を検査する（M13）。

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
```

- **範囲は `contest_id` の接頭辞で絞る**。`AOJ_JAG` には PR1 で済んだ模擬国内も含まれる
- **件数の想定値に 0 を含める理由**: `prisma migrate reset`（ローカル）は空の DB にマイグレーションを流してから seed を入れる。開発者の既存 DB は合宿系だけを持ち、模擬地区は無い（467 / 32）
- **想定値の確定**: 467 / 158 / title のプレフィックスの有無は、Q1 の結果を見てから書く。模擬地区の title にプレフィックスがあれば (3) の想定値に 158 を足す
- **title の条件**: 「自分の `task_id` + `. `」で始まるものだけを対象にする。`~ '^[0-9]+\. '` だと他の数字で始まる title も消しうる。467 件すべてでプレフィックスが `task_id` と一致することは確認済み（[実測](./investigation.md#title-の持ち方が-aoj-内で割れている)）
- **`task_table_index = task_id` の条件**: PR2.1 の CSV（記号付き・素の title）が先に入っていても (1)(3) の対象にならない。PR2.1 との順序を問わないための保険
- `task_id::int` は安全（模擬地区の問題 ID も 2024〜3357 で数値）。1 コンテスト最大 14 問なので `chr(64 + n)` は A〜Z に収まる。SQL の読み方は [investigation.md](./investigation.md#sql-の読み方)

### ローカルと staging での確認

[共通の手順](./plan.md#手順)に加えて:

- ローカルの seed には模擬地区が無い（2-1 で足すのは記号付きの値）。PR2 のコードに切り替える前に、管理画面から JAG REGIONAL を取り込んでおく（index が問題 ID のまま、本番と同じ形で入る）。そうすればローカルでも 625 / 45 / 467 になる
- staging / production は、件数の想定値と一致することを Q1 で先に確かめる。一致しないと RAISE でデプロイが止まる
- 補正した 8 コンテストは「現在値 → 変更後」を全行見る
- 出典欄（問題一覧）で、合宿系・模擬地区が記号になり、title に問題 ID が出ていないこと

## テスト

- `src/lib/clients/aizu_online_judge/seed_problem_letters.test.ts` の範囲を 145 コンテスト / 1,257 問に広げる。補正していないコンテストは `assignProblemLetters` と一致し、補正した 8 コンテストは期待値を literal で書く（M18）。合宿系の title が `${problem id}. ` で始まらないことも見る
- `clients.test.ts`: JAG REGIONAL の取り込みで記号が付くこと。`usesProblemLetters` の JAG 条件を PRELIM だけに戻す変異を検出できること
- 書き換えたテストと追加したテストに `verify-test-strength` を当てる。期待値を新形式へ一括置換するとテストが仕様を検証しなくなるので、`testing.md` の Test integrity に従う
