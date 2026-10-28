# AOJ ICPC / JAG の `problem_index` を A/B/C 形式へ変更する

**日付**: 2026-09-09 作成、2026-10-28 に PR3 を実装し、全体を再編／ **状態**: PR0〜PR2.5 は完了（本番・staging で確認済み）。PR3 は実装・目視確認済み、未マージ。根拠データは [investigation.md](./investigation.md)。

## ゴール

`problem_index`（DB 上は `task_table_index`）に AOJ 問題 ID ではなく**問題記号**を持たせ、表示側が変換なしにそれを使える状態にする。

> **問題記号**: `A`, `B`, `C`… のように、そのコンテスト内で何番目の問題かを表す記号。AtCoder では `abc300_a` の `a` にあたる。AOJ には存在しない（難所 1）。コード上は `letter`。

|                           | 変更前                                   | 目標                                         |
| ------------------------- | ---------------------------------------- | -------------------------------------------- |
| **G1** 出典欄             | `AOJ 3467（ICPC 国内予選 2024）`         | `ICPC 国内予選 2024 - F（AOJ）`              |
| **G2** コンテストテーブル | 問題 ID 3467 → ソート位置から `F` を算出 | `task_table_index` の `F` を**そのまま使う** |

## 現在の状態と PR

AOJ ICPC・JAG の全範囲（ICPC 国内予選 / アジア地区 / JAG 模擬国内 79 コンテスト、合宿系・模擬地区・in AtCoder 76 コンテスト）で `task_table_index` が問題記号になった。title は素（問題 ID も記号も付かない）で、セルは `task_table_index` から `A. タイトル` を組み立てる。

| PR    | 内容                                                                                                                                 | 状態                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| PR0   | 出典欄の AOJ の書式（#4212）                                                                                                         | 完了                                         |
| PR1   | ICPC 国内予選 / アジア地区 / JAG 模擬国内（79 / 632）を記号にする。表示側の変換を削除し、取り込みは基本ルールで記号を付ける（#4217） | 完了                                         |
| PR1.5 | AOJ API の移転（2026-09-07、旧ホストは 410）に追従する（#4219）                                                                      | 完了                                         |
| PR2   | 合宿系 + 模擬地区（66 / 625）を記号にし、合宿系の title から問題 ID を外す（#4220）                                                  | 完了                                         |
| PR2.1 | `ATCODER_JAG` を新設し、AtCoder 上の JAG 4 コンテストと 2025 / 2026 の夏合宿（計 10 コンテスト）を足す（#4222）                      | 完了（本番のデータも投入済み）               |
| PR2.5 | グループ「JAG 模擬地区」に 76 コンテストのテーブルを作る                                                                             | 完了                                         |
| PR3   | AOJ のコンテスト一覧に無い 26 問を足す（AOJ に無い 21 問はダミー）                                                                   | 実装・目視確認済み、未マージ。CSV の投入待ち |

順序の制約:

- **PR2 → PR2.5 は守る**。Provider を先に出すと、合宿系の数値の index と `'2389. …'` の title がそのまま表に出る
- **PR2.5 は PR2.1 の後**。AtCoder の 4 コンテストの Provider が `ATCODER_JAG` と PR2.1 の seed を前提にする。本番の PR2.1 のデータ投入が PR2.5 より後だと、投入までは「JAG 模擬地区」に 10 コンテストの見出しと空の枠が出る
- **PR3 は独立**。PR2 で記号を補正済みなので、欠落を後から足しても既存の記号はずれない

## 残りのタスク

PR3:

実装・Codex のクロスレビュー（指摘はテストの強化 1 件で反映済み）・開発サーバーでの目視（JAG 冬合宿 2006 Day2 の表と問題一覧で、ダミーのリンク先と `（No Judge）` を確認）は済んだ。

