# ふか杯 5th / CodeQUEEN 2023 決勝の問題追加（#4177）

[#4177](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/4177) で 2 コンテスト・計 13 問を追加した。手順は [#4176](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/4176)（bogosort を `UNIVERSITY` に追加）を踏襲した。CodeQUEEN を入れるために、`ATCODER_MAIN_OFFICIAL_ONSITE` の分類とラベル生成を WTF 以外にも広げた。

## 決定事項

| contest_id                 | ContestType                    | 表示名              | 決めた人・根拠 |
| -------------------------- | ------------------------------ | ------------------- | -------------- |
| `fuka5`                    | `UNIVERSITY`                   | ふか杯 5th Contest  | Issue の指定   |
| `codequeen2023-final-open` | `ATCODER_MAIN_OFFICIAL_ONSITE` | CodeQUEEN 2023 決勝 | Issue の指定   |

- CodeQUEEN の表示名に「（オープンコンテスト）」は付けない（ユーザー判断）。WTF も `-open` を落として `World Tour Finals 2019` のように表示しているので、それに合わせた。
- problems.json では、F 問題の `name` / `title` の末尾にタブが付いている（`Queen's Crown\t`）。上流データの誤りとみなし、タブを除いて登録した（ユーザー判断）。add-tasks スキルの「verbatim」ルールの例外にあたる。
- `ATCODER_MAIN_OFFICIAL_ONSITE` の説明コメント（`schema.prisma` と `contest.ts`）を CodeQUEEN も含む表現に直した（ユーザー判断）。`//` コメントだけの変更なので、マイグレーションは発生しない。
- 次の 2 つはスコープ外（YAGNI）：CodeQUEEN の他の回（予選など）と、`-open` の付かない `codequeen2023-final`。

## 重複確認（2026-10-18 時点）

- `task_id`：`fuka_*` と `codequeen2023_final_*` は既存の `prisma/tasks.ts`（2,453 件）になく、新規同士の重複もない。
- `prisma/contest_task_pairs.ts` と `prisma/tasks_for_production.ts` に fuka・codequeen への言及はない。
- 既存の問題との同名はない（似た名前に `すごろくと駒`、`Queen's Case` があるが、別の名前）。
- どちらの型にもコンテスト表のプロバイダーがないので、表の表示には影響しない。

## 設計の根拠

- fuka5 はロジックの変更なしで追加できた。`UNIVERSITY` はプレフィックス一致で判定するので、`ATCODER_UNIVERSITIES` にキーを足せば分類できる。ラベルも #4176 で入れた完全一致のフォールバックで引ける。
  - キーを `fuka` にしなかったのは、ラベルを完全一致で引けなくなるため。
- 変更前は、`ATCODER_MAIN_OFFICIAL_ONSITE` を返すのも、そのラベルを作るのも WTF の正規表現だけだった。そこで WTF 以外のオンサイト大会を完全一致で引く辞書を `prefixes.ts` に追加し、分類と表示名の両方に使った。ほかの辞書（`ATCODER_UNIVERSITIES` など）も 1 つで分類と表示名を兼ねている。
  - 判定を完全一致にしたのは、オンサイト大会は回ごとに ID の形が違い、プレフィックス一致にしても得るものがないため。
- ラベル生成は、独立した関数にせず `LABEL_GENERATORS` のラムダにした。このジェネレーターが呼ばれるのは、`classifyContest` がこの型を返したとき（WTF か辞書のキーのとき）だけである。万一 `undefined` が返っても、`getContestNameLabel` の大文字化フォールバックで受け止められる。テストは WTF と同じく `contest_name_labels.ts` のフィクスチャで行う。
- `prisma/tasks.ts` での位置：
  - fuka5（2012 年）は bogosort より古いので、UNIVERSITY のまとまりの末尾に置いた。
  - CodeQUEEN の開催日は確認できなかった。そのため ID の年の順に、`awtf2024-open` と `wtf22-day2` の間に置いた。

### 採用しなかった案

- WTF の正規表現に CodeQUEEN を加える：`isWorldTourFinals` が WTF でない大会にも `true` を返すことになり、名前と中身が食い違う。
- `world_tour_finals.ts` を一般化して、オンサイト大会全体を扱うファイルにする：ファイル名と責務を変えるほどの理由がない。2 種類目の正規表現が必要になった時点で検討する。
- ラベル用に専用のファイルと関数を作る：処理は三項演算子 1 つで、WTF のラベルにも専用のテストファイルはない。
- `stripOpenSuffix` を通してから辞書を引く：AtCoder Problems にあるのは `-open` 付きの ID だけなので、変換する必要がない。

## その他

- add-tasks スキルの Classify 節に、`ATCODER_MAIN_OFFICIAL_ONSITE` は完全一致で、WTF は正規表現で判定することを書き足した。
- クロスレビューは必須の条件に当たらない。手で編集したのは 12 ファイルで、`schema.prisma` もコメントの変更だけである。
