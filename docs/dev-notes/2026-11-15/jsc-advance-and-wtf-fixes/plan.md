# 日本最強プログラマー学生選手権 Advance の追加と世界大会の並び・contest_id の修正（#4352）

## 概要

既存の 2 つのテーブルに、問題の追加と表記・並びの修正を入れる。1 PR で、フェーズごとにコミットする。

1. 「日本最強プログラマー学生選手権」に 3 テーブルを足し、1 テーブルの見出しを変える（メンテナの指定どおり）。
2. 「AtCoder 世界大会」で、2022 の Day1 を Day2 の上にする。
3. 世界大会 4 回の contest_id から `-open` を外し、本体コンテストのページにリンクする（優先度は低いので最後のフェーズにする）。

### 日本最強プログラマー学生選手権の並び（上から、太字が変更）

| #     | contest_id               | ContestType | 見出し                                                                                                     | 問題                     |
| ----- | ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1     | **jsc2026advance-final** | ABC_LIKE    | **第七回日本最強プログラマー学生選手権～Advance～（ABC 474）**                                             | ペア 7 件（abc474_a〜g） |
| 2     | **abc464**               | ABC         | **第七回日本最強プログラマー学生選手権～Advance～ -予選-（ABC 464）**                                      | 7 問（A〜G）             |
| 3     | jsc2026-final            | ONSITE      | 第七回日本最強プログラマー学生選手権 -決勝-                                                                | 変更なし                 |
| 4     | arc222                   | ARC         | 第七回日本最強プログラマー学生選手権 -予選-（ARC 222）                                                     | 変更なし                 |
| 5     | jsc2025advance-final     | ABC_LIKE    | 日本最強プログラマー学生選手権～Advance～ → **第六回日本最強プログラマー学生選手権～Advance～（ABC 422）** | 変更なし                 |
| 6     | **abc412**               | ABC         | **第六回日本最強プログラマー学生選手権～Advance～ -予選-（ABC 412）**                                      | 7 問（A〜G）             |
| 7〜18 | jsc2025-final 以降       | -           | 変更なし                                                                                                   | 変更なし                 |

- 問題データはメンテナが貼った AtCoder Problems の 21 行。13 行は `adt_*` の contest_id と ADT の記号で載っていたので、task_id から本来の contest_id と記号に戻し、title を `{記号}. {name}` に組み直した（[tasks.json](./tasks.json)）。3 コンテスト × 7 問で、id の重複は無い。
- ペアはメンテナが貼った 7 行（[contest_task_pairs.json](./contest_task_pairs.json)）。記号は参照先の ABC 474 と同じで、参照先はすべて tasks.json にある。
- seed（`prisma/tasks.ts`）には abc412 / abc464 / abc474 の行が 1 つも無い（seed は ABC を一部しか持たない）。

### 世界大会の並びと contest_id（上から）

| contest_id（現在 → 変更後）              | 見出し                           |
| ---------------------------------------- | -------------------------------- |
| awtf2026algo                             | World Tour Finals 2026 Algorithm |
| awtf2025algo-open → **awtf2025algo**     | World Tour Finals 2025 Algorithm |
| awtf2024-open → **awtf2024**             | World Tour Finals 2024           |
| **wtf22-day1-open → wtf22-day1**（上へ） | World Tour Finals 2022 Day1      |
| wtf22-day2                               | World Tour Finals 2022 Day2      |
| wtf19-open → **wtf19**                   | World Tour Finals 2019           |

- 本体の URL はメンテナが示した（`https://atcoder.jp/contests/{awtf2025algo,awtf2024,wtf22-day1,wtf19}/`）。
- task_id は本体と `-open` で同じ（例: `wtf22-day1-open` の問題は `wtf22_day1_a`）なので、変えるのは `contest_id` だけ。

## 本番の状態（2026-11-15 にメンテナが Supabase で確認）

| 対象                     | 本番の行                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| abc412 / abc464 / abc474 | 21 行。contest_id・task_id・task_table_index・title が tasks.json と全項目一致（ADT で再出題される前に取り込まれていた）     |
| 世界大会の contest_id    | `awtf2024-open` 5、`awtf2025algo-open` 5、`awtf2026algo` 5、`wtf19-open` 6、`wtf22-day1-open` 5、`wtf22-day2` 5。seed と一致 |

- ABC の行は migration に入れず、seed にだけ足す。
- Phase 5 の UPDATE は本番の 21 行（6 + 5 + 5 + 5）を変える。

確認に使った SQL:

```sql
SELECT contest_id, task_id, task_table_index, title
FROM task
WHERE contest_id IN ('abc412', 'abc464', 'abc474')
ORDER BY task_id;

SELECT contest_id, COUNT(*) FROM task WHERE task_id LIKE '%wtf%' GROUP BY contest_id ORDER BY contest_id;
```

## 設計判断

