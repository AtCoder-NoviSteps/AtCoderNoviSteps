# 調査の根拠データと検討の経緯

[plan.md](./plan.md) の各主張の裏付け。単独では読まず、plan.md から参照される想定。

**plan.md の決定が常に優先される。** ここに残した検討過程は、後から「なぜその案を採らなかったか」を辿るための記録であり、決定そのものではない。

2026-10-21 に現行コードと再照合し、行番号と件数を更新した（5 章の既存項目は当時の記録のため据え置き、6・7 項目めを追記）。

---

# 1. 実測データ

## 対象規模

`prisma/tasks.ts` の実データ集計。**1,099 問 / 129 コンテスト**（2026-10-21 の再集計でも内訳まで同値）。

| 種別         | コンテスト | 問題数 | Provider |
| ------------ | ---------- | ------ | -------- |
| ICPCPrelim   | 29         | 197    | あり     |
| ICPCRegional | 27         | 266    | あり     |
| JAGPrelim    | 23         | 169    | あり     |
| JAGSummer    | 36         | 338    | **なし** |
| JAGWinter    | 10         | 87     | **なし** |
| JAGSpring    | 4          | 42     | **なし** |

合宿系（Summer / Winter / Spring）は **seed にデータが入っているが Provider が無い**ためコンテスト表に出ていない。移行対象からは外せない。

全 1,099 問で `problem_index` == `task_id`（AOJ 問題ID）。

## 本番の件数（2026-10-21）

本番で `contest_type` ごとに集計した結果。seed と一致するのは `AOJ_ICPC` だけだった。

| contest_type     | 本番（コンテスト / 問題） | seed（コンテスト / 問題） |
| ---------------- | ------------------------- | ------------------------- |
| `AOJ_ICPC`       | 56 / 463                  | 56 / 463                  |
| `AOJ_JAG`        | 89 / 794                  | 73 / 636                  |
| `AOJ_UNIVERSITY` | 27 / 30                   | 27 / 29                   |
| `AOJ_COURSES`    | 8 / 247                   | 0 / 0                     |
| `AOJ_PCK`        | 1 / 12                    | 0 / 0                     |

`AOJ_ICPC` / `AOJ_JAG` を `contest_id` の接頭辞で分けると次のとおり。`AOJ_JAG` の差（16 コンテスト / 158 問）はすべて JAG 模擬地区（管理画面から取り込める。seed には 0 件）で、PR1 / PR2 の対象範囲は本番と seed で一致する。

| 接頭辞         | 本番（コンテスト / 問題） | seed（コンテスト / 問題） |
| -------------- | ------------------------- | ------------------------- |
| `ICPCPrelim`   | 29 / 197                  | 29 / 197                  |
| `ICPCRegional` | 27 / 266                  | 27 / 266                  |
| `JAGPrelim`    | 23 / 169                  | 23 / 169                  |
| `JAGRegional`  | 16 / 158                  | 0 / 0                     |
| `JAGSummer`    | 36 / 338                  | 36 / 338                  |
| `JAGWinter`    | 10 / 87                   | 10 / 87                   |
| `JAGSpring`    | 4 / 42                    | 4 / 42                    |

AtCoder 側（`AOJ_*` 以外）で title が `${task_table_index}. ` で始まらない問題は、本番でも `abs` の practice_1 の 1 件だけだった。

## 欠落は機械的に検出できない

AOJ 問題ID の連番性を調べると 129 コンテスト中 128 が連番。**だが欠落が無い証拠にならない。** AOJ に登録されていない問題なら ID も無いため、残った問題の ID は連番のままになる。AOJ に問題はあるのにコンテスト一覧（取り込み元）から外れている場合も同じである。ICPC 国内予選 2002 の E（Enclosing Circles）は AOJ に問題 1123 として存在するが一覧に無く、取り込まれていない。2002 年の A〜D は 1119〜1122 で連番のままであり、1123 の次の 1124 は 2003 年の A である。

データから欠落を示唆するのは**問題数の異常**の方:

| コンテスト                 | 問題数 | 同種の中央値 |
| -------------------------- | ------ | ------------ |
| `JAGSummer2006-day1`       | 1      | 10           |
| `JAGWinter2006-day2`       | 2      | 10           |
| `JAGWinter2006-day3`       | 4      | 10           |
| `JAGSummer2007-day1`       | 5      | 10           |
| `ICPCPrelim1998/2000/2002` | 各 4   | 8            |

古い回ほど少ない。ただし**当時は本当に問題数が少なかった**可能性も同程度にあり、データだけでは判別できない。

## `title` の持ち方が AOJ 内で割れている