1. PR を開き、staging へマージする
2. コードのデプロイの後に、メンテナが staging へ CSV を投入し、[SQL](#staging--本番への投入メンテナ) で確かめる
3. `main` へ昇格した後、本番にも同じ CSV を投入して確かめる

PR 外（優先度の低いものを含む）:

- 2016 年の JAG 模擬国内を API から取り込むと、記号が seed と食い違う。直すなら、取り込みで 2 回開催を `A` / `B` の `contest_id` に分け、それぞれ A から振る（`getContests` 側もそろえる）
- seed 整合テストの期待値を `assignProblemLetters` http://127.0.0.1:5173/で作っていて、testing.md の「期待値は literal」に合わない。補正したコンテストだけ literal にしている。全件を literal にするかは未判断
- `TaskTable.svelte` は、データの無い Provider でも見出しとテーブルの枠を描画する。直すなら、見出しから枠までを `{#if contestTable}` で囲む（全グループに効く）。既存の挙動なので触っていない
- テーブル名・出典欄の名称（春合宿 / 冬合宿 / 模擬地区）を、スプレッドシートの名称（春コンテスト / 冬コンテスト / 模擬アジア地区）にそろえるかは #4018（コンテスト情報の DB 化）で決める（[名称の違い](./investigation.md#名称の違い)）
- `src/lib/services/tasks.ts` の `title.replace(task_table_index, …)` は、AOJ の問題に ContestTaskPair を作るとタイトル本文を置換する。AOJ の pair は現在 0 件。直すときは先頭の `${index}. ` だけを置換し、`Amidakuji` のような本文と `A. Title` の両方を回帰テストに含める

### スコープ外

次の AOJ は数値の index のまま残し、別タスクとする（本番の件数、2026-10-21）。

| 範囲        | 本番（コンテスト / 問題） | 今の出典欄                                            | 残す理由                                                   |
| ----------- | ------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| AOJ Courses | 8 / 247                   | `プログラミング入門 - ITP1_1_A（AOJ）` のように不格好 | 問題 ID が非数値で、基本ルールの `task_id::int` が使えない |
| AOJ PCK     | 1 / 12                    | 数値の問題 ID のまま                                  | 優先度が低い                                               |
| AOJ 大学系  | 27 / 30                   | `UTPC 2010 - 2207（AOJ）`                             | 優先度が低い。本方式をそのまま当てられる                   |

- 大学系に広げるときは、`AOJ-KUPC2011` の 2279 を移行 SQL の対象から外す（index は既に `I` で正しく、基本ルールでは `A` になる）
- 本番の title のうち 46 件は前後に空白がある（AOJ 4 件、AtCoder 42 件。[詳細](./investigation.md#前後に空白のある-title)）。実害が無く、取り込みが trim するので再発もしない。直すなら 1 本の UPDATE（`btrim`、46 件の件数チェック付き）で済む

## 3 つの難所

1. **問題記号は AOJ API から取得できない。** ただし**基本ルール**（コンテスト内で問題 ID が若い順に `A`, `B`, `C`…）で復元できる。⇒ 対応表はスクリプトで機械生成できる
2. **欠落があると基本ルールが破れる。しかも欠落はデータから検出できない。** 欠落とは、公式の問題が AOJ のコンテスト一覧（管理画面の取り込み元）に無いこと。AOJ に登録が無ければ ID も無く、残った問題の ID は連番のままになる。⇒ **コンテスト単位で外部情報（メンテナのスプレッドシート）と照合するしかない**（PR2 では 8 コンテストで欠落が見つかった。[照合結果](./investigation.md#記号の補正が要るコンテスト)）
3. **表示層で逃げられない。** 出典欄は `task_table_index` を直接読む。⇒ DB の値そのものを直す以外に手段がない

## 決定事項

| 決定                                                                                                                           | 理由                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DB の値そのものを A/B/C に直す。既存データは移行 UPDATE で直す                                                                 | 難所 3。seed も取り込みも「既存なら skip」で、既存レコードは自動更新されない                                                                                                               |
| 対応表は基本ルールで生成し、欠落は人間がスプレッドシートと照合する                                                             | 難所 2。下の[照合の手順](#スプレッドシートとの照合)                                                                                                                                        |
| 管理画面の取り込みは、対応表ではなく基本ルールで記号を付ける。JAG は全 round（模擬国内 / 模擬地区）で付ける                    | 対応表を取り込み側に置くと、毎年の新しいコンテストで追記が要り、忘れると数値の index が黙って入る。補正した 8 コンテストは既存行なので、取り込みは skip し補正は持たない                   |
| 移行は Prisma のデータマイグレーションで適用する                                                                               | CI の既存の仕組みに乗る                                                                                                                                                                    |
| 合宿系の `title` から問題 ID のプレフィックスを除く                                                                            | index だけ記号にすると `removeTaskIndexFromTitle` が空振りし、`'2389. …'` が表に出る                                                                                                       |
| 合宿系は管理画面の取り込みに足さず、seed と Supabase の CSV で入れる                                                           | 既存の contest_id（`JAGSummer2012-day3A` など）にそろえるアドホックな対応が多く、年 1 回の追加には重い（メンテナの判断）                                                                   |
| 表示側の変換と `getTaskLabels` を削除する                                                                                      | DB が記号を持てば変換は恒等になる。`getTaskLabels` だけを残すと、上書きする Provider が 0 の使われないコードが残る                                                                         |
| ヘッダーの並びは `localeCompare`                                                                                               | 記号に `Number()` を当てると NaN になる                                                                                                                                                    |
| `buildTitleWithTaskIndex` は先頭の記号を外してから付ける。`removeTaskIndexFromTitle` は先頭のプレフィックスだけを消す          | AtCoder の title は `A. …` を含むので、付けるだけだと二重になる。本文の `. ` まで消すと `Dr. Podboq` → `DrPodboq` になる                                                                   |
| AOJ ラベルから全角括弧を外す                                                                                                   | 出典欄の目標書式ではコンテスト名を括弧で囲まない。検索・投票・タグ・取り込み画面などの表示も変わるが許容した                                                                               |
| AtCoder 上の JAG 4 つは `ATCODER_JAG` を新設し、contest_id の完全一致で分類する                                                | `jag` の前方一致だと `JAG2013Spring` / `JAG2014Spring`（AOJ の `JAGSpring2013` / `2014` と同じコンテスト）まで入り、二重になる。`AOJ_JAG` だと `（AOJ）` や `getTaskUrl` が AOJ 前提で動く |
| 合宿系・模擬地区・in AtCoder を 1 グループ「JAG 模擬地区」にし、テーブルはコンテストごと。並びは明示的な配列で持つ             | 同じ年の中の前後関係（模擬地区 2014 は夏合宿 2014 の Day3）を表せるのは 1 グループだけ。スプレッドシートの行順は contest_id から導けない。配列の書き漏れは seed との整合テストで落ちる     |
| テーブル名は `getContestNameLabel` の名称に括弧書き（`JAG` / `有志` / `in JAG 夏合宿 20xx Day3`）を付け、出典欄は変えない      | スプレッドシートの名称にすると出典欄と食い違う。そろえるなら検索・投票・タグ・fixture に波及するので #4018 に回した。ラベル（出典欄）に（有志）は付けない                                  |
| Provider の `contestType` は、AtCoder 上の 4 コンテストだけ `ATCODER_JAG`、ほかは `AOJ_JAG`。グループのキーは `aojJagRegional` | `contestType` が効くのは provider key と `getTaskTableHeaderName` だけで、表示は変わらない。キーは localStorage に保存されるので後から変えられない                                         |
| seed の記号の検査は、補正した 8 コンテストだけ literal で書く。title は「問題名（`name`）と同じ」で見る                        | 補正の正しさは基本ルールの関数では検査できない。title は「問題 ID が無い」だけだと、空や別の問題にすり替わっても通る                                                                       |

却下した方針:

- 対応表を `prisma/tasks.ts` に手書きし seed だけ直す: 取り込みが数値を入れ続け、新旧の書式が混在する
- 問題 ID の連番性から欠落を機械判定する: 論理的に成立しない（難所 2）
- seed を冪等化して production に流す: `addUsers` / `addAnswers` / `addVoteStatisticsDemoData` まで走る（`prisma/seed.ts`）
- `title` に記号を入れて `'A. Peculiar Protocol'` に揃える: 同じ情報を 2 列に持つとドリフトする（[詳細](./investigation.md#title-に記号を入れる案を採らない理由)）
- 管理画面に同期 action を足す: 保留。問題記号の入力元が定義できない（[詳細](./investigation.md#管理画面案を保留にした理由)）

## PR3: 欠落問題の補完

根拠は [investigation.md の 7 章](./investigation.md#7-pr3-欠けている問題)。

AOJ の JAG / ICPC で、公式の問題なのに seed に無い 26 問を足す。管理画面の取り込みは AOJ のコンテスト一覧を使うので取り込めない。seed に足し、staging / 本番はメンテナが Supabase の CSV で入れる。

| 種類                                                   | 問題                                                                                                        | 入れ方                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| AOJ にあるが、取り込み元のコンテスト一覧に無い（5 問） | 1123（ICPC 国内予選 2002 の E）、3643（JAG 夏合宿 2024 Day3 の G）、2565〜2567（JAG 模擬地区 2013 の A〜C） | AOJ の問題 ID のまま、通常の問題として入れる             |
| AOJ に無い（21 問）                                    | 2005〜2008 年の JAG の 7 コンテスト（[一覧](./investigation.md#aoj-に無い-21-問)）                          | ダミーの Task として入れ、リンクは jag-icpc.org に向ける |

3643 は 2026-10-10 に AOJ に追加されたばかりで公開前かもしれない（`available` が 4、提出が 0）が、入れる。合宿系は取り込みの対象外なので、一覧に入るのを待っても取り込めない。

### ダミー（21 問）の決定

- **`task_id`**: `NoJudge-{contest_id}_{記号の小文字}`（例: `NoJudge-JAGWinter2006-day2_a`）。`task_table_index` は大文字のまま。接頭辞が「採点の仕組みが無い」という分岐の理由をそのまま表し、AOJ（数字）とも AtCoder（`abc300_a`）とも構造上ぶつからない。判定は `isNoJudgeTask()`（`startsWith('NoJudge-')`）に一本化する
- **title**: jag-icpc.org の年度ページの一覧（= スプレッドシート）の表記。`Wireing Assistant` も原文どおり
- **リンク先**: jag-icpc.org の大会区分のページ（例: `2008/Practice/模擬地区予選`、計 5 ページ）。問題文・ジャッジデータ・講評のどれにも下りられる。URL は組み立てず、ブラウザで開けたものをパーセントエンコードのまま貼る
- **リンクの出し方**: `NoJudgeGenerator` を `AojGenerator` の前に置く（ダミーは JAG の `contest_id` を使うので、順序に意味がある）。`task_id` をキーにした map から引き、漏れていれば空文字を返して AOJ には回さない。seed との突き合わせのテスト 2 件が、map の漏れと打ち間違いを守る
- **出典のラベル**: `（AOJ）` ではなく `（No Judge）`（例: `JAG 冬合宿 2006 Day2 - A（No Judge）`）。`addContestNameToTaskIndex` に必須の `taskId` を足した
- **見た目**: アイコンもツールチップも入れない。表のセルに幅が無く、スマホにはホバーが無い。引っかかっても、新しいタブで開けば提出フォームの無い Wiki だと分かる
- **記号の検査**: ダミーのある 7 コンテストを `LETTERS_OF_SHIFTED_CONTESTS` に入れる（`Number()` で並べられないため、入れ忘れを検出するテストがある）。連番に戻った `JAGRegional2013` と `JAGSummer2024-day3` は外した
- **AOJ に後から追加されたら**: 管理画面から取り込まず、DB の `task_id` を AOJ の ID に UPDATE する。取り込みは後から足された問題へずれた記号を付け、重なると表から黙って消える。外部キー 6 つは `ON UPDATE CASCADE`（[手順](./investigation.md#aoj-に後から追加されたとき)）

### 採らなかった案

- **`task_id`**: 数字（100000 番台は AOJ の本物の ID と見分けられず、AOJ が決める領域で衝突が残る。50xx 番台は AOJ の採番がいずれ届く）、`Missing-`（AOJ にある 5 問にも当てはまり、仮のレコードにも読める）、`jag-icpc_` など（置き場所を表し、分岐の理由を表さない）
- **リンク先**: PDF への直リンク（講評に辿れず、添付ファイル名が揃っておらず切れやすい）、`問題文とデータセット` のページ（講評に辿れない）
- **リンクの出し方**:
  - `getTaskUrl()` の先頭で map を引く: 判定が「map に載っているか」になり、出典のラベル（接頭辞で判定）と基準が割れる。漏れると開けない AOJ のリンクになる
  - Task に `url` 列を足す: マイグレーションと呼び出し元 9 ファイルの変更が要り、21 件には重い。他サイトに対応するときに再検討する
  - URL を年・大会区分・ファイル名から組み立てる: 規則の推測が外れると黙って間違ったリンクになる
  - map を隠して取り出す関数だけを export する: seed との突き合わせで map のキーを列挙できない
  - 外部リンクを CI で確かめる: 外部サイトの状態でテストが落ちる
- **判定の置き場所**: `isNoJudgeTask()` を `src/lib/utils/` に置く案は、`lib/utils/task.ts` が `#lib/contests/index.js` を import しているので循環 import になる。`lib/contests` に置いた
- **`taskId` を省略できる引数にする**: 渡し忘れが黙って `（AOJ）` のままになる。必須なら型チェックが漏れを見つける
- **見た目**: セルにアイコン（AOJ の表は 1 行に最大 6 列で幅が足りない）、`title` 属性のツールチップ（スマホでは出ない。知らせる仕組みが必要になったら最初に検討する）、表のタイトルに `note` で書く（主催者の欄と意味が混ざる）、詳細ページに一文添える（表から直接開く人の目に入らない）
- **title の確認**: 一覧でしか確かめていない 19 問を PDF の表紙でも確かめる案は、一覧がスプレッドシートと一致しているので見送った

### staging / 本番への投入（メンテナ）

コードのデプロイの後に CSV を入れる（先に入れると、デプロイまでの間、ダミーが開けない AOJ のリンクと `（AOJ）` のラベルで出る）。

- 列は `id`・`contest_type`・`created_at`・`updated_at` も明示する。Supabase の CSV は Prisma の既定値を使わず、`created_at` は DB に既定値があっても空になった例がある（`docs/guides/agent-rules/prisma-db.md`）
- `id` は PR2.1 と同じく、メンテナのスクリプトで `sha256(contest_id + title)` にする（`Task.id` を再計算して引く箇所は無い。[根拠](./investigation.md#id-の採番規則が経路ごとに違う)）
- CSV の投入は `invalidateTaskCaches()` を経ないので、画面に出るのはタスクのキャッシュの有効期限（1 時間）が切れた後

| `task_id`                    | `contest_id`       | `contest_type` | `task_table_index` | `title`                      |
| ---------------------------- | ------------------ | -------------- | ------------------ | ---------------------------- |
| 1123                         | ICPCPrelim2002     | AOJ_ICPC       | E                  | Enclosing Circles            |
| NoJudge-JAGRegional2005_c    | JAGRegional2005    | AOJ_JAG        | C                  | Geometry?! Why Not??         |
| NoJudge-JAGRegional2005_f    | JAGRegional2005    | AOJ_JAG        | F                  | University Rankings          |
| NoJudge-JAGRegional2005_h    | JAGRegional2005    | AOJ_JAG        | H                  | Tiling Polygons              |
| NoJudge-JAGRegional2008_j    | JAGRegional2008    | AOJ_JAG        | J                  | Colony Maintenance           |
| 2565                         | JAGRegional2013    | AOJ_JAG        | A                  | Broken Audio Signal          |
| 2566                         | JAGRegional2013    | AOJ_JAG        | B                  | Restore Calculation          |
| 2567                         | JAGRegional2013    | AOJ_JAG        | C                  | SIRO Challenge               |
| NoJudge-JAGSummer2006-day1_a | JAGSummer2006-day1 | AOJ_JAG        | A                  | Monkey Business              |
| NoJudge-JAGSummer2006-day1_c | JAGSummer2006-day1 | AOJ_JAG        | C                  | Sort that Queue              |
| NoJudge-JAGSummer2006-day3_a | JAGSummer2006-day3 | AOJ_JAG        | A                  | Rolling Cubes                |
| 3643                         | JAGSummer2024-day3 | AOJ_JAG        | G                  | Interactive String Guessing  |
| NoJudge-JAGWinter2006-day2_a | JAGWinter2006-day2 | AOJ_JAG        | A                  | Cells                        |
| NoJudge-JAGWinter2006-day2_b | JAGWinter2006-day2 | AOJ_JAG        | B                  | Japan                        |
| NoJudge-JAGWinter2006-day2_c | JAGWinter2006-day2 | AOJ_JAG        | C                  | Maximum                      |
| NoJudge-JAGWinter2006-day2_e | JAGWinter2006-day2 | AOJ_JAG        | E                  | Payment System               |
| NoJudge-JAGWinter2006-day2_g | JAGWinter2006-day2 | AOJ_JAG        | G                  | Roof                         |
| NoJudge-JAGWinter2006-day2_h | JAGWinter2006-day2 | AOJ_JAG        | H                  | Seminar Room                 |
| NoJudge-JAGWinter2006-day2_i | JAGWinter2006-day2 | AOJ_JAG        | I                  | String Compression           |
| NoJudge-JAGWinter2006-day3_b | JAGWinter2006-day3 | AOJ_JAG        | B                  | Widget Factory               |
| NoJudge-JAGWinter2006-day3_c | JAGWinter2006-day3 | AOJ_JAG        | C                  | Hills                        |
| NoJudge-JAGWinter2006-day3_e | JAGWinter2006-day3 | AOJ_JAG        | E                  | Safe Packing                 |
| NoJudge-JAGWinter2006-day3_f | JAGWinter2006-day3 | AOJ_JAG        | F                  | The "Shortest" Pair of Paths |
| NoJudge-JAGWinter2006-day3_i | JAGWinter2006-day3 | AOJ_JAG        | I                  | Counting Triangles           |
| NoJudge-JAGWinter2006-day3_j | JAGWinter2006-day3 | AOJ_JAG        | J                  | Wireing Assistant            |
| NoJudge-JAGWinter2007-day3_e | JAGWinter2007-day3 | AOJ_JAG        | E                  | Networking Company           |

CSV を入れたら、次の SQL で記号を確かめる。`(contest_id, task_table_index)` には一意制約が無く、同じコンテストで記号が重なると、表で片方の問題が黙って消える。seed はテストが守るが、CSV は守らない。

```sql
-- Expect no rows: a duplicated letter hides one problem in the contest table.
SELECT contest_id, task_table_index, COUNT(*)
FROM task
WHERE contest_id IN ('ICPCPrelim2002', 'JAGRegional2005', 'JAGRegional2008', 'JAGRegional2013', 'JAGSummer2006-day1', 'JAGSummer2006-day3', 'JAGSummer2024-day3', 'JAGWinter2006-day2', 'JAGWinter2006-day3', 'JAGWinter2007-day3')
GROUP BY contest_id, task_table_index
HAVING COUNT(*) > 1;

-- Expect the letters in the table below.
SELECT contest_id, COUNT(*) AS task_count, STRING_AGG(task_table_index, '' ORDER BY task_table_index) AS letters
FROM task
WHERE contest_id IN ('ICPCPrelim2002', 'JAGRegional2005', 'JAGRegional2008', 'JAGRegional2013', 'JAGSummer2006-day1', 'JAGSummer2006-day3', 'JAGSummer2024-day3', 'JAGWinter2006-day2', 'JAGWinter2006-day3', 'JAGWinter2007-day3')
GROUP BY contest_id
ORDER BY contest_id;
```

| `contest_id`       | 問題数 | 記号        |
| ------------------ | ------ | ----------- |
| ICPCPrelim2002     | 5      | ABCDE       |
| JAGRegional2005    | 9      | ABCDEFGHI   |
| JAGRegional2008    | 10     | ABCDEFGHIJ  |
| JAGRegional2013    | 10     | ABCDEFGHIJ  |
| JAGSummer2006-day1 | 3      | ABC         |
| JAGSummer2006-day3 | 7      | ABCDEFG     |
| JAGSummer2024-day3 | 11     | ABCDEFGHIJK |
| JAGWinter2006-day2 | 9      | ABCDEFGHI   |
| JAGWinter2006-day3 | 10     | ABCDEFGHIJ  |
| JAGWinter2007-day3 | 10     | ABCDEFGHIJ  |

## データ移行の共通手順

PR2（記号の移行）、PR2.1（enum の追加）、PR3 に当てはまる。

### CI での適用

`.github/workflows/ci.yml`（2026-10-24 に確認）は、build / lint / check / unit-test が通ると、`main` 以外では `preview` ジョブ（適用先は staging の DB）、`main` では `production` ジョブを走らせる。どちらも `vercel build` の後・デプロイの前に `prisma migrate deploy` を流す。

- **PR の CI でも staging の DB に適用される**。`preview` ジョブの条件が `github.ref != 'refs/heads/main'` だけで、PR の ref も当たる。staging へのマージより前である
- このため SQL の確認は PR を開く前にローカルで済ませる。適用済みのマイグレーションは編集しても再適用されないので、後から誤りが見つかったら新しいマイグレーションを積む
- `main` へ昇格した時点で production に適用されるので、staging での確認が自然にゲートになる
- 本件の範囲外だが、`preview` ジョブの「Assign staging domain」はコメントに「if staging branch」とあるのに条件は `github.ref != 'refs/heads/main'` で、PR のデプロイにも staging のドメインが付け替わる

### 手順

1. `pnpm exec prisma migrate dev --create-only --name <name>`、SQL を `migration.sql` に書く
2. ローカル DB で `UPDATE` を `SELECT` に置き換えて「現在値 → 変更後」を確認する。コンテストの切り替わり目（記号が `A` に戻る箇所）と問題数の少ない古いコンテストは目視する価値がある
3. `pnpm exec prisma migrate dev` で適用し、表示を確認する（**ここまで必ず PR を開く前に**）
4. PR を開く → staging へマージして確認 → `main` へ昇格

staging が防げないのは、対応表・欠落判断そのものの誤り。誤った記号でも SQL は完走し、それらしく表示される（難所 2）。

### 事故対策

- **爆発半径**: 一括で復元できるのは AOJ ICPC / JAG だけ（`task_table_index == task_id` が成り立っていたため）。WHERE 句が壊れて AtCoder 系に波及すると一括復元の手段が無くなる（[実測](./investigation.md#復元可能性の実測)）
- **復元**: 一度目の適用に限り、`task_table_index` も `title` のプレフィックスも `task_id` から再構成できる。再修正時は Supabase Pro の PITR が唯一の手段
- **`updated_at`**: `@updatedAt` は Prisma Client 側の実装で、生 SQL では更新されない。意図的に含めない
- **キャッシュ**: TTL 1 時間（`src/lib/clients/cache.ts`）。生 SQL と CSV の投入は `invalidateTaskCaches()` を経由しない。「更新したのに表示が変わらない」ときはこれを疑う
- **トランザクション**: マイグレーションはファイル単位で原子的に適用される（3 文目が失敗するマイグレーションで 1–2 文目も残らないことをローカルで確認）
- **デプロイ直前の数分**: マイグレーションの適用から Vercel のデプロイ完了までは、旧コードが新しいデータを描画する。数分で解消するので許容する

### スプレッドシートとの照合

1. 基本ルールで対象範囲の記号を生成する
2. コンテスト単位で、メンテナのスプレッドシートと照合する（人手が要るのは書き写しだけ）
3. 先頭・途中に欠落があるコンテストは、スプレッドシートの位置から記号を決める（末尾の欠落は記号がずれないので補正不要）
4. 欠落した問題が AOJ に問題番号で存在するかを確かめ、PR3 に引き継ぐ

- 「これまで正しく見えていた」は「欠落が無い」の証明ではない。欠落があっても前詰めでずれた記号が出るだけで、表示は成立する
- スクリプトには総数のアサーションを入れる。抽出漏れが欠落の誤検出に直結する（[事例](./investigation.md#6-調査中の誤りと訂正自戒)）。title は大文字小文字・空白・記号を無視して比べ、セルで切れた title は前方一致にする。スプレッドシート自体の誤りは検出できない
- PR1 / PR2 のスクリプトは git に残っている: `git show 171bf3c9:docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_problem_letters.ts`、`git show c605d3bd:…/generate_aoj_jag_problem_letters.ts`。わざと誤りを入れたコピー 5 種類（順番の入れ替え、途中の title の誤り、欠番、問題数の不足、切れた title の前半の誤り）を、どちらも検出した

## 実装中に分かったこと

コードと git から読み取れない事実だけを残す。

**移行 SQL（PR1 / PR2）**

- 範囲は `contest_type` ではなく `contest_id` の接頭辞で絞る。合宿系も模擬国内と同じ `AOJ_JAG` に分類されるので、PR1 で `contest_type` だけで絞ると合宿系 467 件まで更新する。PR2 は `^JAG(Summer|Winter|Spring|Regional)` で絞る
- PR1 は対応表を焼き込まず基本ルールを SQL で表した。本番は管理画面の取り込みで入っていて seed と一致する保証が無く、`UPDATE` は 0 件でもエラーにならないので、取りこぼしが静かに起きる
- PR2 の補正 8 コンテスト（45 行）は、コンテストの全行を上書きして 1 つのコンテストに 2 つの規則を混ぜない。各ステップの更新件数を DO ブロックで検査し、想定外なら RAISE する（想定値: 空の DB 0、模擬地区の無い開発 DB 467 / 32 / 467、staging・本番 625 / 45 / 467）。模擬地区が一部だけの DB では RAISE し、エラー文で「全部取り込むか、全部消す」と案内する
- 順位はコンテストの全行で付け、更新は問題 ID のままの行だけにする（Codex の指摘）。順位を付ける側でも絞ると、記号の行と問題 ID の行が混ざったコンテストで A から振り直してしまう。title から外すのは「自分の `task_id` + `. `」で始まるものだけ（`^[0-9]+\. ` だと番号で始まる本来の title まで削る）
- `AOJ-KUPC2011` の 2279 は title だけを素にし、index（`I`）は触らない
- `row_number()` は `bigint` を返し `chr(bigint)` は無いので `::int` が要る
- PR2 の staging は当初、模擬地区が 2 コンテスト / 16 問で件数チェックが RAISE するところだった。PR1.5 の後に staging で取り込み、本番と同じ状態（16 / 158、合宿系 50 / 467）にそろえてから PR を開いた

**取り込みと AOJ API（PR1 / PR1.5）**

- AOJ API には 2 日開催を 1 コンテストにしたもの（`JAGPrelim20162`、2738–2751）があり、取り込みでは A–N になる。seed と本番は `JAGPrelim2016A` / `B` に分かれていて、取り込みは既存の問題を skip するので影響しない
- 新しい API とのコードの差はベース URL だけで、応答は最上位の `largeCl.id` が小文字になっただけ（コードは読まない）
- `new URL(endpoint, base)` は、ベースの末尾に `/` が無いか、エンドポイントの先頭に `/` があると `/api` を落とす。旧ホストはパスが無かったので表に出ていなかった
- 取得ツールが新しいホストに `ECONNREFUSED` で拒まれたが、Vercel からは問題なく取得できた。問題ページ `https://onlinejudge.u-aizu.ac.jp/problems/{id}` は今のまま開ける
- テスト: クライアントを nock のまま本番の定数から作り（以前は自前の旧ホストで、定数を間違えても通った）、`nock.disableNetConnect()` を足した。AOJ の fixture は取り直さない（統計値や新しい回の追加で、fixture に依存する期待値まで変わるため）

**分類と表示（PR1 / PR2.1 / PR2.5）**

- 表示の回帰: 旧コードで適用前、新コードで適用後のデータを描画し、79 コンテストすべてで列順とセルの文字列が一致した。スクリーンショットでの目視は未実施
- AtCoder の 4 コンテストのセルは AtCoder に飛ぶ（`getTaskUrl` が AOJ に振るのは大文字の `JAG…` だけ）。title の記号は二重にならない
- DB の `contest_type` は書き込むだけで、読む箇所は無い（分類は毎回 `contest_id` から引く）。enum の値は `ADD VALUE` で DB 上の末尾に足され、schema.prisma の並びと違うが、並べ替えにも使っていない
- PR2.5 のテストは、配列の contest_id を seed の合宿系・模擬地区・AtCoder 上の JAG と突き合わせる（手書きの 76 件の誤りは、計画の件数・並びのテストでは検出できない）。並びと括弧書きは investigation.md の表と機械的に突き合わせ、76 件すべて一致した

**seed とデータの投入（PR2 / PR2.1）**

- seed の模擬地区 158 問は本番から取り出したもので、AOJ の fixture と ID・コンテスト・名前がすべて一致した
- 2025 / 2026 夏合宿は、PR2 の移行の後に CSV で記号付きで入れる（移行の前に問題 ID のまま入れると PR2 の件数の想定値が変わる）。CSV の `id` は既存の合宿系と同じ `sha256(contest_id + title)`
- seed の AOJ 72 行は、既存の AOJ のブロックにそろえて古い順・問題 ID の昇順に置いた（add-tasks の新しい順・降順は AtCoder 側の慣習）
- PR2.1 のデータは、2026-10-25 にメンテナがローカルと staging で投入・確認した（10 コンテストで `ATCODER_JAG` 42 行・`AOJ_JAG` 72 行）
- PR2.1 より前の版へロールバックすると、旧版の Prisma Client は `ATCODER_JAG` を読めない。ロールバックの前に該当 42 行を `OTHERS` に変えて件数を控え、ロールフォワードの後に件数チェック付きの UPDATE で戻す。件数が違えば RAISE させ、期待値を書き換えて通さない（手順の SQL は git の履歴にある）

**開発環境**

- ローカルの管理画面の取り込みが 500 になった原因は 2 つ。外向き通信の許可リスト（`.devcontainer/init-firewall.sh`）に新しいホストが無かったこと（起動時に 1 回だけ DNS で IP を引くので、反映にはコンテナの再ビルドが要る。旧ホストは残さず置き換えた）と、enum を足す前から動いている開発サーバーが古い Prisma Client を持っていたこと（再起動で直る）
- PR2.1 より前に seed したローカル DB には 2025 / 2026 の夏合宿が無く、「JAG 模擬地区」にテーブルが出ない。`pnpm db:seed` を流し直せば入る
