# PAST（アルゴリズム実技検定）のコンテスト別テーブル（#4258）

## 概要

`ContestType.PAST` の第 1〜24 回を、ICPC アジア地区と同じ形式で表示する。1 回 = 1 テーブルで、見出しは `PAST 第 N 回`、セルは `A. 問題名`、新しい回が上。
ボタンのラベルは `PAST` で、`AWC 0001 〜` の直後（画面上では右）に置いた（暫定）。

## 意思決定

- **表示は ICPC アジア地区と同じ:** ユーザーの指定。列の幅と折り返しも ICPC と同じ（`lg:w-1/6`、6 列を超えると折り返す）。5 列 × 3 行の案も出したが、ユーザーは ICPC と同じものを選んだ。
- **`pastbook2022` は出さない:** ユーザーの判断。ContestType は PAST のまま。
- **引数は回数:** contest_id は第 14 回までが `past{YYYYMM}-open`、第 15 回以降が `past{N}-open` で、文字列の降順では `past24-open` が `past202303-open` より下になる。回数で並べれば、この並び順の問題と切り離せる。
- **回数 → contest_id は `past.ts` の年月の配列 1 つで持つ:** `PAST_TRANSLATIONS` も同じ配列から作る。採らなかった案は次のとおり。contest_id を 24 個並べる（JAG 夏合宿・模擬地区の方式）と、年月が二重になる。`PAST_TRANSLATIONS` の逆引きは、表示用の文字列を解析するか、整数に見えるキーの並び順に頼ることになる。
- **ICPC と共有する表示設定を改名した:** AtCoder の PAST から使うので、AOJ を含まない名前（`per_contest_table_layout.ts`）にした。AOJ の名前のまま import する案と、PAST 用に同じ値の定数を作る案は採らなかった。
- **範囲型（ABC のように全回を 1 テーブル）は採らなかった:** ICPC 形式という要望に合わず、上の並び順の問題も残る。
- **フィルタは contest_id の完全一致:** `classifyContest` を使わないので、`pastbook2022` を除く条件が要らない。
- **テストの期待値はリテラル:** Codex のレビューを受けて変えた。第 1〜14 回の contest_id とグループの 24 キーを列挙している。年月の配列を共有する往復テストだけでは、配列の途中の入れ替えを検出できなかった。

## コードから読み取れない事実

- 2026-10-31 時点で第 24 回まで開催済み（ユーザーが確認）。
- seed の 360 行は、ユーザーが貼った AtCoder Problems の problems.json の行から生成した。各回に A〜O の 15 問がそろい、task_id に重複が無いことを確かめた。入力に使った JSON は、seed に入れた commit で消した。
- task_id は contest_id から導けない。第 15・16 回は `past202306_*`・`past202309_*`、第 17 回以降は `past{N}_*`。
- seed に元からあった 5 問の grade（`past18_a` Q8、`past202309_a` Q8、`past202306_b` Q9、`past202306_a` Q10、`past202209_g` Q1）は引き継いだ。ほかの 355 問には grade が無い（seed では PENDING になる）。
- ローカルで `pnpm db:seed` を実行し、355 問が新しく入った。エラーは無かった。
- `pnpm test:unit`（2978 件）、`pnpm check`（エラー 0。警告 30 は既存）、`pnpm lint`（警告 1 は既存）、`git diff --check` が通った。
- Codex のレビューでは Critical・Major は無かった。Minor の 2 件（期待値が本番の配列や定数から作られていた）を直した。第 6・7 回の入れ替え、最新回を 23 に下げる、登録順を逆にする、の 3 つの変更をテストが検出することを、わざと壊して確かめた。計画での grade の誤記（`past202306_a` を Q8 と書いていた）も指摘された。
- この環境では curl が権限で止められたため、画面での確認はしていない。

## 残りタスク

- [ ] 本番 DB に PAST の問題がそろっているか確かめる（ユーザー）。そろっていない回は、データが入るまで見出しと空の枠が出る。

  ```sql
  SELECT contest_id, COUNT(*) AS task_count, MIN(task_table_index) AS first_index, MAX(task_table_index) AS last_index
  FROM task
  WHERE contest_id LIKE 'past%'
  GROUP BY contest_id
  ORDER BY contest_id;
  ```

  期待: `past*-open` が 24 行で、どれも 15 問・A〜O。ほかに `pastbook2022` の 1 行。

- [ ] `pnpm dev` で、`PAST` ボタンが `AWC 0001 〜` の右にあること、第 24 回が一番上・第 1 回が一番下であること、`pastbook2022` が出ないことを見る。
- [ ] ボタンの位置が確定したら、`contestTableProviderGroups` のキーの順と、テスト `places the PAST button right after AWC 0001 onwards` を合わせる。
- [ ] push と PR の作成（ユーザー）。

## 新しい回が出たとき

1. `contest_table_provider_groups.ts` の `PAST_LATEST_ROUND` を上げる。
2. `contest_table_provider_groups.test.ts` の PAST のキー一覧の先頭に `PAST::{N}` を足す。
3. seed（`prisma/tasks.ts`）と本番 DB に、その回の問題を入れる。

第 15 回以降は contest_id が `past{N}-open` の形なので、`past.ts` は変えなくてよい。
