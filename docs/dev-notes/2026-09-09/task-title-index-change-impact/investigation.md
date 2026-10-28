# 調査の根拠データと検討の経緯

[plan.md](./plan.md) の裏付け。単独では読まず、計画から参照される想定。**計画の決定が常に優先される。**

| 章                                              | 内容                                                | 主に使う PR     |
| ----------------------------------------------- | --------------------------------------------------- | --------------- |
| [1](#1-pr2-の照合2026-10-24)                    | スプレッドシートとの照合、補正、表示順              | PR2 / 2.1 / 2.5 |
| [2](#2-実測データ)                              | 件数、title の形、復元可能性、一意性                | PR2             |
| [3](#3-sql-の解説)                              | 基本ルールの SQL の読み方と計算量                   | PR2             |
| [4](#4-検討の経緯採らなかった案)                | 採らなかった案の理由                                | —               |
| [5](#5-task-テーブルへの書き込み経路の全数調査) | Task への書き込み経路（移行 UPDATE の安全性の根拠） | PR2 / PR3       |
| [6](#6-調査中の誤りと訂正自戒)                  | 調査中の誤り                                        | —               |
| [7](#7-pr3-欠けている問題)                      | 欠けている問題の調査、ダミーの設計、影響範囲        | PR3             |

PR0 / PR1 だけに関わる調査（出典欄の呼び出し元、テストの影響範囲など）は、コードと #4212 / #4217 の差分から読めるので削除した。判断の要約は [plan.md](./plan.md#実装中に分かったこと)。

---

# 1. PR2 の照合（2026-10-24）

メンテナのスプレッドシート（スクリーンショット 16 枚、行 2〜1025。上が新しい）と、本番の問題一覧の JAG 模擬地区（スクリーンショット 10 枚、158 問）を目視で突き合わせた。目視の結果で、PR2 の照合スクリプト（書き写したスプレッドシートとの機械的な照合）でも同じ結果になった（[plan.md](./plan.md#スプレッドシートとの照合)）。

スプレッドシートで折りたたまれた行（40–50 ほか 19 か所）は JAG 模擬国内だけで、合宿系・模擬地区は含まない（メンテナに確認済み）。

## 対応の確認

- seed の合宿系 50 コンテストは、すべてスプレッドシートにある。問題名は記号の位置ごとに一致した
- 本番の模擬地区 16 コンテスト（2005〜2017 と 2020〜2022）も、すべてある。問題 ID は 2024〜3357 で、すべて数値
- スプレッドシートにあって DB に無いのは 10 コンテスト（[下記](#db-に無いコンテスト)）

## 記号の補正が要るコンテスト

基本ルール（問題 ID の昇順に A, B, C…）と、スプレッドシートの位置が食い違うコンテスト。いずれも先頭か途中に、AOJ に無い問題がある。末尾だけの欠落（模擬地区 2008 の J）は記号がずれないので含めない。

| contest_id           | 問題 ID → 記号                                             | 欠けている記号      |
| -------------------- | ---------------------------------------------------------- | ------------------- |
| `JAGSummer2006-day1` | 2057 → B                                                   | A, C                |
| `JAGSummer2006-day3` | 2067〜2072 → B〜G                                          | A                   |
| `JAGWinter2006-day2` | 2073 → D、2074 → F                                         | A, B, C, E, G, H, I |
| `JAGWinter2006-day3` | 2075 → A、2076 → D、2077 → G、2078 → H                     | B, C, E, F, I, J    |
| `JAGWinter2007-day3` | 2122〜2125 → A〜D、2126〜2130 → F〜J                       | E                   |
| `JAGSummer2024-day3` | 3637〜3642 → A〜F、3644〜3647 → H〜K                       | G                   |
| `JAGRegional2005`    | 2024 → A、2025 → B、2026 → D、2027 → E、2028 → G、2029 → I | C, F, H             |
| `JAGRegional2013`    | 2568〜2574 → D〜J                                          | A, B, C             |

8 コンテスト / 45 行（合宿系 32、模擬地区 13）。基本ルールから値が変わるのは 32 行（合宿系 21、模擬地区 11）。

## DB に無いコンテスト

PR2.1 で入れる。contest_id と問題番号は 2026-10-24 にメンテナから受け取った。

| スプレッドシートの見出し                            | contest_id                | 問題（task_id）                   | 入手元  |
| --------------------------------------------------- | ------------------------- | --------------------------------- | ------- |
| JAG 夏合宿 2026 Day1（JAG）                         | `JAGSummer2026-day1`      | 3684〜3695                        | AOJ     |
| JAG 夏合宿 2026 Day2（有志）（AMATSUKAZE2025）      | `JAGSummer2026-day2`      | 3696〜3707                        | AOJ     |
| JAG 夏合宿 2026 Day3（JAG）                         | `JAGSummer2026-day3`      | 3708〜3719                        | AOJ     |
| JAG 夏合宿 2025 Day1（有志）                        | `JAGSummer2025-day1`      | 3648〜3659                        | AOJ     |
| JAG 夏合宿 2025 Day2（JAG）                         | `JAGSummer2025-day2`      | 3660〜3671                        | AOJ     |
| JAG 夏合宿 2025 Day3（有志）                        | `JAGSummer2025-day3`      | 3672〜3683                        | AOJ     |
| JAG 夏合宿 2018 Day2（有志）（in AtCoder）          | `jag2018summer-day2`      | `jag2018summer_day2_a`〜`k`       | AtCoder |
| JAG 夏合宿 2017 Day1（有志）（in AtCoder）          | `jag2017summer-day1`      | `jag2017summer_day1_a`〜`k`       | AtCoder |
| JAG 夏合宿 2015 Day3（過去問）（in AtCoder）        | `jag2015summer-day3`      | `icpc2015summer_day3_a`〜`j`      | AtCoder |
| JAG 夏合宿 2013 Day2 WarmUp（過去問）（in AtCoder） | `jag2013summer-warmingup` | `icpc2013summer_warmingUp_a`〜`j` | AtCoder |

計 114 問（AOJ 72 は各 12 問、AtCoder 42）。いずれも「AOJ 未収録」の表記は無く、受け取った問題名はスプレッドシートと記号の位置ごとに一致した（目視）。AOJ の 6 コンテストは問題 ID が連番で、記号は基本ルールと一致する。

AtCoder Problems の `contests.json` には、ほかに `JAG2013Spring` / `JAG2014Spring` もある。AOJ の `JAGSpring2013` / `JAGSpring2014` と同じコンテストなので対象外とする。

## 表示順（76 コンテスト）

PR2.5 の配列（`aoj_jag_regional_entries.ts`）の元。スプレッドシートの行順そのまま（上が新しい）。括弧書きは plan.md の決定事項に従う（「過去問」「in AtCoder」「AMATSUKAZE2025」は書かない）。「DB」列の「無し」は PR2.1 で入るもの、「補正」は上の 8 コンテスト。

| #   | 行   | contest_id                           | 括弧書き                | DB   |
| --- | ---- | ------------------------------------ | ----------------------- | ---- |
| 1   | 2    | `JAGSummer2026-day1`                 | JAG                     | 無し |
| 2   | 15   | `JAGSummer2026-day2`                 | 有志                    | 無し |
| 3   | 28   | `JAGSummer2026-day3`                 | JAG                     | 無し |
| 4   | 51   | `JAGSummer2025-day1`                 | 有志                    | 無し |
| 5   | 64   | `JAGSummer2025-day2`                 | JAG                     | 無し |
| 6   | 77   | `JAGSummer2025-day3`                 | 有志                    | 無し |
| 7   | 100  | `JAGSummer2024-day2`                 | 有志                    |      |
| 8   | 115  | `JAGSummer2024-day3`                 | JAG                     | 補正 |
| 9   | 137  | `JAGSummer2023-day2`                 | 有志                    |      |
| 10  | 150  | `JAGSummer2023-day3`                 | JAG                     |      |
| 11  | 171  | `JAGRegional2022`                    | JAG                     |      |
| 12  | 193  | `JAGRegional2021`                    | JAG                     |      |
| 13  | 214  | `JAGRegional2020`                    | JAG                     |      |
| 14  | 235  | `JAGSummer2019-day1`                 | JAG                     |      |
| 15  | 247  | `JAGSummer2019-day2`                 | 有志                    |      |
| 16  | 258  | `JAGSummer2019-day3`                 | 有志                    |      |
| 17  | 278  | `jag2018summer-day2`（AtCoder）      | 有志                    | 無し |
| 18  | 290  | `JAGSummer2018-day3`                 | JAG                     |      |
| 19  | 311  | `JAGRegional2017`                    | JAG                     |      |
| 20  | 323  | `jag2017summer-day1`（AtCoder）      | 有志                    | 無し |
| 21  | 335  | `JAGSummer2017-day3`                 | JAG                     |      |
| 22  | 356  | `JAGRegional2016`                    | in JAG 夏合宿 2016 Day3 |      |
| 23  | 384  | `JAGRegional2015`                    | JAG                     |      |
| 24  | 396  | `JAGSummer2015-day2`                 | 有志                    |      |
| 25  | 408  | `jag2015summer-day3`（AtCoder）      | なし                    | 無し |
| 26  | 419  | `JAGSummer2015-day4`                 | JAG                     |      |
| 27  | 438  | `JAGSpring2015`                      | JAG                     |      |
| 28  | 451  | `JAGSummer2014-day2`                 | 有志                    |      |
| 29  | 462  | `JAGRegional2014`                    | in JAG 夏合宿 2014 Day3 |      |
| 30  | 474  | `JAGSummer2014-day4`                 | 有志                    |      |
| 31  | 493  | `JAGSpring2014`                      | JAG                     |      |
| 32  | 504  | `JAGRegional2013`                    | JAG                     | 補正 |
| 33  | 515  | `jag2013summer-warmingup`（AtCoder） | なし                    | 無し |
| 34  | 526  | `JAGSummer2013-day2`                 | 有志                    |      |
| 35  | 534  | `JAGSummer2013-day3`                 | 有志                    |      |
| 36  | 547  | `JAGSummer2013-day4`                 | JAG                     |      |
| 37  | 566  | `JAGSpring2013`                      | JAG                     |      |
| 38  | 577  | `JAGRegional2012`                    | JAG                     |      |
| 39  | 588  | `JAGSummer2012-day2`                 | 有志                    |      |
| 40  | 599  | `JAGSummer2012-day3A`                | 有志                    |      |
| 41  | 606  | `JAGSummer2012-day3B`                | 有志                    |      |
| 42  | 614  | `JAGSummer2012-day4`                 | JAG                     |      |
| 43  | 633  | `JAGSpring2012`                      | JAG                     |      |
| 44  | 644  | `JAGWinter2011`                      | JAG                     |      |
| 45  | 655  | `JAGRegional2011`                    | JAG                     |      |
| 46  | 674  | `JAGSummer2011-day2`                 | 有志                    |      |
| 47  | 685  | `JAGSummer2011-day3`                 | JAG                     |      |
| 48  | 696  | `JAGSummer2011-day4`                 | 有志                    |      |
| 49  | 707  | `JAGWinter2010-day3`                 | 有志                    |      |
| 50  | 718  | `JAGWinter2010-day4`                 | JAG                     |      |
| 51  | 729  | `JAGRegional2010`                    | JAG                     |      |
| 52  | 740  | `JAGSummer2010-day2`                 | 有志                    |      |
| 53  | 751  | `JAGSummer2010-day3`                 | 有志                    |      |
| 54  | 762  | `JAGSummer2010-day4`                 | JAG                     |      |
| 55  | 781  | `JAGWinter2009`                      | JAG                     |      |
| 56  | 792  | `JAGRegional2009`                    | JAG                     |      |
| 57  | 803  | `JAGSummer2009-day2`                 | JAG                     |      |
| 58  | 814  | `JAGSummer2009-day3`                 | JAG                     |      |
| 59  | 832  | `JAGWinter2008-day2`                 | JAG                     |      |
| 60  | 844  | `JAGWinter2008-day3`                 | JAG                     |      |
| 61  | 856  | `JAGRegional2008`                    | JAG                     |      |
| 62  | 867  | `JAGSummer2008-day2`                 | JAG                     |      |
| 63  | 878  | `JAGSummer2008-day4`                 | JAG                     |      |
| 64  | 894  | `JAGWinter2007-day2`                 | JAG                     |      |
| 65  | 905  | `JAGWinter2007-day3`                 | JAG                     | 補正 |
| 66  | 916  | `JAGRegional2007`                    | JAG                     |      |
| 67  | 926  | `JAGSummer2007-day1`                 | JAG                     |      |
| 68  | 932  | `JAGSummer2007-day2`                 | JAG                     |      |
| 69  | 942  | `JAGSummer2007-day3`                 | JAG                     |      |
| 70  | 957  | `JAGWinter2006-day2`                 | JAG                     | 補正 |
| 71  | 967  | `JAGWinter2006-day3`                 | JAG                     | 補正 |
| 72  | 978  | `JAGRegional2006`                    | JAG                     |      |
| 73  | 988  | `JAGSummer2006-day1`                 | JAG                     | 補正 |
| 74  | 992  | `JAGSummer2006-day2`                 | JAG                     |      |
| 75  | 1002 | `JAGSummer2006-day3`                 | JAG                     | 補正 |
| 76  | 1017 | `JAGRegional2005`                    | JAG                     | 補正 |

内訳: 合宿系 50、模擬地区 16、DB に無いもの 10（AOJ 6、AtCoder 4）。

### 年の中での並び

contest_id から並びを導けない例（スプレッドシートの上から順）。冬合宿・冬コンテストは、年の数字が同じ夏合宿・模擬地区より上にある。

- 2014: 夏合宿 Day2 → 模擬地区（夏合宿の Day3 として開催）→ 夏合宿 Day4 → 春コンテスト 2014
- 2012: 模擬地区 2012 → 夏合宿 2012 → 春コンテスト 2012 → 冬コンテスト 2011 → 模擬地区 2011 → 夏合宿 2011
- 2010: 冬合宿 2010 → 模擬地区 2010 → 夏合宿 2010

## 名称の違い

| スプレッドシート | 現行のコード（`JAG_TRANSLATIONS`） | 対象                                              |
| ---------------- | ---------------------------------- | ------------------------------------------------- |
| 春コンテスト     | 春合宿                             | `JAGSpring2012`〜`2015`                           |
| 冬コンテスト     | 冬合宿                             | `JAGWinter2009` / `JAGWinter2011`（日の無いもの） |
| 模擬アジア地区   | 模擬地区                           | `JAGRegional*`                                    |

テーブル名は現行のコードに合わせる。出典欄と同じ名称になり、違うのは括弧書きの有無だけになる。

---

# 2. 実測データ

## 対象規模

`prisma/tasks.ts` の集計（2026-10-21）と、本番だけにある JAG 模擬地区。

| 種別         | コンテスト | 問題数 | 所在        | PR  |
| ------------ | ---------- | ------ | ----------- | --- |
| ICPCPrelim   | 29         | 197    | seed と本番 | PR1 |
| ICPCRegional | 27         | 266    | seed と本番 | PR1 |
| JAGPrelim    | 23         | 169    | seed と本番 | PR1 |
| JAGSummer    | 36         | 338    | seed と本番 | PR2 |
| JAGWinter    | 10         | 87     | seed と本番 | PR2 |
| JAGSpring    | 4          | 42     | seed と本番 | PR2 |
| JAGRegional  | 16         | 158    | 本番のみ    | PR2 |

PR1 / PR2 の合計は 1,257 問 / 145 コンテスト。PR1 の前は、seed の 1,099 問すべてで `problem_index` == `task_id`（AOJ 問題 ID）だった。

## 本番の件数（2026-10-21）

本番で `contest_type` ごとに集計した結果。seed と一致するのは `AOJ_ICPC` だけだった。

| contest_type     | 本番（コンテスト / 問題） | seed（コンテスト / 問題） |
| ---------------- | ------------------------- | ------------------------- |
| `AOJ_ICPC`       | 56 / 463                  | 56 / 463                  |
| `AOJ_JAG`        | 89 / 794                  | 73 / 636                  |
| `AOJ_UNIVERSITY` | 27 / 30                   | 27 / 29                   |
| `AOJ_COURSES`    | 8 / 247                   | 0 / 0                     |
| `AOJ_PCK`        | 1 / 12                    | 0 / 0                     |

`AOJ_JAG` の差（16 コンテスト / 158 問）はすべて JAG 模擬地区（管理画面から取り込める。seed には 0 件）。接頭辞ごとに分けると、ほかはすべて本番と seed で一致した。

AtCoder 側（`AOJ_*` 以外）で title が `${task_table_index}. ` で始まらない問題は、本番でも `abs` の practice_1 の 1 件だけだった。

## PR2 の範囲の本番と staging（2026-10-24）

本番と staging で範囲の状態を集計した結果（SQL は `git show 7c68cef6:docs/dev-notes/2026-09-09/task-title-index-change-impact/plan-pr2.md` の「確かめ方」）。

| 範囲     | 本番     | staging                         | index が問題 ID のまま | title が問題 ID 付き |
| -------- | -------- | ------------------------------- | ---------------------- | -------------------- |
| Regional | 16 / 158 | 16 / 158（取り込み前は 2 / 16） | 全行                   | 0 行                 |
| Spring   | 4 / 42   | 4 / 42                          | 全行                   | 全行                 |
| Summer   | 36 / 338 | 36 / 338                        | 全行                   | 全行                 |
| Winter   | 10 / 87  | 10 / 87                         | 全行                   | 全行                 |

- staging には当初、模擬地区が 2 コンテスト / 16 問しか無かった。PR1.5（#4219）の後に staging で取り込み、本番と同じ 16 / 158 にそろえた（2026-10-24）
- 本番の模擬地区 158 問（本番から取り出したもの）は、AOJ の一覧のスクリーンショットと問題名・問題 ID がすべて一致した。grade が付いているのは 6 問
- 本番の 3355 の title の末尾にタブがある（`Most distant point from the stations\t`）。前後に空白のある title はほかにもある（下記）

## 前後に空白のある title

本番で `title <> btrim(title, E' \t\r\n')` の行を数えると 46 件あった（2026-10-24）。

| 範囲                                    | 件数 | 例                                                       |
| --------------------------------------- | ---- | -------------------------------------------------------- |
| JAG 模擬国内（3202 / 3250 / 3299）      | 3    | `"Chains of Explosions "`（末尾の空白）                  |
| JAG 模擬地区（3355）                    | 1    | `"Most distant point from the stations\t"`（末尾のタブ） |
| AtCoder（ABC / AGC / ARC / JOI / TTPC） | 42   | `"A. Weather Prediction "`（末尾の空白）                 |

- **出どころは上流のデータ**。AOJ の API が返す名前そのものに空白がある（2026-05 に記録した fixture の `jag_prelim` / `jag_regional` にも同じ空白がある）。AtCoder Problems も同様
- **再発はしない**。取り込みが title を `trim()` するようになった（2026-05-18、`0e1ec4e7`）。46 件はそれより前に入った行。seed の値は trim 済み
- **実害は無い**。HTML の表示では末尾の空白が潰れる。title を比べるコードは `removeTaskIndexFromTitle` の `startsWith`（先頭の `A. ` を見るだけ）しか無く、完全一致で比べる箇所は無い。検索は部分一致なので、空白で終わる検索語でなければ影響しない
- **起こりうる害**: 将来 title の完全一致で照合する処理（#4018 のコンテスト情報の同期など）を書くと、この 46 件だけが食い違う。CSV の `id` は `sha256(contest_id + title)` だが、既存行の `id` は再計算されないので関係ない

PR2 では直さず、残タスクとした（[plan.md](./plan.md#スコープ外)）。

## 欠落は機械的に検出できない

AOJ 問題 ID の連番性を調べると、seed の 129 コンテスト中 128 が連番。**だが欠落が無い証拠にならない。** AOJ に登録されていない問題なら ID も無いため、残った問題の ID は連番のままになる。AOJ に問題はあるのにコンテスト一覧（取り込み元）から外れている場合も同じである。ICPC 国内予選 2002 の E（Enclosing Circles）は AOJ に問題 1123 として存在するが一覧に無く、取り込まれていない。2002 年の A〜D は 1119〜1122 で連番のままであり、1123 の次の 1124 は 2003 年の A である。

連番でない 1 コンテストは `JAGSummer2024-day3`（3643 が無い）で、スプレッドシートの G（Interactive String Guessing）に当たる。スプレッドシートでは「AOJ 未収録」だが、AOJ に 3643 はあり、コンテスト一覧から外れているだけだった。

データから欠落を示唆するのは**問題数の異常**の方だが、それも決め手にならない:

| コンテスト                 | 問題数 | 同種の中央値 | スプレッドシートとの照合                                      |
| -------------------------- | ------ | ------------ | ------------------------------------------------------------- |
| `JAGSummer2006-day1`       | 1      | 10           | 公式は 3 問。A・C が AOJ 未収録                               |
| `JAGWinter2006-day2`       | 2      | 10           | 公式は 9 問。7 問が AOJ 未収録                                |
| `JAGWinter2006-day3`       | 4      | 10           | 公式は 10 問。6 問が AOJ 未収録                               |
| `JAGSummer2007-day1`       | 5      | 10           | 公式も 5 問（欠落なし）                                       |
| `ICPCPrelim1998/2000/2002` | 各 4   | 8            | 1998 / 2000 は公式も 4 問。2002 は E が一覧に無い（AOJ 1123） |

## `title` の持ち方が AOJ 内で割れている

| 範囲                                       | 件数  | `title` の形                    | 例                                |
| ------------------------------------------ | ----- | ------------------------------- | --------------------------------- |
| ICPC国内 / アジア / JAG模擬国内（**PR1**） | 632   | 素                              | `'Peculiar Protocol'`             |
| JAG 合宿系（**PR2**）                      | 467   | **数値ID のプレフィックス付き** | `'2389. Asynchronous Exceptions'` |
| JAG 模擬地区（**PR2**、本番のみ）          | 158   | 素                              | `'Restriction Enzyme'`            |
| AtCoder 等（対象外）                       | 1,366 | index のプレフィックス付き      | `'EX8. たくさんのA足すB問題'`     |

**プレフィックスは合宿系の 467 件すべてで `task_id` と完全に一致していた（不一致 0 件）。** したがって除去も復元も機械的に安全に行える。

模擬地区は管理画面の取り込みで本番に入っており、取り込みは導入時（2024-10、`7dcc5e4c`）から `problem.name` をそのまま title にしている。範囲の集計でもプレフィックスは 0 行だった（本番・staging）。

退行の機序（title を直さずに index だけ記号にした場合）:

```
現在:   index='2389', title='2389. Asynchronous Exceptions'
        → 先頭の '2389. ' を除去 → 'Asynchronous Exceptions'   正常

PR2 後: index='A',    title='2389. Asynchronous Exceptions'
        → 先頭の 'A. ' を除去 → 空振り
        → '2389. Asynchronous Exceptions' が露出           退行
```

## 復元可能性の実測

| 対象                     | 件数  | 復元                                                                                     |
| ------------------------ | ----- | ---------------------------------------------------------------------------------------- |
| AOJ ICPC/JAG（更新対象） | 1,099 | **無条件に可能**。`task_table_index == task_id` が例外ゼロで成立（seed、PR1 の前）       |
| その他（AtCoder 等）     | 1,367 | **条件付き**。84.2%（1,151 件）は `task_id` のサフィックスから導出できるが、216 件は例外 |

本番にある模擬地区 158 件も、範囲の集計で全行 `task_table_index == task_id` だった（2026-10-24）。

導出できない 216 件の内訳: `abc` 41（`abc318_h` に対し index は `Ex`）、`typical` 32、 `APG` 27（`APG4bPython_co` に対し index は `EX8`）、`arc` 27、`tdpc` 20、 `math-and-algorithm` 15、ほか（`task_id` にサフィックスが無い AOJ 大学系 29 件を含む）。

`abc*_h → Ex` は規則として書けるため理論上は 90% 超まで導出できるが、 **事故対応の手段としては成立しない**。理由は 2 つ。

1. 「84% は規則で戻せるが 16% は個別対応」という状態は、復旧手順として使えない
2. `task_table_index` を上書きした後では、**どの行が元から `A` だったのかを区別できない**

## 既存 DB は自動更新されない

- seed: `prisma/seed.ts` で `findUnique(task_id)` → 既存なら **skip**
- 取り込み: `src/lib/services/tasks.ts` の `createTask` で `isExistsTask(task_id)` → 既存なら **silent return**。`classifyContest` が `null` を返す contest_id も黙って捨てる
- `updateTask` は `grade` しか触らない

## 一意性は壊れない

`prisma/schema.prisma` の Task で unique なのは 2 つのみ。

| フィールド          | 由来                           |
| ------------------- | ------------------------------ |
| `id` (@id @unique)  | `sha256(contest_id + task.id)` |
| `task_id` (@unique) | `task.id` をそのまま           |

どちらも入力は contest_id と AOJ 問題 ID のみ。`problem_index` は混ざらない。FK も全て `task_id` 参照（`TaskTag` / `TaskAnswer` / `WorkBookTask` / `VoteGrade` / `VotedGradeCounter` / `VotedGradeStatistics`）。ハッシュの `id` を FK にしている箇所は無い。

**性質の変化**: `task_table_index` は「全 DB でユニーク」から**「コンテスト内でのみユニーク」**になる。unique 制約は無く、コンテスト横断で index をキーにしている箇所も無い（`sortAojHeaderIds` は単一コンテスト内で閉じる）ため問題ない。

---

# 3. SQL の解説

## SQL の読み方

**大きなクエリは内側から読み、各段階で「これは何の表を作るのか」を問う。** `WITH` 形式ならその順序がそのまま上から下になる。

`letters` が作るのは **`task_id` と `letter` の 2 列だけの一時的な表**。

| task_id | letter                                    |
| ------- | ----------------------------------------- |
| 1100    | A                                         |
| 1101    | B                                         |
| 1102    | C                                         |
| 1103    | D                                         |
| 1672    | **A** ← コンテストが変わり番号が 1 に戻る |
| 1673    | B                                         |

これが分かれば `UPDATE` 側は単純で、「`task` と `letters` を `task_id` で突き合わせ、一致した行に `letter` を書き込む」だけ。

| 句                               | 意味                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| `PARTITION BY contest_id`        | **コンテストごとにグループ分けし、番号を 1 から振り直す**                  |
| `ORDER BY task_id::int`          | 各グループ内で問題 ID の数値昇順に並べる                                   |
| `row_number()`                   | 並べた順に 1, 2, 3… を返す（**1 始まり**、`bigint` なので `::int` が要る） |
| `chr(64 + n)`                    | 文字コード変換。`chr(65)` = `A` なので `n=1 → A`、`n=2 → B`                |
| `contest_id ~ '^JAG(Summer\|…)'` | `AOJ_JAG` には PR1 で済んだ模擬国内も含まれるため、接頭辞で範囲を絞る      |

`PARTITION BY` が無いと対象の全問題に通し番号が振られ、2 つ目以降のコンテストが `Z` を超えて壊れる。

> **SQL は書かれた順に評価されない。** 論理的な処理順序は `FROM`（サブクエリと別名の確定）→ `WHERE` → `SELECT` / `SET`。このため別名を定義より前に参照しているように見えても正しい（`SELECT u.name FROM users AS u` と同じ理屈）。

実データでの確認: `ICPCPrelim2024`（9 問）は `1672 → A`, `1673 → B`, … `1680 → I`。 `ICPCPrelim1998` は 4 問なので `A`〜`D`。

## 計算量 — O(N²) にはならない

- `WHERE` の条件は **join ではなくフィルタ**。1 行あたり O(1) で評価され、行数を減らす方向にしか働かない
- join 側も、`task_id` に UNIQUE インデックスがある（`prisma/migrations/0_init/migration.sql` の `task_task_id_key`）ため、Nested Loop + Index Scan なら O(M log N)、Hash Join なら O(N + M)。二乗にはならない
- 支配項はウィンドウ関数のソート O(K log K)（K = PR2 で 625）。実行時間はミリ秒台

**推測ではなく実行計画で確認すること。** PR1 では `task` の Seq Scan 2 回 + Hash Join だった（`contest_type` に索引が無いため想定どおり）。

---

# 4. 検討の経緯（採らなかった案）

**以下はいずれも計画で却下・保留と決定済み。** 判断の理由を残すための記録。PR3 の採らなかった案は [plan.md](./plan.md#採らなかった案) にまとめた。

## `title` に記号を入れる案を採らない理由

`title` を `'A. Peculiar Protocol'` に揃えれば AtCoder 側 1,366 件と形式が揃うが、採らない。

- **同じ情報を 2 列に持つとドリフトする。** 欠落判断の誤りを修正するとき（修正は起こる前提）、両方を更新しないと不整合になる
- **G2 に逆行する。** title にプレフィックスを埋め込む設計は、表示側に文字列の除去を要求する。除去したかった種類の変換そのもの
- **除去は脆い。** 合宿系の title の退行がその実例

「入れない」を選んでも AtCoder と AOJ で title の意味は揃わないが、 **どちらを選んでも不整合は残る**（AtCoder 側を触るのはスコープ外）。AOJ を「素の title」に寄せ、セルで `A. ` を付ける方が、PR1 の設計（`buildTitleWithTaskIndex`）と整合する。

## 管理画面案を保留にした理由

「管理画面から SvelteKit の action で更新する」案には実質的な利点がある。

- **再実行できる。** マイグレーションは適用後 immutable なので、欠落判断の誤りが後から見つかると新しいマイグレーションを積むことになる
- 欠落判断は人間が行う以上、**修正は起こる前提**であるべき

一方で、この案は**問題記号の入力元が定義できないと成立しない**。手入力なら 1,000 回超の手作業に戻り、難所 1 で否定したものに戻る。コード上の対応表を読むなら、実質「対応表を DB に同期するボタン」になる。

さらに、素直に実装すると **N+1 になりやすい**。既存の `createTask` がまさにその形で（`src/routes/(admin)/tasks/+page.server.ts` の `Promise.all` + check-then-act）、トランザクションが無いため途中で失敗すると部分適用が残る。採るなら `updateMany` か `$executeRaw` で一括処理する設計が前提になる。

**再検討の結果（2026-10-24）**: PR2 の照合で補正が要るのは 8 コンテストと分かり、マイグレーション 1 本で足りると判断した。補正の誤りが繰り返し見つかるようなら再検討する。

---

# 5. Task テーブルへの書き込み経路の全数調査

リポジトリ全体（`src` / `prisma` / `e2e`）を確認した結果。移行 UPDATE の安全性の根拠。

## 書き込み経路は 3 つだけ、削除経路はゼロ

| 経路                 | 実装                                        | 書き込むフィールド                                                              |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| 管理画面の取り込み   | `src/lib/services/tasks.ts` の `createTask` | `id` / `task_id` / `contest_id` / `contest_type` / `task_table_index` / `title` |
| 管理画面の難易度更新 | `src/lib/services/tasks.ts` の `updateTask` | `grade` のみ                                                                    |
| seed                 | `prisma/seed.ts`                            | 上記 + `grade`（`id` は未指定）                                                 |

- `updateTask` の呼び出し元は 2 つ（`src/routes/(admin)/tasks/[task_id]/+page.server.ts`、 `src/routes/(admin)/tasks/grade/+page.server.ts`）。いずれも `grade` のみ
- `task.delete` / `deleteMany` / `upsert` / `createMany` は**リポジトリ全体に存在しない**
- 生 SQL（`$executeRaw` / `$queryRaw`）による Task への書き込みもなし
- 他モデルからのネストした `task: { create: ... }` もなし

⇒ **一意フィールドを UPDATE するコードは構造的に存在しない。** リポジトリの外では、staging / production に Supabase の CSV で行を入れることがある（既存の合宿系、PR2.1）。

## `id` の採番規則が経路ごとに違う

- 取り込み: `sha256(contest_id + task.id)`（16 進）— 決定的
- Supabase の CSV（既存の合宿系、PR2.1）: `sha256(contest_id + title)`（16 進）。メンテナが別プロジェクトのスクリプトで作る（2026-10-24 にメンテナが説明）
- seed: `id` 未指定のため fabbrica の自動採番で連番文字列

一意性は破れないが「`Task.id` は `task_id` から決まるハッシュ」という前提は**取り込み以外では成立しない**。ただし **`Task.id` を再計算して引く箇所はゼロ**で、全ルックアップは `task_id` 経由。現状の実害はないが、将来 `Task.id` に決定性を期待するコードを書くと静かに壊れる。

## check-then-act の競合

`createTask` は `isExistsTask`（`findMany`）→ `create` の check-then-act で、 `src/routes/(admin)/tasks/+page.server.ts` がこれを `Promise.all` で並列実行している。

同一 `task_id` が 1 回の取り込み JSON に 2 件含まれると、両方がチェックを通過して 2 件目が P2002 で落ちる。`Promise.all` 全体が reject して 500 を返すが、 **トランザクションが無いため先に成功した分はロールバックされない**（部分適用）。

`prisma/seed.ts` も同じ形で PQueue concurrency 3 で並列実行しており同種のレースがある。

一意性は DB 制約が守るので壊れはしないが、エラー時の挙動が中途半端。 `docs/guides/agent-rules/prisma-db.md` の「Idempotent Writes」に該当し、本来は `createMany({ skipDuplicates: true })` か `upsert` が解。**本件とは独立の既存課題**（O5）。

## 他の sha256 決定的 ID は Task から独立

`src/lib/services/answers.ts` と `src/features/votes/services/vote_grade.ts` はいずれも入力が `Task.id` ではなく `task_id`。`vote_grade.ts` は全て `upsert` で `where` に複合ユニークを使うため id 衝突の経路もない。

## 削除経路がないことの帰結

Task を削除するコードが存在しないため、関連テーブルが孤児 FK を持つ事故は現状起こらない。将来 Task 削除機能を追加する場合（PR3 のダミーの扱いなど）、6 つの関連のうち `TaskTag` / `TaskAnswer` / `WorkBookTask` は `onDelete` 未指定なので要注意（投票系 3 つは `Cascade`）。

---

# 6. 調査中の誤りと訂正（自戒）

1. **対象を 632 問と集計した** — Provider が存在する 3 種のみを数え、seed にデータがある合宿系 467 問を落としていた。正しくは 1,099 問。 _教訓: 「実装がある範囲」と「データがある範囲」は一致しない。集計条件は後者で取る。_

2. **「問題 ID が連番だから欠落なし、機械生成できる」と結論した** — 欠落問題は ID も採番されないため、連番性は欠落の有無について何も語らない。検証が問いに答えていなかった。 _教訓: 「観測できる範囲に異常が無い」ことを「異常が無い」と読み替えない。欠落は定義上、観測できない側にある。_

3. **抽出スクリプトのバグを、データの欠落として提示しかけた** — `prisma/tasks.ts` からタスクを抜き出す正規表現がシングルクォート前提だったため、 `name: "A Bug That's Not a Pill Bug"`（アポストロフィを含むためダブルクォート）を取りこぼし、`ICPCPrelim2024` が 8 問に見えた。実際は 9 問で、欠番は存在しなかった。 _教訓: 抽出スクリプトを書いたら、まず総数が既知の値と一致するかを確認する。1 と同じ「観測範囲を実際の範囲と取り違える」失敗であり、本件では欠落の誤検出に直結する。_

4. **移行 SQL を seed 由来の対応表から生成する案を出した** — production のタスクは管理画面の取り込み経由で入っており seed と一致する保証がないため、production にしか無い行が取り残される。しかも `UPDATE` は該当行が無くてもエラーにならない。 _教訓: 2 と同じ型。「seed で見えている範囲」を「production の実態」と取り違えた。_

5. **AtCoder 系の復元を「不可能」と断定した** — 実際は `task_id` のサフィックスから 83.4% が導出できる。ただし事故対応としては成立しないという結論自体は変わらない。 _教訓: 断定する前に測る。結論が同じでも、根拠が誤っていると次の判断で誤用される。_

6. **PR を分けた後も、移行 SQL の範囲を 1,099 件のままにしていた**（2026-10-21 に発見）— `contest_type IN ('AOJ_ICPC', 'AOJ_JAG')` は合宿系も含むため、PR1 で 467 件を余計に更新するところだった。 _教訓: 範囲を分割したら、範囲を表す条件をすべて追従させる。分類（`contest_type`）と分割の単位が一致しているとは限らない。_

7. **欠落した問題を「AOJ に存在しない（ID も無い）」と決めつけていた**（2026-10-21 に発見）— ICPC 国内予選 2002 の E は AOJ に問題 1123 として存在し、コンテスト一覧（取り込み元）から外れているだけだった。PR3 でダミーを作るという前提は、この問題には当てはまらない。 _教訓: 「一覧に無い」と「存在しない」は別。データの取得元の範囲を、対象が実在する範囲と取り違えない（1・4 と同じ型）。_

---

# 7. PR3: 欠けている問題

[plan.md の PR3 の節](./plan.md#pr3-欠落問題の補完) の根拠。確認はすべて 2026-10-28 時点（メンテナのスクリーンショットと AOJ の API、リポジトリのコード）。採らなかった案は [plan.md](./plan.md#採らなかった案) に 1 か所にまとめた。

## 調べ方と結果

公式の問題なのに seed に無いものを、AOJ の問題一覧 API で問題名から探した（部分一致）。対象は、スプレッドシートで「AOJ 未収録」とある 22 問、スプレッドシートのリンク先の title が AOJ で見つからなかった 3 問（JAG 模擬地区 2013 の A〜C）、PR1 で見つかった 1 問（ICPC 国内予選 2002 の E）。

結果は 26 問で、AOJ にあるものが 5 問、AOJ に無いものが 21 問。

- スプレッドシートの「AOJ 未収録」は、AOJ に無いことの保証にならない。書いた後で AOJ に追加された問題がある（3643）
- AOJ のコンテスト一覧（管理画面の取り込み元）に無いことも、AOJ に無いことの保証にならない。問題一覧 API には載っている問題がある（下の 5 問）
- AOJ は過去の問題を後から追加するので、この結果は確認した時点のもの

## AOJ にある 5 問

どれも AOJ のコンテスト一覧には無いが、問題一覧 API に同じ問題名で載っている。

| 問題                                                                                    | AOJ の問題 ID | メモ                                                                                                                               |
| --------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ICPC 国内予選 2002 の E（Enclosing Circles）                                            | 1123          | A〜D は 1119〜1122                                                                                                                 |
| JAG 夏合宿 2024 Day3 の G（Interactive String Guessing）                                | 3643          | 2026-10-10 に AOJ に追加された。`available` が 4（ほかの問題は 1）で、提出が 0。公開前とみられるが、`available` の値の意味は未確認 |
| JAG 模擬地区 2013 の A〜C（Broken Audio Signal / Restore Calculation / SIRO Challenge） | 2565〜2567    | D〜J（2568〜2574）と連番                                                                                                           |

## AOJ に無い 21 問

表記ゆれのありそうな語（`Wireing`、`Shortest`、`Geometry`）も部分一致で探したが、見つからなかった。

| コンテスト           | 記号と問題名                                                                                                         | jag-icpc.org の年度ページ                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| JAG 夏合宿 2006 Day1 | A Monkey Business、C Sort that Queue                                                                                 | [2006/Practice/夏合宿][jag-2006-summer]         |
| JAG 夏合宿 2006 Day3 | A Rolling Cubes                                                                                                      | [2006/Practice/夏合宿][jag-2006-summer]         |
| JAG 冬合宿 2006 Day2 | A Cells、B Japan、C Maximum、E Payment System、G Roof、H Seminar Room、I String Compression                          | [2006/Practice/冬合宿][jag-2006-winter]         |
| JAG 冬合宿 2006 Day3 | B Widget Factory、C Hills、E Safe Packing、F The "Shortest" Pair of Paths、I Counting Triangles、J Wireing Assistant | [2006/Practice/冬合宿][jag-2006-winter]         |
| JAG 冬合宿 2007 Day3 | E Networking Company                                                                                                 | [2007/Practice/冬合宿][jag-2007-winter]         |
| JAG 模擬地区 2005    | C Geometry?! Why Not??、F University Rankings、H Tiling Polygons                                                     | [2005/Practice/模擬地区予選][jag-2005-regional] |
| JAG 模擬地区 2008    | J Colony Maintenance                                                                                                 | [2008/Practice/模擬地区予選][jag-2008-regional] |

[jag-2006-summer]: https://jag-icpc.org/?2006%2FPractice%2F%E5%A4%8F%E5%90%88%E5%AE%BF
[jag-2006-winter]: https://jag-icpc.org/?2006%2FPractice%2F%E5%86%AC%E5%90%88%E5%AE%BF
[jag-2007-winter]: https://jag-icpc.org/?2007%2FPractice%2F%E5%86%AC%E5%90%88%E5%AE%BF
[jag-2005-regional]: https://jag-icpc.org/?2005%2FPractice%2F%E6%A8%A1%E6%93%AC%E5%9C%B0%E5%8C%BA%E4%BA%88%E9%81%B8
[jag-2008-regional]: https://jag-icpc.org/?2008%2FPractice%2F%E6%A8%A1%E6%93%AC%E5%9C%B0%E5%8C%BA%E4%BA%88%E9%81%B8

- 合宿系 17 問、模擬地区 4 問。7 コンテストはすべて 2005〜2008 年で、冬合宿 2006 の Day2 / Day3 に 13 問が集中する
- 問題名は jag-icpc.org の表記とすべて一致した。19 問は年度ページの問題一覧で、2 問（冬合宿 2007 Day3 の E、模擬地区 2008 の J）は問題文の PDF の表紙で確かめた。seed の title にはこの表記を使う
- `Wireing Assistant` は原文どおりの綴り。`The "Shortest" Pair of Paths` の引用符は半角

## jag-icpc.org

JAG のサイトで、スプレッドシートの情報源の一つ。URL の形式（`?plugin=attach&refer=...&openfile=...`）から PukiWiki とみられる。

- 構成は `年度/Practice/大会区分/問題文とデータセット/`（その下に問題文の PDF と注釈）。`問題文とデータセット` と同じ階層に、講評などのページもある
- 21 問の 7 コンテストは、5 つの年度ページにまとまる。どのページにも問題文へのリンクがある
- 添付ファイル名は揃っていない（2006 年夏合宿は `day1.pdf` など日ごと、2008 年模擬地区予選は `problems.pdf`）
- 年度ページの問題一覧は手書きで、誤記が混じる（例: PDF の表紙と AOJ が `Flame of Nucleus` の問題を、一覧は `Frame of Nucleus` と書いている）。表記が食い違ったら、問題文の PDF の表紙で判断する

## 記号がずれないか

PR3 で記号（`task_table_index`）がずれる心配は、事実上ない。

- **今ある記号は変わらない**。各行に保存された値で、PR2 で補正済み（本番・staging とも反映済み）。PR3 は行を足すだけで、書き換えない。画面も保存された値を使い、問題 ID から計算し直さない。PR1 / PR2 のマイグレーションが再び流れることもない（[影響範囲](#影響範囲)）
- **足す 26 行の記号は、2 つ以上の根拠がそろう**。ダミーの 21 問は、スプレッドシートの位置と jag-icpc.org（年度ページの問題一覧で 5 コンテスト、問題文の PDF の表紙で 2 コンテスト）。AOJ にある 5 問は、スプレッドシートの位置と AOJ の ID の並び（1119〜1123 の E、3642 と 3644 の間の G、2565〜2574 の A〜C）
- **空いている位置にちょうど収まる**（下表）。今ある記号も、年度ページの問題一覧と一致した（夏合宿 2006 Day1 / Day3、冬合宿 2006 Day2 / Day3、模擬地区 2005）
- **seed はテストが固定する**。`seed_problem_letters.test.ts` が記号を 1 問ずつ確かめる（[plan.md の PR3 の節](./plan.md#pr3-欠落問題の補完)）

残るのは人の作業の誤りで、どちらも確かめる手順がある:

| リスク                                 | 起きる条件                                                                      | 守り                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 本番の CSV の打ち間違い                | メンテナが作る CSV の記号を間違える                                             | 投入後の SQL で、記号の重なりと 10 コンテストの記号を確かめる（[plan.md](./plan.md#staging--本番への投入メンテナ)）。見つかっても UPDATE 1 本で直る |
| 管理画面の取り込みで、ずれた記号が付く | 将来 AOJ が欠けた問題を足し、それを管理画面から取り込む（PR3 の前からある危険） | 取り込まず、ダミーの `task_id` を UPDATE する（[手順](#aoj-に後から追加されたとき)）                                                                |

ダミーで足す記号:

| コンテスト         | 今ある記号       | ダミーで足す記号    | 合わせると |
| ------------------ | ---------------- | ------------------- | ---------- |
| JAGSummer2006-day1 | B                | A, C                | A〜C       |
| JAGSummer2006-day3 | B〜G             | A                   | A〜G       |
| JAGWinter2006-day2 | D, F             | A, B, C, E, G, H, I | A〜I       |
| JAGWinter2006-day3 | A, D, G, H       | B, C, E, F, I, J    | A〜J       |
| JAGWinter2007-day3 | E 以外の A〜J    | E                   | A〜J       |
| JAGRegional2005    | A, B, D, E, G, I | C, F, H             | A〜I       |
| JAGRegional2008    | A〜I             | J                   | A〜J       |

AOJ にある 5 問を足すと、ICPC 国内予選 2002 は A〜E、模擬地区 2013 は A〜J、夏合宿 2024 Day3 は A〜K になる。

## ダミーの `task_id`

`NoJudge-{contest_id}_{記号の小文字}`（例: `NoJudge-JAGWinter2006-day2_a`）。`task_table_index` は大文字（`A`）のまま。

- 接頭辞が、コードが分岐に使う性質（採点の仕組みが無い）をそのまま表す。ID だけでダミーと分かり、判定は `startsWith('NoJudge-')` で足りる
- 数字でも小文字始まりでもないので、AOJ（数字）とも AtCoder（`abc300_a` など）とも構造上ぶつからない
- 記号を小文字にするのは、AtCoder の形式（`abc300_a`、`jag2018summer_day2_a`）に合わせるため
- `contest_id` と記号の組が一意なので、ID も一意になる
- 英数字・`-`・`_` だけなので、`/problems/{task_id}` にそのまま入る

## リンク先

jag-icpc.org の大会区分のページ（例: `2008/Practice/模擬地区予選`）にする。

- 提出先が無いので、自分で採点するには問題文だけでなく、ジャッジデータと講評も要る。大会区分のページからは、どれにも下りられる
- 深いページに着地したユーザーは、上の階層にほぼ戻らない（PDF には戻る手段すら無い）。入口のページが、ユーザーの見つけられる範囲を決める
- 階層が浅いほど、下位ページ名や添付ファイル名の変更でリンクが切れる箇所も、URL 中の日本語も減る
- リンク先は map の値にすぎないので、後から深くするのは定数の差し替えで済む

## リンクの出し方

`getTaskUrl()`（`src/lib/utils/task.ts`）の URL ジェネレータの並びに `NoJudgeGenerator` を足す。問題へのリンクはすべて `getTaskUrl()` を通るので、1 か所で全画面に効く。

```typescript
class NoJudgeGenerator implements UrlGenerator {
  canHandle(_contestId: string, taskId: string): boolean {
    return isNoJudgeTask(taskId);
  }

  generateUrl(_contestId: string, taskId: string): string {
    return NO_JUDGE_TASK_URLS.get(taskId) ?? '';
  }
}

// NoJudge must precede AOJ: dummies share JAG contest_ids.
const urlGenerators: UrlGenerators = [
  new NoJudgeGenerator(),
  new AojGenerator(),
  new AtCoderGenerator(),
];
```

- 既存の設計（ジェネレータを並べ、最初に `canHandle` が真になったものを使う）に沿う。`getTaskUrl()` の本体は変わらず、`task.ts` の TODO（Codeforces・yukicoder・BOJ）も同じ形で足せる
- `UrlGenerator.canHandle`（`src/lib/types/url.ts`）に `taskId` を足す。使うのは `task.ts` だけで、既存の 2 つの実装は引数が少ないままでも型を満たす
- **並び順に意味がある**。ダミーは JAG の `contest_id` を使うので、`NoJudgeGenerator` を `AojGenerator` より前に置かないと、AOJ 側が先に受け取る。コメントとテストで固定する
- 判定は出典のラベルと共通の `isNoJudgeTask()`。ダミーかどうかの基準が 1 つになる
- URL は問題ごとではなくページごとに決まる（21 問に対して 5 ページ）。map は `{ url, taskIds }` をページごとに並べて組み立て、各 URL を 1 回だけ書く
- URL はブラウザで開けたものを、パーセントエンコードのまま貼る（ソースは ASCII だけになる）。そのまま返すことを単体テストで固定し、二重エンコードや書き換えを防ぐ
- ダミーは DB、map はコードにあるので、漏れがあり得る。漏れたら空文字を返し、AOJ のジェネレータには回らない（本物らしく見えて開けない AOJ のリンクにはならない）。seed のダミーが全件 map にあること、map のキーがすべて seed にあることをテストで確かめる

## 出典のラベル

ダミーの出典は `（AOJ）` ではなく `（No Judge）` にする（例: `JAG 冬合宿 2006 Day2 - A（No Judge）`）。

- 括弧の中は「どこで解けるか（どこで採点されるか）」を表す。採点の無い問題に `（AOJ）` と出すのは誤り
- `task_id` の接頭辞 `NoJudge-` と言葉がそろう
- 問題一覧や問題集では、アイコンを足さずに文字だけで、採点が無いことを伝えられる
- `addContestNameToTaskIndex()` は `contest_id` と記号しか受け取らない。ダミーは本物の AOJ の問題と同じ `contest_id` を使うので見分けられず、`taskId` を足す
- `taskId` は省略できない引数にする。型チェックが呼び出し元 6 か所の漏れをすべて見つける。どの呼び出し元も `task_id` を持っている

## アイコンもツールチップも入れない理由

採点が無いことは、出典のラベルの `（No Judge）` で文字として伝える。コンテスト別の表のセルには出典のラベルが出ないので、表の見た目は変わらない。

- 表のセルは [難易度バッジ] [問題名（長いと省略）] [状態のメニュー] で、AOJ の表は 1 行に最大 6 列。問題名はもう省略されていて、アイコンを足すとさらに削られる。外部リンクのアイコンも、表では消している（`ExternalLinkWrapper` の `iconSize={0}`）
- ホバーで出る jag-icpc.org の URL だけでは気づきにくい。スマホにはホバーが無く、画面の隅の URL を見る人は少なく、ドメインが違っても提出先が無いことまでは読み取りにくい
- それでも、引っかかったときの損は小さい。リンクは新しいタブで開き、開けば提出フォームの無い Wiki だと分かる。解答状況はユーザーが自分で設定するので、ジャッジデータで確かめて AC にできる

## 影響範囲

変更が要る機能は、問題へのリンク（`getTaskUrl()`）と出典のラベル（`addContestNameToTaskIndex()`）の 2 つ。ほかは Task のレコードを足せば動く。

| 機能・処理                    | 何で決まるか                                                                                                                                                                                                                                             | ダミーへの影響                                                                                                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| コンテスト別の表              | `contest_id` で絞り、`task_table_index` の順に列を並べて置く（`sortAojHeaderIds`、`generateTable`）。`task_id` は使わない                                                                                                                                | 変更なし。7 コンテストとも表の設定（`aoj_jag_regional_entries.ts`）がある                                                                                                                                                               |
| セルの表示名                  | `task_table_index` を付けて「A. Monkey Business」と出す。title の先頭の「記号. 」を外してから付けるが、21 問の title はどれも「記号. 」で始まらない                                                                                                      | 変更なし                                                                                                                                                                                                                                |
| 問題へのリンク                | すべて `getTaskUrl()` を通る（呼び出し元 9 ファイル）                                                                                                                                                                                                    | `NoJudgeGenerator` を足す                                                                                                                                                                                                               |
| 出典のラベル                  | `addContestNameToTaskIndex(contestId, taskTableIndex)` が `contest_id` だけを見て、AOJ 系なら `（AOJ）` を付ける。呼び出し元は 6 ファイル（各 1 か所）                                                                                                   | `taskId` を足し、ダミーは `（No Judge）` にする                                                                                                                                                                                         |
| 投票・タグ・問題集・回答      | `task_id` への外部キー（6 テーブル）                                                                                                                                                                                                                     | 変更なし。Task があれば動く                                                                                                                                                                                                             |
| 問題の詳細ページ              | `/problems/{task_id}`                                                                                                                                                                                                                                    | 変更なし                                                                                                                                                                                                                                |
| 一覧の並び                    | 画面では `compareByContestIdAndTaskId()` がコンテストの優先度 → `contest_id` → 記号の順に並べ直す。DB から取る順（`task_id` の降順）は効かない                                                                                                           | 変更なし                                                                                                                                                                                                                                |
| 入力チェック                  | zod は `task_id` が空でないことだけを見る                                                                                                                                                                                                                | 変更なし                                                                                                                                                                                                                                |
| 問題 ID を数値として読む箇所  | コードでは `assignProblemLetters()` の `Number()` だけ。管理画面の AOJ 取り込みと、`seed_problem_letters.test.ts` の基本ルールの検査で使う。ほかに PR1 / PR2 のマイグレーション（`20261024033928`、`20261025000719`）が `ORDER BY task_id::int` で並べる | 取り込みはダミーを通らない。テストでは、ダミーのあるコンテストを `LETTERS_OF_SHIFTED_CONTESTS` に入れて検査から外す。マイグレーションは本番・staging とも適用済みで、新しい DB では seed より先に流れるので、ダミーの行を読むことはない |
| `task_id` を `_` で分ける箇所 | `getCourseName()` だけ。AOJ の API の応答にしか使わない                                                                                                                                                                                                  | 変更なし                                                                                                                                                                                                                                |
| 解答状況                      | ユーザーが自分で設定する。AOJ から提出結果を取り込む処理は無い                                                                                                                                                                                           | ジャッジデータで確かめて AC にできる                                                                                                                                                                                                    |
| 管理画面の AOJ 取り込み       | Task を削除しない（[5 章](#5-task-テーブルへの書き込み経路の全数調査)）。すでにある行は飛ばす                                                                                                                                                            | ダミーは消えない。欠けた問題が AOJ に後から足されたときだけ注意する（[下記](#aoj-に後から追加されたとき)）                                                                                                                              |

レコードの入れ方:

- seed: `prisma/tasks.ts` に足す。`contest_type` は `classifyContest()` が `contest_id` から決める（ダミーの 7 コンテストは `AOJ_JAG`）
- staging / 本番: メンテナが Supabase の CSV で入れる。列と確認の SQL は [plan.md](./plan.md#staging--本番への投入メンテナ)

## AOJ に後から追加されたとき

3643 のように、AOJ は過去の問題を後から追加することがある。ダミーの問題が AOJ に入ったら、AOJ の ID に移す。

1. **管理画面から取り込まない**。取り込みは、AOJ のコンテスト一覧にある問題 ID の昇順で記号を振る（`assignProblemLetters()`）。すでにある行は飛ばすので今の記号は変わらないが、欠けたコンテストに後から足された問題には、ずれた記号が付く（例: 模擬地区 2005 の C が新しい ID で入ると、7 番目の G になる）。同じコンテストで記号が重なると、`generateTable` が片方を上書きし、問題が黙って表から消える（`(contest_id, task_table_index)` に一意制約は無い）。この危険は PR3 の前からあり、対象は管理画面から取り込める模擬地区（ダミーがあるのは 2005 / 2008）。合宿系は AOJ の一覧に無いので取り込めない
2. DB の `task_id` を AOJ の ID に UPDATE する。参照する外部キーは 6 つとも `ON UPDATE CASCADE`（taskanswer / tasktag / workbooktask / votegrade / votedgradecounter / votedgradestatistics）なので、回答・投票・タグ・問題集のデータは付いてくる。記号もそのまま残る
3. `no_judge.ts` の map から消し、seed の行の `id` と `seed_problem_letters.test.ts` の期待値を直す
4. 出典のラベルは `task_id` から決まるので、自動で `（AOJ）` に戻る

移し忘れても、`NoJudge-` が残っていれば一目で分かる。