| 範囲                                       | 件数  | `title` の形                    | 例                                |
| ------------------------------------------ | ----- | ------------------------------- | --------------------------------- |
| ICPC国内 / アジア / JAG模擬国内（**PR1**） | 632   | 素                              | `'Peculiar Protocol'`             |
| JAG 合宿系（**PR2**）                      | 467   | **数値ID のプレフィックス付き** | `'2389. Asynchronous Exceptions'` |
| AtCoder 等（対象外）                       | 1,366 | index のプレフィックス付き      | `'EX8. たくさんのA足すB問題'`     |

632 / 467 の分かれ目が PR1 / PR2 の境界と**完全に一致**する。

退行の機序:

```
現在:   index='2389', title='2389. Asynchronous Exceptions'
        → replace('2389. ', '') → 'Asynchronous Exceptions'   正常

PR2 後: index='A',    title='2389. Asynchronous Exceptions'
        → replace('A. ', '')    → 空振り
        → '2389. Asynchronous Exceptions' が露出           退行
```

`removeTaskIndexFromTitle`（`src/lib/utils/task.ts:123`）は `${index}. ` の決め打ち置換のため、 `task_table_index` だけを更新すると空振りする。

**プレフィックスは 467 件すべてで `task_id` と完全に一致していた（不一致 0 件）。** したがって除去も復元も機械的に安全に行える。

## 復元可能性の実測

| 対象                     | 件数  | 復元                                                                                     |
| ------------------------ | ----- | ---------------------------------------------------------------------------------------- |
| AOJ ICPC/JAG（更新対象） | 1,099 | **無条件に可能**。`task_table_index == task_id` が例外ゼロで成立                         |
| その他（AtCoder 等）     | 1,367 | **条件付き**。84.2%（1,151 件）は `task_id` のサフィックスから導出できるが、216 件は例外 |

導出できない 216 件の内訳: `abc` 41（`abc318_h` に対し index は `Ex`）、`typical` 32、 `APG` 27（`APG4bPython_co` に対し index は `EX8`）、`arc` 27、`tdpc` 20、 `math-and-algorithm` 15、ほか（`task_id` にサフィックスが無い AOJ 大学系 29 件を含む）。

`abc*_h → Ex` は規則として書けるため理論上は 90% 超まで導出できるが、 **事故対応の手段としては成立しない**。理由は 2 つ。

1. 「84% は規則で戻せるが 16% は個別対応」という状態は、復旧手順として使えない
2. `task_table_index` を上書きした後では、**どの行が元から `A` だったのかを区別できない**

AOJ ICPC/JAG の 1,099 件が「無条件に一括復元できる」のとは質的に異なる。

## 既存 DB は自動更新されない

- seed: `prisma/seed.ts:192-199` で `findUnique(task_id)` → 既存なら **skip**
- インポート: `src/lib/services/tasks.ts:175-180` で `isExistsTask(task_id)` → 既存なら **silent return**
- `updateTask`（`src/lib/services/tasks.ts:206`）は `grade` しか触らない

## 一意性は壊れない

`prisma/schema.prisma` の Task で unique なのは 2 つのみ。

| フィールド          | 由来                           |
| ------------------- | ------------------------------ |
| `id` (@id @unique)  | `sha256(contest_id + task.id)` |
| `task_id` (@unique) | `task.id` をそのまま           |

どちらも入力は contest_id と AOJ 問題ID のみ。`problem_index` は混ざらない。FK も全て `task_id` 参照（`TaskTag` / `TaskAnswer` / `WorkBookTask` / `VoteGrade` / `VotedGradeCounter` / `VotedGradeStatistics`）。ハッシュの `id` を FK にしている箇所は無い。

**性質の変化**: `task_table_index` は現状「全 DB でユニーク」だが変更後は **「コンテスト内でのみユニーク」**になる。unique 制約は無く、コンテスト横断で index をキーにしている箇所も無い（`getTaskLabels` は contestId で名前空間を切り、 `sortAojHeaderIds` は単一コンテスト内で閉じる）ため問題ない。

## 変更しても安全な箇所

- **`formatAojTitle`** … PR1 範囲は `title` に index プレフィックスが無いため二重化しない
- **`getTaskUrl(contest_id, task_id)`** … index 非依存
- **`ContestTaskPair` のマージ** … `prisma/contest_task_pairs.ts` に ICPC/JAG のエントリは **0 件**
- **`columnWrapThreshold: 6`** … 問題数は変わらないので影響なし

## 出典欄の呼び出し元

`addContestNameToTaskIndex`（`src/lib/contests/utils/task_index_label.ts:4-12`）は 1 関数で、呼び出し元 6 箇所は自動的に揃う。

