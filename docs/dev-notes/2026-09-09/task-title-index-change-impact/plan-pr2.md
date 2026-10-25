# PR2 — JAG 合宿系と JAG 模擬地区を問題記号にする（66 コンテスト / 625 問）

AOJ の JAG 合宿系（夏 / 冬 / 春）と JAG 模擬地区の `task_table_index` を、AOJ の問題 ID から問題記号（A, B, C…）に変える。PR1 で ICPC / JAG 模擬国内に行ったことを、残りの JAG に広げる。

全体の目的・共通の決定（M 番号）・データ移行の共通手順は [plan.md](./plan.md)、根拠データは [investigation.md](./investigation.md)。

**状態**: 実装済み（ブランチ `#4030`、未マージ）。[実施記録](#実施記録2026-10-25)

## 範囲

| 範囲                 | コンテスト / 問題 | ある場所                           | 今の `task_table_index` | 今の `title`                      |
| -------------------- | ----------------- | ---------------------------------- | ----------------------- | --------------------------------- |
| JAG 夏 / 冬 / 春合宿 | 50 / 467          | seed・staging・本番                | 問題 ID                 | `'2389. …'`（問題 ID が前に付く） |
| JAG 模擬地区         | 16 / 158          | staging・本番（**seed には無い**） | 問題 ID                 | 素                                |

PR2 の後は、625 問すべてで `task_table_index` が問題記号になり、合宿系の title は素になる。管理画面の取り込みでも、JAG は全 round で記号を付けるようになる。

範囲外:

- コンテスト別のテーブルの作成（PR2.5）
- DB に無いコンテストの追加（PR2.1）
- AOJ のコンテスト一覧に無い問題の補完（PR3）
- 前後に空白のある title（本番 46 件。3355 の末尾のタブを含む。[plan.md](./plan.md#スコープ外)）

## 知っておくこと

- **既存の行は自動では変わらない**。seed も取り込みも「既存なら skip」なので、移行 SQL で直す（M2）
- **記号は基本ルール（コンテスト内で問題 ID の昇順に A, B, C…）で付く。ただし 8 コンテストは例外**。先頭や途中の問題が AOJ に無く、そのまま振ると記号がずれる。正しい記号はメンテナのスプレッドシートの位置で決める（M13。一覧は [investigation.md](./investigation.md#記号の補正が要るコンテスト)。8 コンテスト / 45 行）
- **合宿系の title は直す**。index だけ記号にすると、表示側の `removeTaskIndexFromTitle`（先頭の `${index}. ` を外す）が空振りし、`'2389. …'` が出典欄やセルに出る。467 件すべてで、前に付いた番号は自分の `task_id` と一致する（M9）
- **一意性は壊れない**。`id` / `task_id` は `task_table_index` を使っておらず、FK もすべて `task_id` を参照する（[根拠](./investigation.md#一意性は壊れない)）
- **データの状態**: 本番と staging は同じで（2026-10-24 に集計。SQL は[確かめ方](#確かめ方)）、範囲の全行で index が問題 ID のまま。title に問題 ID が付いているのは合宿系だけ

| kind     | 本番・staging（コンテスト / 問題） | index が問題 ID のまま | title が問題 ID 付き |
| -------- | ---------------------------------- | ---------------------- | -------------------- |
| Regional | 16 / 158                           | 全行                   | 0 行                 |
| Spring   | 4 / 42                             | 全行                   | 全行                 |
| Summer   | 36 / 338                           | 全行                   | 全行                 |
| Winter   | 10 / 87                            | 全行                   | 全行                 |

## タスク

| #   | 内容                                                                                   | 補足                                                                                                           |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 2-1 | seed に模擬地区 158 問を追加する（M12）                                                | [下記](#2-1-seed-に模擬地区を足す)                                                                             |
| 2-2 | 対応表を作り、スプレッドシートと照合する（M6）                                         | [下記](#2-2-照合)                                                                                              |
| 2-3 | 取り込みで、JAG は全 round で記号を付ける（M14）                                       | `AojChallengesApiClient` の `usesProblemLetters` を `contestType === 'ICPC' \|\| contestType === 'JAG'` にする |
| 2-4 | `prisma/tasks.ts` の 625 件の `problem_index` と、合宿系 467 件の `title` を書き換える | 2-2 の出力で置き換える                                                                                         |
| 2-5 | 移行 SQL                                                                               | [下記](#2-5-移行-sql)                                                                                          |
| 2-6 | テスト                                                                                 | [下記](#2-6-テスト)                                                                                            |
| 2-7 | 手順書                                                                                 | `add-tasks` の「ICPC / JAG 模擬国内の `problem_index` は問題記号にする」を JAG 全体に広げる                    |
| 2-8 | 照合スクリプトを削除する                                                               | 追加とは別のコミットにし、git の履歴から辿れるようにする                                                       |

**クロスレビューが必須**（データ移行）。

### 2-1 seed に模擬地区を足す

本番から次の SQL で取り出した値を、まず本番と同じ形（index = 問題 ID）で `prisma/tasks.ts` に足す。2-2 の照合はこれを読む。記号への書き換えは 2-4 で合宿系と一緒に行う。

```sql
-- JAG Regional tasks for the seed (run on production).
SELECT task_id, contest_id, task_table_index, title, grade
FROM task
WHERE contest_type = 'AOJ_JAG'
  AND contest_id LIKE 'JAGRegional%'
ORDER BY contest_id, task_id::int;
```

- grade は本番の値のまま入れる（PENDING でないのは 6 問: 2251 D3、2594 D3、2736 D5、2858 D1、2863 D2、2865 D4）
- title は取り込みと同じく trim する（3355 の末尾のタブを落とす）

### 2-2 照合

PR1 のスクリプト（`git show 171bf3c9:docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_problem_letters.ts`。仕組みは [done.md](./done.md#検証で分かったこと)）を次のように直して使う。

- 対象は `^JAG(Summer|Winter|Spring|Regional)` の 66 コンテスト / 625 問。件数が合わなければ止める
- スプレッドシートは 2026-10-24 のスクリーンショット（16 枚、行 2〜1025）から書き写す。PR2.1 の 10 コンテストは含めない
- 記号はスプレッドシートの位置（欠けている問題を飛ばした位置）から決める。PR1 は基本ルールで記号を付けてから照合したが、PR2 には先頭・途中の欠落があるのでそうはいかない
- 基本ルールと違うコンテストを別に出力し、2-5 の補正の `VALUES` に使う。期待する結果は 8 コンテスト / 45 行（目視の暫定値。合わなければ、どちらが正しいかを個別に確かめる）
- 夏合宿 2010 Day2 の J（`Person responsible for problem description don't w`）は、AOJ の title 自体も同じ所で切れている。前方一致の扱いは要らない

### 2-5 移行 SQL

骨組みのみ。補正の `VALUES`（45 行）は 2-2 の出力で埋める。3 つの UPDATE を 1 つの DO ブロックに入れ、それぞれの更新件数を検査する。想定外の件数なら RAISE して、マイグレーション全体を戻す（M13。UPDATE は対象が 0 件でもエラーにならないため）。

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
  )
  UPDATE "task" AS t
  SET "task_table_index" = letters.letter
  FROM letters
  WHERE t."task_id" = letters.task_id
    AND t."contest_type" = 'AOJ_JAG'
    AND t."contest_id" ~ '^JAG(Summer|Winter|Spring|Regional)'
    -- Rank every row above, but leave rows that already hold a letter (added with letters) as they are.
    AND t."task_table_index" = t."task_id";

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

- **範囲は `contest_id` の接頭辞で絞る**。`AOJ_JAG` には、PR1 で記号にした模擬国内も含まれる
- **件数の想定値**: staging / 本番は 625 / 45 / 467（上の表から）。0 を含めるのは、`prisma migrate reset`（ローカル）が空の DB にマイグレーションを流してから seed を入れるため。開発者の既存の DB は合宿系だけを持つので 467 / 32 / 467 になる
- **title の条件**: 「自分の `task_id` + `. `」で始まるものだけを対象にする。`~ '^[0-9]+\. '` だと、番号で始まる本来の title まで削りうる
- **`task_table_index = task_id` の条件**: PR2.1 の行（記号付き・素の title で入る）が先にあっても、(1)(3) の対象にならない。PR2.1 と順序を問わないための保険。順位はコンテストの全行で付け、更新だけをこの条件で絞る。順位を付ける側でも絞ると、記号の行と問題 ID の行が混ざったコンテストで A から振り直してしまう（Codex のレビューで指摘）
- `task_id::int` は安全（範囲の問題 ID はすべて数値）。1 コンテスト最大 14 問なので、`chr(64 + n)` は A〜Z に収まる。SQL の読み方は [investigation.md](./investigation.md#sql-の読み方)

#### 確かめ方

[共通の手順](./plan.md#手順)（ローカルで `UPDATE` を `SELECT` に置き換えて「現在値 → 変更後」を見る、など）に加えて:

- PR2 の seed の模擬地区は記号で入っている（2-1 で足し、2-4 で記号にする）ので、seed から作った DB では移行 SQL の模擬地区の分を確かめられない。PR2 のコードに切り替える前の DB に、管理画面から JAG REGIONAL を取り込んでおく（問題 ID のまま入る）。そうすればローカルでも 625 / 45 / 467 になる
- 補正する 8 コンテストは、「現在値 → 変更後」を全行見る
- 問題一覧の出典欄で、合宿系・模擬地区が `JAG 夏合宿 2024 Day3 - H（AOJ）` のように記号になり、title に問題 ID が出ていないこと（この範囲のコンテストテーブルは PR2.5 まで無い）
- **PR を開く前に**、staging で次の SQL を流し、上の表と同じ件数であることを確かめる。PR の CI は、staging へのマージ前に staging の DB へマイグレーションを流す（[CI での適用](./plan.md#ci-での適用)）。件数が違うと RAISE でデプロイが止まる。**済（2026-10-24）**: 上の表と同じ件数だった（Regional 16 / 158、Spring 4 / 42、Summer 36 / 338、Winter 10 / 87。index は全行が問題 ID のまま、title の問題 ID は合宿系の全行だけ）。PR を開くまでに staging の AOJ の問題を足したり消したりした場合は、もう一度流す

```sql
-- State of the PR2 scope (run on staging before opening the PR).
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
```

### 2-6 テスト

- `src/lib/clients/aizu_online_judge/seed_problem_letters.test.ts` の範囲を 145 コンテスト / 1,257 問に広げる。補正していないコンテストは `assignProblemLetters` と一致すること、補正した 8 コンテストは literal の期待値と一致することを見る（M18）。title が問題名（`name`）と同じであることも見る（`${problem id}. ` の付け忘れ・除き過ぎの両方を検出する）
- `clients.test.ts`: JAG REGIONAL の取り込みで記号が付くこと。`usesProblemLetters` の JAG の条件を PRELIM だけに戻す変異を検出できること
- 書き換えたテストと足したテストに `verify-test-strength` を当てる。期待値を新しい形へ一括置換すると、テストが仕様を検証しなくなるので、`testing.md` の Test integrity に従う

## 実施記録（2026-10-25）

コミットは `c605d3bd`（照合スクリプト）→ `4c7b9763`（実装）→ `c835754b`（レビュー対応）→ `597104fd`（スクリプトの削除）。照合スクリプトは `git show c605d3bd:docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_jag_problem_letters.ts` で参照できる。

- **seed の模擬地区**: 本番から取り出した 158 問は、AOJ の fixture（2026-05 記録）と問題 ID・コンテスト・名前がすべて一致した
- **照合**: スプレッドシートの書き写し（66 コンテスト）と 625 問の title が、記号の位置ですべて一致した。補正は 8 コンテスト / 45 行で、目視の暫定値どおり。わざと誤りを入れたコピー 5 種類（欠落の記号を外す、順番の入れ替え、途中の title の誤り、欠落の数の不足、切れた title の前半の誤り）は、すべて検出された
- **ローカルでの移行**: 管理画面で模擬地区を取り込み、本番と同じ状態（16 / 158、index は問題 ID のまま）にしてから確かめた。`SELECT` のプレビューは 625 行すべてで照合の結果と一致し、適用後もプレビューと 625 / 625 で一致した。範囲外の AOJ（PCK、大学系、PR1 の範囲）は変わらない。`EXPLAIN` は CTE 側の Seq Scan 1 回と、`task_task_id_key` の Index Scan を使う Nested Loop
- **テストの検出力**: 6 つの変異をすべて検出した（JAG の記号を PRELIM だけ / ICPC だけにする、補正した記号を基本ルールに戻す、基本ルールのコンテストで A・B を入れ替える、title に問題 ID を付け直す、模擬地区の記号を問題 ID に戻す）。title のテストは、空の title・別の問題の title・問題 ID の付け直しも検出する
- **title の空白**: ローカルの 3355 にも末尾のタブがあった（取り込みが trim する前に入った行）。本件では直さない（[plan.md](./plan.md#スコープ外)）

Codex のクロスレビュー（2026-10-25）:

| 指摘                                                                                                          | 扱い                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moderate: 取り込みは記号がずれる 8 コンテストでも基本ルールで振る                                             | **対応しない**。M14 の決定どおり。8 コンテストは本番・staging・seed のすべてにあり、取り込みは既存の問題を skip する                                                                                                            |
| Minor: title のテストが「問題 ID が前に付いていない」しか見ない                                               | **対応**。「title が name と同じ」を見るテストに変えた（seed の 1,257 問すべてで成り立つ）                                                                                                                                      |
| Moderate（条件付き）: (1) が問題 ID の行だけで順位を付けるので、記号の行と混ざったコンテストで A から振り直す | **対応**。順位は全行で付け、更新だけ問題 ID の行に絞った。混ざったコンテストを読み取り専用で再現し、直した SQL が正しく振ることを確かめた。ローカルは移行前の状態に戻してから、プレビューと適用をやり直した（625 / 625 で一致） |
| Moderate（条件付き）: `task_id` だけで結合している                                                            | **対応しない**。`task_id` は schema で `@unique`                                                                                                                                                                                |

残っている確認: staging（PR の CI）と本番で、移行が想定の件数（625 / 45 / 467）で通ること。問題一覧の出典欄の表示。