- **JSC は既存の `JAPANESE_STUDENT_CHAMPIONSHIP_ENTRIES` に 3 件を足し、1 件の title を変えるだけ**。Provider・グループ・型は変えない。
- **`jsc2026advance-final` を `prefixes.ts` の `ABC_LIKE`（完全一致）に足す**。`getMergedTasksMap()` は `classifyContest(pair.contestId)` が `null` のペアを黙って捨てるので、足さないとテーブルが空になる。2025 と同じく「ABC-Like」テーブルにも出る。`ABC_LIKE` の値（表示名）は実行時に使われないが、見出しに合わせて `第七回…～Advance～` / `第六回…～Advance～` にする。
- **ABC 474 の問題は Task として持ち、jsc2026advance-final はペアだけで表示する**（jsc2025advance-final → ABC 422 と同じ）。ABC 412 / 464 / 474 は ABC のテーブルにも残る。
- **ペアの本番投入はデータ migration**（メンテナが選択）。CI がデプロイ前に流すので、手作業も、メモリキャッシュ（TTL 1 時間）が古いまま残ることも無く、PR でレビューできる。`ON CONFLICT ("contestId", "taskId") DO NOTHING` にして、seed で先に入った開発環境では何も変えない。`id` は `gen_random_uuid()`、`updatedAt` は DB に既定値が無いので明示する。
- **同じ大会が複数日あるときは Day1, Day2, Day3 の順に並べる**（メンテナの方針、テーブル共通）。年（回）は新しい順のまま。JAG のテーブル（`aoj_jag_regional_entries.ts`）は既にこの順で、世界大会だけが逆だった。
- **`-open` を外しても sha256 で作る ID は壊れない**。
  - FK（回答・タグ・問題集・投票）はすべて `Task.task_id` を参照し、`TaskAnswer.id` は `sha256(task_id + user_id)`、投票系は `sha256(taskId + …)`。どれも task_id だけから作る。
  - `Task.id` は管理画面の取り込みで一度だけ `sha256(contest_id + task_id)` で作るが、作り直したり、それで検索したりする処理は無い（seed は fabbrica のランダム ID、データ migration は `gen_random_uuid()`）。UPDATE 後は `Task.id` と `sha256(新 contest_id + task_id)` が一致しなくなるが、影響は無い。
  - seed は task_id が既にあれば飛ばすので、本番は seed では直らない。データ migration の UPDATE で直す。
- **`stripOpenSuffix` と正規表現はそのまま残す**。AtCoder Problems はこれからも `-open` 付きで載せるので、管理画面の取り込み（`classifyContest` の判定）で必要。fixture も `-open` 付きの形を残し、本体の形を足す。

## 却下した案

- **jsc2026advance-final にも Task 行を持たせる**: `task_id` は一意なので、ABC 474 と同じ問題を 2 行持てない。
- **ペアを Supabase の CSV で入れる**（ガイドの従来手順）: 手作業で `id` / `createdAt` / `updatedAt` を作る必要があり、取り込み後もキャッシュが切れるまで表示されないことがある。
- **ABC 21 行も migration に入れる**: 本番に全行がそろっているので、何も変えない INSERT が残るだけになる。
- **`-open` 付きの形を fixture から消す**: `stripOpenSuffix` を通る入力が無くなり、取り込みで使う分類が検証されなくなる。
- **JSC / AJO / CodeQUEEN の `-open`（jsc2022-final-open など）も直す**: Issue の対象外（メンテナが判断）。本体ページから提出できるかの確認も別に要る。
- **PR を分ける**: どちらも migration を含むのでクロスレビューの回数が増えるだけ。`-open` は最後のフェーズにして、必要なら切り離せるようにする。

## 型・関数

新しい型・関数・コンポーネントは無い。変えるのはデータ（エントリの配列、`prefixes.ts`、seed、migration）とテストの期待値だけ。

## フェーズ（低リスク → 高リスク）

### Phase 1: 世界大会の Day の並び

- テスト先行: `atcoder_world_tour_finals_entries.test.ts` の `titles each table with its contest name label` の期待値で、Day1 を Day2 の上にする。RED を確かめる。
- 実装: `WORLD_TOUR_FINALS_CONTEST_IDS` の `wtf22-day2` と `wtf22-day1-open` を入れ替え、コメント（`Day2 of 2022 above Day1`）を直す。
- ガイド: `how-to-add-contest-table-provider.md` の「明示的な配列」の節に、Day1, Day2, Day3 の順のルールを足す。

### Phase 2: jsc2026advance-final の分類（`src/lib/contests/`）

- テスト先行: `fixtures/contest_type.ts` の ABC-like に `jsc2026advance-final` → `ABC_LIKE` を足し、jsc2025advance-final のケース名を `第六回日本最強プログラマー学生選手権～Advance～` にする。`pnpm test:unit src/lib/contests/` で RED。
- 実装: `prefixes.ts` の `ABC_LIKE` に足し、jsc2025advance-final の値を直す。

### Phase 3: JSC のエントリと seed