- `src/lib/components/TaskList.svelte:124`
- `src/lib/components/TaskListSorted.svelte:55`
- `src/lib/components/TaskForm.svelte:51`
- `src/routes/(admin)/tasks/grade/_components/TaskGradeTable.svelte:106`
- `src/features/workbooks/components/detail/WorkBookTasksTable.svelte:202`
- `src/routes/workbooks/[slug]/+page.svelte:52`

`getAojContestLabel`（`src/lib/contests/utils/labels/aoj.ts:52`）と `getAojUniversityContestLabel`（同 `:63`）から全角括弧を外す場合（M11）に巻き込まれる箇所 — `getContestNameLabel` を AOJ コンテストに直接使っている:

- `src/lib/utils/task_filter.ts:39` — 検索マッチ
- `src/lib/components/SubmissionStatus/UpdatingModal.svelte:69` — `"{label} - {title}"` （現状 `"（…） - title"` で元々不格好）
- `src/lib/components/TagForm.svelte:99`
- `src/routes/votes/+page.svelte:114`
- `src/routes/(admin)/tasks/_components/TaskTableForImport.svelte:53`

## テストの影響範囲

| ファイル                     | 行数 | 関連                        |
| ---------------------------- | ---- | --------------------------- |
| `aoj_icpc_providers.test.ts` | 902  | comparator / ヘルパー       |
| `aoj_jag_providers.test.ts`  | 455  | 同上                        |
| `aoj_labels.test.ts`         | 186  | 同上                        |
| `task_index_label.test.ts`   | 213  | 出典欄                      |
| `labels/index.test.ts`       | 184  | 出典欄（M11）               |
| `labels/aoj.test.ts`         | 82   | 出典欄（M11、大学系を含む） |

期待値の多くは fixture 側にある。`src/lib/contests/fixtures/contest_name_labels.ts`（349 行）と `contest_name_and_task_index.ts`（986 行）の AOJ 部分（大学系を含む）が全角括弧と数値 index を前提にしている。

---

# 2. SQL の解説

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

| 句                             | 意味                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `PARTITION BY contest_id`      | **コンテストごとにグループ分けし、番号を 1 から振り直す**              |
| `ORDER BY task_id::int`        | 各グループ内で問題ID の数値昇順に並べる                                |
| `row_number()`                 | 並べた順に 1, 2, 3… を返す（**1 始まり**）                             |
| `chr(64 + n)`                  | 文字コード変換。`chr(65)` = `A` なので `n=1 → A`、`n=2 → B`            |
| `contest_id LIKE 'JAGPrelim%'` | `AOJ_JAG` には合宿系も含まれるため、PR1 では接頭辞で模擬国内だけに絞る |

`64` は 1 始まりの分を引いた値。現行の `buildAojLetterMap` は 0 始まりのループ変数で `String.fromCharCode(65 + i)` としており、結果は同じになる。

`PARTITION BY` が無いと対象の全問題（PR1 なら 632 問）に通し番号が振られ、2 つ目以降のコンテストが `Z` を超えて壊れる。

> **SQL は書かれた順に評価されない。** 論理的な処理順序は `FROM`（サブクエリと別名の確定）→ `WHERE` → `SELECT` / `SET`。このため別名を定義より前に参照しているように見えても正しい（`SELECT u.name FROM users AS u` と同じ理屈）。

実データでの確認: `ICPCPrelim2024`（9 問）は `1672 → A`, `1673 → B`, … `1680 → I`。 `ICPCPrelim1998` は 4 問なので `A`〜`D`。

## 計算量 — O(N²) にはならない

- 外側の `AND (t.contest_type = … OR …)` は **join ではなくフィルタ**。1 行あたり O(1) で評価され、行数を減らす方向にしか働かない。`AND` は「同じ 1 行に対する複数の判定」であって集合同士の組み合わせではない
- join 側も、`task_id` に UNIQUE インデックスがある（`prisma/migrations/0_init/migration.sql:134` `task_task_id_key`）ため、Nested Loop + Index Scan なら O(M log N)、Hash Join なら O(N + M)。二乗にはならない
- 支配項はウィンドウ関数のソート O(K log K)（K = PR1 で 632、PR2 で 467）。実行時間はミリ秒台

**推測ではなく実行計画で確認すること。** staging で `EXPLAIN ANALYZE` を付けて実行し、内側ループに `Seq Scan` が出ていないかを見る。

---

# 3. 検討の経緯（採らなかった案）

**以下はいずれも plan.md で却下・保留と決定済み。** 判断の理由を残すための記録。

## `title` に記号を入れる案を採らない理由

`title` を `'A. Peculiar Protocol'` に揃えれば AtCoder 側 1,366 件と形式が揃うが、採らない。

- **同じ情報を 2 列に持つとドリフトする。** 欠落判断の誤りを修正するとき（修正は起こる前提）、両方を更新しないと不整合になる
- **G2 に逆行する。** title にプレフィックスを埋め込む設計は、表示側に `removeTaskIndexFromTitle` という文字列 replace を要求する。除去したかった種類の変換そのもの
- **`replace` は脆い。** 破壊的変更 5 の退行がその実例

「入れない」を選んでも AtCoder と AOJ で title の意味は揃わないが、 **どちらを選んでも不整合は残る**（AtCoder 側を触るのはスコープ外）。コードは既に `formatAojTitle`（AOJ・付与）と `removeTaskIndexFromTitle`（AtCoder・除去）で経路が分かれているため、AOJ を「素の title」に寄せる方が既存の設計と整合する。

## 管理画面案を保留にした理由

「管理画面から SvelteKit の action で更新する」案には実質的な利点がある。

- **再実行できる。** マイグレーションは適用後 immutable なので、欠落判断の誤りが後から見つかると新しいマイグレーションを積むことになる
- 欠落判断は人間が行う（M6）以上、**修正は起こる前提**であるべき

一方で、この案は**問題記号の入力元が定義できないと成立しない**。手入力なら 1,099 回の手作業に戻り、難所 1 で否定したものに戻る。コード上の対応表を読むなら prefix / problem_id は入力ではなくなり、実質「対応表を DB に同期するボタン」になる。

さらに、素直に実装すると **N+1 になりやすい**。既存の `createTask` がまさにその形で（`src/routes/(admin)/tasks/+page.server.ts:85` の `Promise.all` + check-then-act）、トランザクションが無いため途中で失敗すると部分適用が残る。採るなら `updateMany` か `$executeRaw` で一括処理する設計が前提になる。

**再検討のタイミング**: PR2 で例外が多く、修正が繰り返し発生すると分かった時点。PR1 は欠落が少ない見込みなのでマイグレーション 1 本で足りる。

## 逆順（合宿系を先）を採らなかった理由

「動いているものへの改修を後に回す方が PR のレビュー負荷が低い」という利点はある。実際、合宿系を先にすれば既存コードへの変更は `mapToTask` の分岐追加だけで済む。

ただし出典欄の反映が PR2 まで持ち越しになり、対応表のフォーマットを最も判断の重い 50 コンテストで作ることになる。**仕様反映の速さを優先して順序を決めた。**

---

# 4. Task テーブルへの書き込み経路の全数調査

リポジトリ全体（`src` / `prisma` / `e2e`）を確認した結果。移行 UPDATE の安全性の根拠。

## 書き込み経路は 3 つだけ、削除経路はゼロ

| 経路                 | 実装                            | 書き込むフィールド                                                              |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| 管理画面インポート   | `src/lib/services/tasks.ts:182` | `id` / `task_id` / `contest_id` / `contest_type` / `task_table_index` / `title` |
| 管理画面の難易度更新 | `src/lib/services/tasks.ts:208` | `grade` のみ                                                                    |
| seed                 | `prisma/seed.ts:217`            | 上記 + `grade`（`id` は未指定）                                                 |

- `updateTask` の呼び出し元は 2 つ（`src/routes/(admin)/tasks/[task_id]/+page.server.ts:73`、 `src/routes/(admin)/tasks/grade/+page.server.ts:34`）。いずれも `grade` のみ
- `task.delete` / `deleteMany` / `upsert` / `createMany` は**リポジトリ全体に存在しない**
- 生 SQL（`$executeRaw` / `$queryRaw`）による Task への書き込みもなし
- 他モデルからのネストした `task: { create: ... }` もなし

⇒ **一意フィールドを UPDATE するコードは構造的に存在しない。**

## `id` の採番規則がインポートと seed で不一致

- インポート: `sha256(contest_id + task.id)` — 決定的
- seed: `id` 未指定のため fabbrica の自動採番（`prisma/.fabbrica/index.ts:915`）で連番文字列

一意性は破れないが「`Task.id` はハッシュ」という前提は**開発環境では成立しない**。ただし **`Task.id` を再計算して引く箇所はゼロ**で、全ルックアップは `task_id` 経由。現状の実害はないが、将来 `Task.id` に決定性を期待するコードを書くと静かに壊れる。

## check-then-act の競合

`createTask` は `isExistsTask`（`findMany`）→ `create` の check-then-act で、 `src/routes/(admin)/tasks/+page.server.ts:85` がこれを `Promise.all` で並列実行している。