- テスト先行:
  - `japanese_student_championship_entries.test.ts` の問題数に `'jsc2026advance-final': 7`、`abc464: 7`、`abc412: 7` を足す。
  - `contest_table_provider_groups.test.ts` の provider key の並びに、先頭の `ABC_LIKE::jsc2026advance-final`・`ABC::abc464` と、`ABC_LIKE::jsc2025advance-final` の次の `ABC::abc412` を足す。
- 実装:
  - エントリ: 3 件を足し、jsc2025advance-final の title を変える。冒頭のコメント（`jsc2025advance-final placed by the maintainer`）も直す。
  - seed: tasks.json の 21 行をスクリプトで `tasks.ts` の形に書き出す。abc474 → abc464 は ABC のブロックの先頭（abc462 の前）、abc412 は abc422 と abc410 の間。問題は記号の降順（G → A）。
  - ペア: `contest_task_pairs.ts` の jsc2025advance-final のブロックの前に 7 行（G → A）。
  - `grep -c` で件数を確かめる。既存の `seeds the original task of every contest task pair in the group` が、ABC 474 の足し忘れを拾う。
- テストの検出力: エントリを 1 件消す、2 件の順を入れ替える、seed の abc474_a を消す、のそれぞれで落ちることを確かめる。

### Phase 4: JSC のデータ migration

- `pnpm exec prisma migrate dev --create-only --name add_jsc2026advance_final_contest_task_pairs`
- SQL は contest_task_pairs.json からスクリプトで書き出す。ペアだけを入れる（ABC 474 の 7 行は本番にある）。

  ```sql
  -- jsc2026advance-final reuses the ABC 474 problems (#4352), so it is shown through contest task pairs.
  -- Rows that already exist are left untouched.
  INSERT INTO "contesttaskpair" ("id", "contestId", "taskTableIndex", "taskId", "createdAt", "updatedAt")
  VALUES
    (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'G', 'abc474_g', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- ... 7 rows in total
    (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'A', 'abc474_a', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("contestId", "taskId") DO NOTHING;
  ```

- ローカルで確かめる: seed の後にペア 7 行を消して本番を再現し、migration で 7 行だけが入ること。seed の行が残っている DB では何も変えないこと。
- ガイド: `how-to-add-contest-task-pairs.md` の投入手順に、データ migration でも入れられることを足す。`how-to-add-contest-table-provider.md` の JSC の行（流用した回、件数 15 → 18）を直す。
- tasks.json と contest_task_pairs.json を消してコミットする。

### Phase 5: 世界大会の contest_id から `-open` を外す（最もリスクが高い、優先度は低い）

- テスト先行: `atcoder_world_tour_finals_entries.test.ts` の問題数のキーを本体の contest_id にする。RED。
- 実装:
  - seed: 4 コンテスト 21 行（5 + 5 + 5 + 6）の `contest_id` から `-open` を外す。
  - エントリ: `WORLD_TOUR_FINALS_CONTEST_IDS` を本体の contest_id にし、コメントを直す。
  - fixture: `contest_type.ts` と `contest_name_labels.ts` の世界大会に本体の 4 件を足す（`-open` 付きは取り込み用に残す）。`wtf22-day2` / `awtf2026algo` の「`-open` が無い」注記を直す。
  - `world_tour_finals.ts` の冒頭コメントを直す（seed は本体の contest_id、AtCoder Problems は `-open` 付きで載せる）。
- データ migration（`remove_open_suffix_from_wtf_contest_ids`）:

  ```sql
  -- The World Tour Finals main contests accept submissions, so link to them instead of the -open mirrors (#4352).
  -- task_id is shared between the two contests, so answers, votes and workbooks are unaffected.
  UPDATE "task" SET "contest_id" = 'wtf19' WHERE "contest_id" = 'wtf19-open';
  UPDATE "task" SET "contest_id" = 'wtf22-day1' WHERE "contest_id" = 'wtf22-day1-open';
  UPDATE "task" SET "contest_id" = 'awtf2024' WHERE "contest_id" = 'awtf2024-open';
  UPDATE "task" SET "contest_id" = 'awtf2025algo' WHERE "contest_id" = 'awtf2025algo-open';
  ```

- seed のペア（`contest_task_pairs.ts`）に世界大会の contest_id は無い。
- ローカルで確かめる: 変更前の seed で入れた DB に migration を流し、21 行の contest_id だけが変わること。
- ガイド: `how-to-add-contest-table-provider.md` の「contest_id は AtCoder Problems の値をそのまま使う」を、「本体ページから提出できるなら `-open` を外した本体の contest_id を使う。管理画面の取り込みは AtCoder Problems の値で入るので、新しい回は取り込み後に直す」に書き換える。

## 検証とレビュー

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- 余裕があれば、`pnpm db:seed` の後に `pnpm dev` で 2 つのテーブルの並び・見出しと、世界大会の問題リンクが本体のページを開くことを見る。
- データ migration があるので、Codex のクロスレビューが要る。

## 本番で行うこと（メンテナ）

main へのマージで、CI が 2 つの migration を流す（ペア 7 行の INSERT と、世界大会 21 行の UPDATE）。管理画面からの取り込みと Supabase の CSV は要らない。