同一 `task_id` が 1 回のインポート JSON に 2 件含まれると、両方がチェックを通過して 2 件目が P2002 で落ちる。`Promise.all` 全体が reject して 500 を返すが、 **トランザクションが無いため先に成功した分はロールバックされない**（部分適用）。

`prisma/seed.ts:192-199` も同じ形で PQueue concurrency 3 で並列実行しており同種のレースがある。

一意性は DB 制約が守るので壊れはしないが、エラー時の挙動が中途半端。 `docs/guides/agent-rules/prisma-db.md` の「Idempotent Writes」に該当し、本来は `createMany({ skipDuplicates: true })` か `upsert` が解。**本件とは独立の既存課題**（O5）。

## 他の sha256 決定的 ID は Task から独立

`src/lib/services/answers.ts:86,105` と `src/features/votes/services/vote_grade.ts:107,120,146` はいずれも入力が `Task.id` ではなく `task_id`。`vote_grade.ts` は全て `upsert` で `where` に複合ユニークを使うため id 衝突の経路もない。

## 削除経路がないことの帰結

Task を削除するコードが存在しないため、関連テーブルが孤児 FK を持つ事故は現状起こらない。将来 Task 削除機能を追加する場合、6 つの関連のうち `TaskTag` / `TaskAnswer` / `WorkBookTask` は `onDelete` 未指定なので要注意（投票系 3 つは `Cascade`）。

---

# 5. 調査中の誤りと訂正（自戒）

1. **対象を 632 問と集計した** — Provider が存在する 3 種のみを数え、seed にデータがある合宿系 467 問を落としていた。正しくは 1,099 問。 _教訓: 「実装がある範囲」と「データがある範囲」は一致しない。集計条件は後者で取る。_

2. **「問題ID が連番だから欠落なし、機械生成できる」と結論した** — 欠落問題は ID も採番されないため、連番性は欠落の有無について何も語らない。検証が問いに答えていなかった。 _教訓: 「観測できる範囲に異常が無い」ことを「異常が無い」と読み替えない。欠落は定義上、観測できない側にある。_

3. **抽出スクリプトのバグを、データの欠落として提示しかけた** — `prisma/tasks.ts` からタスクを抜き出す正規表現がシングルクォート前提だったため、 `name: "A Bug That's Not a Pill Bug"`（アポストロフィを含むためダブルクォート）を取りこぼし、`ICPCPrelim2024` が 8 問に見えた。実際は 9 問で、欠番は存在しなかった。 _教訓: 抽出スクリプトを書いたら、まず総数が既知の値と一致するかを確認する。1 と同じ「観測範囲を実際の範囲と取り違える」失敗であり、本件では欠落の誤検出に直結する。_

4. **移行 SQL を seed 由来の対応表から生成する案を出した** — production のタスクは管理画面インポート経由で入っており seed と一致する保証がないため、production にしか無い行が取り残される。しかも `UPDATE` は該当行が無くてもエラーにならない。 _教訓: 2 と同じ型。「seed で見えている範囲」を「production の実態」と取り違えた。_

5. **AtCoder 系の復元を「不可能」と断定した** — 実際は `task_id` のサフィックスから 83.4% が導出できる。ただし事故対応としては成立しないという結論自体は変わらない。 _教訓: 断定する前に測る。結論が同じでも、根拠が誤っていると次の判断で誤用される。_

6. **PR を分けた後も、移行 SQL の範囲を 1,099 件のままにしていた**（2026-10-21 に発見）— `contest_type IN ('AOJ_ICPC', 'AOJ_JAG')` は合宿系も含むため、PR1 で 467 件を余計に更新するところだった。 _教訓: 範囲を分割したら、範囲を表す条件をすべて追従させる。分類（`contest_type`）と分割の単位が一致しているとは限らない。_

7. **欠落した問題を「AOJ に存在しない（ID も無い）」と決めつけていた**（2026-10-21 に発見）— ICPC 国内予選 2002 の E は AOJ に問題 1123 として存在し、コンテスト一覧（取り込み元）から外れているだけだった。PR3 でダミーを作るという前提は、この問題には当てはまらない。 _教訓: 「一覧に無い」と「存在しない」は別。データの取得元の範囲を、対象が実在する範囲と取り違えない（1・4 と同じ型）。_

なお本調査は当初「上流が `title` / `problem_index` を変更した場合」という別の問いから始まったため、初版には鉄則本の章分類（`tessoku_book_providers.ts`）や `ContestTaskPair` の `replace` 誤置換に関する記述があった。いずれも本件では対象外のため削除済み。
