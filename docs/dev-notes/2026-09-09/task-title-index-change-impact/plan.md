# AOJ ICPC / JAG の `problem_index` を A/B/C 形式へ変更する

**日付**: 2026-09-09（2026-10-21 に現行コードと再照合し、参照・数値を更新。2026-10-24 に PR2 以降の範囲と分割を見直し）／ **状態**: PR0 完了（#4212）・PR1 完了（#4217、[実施記録](#pr1-の実施記録2026-10-24)）・PR2 以降は未着手（[着手前の確認事項](#pr2-以降の着手前の確認事項)） **実測データと検討の経緯は** [investigation.md](./investigation.md)

## ゴール

`problem_index`（DB 上は `task_table_index`）に AOJ 問題ID ではなく**問題記号**を持たせ、 **表示側が変換なしにそれを使える状態にする。**

> **問題記号**: `A`, `B`, `C`… のように、そのコンテスト内で何番目の問題かを表す記号。AtCoder では `abc300_a` の `a` にあたる。AOJ には存在しない（難所 1）。コード上は `letter`。

|                                        | 現在                                        | 目標                                         |
| -------------------------------------- | ------------------------------------------- | -------------------------------------------- |
| **G1** 出典欄（`TaskList.svelte:124`） | `AOJ 3467（ICPC 国内予選 2024）`            | `ICPC 国内予選 2024 - F（AOJ）`              |
| **G2** コンテストテーブル              | 問題ID 3467 → ソート位置から `F` を**算出** | `task_table_index` の `F` を**そのまま使う** |

G2 は「アドホックな変換をなくす」ことが本体。位置ベース導出（`buildAojLetterMap`）が残る限りゴール未達になる。

### 対象と PR 分割

**記号にするのは 1,257 問 / 145 コンテスト**（2026-10-24 に JAG 模擬地区 158 問 / 16 コンテストを加えた）。ほかに、DB に無い 10 コンテストを PR2.1 で追加する。

|           | 範囲                                                    | コンテスト | 問題数                    | Provider | 到達点                                                    |
| --------- | ------------------------------------------------------- | ---------- | ------------------------- | -------- | --------------------------------------------------------- |
| **PR0**   | 出典欄の書式（AOJ 全体）                                | —          | —                         | —        | G1 の書式を先に入れる（index は数値のまま）               |
| **PR1**   | ICPC 国内予選 / アジア地区 / JAG 模擬国内               | 79         | 632                       | 実装済み | G1 / G2 をこの範囲で達成                                  |
| **PR2**   | JAG 夏合宿 / 冬合宿 / 春合宿 + JAG 模擬地区             | 66         | 625                       | 無し     | 既存データを記号にする（seed・移行 SQL・title・取り込み） |
| **PR2.1** | 2025 / 2026 の夏合宿（AOJ）+ in AtCoder の 4 コンテスト | 10         | 114（スプレッドシート上） | 無し     | 新しいデータを入れる（`ATCODER_JAG` の新設を含む）        |
| **PR2.5** | PR2 / PR2.1 の 76 コンテスト                            | 76         | —                         | 追加     | グループ「JAG 模擬地区」でコンテスト表に出す              |
| **PR3**   | 欠落問題の補完                                          | —          | —                         | —        | AOJ のコンテスト一覧に無い問題をどう埋めるか              |

PR1 / PR2 は「AOJ のコンテスト一覧にある問題の記号を正しくする」で完結し、PR3 に進まなくても機能として成立する。

順序: PR2 → PR2.5 は守る。Provider を先に出すと、合宿系の数値の index と `'2389. …'` の title がそのまま表に出る。PR2.1 は PR2 / PR2.5 と前後してよい。移行 SQL は index が問題 ID のままの行しか書き換えず、Provider はデータの無いコンテストを表示しない（`TaskTable.svelte` の `prepareContestTable` が `null` を返す）ため。

### スコープ外（残タスク）

PR0 の書式変更は出典欄の AOJ 分岐全体に効くが、index を記号にするのは ICPC / JAG 模擬国内 / JAG 合宿系だけである。次の範囲は数値の index のまま残し、別タスクとする。件数は本番の集計（2026-10-21）。

| 範囲        | 本番の件数（コンテスト / 問題） | PR0 後の出典欄                                        | 残す理由                                                  |
| ----------- | ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| AOJ Courses | 8 / 247                         | `プログラミング入門 - ITP1_1_A（AOJ）` のように不格好 | 問題ID が非数値で、基本ルールの `task_id::int` が使えない |
| AOJ PCK     | 1 / 12                          | 数値の問題ID のまま                                   | 優先度が低い                                              |
| AOJ 大学系  | 27 / 30                         | `UTPC 2010 - 2207（AOJ）`                             | 優先度が低い（2279 だけは記号で登録済み）                 |

JAG 模擬地区（本番のみ 16 / 158）は当初ここに入れていたが、2026-10-24 に PR2 へ移した（M12）。

## 3 つの難所

**難所 1: 問題記号は AOJ API から取得できない。** `mapToTask`（`src/lib/clients/aizu_online_judge/utils.ts:65`）のコメントが明言しているとおり、API は「その問題がコンテストで何番目か」を返さない。現在の数値は問題ID の代用。

ただし**基本ルール**（コンテスト内で問題ID が若い順に `A`, `B`, `C`…）で復元できる。これは現行 `buildAojLetterMap` の導出と同一なので、**生成した対応表は現在の表示を再現する**。PR1 の回帰確認はここに依拠できる。⇒ 対応表はスクリプトで機械生成できる。

**難所 2: 欠落があると基本ルールが破れる。しかも欠落は検出できない。** ここでの欠落は、公式の問題が AOJ のコンテスト一覧（管理画面の取り込み元）に無いことを指す。AOJ に登録されていない問題なら **ID も無い**ため、残った問題の ID は連番のままになる。AOJ に問題はあるのに一覧から外れている場合もある（ICPC 国内予選 2002 の E = AOJ 1123）。どちらの場合も、コンテスト内の連番性は欠落の有無を何も語らない。⇒ **コンテスト単位で外部確認するしかない**（唯一の手作業）。PR2 の範囲では、実際に 8 コンテストで先頭・途中の欠落が見つかった（[照合結果](./investigation.md#記号の補正が要るコンテスト)）。

この構造こそが変更の動機でもある。導出のままでは欠落を表現できず例外表を抱えるしかないが、データ化すれば欠落コンテストも通常のデータとして扱える。

**難所 3: 表示層で逃げられない。** 出典欄は `task_table_index` を**直接**読み、コンテスト表の問題記号マップはこの経路に関与しない。⇒ DB の値そのものを直す以外に手段がない。

## 破壊的変更 5 点

| #   | 変更                                              | 起きること                                                                                                                      | 対処                                           |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | `task_table_index` の値が変わる                   | **既存レコードは自動更新されない**（seed も import も「既存なら skip」）                                                        | 移行 UPDATE（M2）                              |
| 2   | index が非数値になる                              | `aoj_labels.ts:26,54` の `Number(a) - Number(b)` が NaN になりソートが無効化。列順が `task_id` 降順に化ける                     | `localeCompare` へ（M4）。**移行 UPDATE の後** |
| 3   | `getTaskLabels` を削除すると                      | `taskLabel` が undefined になり `"A. "` プレフィックスが消える                                                                  | セル側を index 直参照に（M10）                 |
| 4   | コンテスト名の全角括弧を外すと                    | `getAojContestLabel` と `getAojUniversityContestLabel` が `'（…）'` を埋め込むため、**AOJ ラベルを使う他 5 箇所の表示も変わる** | 許容して廃止（M11）                            |
| 5   | **合宿系のみ `title` に数値プレフィックスがある** | `'2389. …'` に対し `removeTaskIndexFromTitle` が空振りし、**問題ID がタイトルに露出する**                                       | PR2 で `title` も正規化（M9）                  |

- 変更 1 で**一意性は壊れない**。`id` / `task_id` は `problem_index` を入力にしておらず、FK も全て `task_id` 参照（[根拠](./investigation.md#一意性は壊れない)）
- 変更 5 は **PR1 の 632 件には影響しない**（title が素なので空振りして無変化）。PR1 は安全、PR2 だけが危険という非対称がある（[実測](./investigation.md#title-の持ち方が-aoj-内で割れている)）
- JAG 模擬地区は管理画面の取り込み（`problem.name` をそのまま title にする）で本番に入っているので、プレフィックスは無い見込み。PR2 の着手前に本番で確かめる（[SQL A](#pr2-以降の着手前の確認事項)）

## 決定事項

| #   | 決定                                                                                                                                         | 理由                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | DB の値そのものを A/B/C に直す                                                                                                               | 難所 3                                                                                                                                                                                                                |
| M2  | 移行 UPDATE を実施する                                                                                                                       | 破壊的変更 1                                                                                                                                                                                                          |
| M3  | JAG 合宿系 467 問も対象に含める（PR2 に分割）                                                                                                | seed にデータがあり Provider だけが無い                                                                                                                                                                               |
| M4  | `sortAojHeaderIds` の comparator を `localeCompare` へ                                                                                       | 破壊的変更 2                                                                                                                                                                                                          |
| M5  | 管理画面からの取り込み時に、ICPC / JAG 模擬国内は基本ルールで記号を付ける                                                                    | 放置すると次回の取り込みで数値 index が再混入する。毎年の新しいコンテストも追記なしで記号になる                                                                                                                       |
| M6  | 対応表は基本ルールで生成し、欠落確認は人間が行う                                                                                             | 難所 2                                                                                                                                                                                                                |
| M7  | `buildAojLetterMap` / `AOJ_LABEL_OVERRIDES` を削除                                                                                           | **G2 そのもの**                                                                                                                                                                                                       |
| M8  | 移行は Prisma のデータマイグレーションで適用                                                                                                 | CI の既存の仕組みに乗る                                                                                                                                                                                               |
| M9  | PR2 で合宿系の `title` から数値プレフィックスを除去                                                                                          | 破壊的変更 5                                                                                                                                                                                                          |
| M10 | `getTaskLabels` を削除し、セル側を `task_table_index` 直参照へ                                                                               | 恒等マップを組む無駄を残さない。G2 の趣旨                                                                                                                                                                             |
| M11 | `getAojContestLabel` / `getAojUniversityContestLabel` から全角括弧を外す                                                                     | 出典欄の目標書式ではコンテスト名を括弧で囲まない（括弧は末尾の `（AOJ）` だけで、コードベースの慣習どおり全角）。AOJ 大学系も出典欄の AOJ 分岐（`isAojContest`）を通るため両方が対象。**他 5 箇所への波及を許容する** |
| M12 | JAG 模擬地区（本番のみ 16 / 158）を PR2 に含め、seed にも本番から抽出して追加する                                                            | 取り込みとの整合を seed で検査でき、ローカルで移行 SQL を確かめられる。記号がずれる 2005 / 2013 も seed に入るので、ローカルで取り込んでも skip される                                                                |
| M13 | 基本ルールで記号がずれるコンテストは、移行 SQL でコンテストの全行を上書きし、各 UPDATE の件数を DO ブロックで検査する                        | 8 コンテストで先頭・途中の欠落がある。UPDATE は 0 件でもエラーにならないため、想定外の件数なら RAISE してマイグレーション全体を戻す                                                                                   |
| M14 | 管理画面からの取り込みでは、JAG は全 round（模擬国内 / 模擬地区）で記号を付ける                                                              | M5 の拡張。2005 / 2013 の補正は取り込み側に持たない（既存行は skip される）                                                                                                                                           |
| M15 | Provider は PR2.5 に分け、合宿系・模擬地区・in AtCoder を 1 グループ「JAG 模擬地区」にまとめる                                               | テーブルはコンテストごと。並びはスプレッドシートの行順（新しい順）で、contest_id から導けないので明示的な配列で持つ                                                                                                   |
| M16 | テーブル名は `getContestNameLabel` の名称に括弧書き（`JAG` / `有志` / `in JAG 夏合宿 20xx Day3`）を付ける。出典欄は変えない                  | 名称は現行の `JAG_TRANSLATIONS` に合わせる。「過去問」「in AtCoder」「AMATSUKAZE2025」は括弧ごと書かない。出典欄とそろえるのは #4018（コンテスト情報の DB 化）で行う                                                  |
| M17 | DB に無い 10 コンテストは PR2.1 で入れる。AtCoder 上の 4 つは `ATCODER_JAG` を新設し、AOJ の 2025 / 2026 は seed と Supabase の CSV で入れる | `ATCODER_JAG` は enum・優先度・分類ルールのいずれも `UNIVERSITY` の直前に置き、4 つを完全一致で分類する。CSV は移行の後に記号付きで入れる（既存の合宿系と同じ投入方法）                                               |
| M18 | seed の記号の検査では、補正したコンテストだけ期待値を literal で書く                                                                         | 補正していないコンテストは `assignProblemLetters` と一致することを見る                                                                                                                                                |

OPTIONAL は 1 件のみ。**O5**: `createTask` の check-then-act を upsert 化 —本件と独立の既存課題で別ブランチ推奨（[詳細](./investigation.md#check-then-act-の競合)）。

## 却下した方針

| 案                                                                                           | 却下理由                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 対応表を `prisma/tasks.ts` に手書きし seed のみ直す                                          | `mapToTask` が数値を入れ続け、取り込みのたびに**新旧書式が混在**する                                                                                                                                  |
| DB は数値のまま `AOJ_LABEL_OVERRIDES` を拡充し表示層で解決                                   | 移行不要で最も安いが、**ゴールを満たせない**（難所 3）                                                                                                                                                |
| 問題ID の連番性から欠落を機械判定                                                            | **論理的に成立しない**（難所 2）                                                                                                                                                                      |
| seed を冪等化して production に流す                                                          | **不可**。`addUsers` / `addAtCoderAccounts` / `addWorkBooks` / `addAnswers` / `addVoteStatisticsDemoData` まで走る（`prisma/seed.ts:71-81`）                                                          |
| `title` に記号を入れて `'A. Peculiar Protocol'` に揃える                                     | 同じ情報を 2 列に持つとドリフトする（[詳細](./investigation.md#title-に記号を入れる案を採らない理由)）                                                                                                |
| 管理画面に同期 action を足す                                                                 | **保留**。再実行できる利点はあるが問題記号の入力元が定義できない（[詳細](./investigation.md#管理画面案を保留にした理由)）                                                                             |
| 632 件の対応表を `src/lib/clients/aizu_online_judge/` に置き、`mapToTask` で引く（旧・案 B） | 毎年の新しいコンテスト（ICPC 国内予選 / アジア地区、JAG 模擬国内）で表への追記が要り、忘れると数値の index が黙って入る。`prisma/tasks.ts` と同じ情報を 2 か所に持つことにもなる（2026-10-21 に変更） |
| 合宿系と模擬地区を 2 グループに分ける                                                        | 同じ年の中の前後関係（例: 模擬地区 2014 は夏合宿 2014 の Day3 として開催）を表せない（2026-10-24）                                                                                                    |
| 既存の「JAG 模擬国内」グループに統合する                                                     | 模擬国内は PR1 で年のループとして完成している。統合すると、それも明示的な配列に置き換えることになる（2026-10-24）                                                                                     |
| テーブル名をスプレッドシートの名称（春コンテスト / 冬コンテスト / 模擬アジア地区）にする     | 出典欄（`JAG_TRANSLATIONS`）と名称が食い違う（2026-10-24）                                                                                                                                            |
| `ATCODER_JAG` を `jag` の前方一致で分類する                                                  | AtCoder Problems の `JAG2013Spring` などは AOJ の `JAGSpring2013` と同じコンテストで、問題が二重に入る（2026-10-24）                                                                                  |
| 2025 / 2026 の夏合宿を、移行の前に問題 ID のまま CSV で入れる                                | 移行 SQL の件数の想定値が、投入の有無で変わる。記号付きで入れれば移行と独立する（2026-10-24）                                                                                                         |

採用は**取り込み時の基本ルール**: `AojChallengesApiClient.getTasks` で、ICPC（国内予選 / アジア地区）と JAG 模擬国内のときだけ、コンテストの問題を ID 昇順に並べて A, B, C… を付ける（[1-1 の契約](#1-1-の契約)）。seed は生成スクリプトで書き換える。途中に欠番がある新しいコンテストでは記号がずれるが、気づけないのは現状の表示と同じである。見つかった時点で補正表を足す（PR1 の範囲では補正の必要が無いため、補正表は作らない）。PR2 では JAG 模擬地区にも広げる（M14）。補正が要る 2005 / 2013 は既存行として skip されるので、取り込み側に補正表は持たない。

> **この条件分岐はスコープの区切りであって、恒久的な設計ではない。** AOJ 由来のコンテストは最終的に A/B/C 形式へ揃えるのが自然だが、 **優先度は低く後回し**。取り込み時の基本ルールと移行 SQL は流用でき、対象の条件を広げるだけで済む。
>
> - **AOJ 大学**（RUPC / HUPC / UAPC / OUPC / UTPC / KUPC）… 29 件 / 27 コンテスト。28 件は `index == task_id` の数値で**同じ問題を抱えている**。本方式をそのまま適用できる。ただし `AOJ-KUPC2011` の 2279 は変更後の形式（`problem_index: 'I'`）で登録済み（本番も同じ）。AOJ に 1 問しか無いため基本ルールでは `A` になってしまう。範囲を広げるときは移行 SQL の対象から外す。title だけは `'I. Mountain'` と記号付きなので、PR1 で素の `'Mountain'` に揃える
> - **AOJ PCK / Courses** … ContestType は定義済みだがデータ未投入。ただし Courses は task_id が `ITP1_1_A` 形式で**非数値**のため、基本ルールの `task_id::int` が使えず別の導出が要る
>
> 移行 SQL の `contest_type` / `contest_id` 条件は、スコープ限定であると同時に **Courses の非数値 ID で `task_id::int` が失敗するのを防いでいる**。

## 移行手段

CI が `github.ref` でジョブを分け、staging と production の両方に `prisma migrate deploy` を実行している（`.github/workflows/ci.yml:91,130`）。

| ブランチ    | 適用先                                        |
| ----------- | --------------------------------------------- |
| `main` 以外 | `PREVIEW_DATABASE_URL`（`ci.yml:115-119`）    |
| `main`      | `PRODUCTION_DATABASE_URL`（`ci.yml:150-154`） |

いずれも build / lint / check / unit-test ジョブの成功後、`vercel build` の**後**・Vercel デプロイの**前**に走る（build が失敗すれば DB に触れない）。`main` へ昇格した時点で production に適用されるため、**staging での確認が自然にゲートになる**。

> **要確認**: CI は `pull_request` でも起動し、preview ジョブの条件は `github.ref != 'refs/heads/main'` だけである。YAML 上は、**同一リポジトリのブランチから PR を開いた時点で** `PREVIEW_DATABASE_URL` に適用される（staging へのマージ前）。Actions の実行履歴で確かめること。このため SQL の確認は PR を開く前にローカルで済ませる（[手順と確認](#手順と確認)）。

### SQL — 対応表を焼き込まず、基本ルールを SQL で表現する

**production のタスクは管理画面インポート経由で入っており seed と一致する保証がない。** seed 由来の一覧から `VALUES` を生成すると production にしか無い行が取り残され、 `UPDATE` は該当行が無くてもエラーにならないため**取りこぼしが静かに起きる**。

PR1 の SQL（ICPC 国内予選 / アジア地区 / JAG 模擬国内の 632 件）:

```sql
-- (1) Build a task_id -> problem letter lookup table.
WITH letters AS (
  SELECT task_id,
         chr(64 + row_number() OVER (
           PARTITION BY contest_id      -- Restart numbering for each contest.
           ORDER BY task_id::int        -- AOJ problem ids are numeric.
         )::int) AS letter
  FROM "task"
  WHERE contest_type = 'AOJ_ICPC'
     -- AOJ_JAG also covers training camps, so narrow it by contest_id.
     OR (contest_type = 'AOJ_JAG' AND contest_id LIKE 'JAGPrelim%')
)
-- (2) Apply the lookup table to the task rows.
UPDATE "task" AS t
SET "task_table_index" = letters.letter
FROM letters
WHERE t."task_id" = letters.task_id
  -- Redundant with the CTE filter, but keeps the blast radius fixed.
  AND (
    t."contest_type" = 'AOJ_ICPC'
    OR (t."contest_type" = 'AOJ_JAG' AND t."contest_id" LIKE 'JAGPrelim%')
  );
```

`row_number()` は `bigint` を返し、`chr(bigint)` は存在しない（`ERROR: function chr(bigint) does not exist`）。このため `::int` が要る（2026-10-24 にローカルで確認。当初の SQL には無かった）。

**範囲は `contest_type` だけでは絞れない。** 合宿系（`JAGSummer` / `JAGWinter` / `JAGSpring`）も模擬国内と同じ `AOJ_JAG` に分類される（`src/lib/contests/utils/classification.ts:76` の `regexForJag`）。`contest_type IN ('AOJ_ICPC', 'AOJ_JAG')` のままだと PR1 で合宿系 467 件まで更新される。そうなると破壊的変更 5 が PR1 で起き、欠落確認前の記号が合宿系に入る。このため `contest_id` の接頭辞で絞る。

PR2 の SQL は [PR2 の SQL](#pr2-の-sql) にまとめた。範囲は合宿系と模擬地区に絞る。PR1 の範囲を含めたまま流すと PR1 の行まで書き換わり、爆発半径が広がる。

DB の実データに対して実行されるので seed との差異が問題にならない。 `task_id::int` は安全（145 コンテストすべてで問題ID が数値であることを確認済み。模擬地区は本番の問題一覧で 2024〜3357）、1 コンテスト最大 14 問なので `chr(64 + n)` は A〜Z に収まる（`row_number()` は 1 始まりなので `chr(65)` = `A` から）。

読み方と計算量の分析は [investigation.md](./investigation.md#sql-の読み方)。

**PR1 のみ**: 2279 の `title` を素の形に揃える。index は本番も `I` で正しいため触らない。現在値を条件にしているので、既に揃っている環境では 0 件で終わる。

```sql
-- Align the AOJ-KUPC2011 title with the plain AOJ title format.
UPDATE "task"
SET "title" = 'Mountain'
WHERE "task_id" = '2279'
  AND "title" = 'I. Mountain';
```

#### PR2 の SQL

骨組みのみ。補正の `VALUES`（45 行）は 2-0 の照合スクリプトの出力で埋める。3 つの UPDATE を 1 つの DO ブロックに入れ、各件数を検査する（M13）。

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

- **件数の想定値に 0 を含める理由**: `prisma migrate reset`（ローカル）は空の DB にマイグレーションを流してから seed を入れる。開発者の既存 DB は合宿系だけを持ち、模擬地区は無い（467 / 32）
- **title の条件**: 旧案の `~ '^[0-9]+\. '` は他の数字で始まる title も消しうる。そこで「自分の `task_id` + `. `」で始まるものだけを対象にする。467 件すべてでプレフィックスが `task_id` と一致することは確認済み（[実測](./investigation.md#title-の持ち方が-aoj-内で割れている)）
- **想定値の確定**: 467 / 158 / title のプレフィックスの有無は、本番と staging で SQL A を流して確かめてから書く。模擬地区の title にプレフィックスがあれば (3) の想定値に 158 を足す
- **`task_table_index = task_id` の条件**: PR2.1 の CSV（記号付き・素の title）が先に入っていても、(1)(3) の対象にならない。PR2.1 との順序を問わないための保険

### 手順と確認

1. `pnpm exec prisma migrate dev --create-only --name update_aoj_task_table_index`
2. SQL + 例外の上書きを `migration.sql` に書く
3. **ローカル DB で `UPDATE` を `SELECT` に置き換えて「現在値 → 変更後」を確認する**
4. ローカルで `pnpm exec prisma migrate dev` を実行して適用し、表示を確認する
5. PR を開く → staging へマージして確認 → `main` へ昇格

手順 3–4 は**必ず PR を開く前に**済ませる。PR を開いた時点で preview DB に適用されうるうえ（[移行手段](#移行手段)の要確認）、適用済みのマイグレーションは編集しても再適用されない。PR を開いた後に SQL の誤りが見つかったら、新しいマイグレーションを積む。ローカル DB は seed 由来なので、確かめられるのは SQL のロジックまでである。

PR2 の模擬地区はローカルの seed に無い（M12 で足すのは記号付きの値）。PR2 のコードに切り替える前に、管理画面から JAG REGIONAL を取り込んでおく（index が問題 ID のまま、本番と同じ形で入る）。staging / production は、件数チェックの想定値と一致するかを着手前に SQL A で確かめる。一致しないと RAISE でデプロイが止まる。

手順 3 により **SQL の正しさを構文から判断する必要がなくなる**ので、必ず通すこと。全件を見る必要はないが、**コンテストの切り替わり目（記号が `A` に戻る箇所）**と **問題数の少ない古いコンテスト**は目視する価値がある。

ローカル（手順 3–4）と staging での確認項目:

- **更新件数**が想定（PR1 = 632 と 2279 の title 1 件、PR2 = 基本ルール 625・補正 45・title 467）と一致するか。PR1 で 1,099 件になったら合宿系を除外できていない。PR2 は DO ブロックが検査する
- `EXPLAIN ANALYZE` に想定外の `Seq Scan` が無いか
- コンテストテーブルの表示が**変わらない**こと（基本ルールは現行の導出と同一のため）

**staging が防げないもの**: **対応表・欠落判断そのものの誤り**。誤った記号でも SQL は正常に完走し、staging では「それらしい表示」になる（難所 2）。

### 事故対策

| 観点                     | 内容                                                                                                                                                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **爆発半径**             | 復元できるのは AOJ ICPC/JAG の 1,257 件のみ（模擬地区 158 件は、index が問題 ID のままであることを SQL A で確かめる）。WHERE 句が壊れて AtCoder 系に波及すると**一括復元の手段が無くなる**（[実測](./investigation.md#復元可能性の実測)）。外側 `WHERE` の重複条件はこのため |
| **復元**                 | 一度目の適用に限り、`task_table_index` も `title` のプレフィックスも `task_id` から再構成できる                                                                                                                                                                              |
| **バックアップ**         | Supabase Pro のため PITR が利用可。復元トリックが効くのは一度目だけなので、**再修正時は PITR が唯一の手段**                                                                                                                                                                  |
| **`updated_at`**         | `@updatedAt` は Prisma Client 側の実装で DB トリガーではない。生 SQL では更新されない。**意図的に含めない**                                                                                                                                                                  |
| **キャッシュ**           | TTL 1 時間（`src/lib/clients/cache.ts:157`）。生 SQL は `invalidateTaskCaches()` を経由しない。ローカル / staging で「更新したのに表示が変わらない」ときはこれを疑う                                                                                                         |
| **トランザクション境界** | マイグレーションファイル単位で原子的に適用される。2026-10-24 にローカルの別スキーマで、3 文目が失敗するマイグレーションを `prisma migrate deploy` し、1–2 文目（CREATE / INSERT）も残らないことを確認した                                                                    |
| **デプロイ直前の数分**   | マイグレーションの適用から Vercel のデプロイ完了までの間は、旧コードが記号のデータを `Number()` で並べるため、記号がずれて表示されうる。数分で解消するので**許容する**                                                                                                       |

## フェーズ

**PR0（出典欄の書式）→ PR1（ICPC / JAG 模擬国内）→ PR2（合宿系 + 模擬地区）→ PR2.5（Provider）→ PR3（欠落補完）** の順。PR2.1（新しいデータ）は PR2 / PR2.5 と前後してよい。PR0 は DB に依存しないので先に出し、ラベル周りのテストを PR1 から切り離す。PR1 を合宿系より先にする理由: 出典欄はコンテストごとに正しくなるため PR1 完了時点で成果が見える／PR1 は欠落が少なく対応表フォーマットを楽なケースで確立できる／合宿系は Provider が無いため comparator 差し替えの影響を受けず **PR1 内で完結する**。逆順を採らなかった理由は [investigation.md](./investigation.md#逆順合宿系を先を採らなかった理由)。

### PR0 — 出典欄の書式変更（DB 変更なし）

| #   | 内容                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-1 | `addContestNameToTaskIndex`（`src/lib/contests/utils/task_index_label.ts`）の AOJ 分岐を `${contestName} - ${taskTableIndex}（AOJ）` にする（G1）                                           |
| 0-2 | `getAojContestLabel` / `getAojUniversityContestLabel`（`src/lib/contests/utils/labels/aoj.ts`）から全角括弧を外す（M11）                                                                    |
| 0-3 | テスト: `task_index_label.test.ts`、`labels/aoj.test.ts`、`labels/index.test.ts` と、fixture の `contest_name_labels.ts` / `contest_name_and_task_index.ts` の AOJ 部分の期待値を書き換える |

PR0 時点の出典欄は `ICPC 国内予選 2024 - 3467（AOJ）`（index は数値のまま）で、PR1 の移行で `ICPC 国内予選 2024 - F（AOJ）` になる。合宿系・大学系・Courses・PCK も同じ書式になる（[スコープ外](#スコープ外残タスク)）。変更後の形式で登録済みの `AOJ-KUPC2011` は `KUPC 2011 - I（AOJ）` になる。

### PR1 — ICPC 国内予選 / アジア地区 / JAG 模擬国内（79 コンテスト / 632 問）

| #   | 内容                                                                         | 補足                                                                         |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1-0 | 対応表の生成と検証（Phase 0 / M6）                                           | `generate_aoj_problem_letters.ts`（[Phase 0](#phase-0-の内訳1-0--2-0-共通)） |
| 1-1 | 取り込み時に基本ルールで記号を付ける（M5）                                   | [契約](#1-1-の契約)                                                          |
| 1-2 | `prisma/tasks.ts` の 632 件の `problem_index` と、2279 の title を書き換える | 1-0 の出力で置き換える                                                       |
| 1-3 | 移行 SQL（632 件 + 2279 の title 1 件）（M2 / M8）                           |                                                                              |
| 1-4 | `sortAojHeaderIds` の comparator を `localeCompare` へ（M4）                 | 順序の制約は無い（下記）                                                     |
| 1-5 | `buildAojLetterMap` / `AOJ_LABEL_OVERRIDES` / `formatAojTitle` を削除（M7）  | G2 の本体。**1-6 と同じコミットで、1-6 の後に消す**（下記）                  |
| 1-6 | `getTaskLabels` を削除し、セルは `task_table_index` から表示する（M10）      | [契約](#1-6-の契約)                                                          |
| 1-7 | テスト                                                                       | [一覧](#1-7-のテスト)                                                        |
| 1-8 | 手順書の更新                                                                 | 下記                                                                         |
| 1-9 | 生成スクリプトを削除する                                                     | 追加とは別のコミットで消し、git の履歴から辿れるようにする                   |

1-4 に順序の制約は無い。同じ PR の中なら CI がデプロイより先にマイグレーションを流すうえ、PR1 範囲の問題ID はすべて 4 桁なので、数値のままでも `localeCompare` で正しく並ぶ。

1-5 は単独では消せない。`buildAojLetterMap`（と、その中だけで使う `AOJ_LABEL_OVERRIDES`）の呼び出し元は AOJ の `getTaskLabels`（`aoj_icpc_providers.ts:51,95`、`aoj_jag_providers.ts:60`）だけで、`formatAojTitle` の呼び出し元は `TaskTableBodyCell.svelte:37` だけである。どれも 1-6 で消えるので、1-6 → 1-5 の順に同じコミットで行う。先に 1-5 だけ消すとビルドが壊れる。`aoj_labels.ts` の残り（`AOJ_TITLE_STYLE` / `sortAojHeaderIds` / `buildAojDisplayConfig`）は Provider が使い続けるので消さない。

1-8 で直す手順書:

- `.agents/skills/add-contest-table-provider/instructions.md:85` と `docs/guides/how-to-add-contest-table-provider.md:83` から、削除する `getTaskLabels` / `AOJ_LABEL_OVERRIDES` への言及を外す
- `.agents/skills/add-tasks/instructions.md` に「ICPC / JAG 模擬国内の `problem_index` は問題記号にする」を足す。seed に手で足すと数値の index が混ざるため

PR1 は動作中の 3 Provider を改修するため、**regression の確認が主なレビュー観点**になる。

**PR1 はクロスレビューが必須**。データ移行を含み、共有インターフェイス `ContestTableProvider` から `getTaskLabels` を消すため、AGENTS.md の「DB schema, migrations, or data transformations」と「Shared architecture or public interface changes」の両方に当たる。PR を出す前に Codex でクロスレビューを行う（使えなければ `coderabbit review --plain`）。

#### 1-1 の契約

```typescript
// src/lib/clients/aizu_online_judge/utils.ts
// Assign A, B, C... to problem ids in ascending numeric order (the basic rule).
export function assignProblemLetters(problemIds: string[]): Map<string, string>;

// problemIndex defaults to the AOJ problem id, as before.
export function mapToTask(
  problem: AOJTaskAPI,
  contestId: string,
  problemIndex: string = problem.id,
);
```

`AojChallengesApiClient.getTasks`（`src/lib/clients/aizu_online_judge/clients.ts:91-99`）は、`contestType === 'ICPC'` または `contestType === 'JAG' && round === 'PRELIM'` のときだけ記号を付ける。取り込み時の `contest_id` は `contest.abbr` でコンテスト単位なので、日ごとではなく `contest.days.flatMap((day) => day.problems)` にまとめて `assignProblemLetters` を当てる。PCK は数値のまま（[スコープ外](#スコープ外残タスク)）。JAG 模擬地区は PR1 では数値のままとし、PR2 で記号にする（M14）。合宿系は管理画面から取り込めない（`JagRound` は `PRELIM` / `REGIONAL` のみ）。

`contest.abbr` が seed の `contest_id` と一致することは、AOJ API へのアクセスが許可されず直接は確かめていない。ただし本番の ICPC / JAG 模擬国内は管理画面からの取り込み（`contest.abbr` をそのまま `contest_id` にする）で入っており、本番と seed の件数は一致する。

#### 1-6 の契約

`getTaskLabels` は全 Provider が実装する共有インターフェイスに定義されているが、ICPC 国内予選の記号表示のために追加されたもの（`15f498f8`、2026-06-11）で、DB の index が数値であることが存在理由である。32 の Provider のうち上書きしているのは AOJ ICPC / JAG の 3 つだけで、残りは基底クラスの `{}` を受け継ぐだけなので、消しても動作は変わらない。呼び出し元は `TaskTable.svelte` だけで、`TaskTableBodyCell` を使うのも `TaskTable.svelte` だけである。合宿系・大学系・Courses・PCK・JAG 模擬地区には Provider が無い。AOJ の上書きには `override` が付いているので、消し忘れは型検査で検出される。

後続の PR に分けて、インターフェイスの `getTaskLabels` だけを残す案は採らない。上書きする Provider が 0 になり、使われないコードが残るため。

| 対象                                                                                                                                                                                   | 変更                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `ContestTableProvider`（`contest_table_provider.ts:80`）、基底クラス（`contest_table_provider_base.ts:115`）、AOJ の上書き（`aoj_icpc_providers.ts:50,94`、`aoj_jag_providers.ts:59`） | `getTaskLabels` を削除                               |
| `TaskTable.svelte`（`:71,105,301,318`）                                                                                                                                                | `taskLabels` と `taskLabel` の受け渡しを削除         |
| `TaskTableBodyCell.svelte`                                                                                                                                                             | props から `taskLabel?: string` を削除し、表示は下記 |

```typescript
// src/lib/utils/task.ts
export const buildTitleWithTaskIndex = (title: string, taskTableIndex: string): string =>
  `${taskTableIndex}. ${removeTaskIndexFromTitle(title, taskTableIndex)}`;

// TaskTableBodyCell.svelte
let displayTitle = $derived(
  isShownTaskIndex
    ? buildTitleWithTaskIndex(taskResult.title, taskResult.task_table_index)
    : removeTaskIndexFromTitle(taskResult.title, taskResult.task_table_index),
);
```

AtCoder 側の表示は変わらない。`isShownTaskIndex: true` の Provider（典型 90 問 / ACL / 鉄則 / FPS 24 題 / アルゴリズムと数学 / 組合せゲーム 24 題 / AALC / DP / AWC）の title は `${task_table_index}. ` で始まるので、外してから付け直すと元に戻る。seed で title にプレフィックスの無い問題は `abs` の practice_1 だけで、ABS は `isShownTaskIndex: false` である。本番でも、プレフィックスの無い title はこの 1 件だけだった（2026-10-21 に集計）。

#### 1-7 のテスト

| 区分     | 対象                                                                                                                                                                                                                                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 削除     | `aoj_labels.test.ts` の `buildAojLetterMap` と `formatAojTitle`、`contest_table_provider_base.test.ts:27-37`（`getTaskLabels` の既定値）、`aoj_icpc_providers.test.ts` / `aoj_jag_providers.test.ts` の `getTaskLabels` のケース、`aoj_icpc_providers.test.ts` の `override map path`（3 か所。`AOJ_LABEL_OVERRIDES` を使う。うち 1 つは `generateTable` のテスト）                        |
| 書き換え | `aoj_icpc_providers.test.ts` / `aoj_jag_providers.test.ts` / `aoj_labels.test.ts` の fixture の `task_table_index` を数値から記号へ（`sortAojHeaderIds` の期待値を含む）                                                                                                                                                                                                                   |
| 追加     | `buildTitleWithTaskIndex` の単体テスト（`src/lib/utils/task.test.ts` を新設）、`assignProblemLetters` と `getTasks` の記号付与（`utils.test.ts` / `clients.test.ts`）、`prisma/tasks.ts` の ICPC / JAG 模擬国内の `problem_index` が `assignProblemLetters` の結果と一致する整合テスト（`src/lib/clients/aizu_online_judge/` に置く。src のテストから `prisma/tasks.ts` を読む前例は無い） |
| 手動     | コンテスト表には E2E テストもコンポーネントテストも無い。PR1 の前後でコンテスト表のスクリーンショットを比べ、79 コンテストの表示が変わらないことを確かめる。2026-10-21 に撮ったスクリーンショットを基準にする                                                                                                                                                                              |

書き換えたテストと追加したテストには `verify-test-strength` skill を当てる。

#### PR1 の範囲の本番データ

本番の ICPC 国内予選 / アジア地区 / JAG 模擬国内は 79 コンテスト / 632 問で、seed と一致する（2026-10-21 に集計、[内訳](./investigation.md#本番の件数2026-10-21)）。本番の `AOJ_JAG` が seed より多い分（16 コンテスト / 158 問）は JAG 模擬地区で、PR1 の移行 SQL の条件から外れる（PR2 で扱う）。

#### PR1 の実施記録（2026-10-24）

移行 SQL は `prisma/migrations/20261024033928_update_aoj_task_table_index/migration.sql`。

適用前の確認（ローカル DB、手順 3）:

- `migration.sql` の CTE と外側の `WHERE` をそのまま使い、`UPDATE` を `SELECT` に置き換えて「現在値 → 変更後」を出した。632 行 / 79 コンテスト、`task_id` の重複なし、全行で現在値 = `task_id`（数値）
- 生成スクリプトの JSON（632 件）と突き合わせ: 片側にしか無い ID 0、記号の不一致 0
- 現行の表示ロジック（`buildAojLetterMap`）を現在値に当てた記号とも突き合わせ: 不一致 0。各コンテストの記号は A から連続
- 2279 の title 更新対象は 1 行
- `EXPLAIN`: `task` の Seq Scan 2 回（CTE と外側。`contest_type` に索引が無いため想定どおり）+ Hash Join

適用後の確認（手順 4）:

- 632 行がプレビューの記号と一致。範囲外の AOJ（合宿系・模擬地区 518 行、PCK、Courses、大学系）は数値の index のまま。2279 は `I` / `Mountain`
- 旧コード（`Number` ソート + `buildAojLetterMap` + `formatAojTitle`）で適用前のデータを描画した結果と、新コード（`localeCompare` + `buildTitleWithTaskIndex`）で適用後のデータを描画した結果が、79 コンテストすべてで列順・セルの文字列とも一致した。スクリーンショットによる目視確認（1-7 の手動）は未実施
- `removeTaskIndexFromTitle` は当初 `"{index}. "` の最初の出現を位置を問わず消していた。title の途中に `"{記号}. "` を含む問題は seed にも DB にも無い（0 件）が、レビューを受けて先頭のプレフィックスだけを消すよう直した（下記）

計画からの差分:

- AOJ API の JAG 模擬国内には 2 日開催のコンテスト（fixture の `JAGPrelim20162`、2738–2751）がある。取り込み時の `contest_id` は日ではなくコンテスト単位なので A–N になる（日ごとに振ると同じ `contest_id` に A–G が重複する）。seed / 本番は `JAGPrelim2016A` / `B` に分かれており、取り込みは既存 ID を skip するため影響しない

テストの検出力（`verify-test-strength`）: 次の 15 個の変異をすべて検出した。`assignProblemLetters` の数値→辞書順ソート / 降順 / 記号の開始位置 / 入力の破壊、`mapToTask` が `problemIndex` を無視、`getTasks` の JAG 条件の反転 / 全種別に記号 / 1 日目だけで記号付与、seed の 1 件を数値に戻す / A・B の入れ替え、`sortAojHeaderIds` の降順 / `Number` 比較 / 重複除去なし、`buildTitleWithTaskIndex` の除去なし / title をそのまま返す。単独で検出する変異が無いテストは seed 整合テストの `ICPC Prelim 2024 F is problem 1677` だけだが、このファイルで唯一の literal な期待値（対応表とデータが一緒にずれた場合の歯止め）なので残した。

クロスレビュー（Codex、2026-10-24）: 移行 SQL に不具合の指摘は無かった。指摘 3 件はいずれも PR1 では対応せず、残タスクとする。

| 指摘                                                                                                                                            | 扱い                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Moderate: API の `JAGPrelim20162`（2 回開催）を取り込むと、2745 が seed の `A` ではなく `H` になる                                              | **残タスク**。本番には影響しない: 本番の `contest_id` は `JAGPrelim2016A` / `B` が各 7 問に分かれており（2026-10-24 に本番で確認）、移行 SQL は `contest_id` ごとに採番するので各 A–G になる。取り込みは既存の `task_id` を skip する。直すなら、取り込み時に 2 回開催を seed と同じ `A` / `B` の `contest_id` に分け、それぞれ A から振る |
| Minor: seed 整合テストの期待値を本番関数 `assignProblemLetters` で作っており、testing.md の「期待値は literal」に合わない                       | **残タスク**。記号自体の正しさは生成スクリプトの照合で確認済みで、このテストは取り込みとの整合を見るもの。literal な fixture（632 件）を足すかは別途判断する                                                                                                                                                                               |
| 潜在リスク: `src/lib/services/tasks.ts` の `title.replace(task_table_index, …)` は、AOJ の問題に ContestTaskPair を作るとタイトル本文を置換する | **残タスク**。AOJ の pair は現在 0 件。直すときは先頭の `${index}. ` だけを置換し、`Amidakuji` のような本文と `A. Title` の両方を回帰テストに含める                                                                                                                                                                                        |

CodeRabbit のレビュー（2026-10-24）:

| 指摘                                                                                            | 扱い                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `clients.ts`: 2016 年の 2 回開催を `JAGPrelim2016A` / `B` に分けて取り込み、それぞれ A から振る | **見送り**。Codex の Moderate と同じ指摘で、上表のとおり残タスク。直すなら `getContests` 側も同じ `contest_id` に揃える必要がある                                                                |
| `task.ts`: `removeTaskIndexFromTitle` は先頭のプレフィックスだけを消す                          | **対応**。index が空のときに title 途中の `. ` まで消えていた（`Dr. Podboq` → `DrPodboq`）点も直る。seed と DB（ローカル 2,832 件）に途中だけに現れる title は無く、既存データの表示は変わらない |
| `buildTitleWithTaskIndex` のテストを `task.ts` に隣接するファイルへ移す                         | **対応**。`src/lib/utils/task.test.ts` を新設（`task_grade` と同じく、新しいテストは隣接、既存は `src/test/` に残す）。`removeTaskIndexFromTitle` の先頭限定のテストもここに置いた               |

### PR2 以降の着手前の確認事項

メンテナに依頼する（2026-10-24 時点）。

| #   | 対象  | 内容                                                                                                         | 使い道                                                                                                             |
| --- | ----- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Q1  | PR2   | 本番と staging で SQL A を流す                                                                               | 件数チェックの想定値（合宿系 50 / 467、模擬地区 16 / 158）、index が問題 ID のままか、title のプレフィックスの有無 |
| Q2  | PR2   | 本番で SQL B を流し、結果を JSON か CSV で渡す                                                               | 模擬地区 158 問の seed（M12）                                                                                      |
| Q3  | PR2.1 | 2025 / 2026 夏合宿 6 コンテストの contest_id（`JAGSummer2025-day1` の形でよいか）と、各問題の AOJ の問題番号 | seed・CSV・並び順の配列                                                                                            |
| Q4  | PR2.1 | in AtCoder の 4 コンテストの、AtCoder 上の contest_id                                                        | `ATCODER_JAG` の分類・ラベル・並び順の配列                                                                         |
| Q5  | PR2.1 | 既存の合宿系を CSV で入れたときの列と、`id` の作り方（SQL C で確かめられる）                                 | CSV の作り方                                                                                                       |
| Q6  | PR3   | 模擬地区 2013 の A〜C のリンク先（AOJ の問題番号）と、AOJ に 3643 があるか                                   | 欠落の分類（3-0）。PR2 の記号には影響しない                                                                        |

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

-- SQL C: whether existing ids follow the import's sha256(contest_id + task_id).
SELECT contest_id, task_id,
       id = encode(sha256(convert_to(contest_id || task_id, 'UTF8')), 'hex') AS is_import_hash
FROM task
WHERE contest_id IN ('JAGSummer2024-day3', 'JAGRegional2022')
ORDER BY contest_id, task_id
LIMIT 6;
```

### PR2 — JAG 夏 / 冬 / 春合宿 + JAG 模擬地区（66 コンテスト / 625 問）

2026-10-24 に範囲を見直した。JAG 模擬地区（本番のみ 16 / 158）を加え（M12）、新しいデータ（PR2.1）と Provider（PR2.5）を分けた。

| #   | 内容                                                                                   | 補足                                                                                                           |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 2-0 | 対応表の生成と照合（Phase 0 / M6）                                                     | PR1 のスクリプトを直して使う（[Phase 0](#phase-0-の内訳1-0--2-0-共通)）。目視の暫定結果では補正は 8 コンテスト |
| 2-1 | seed に模擬地区 158 問を追加する                                                       | Q2 の値。最初は本番と同じ形（index = 問題 ID、素の title）で入れ、2-0 の照合の入力にする                       |
| 2-2 | 取り込みで、JAG は全 round で記号を付ける（M14）                                       | `usesProblemLetters` を `contestType === 'ICPC' \|\| contestType === 'JAG'` にする                             |
| 2-3 | `prisma/tasks.ts` の 625 件の `problem_index` と、合宿系 467 件の `title` を書き換える | 2-0 の出力で置き換える                                                                                         |
| 2-4 | 移行 SQL（M2 / M8 / M9 / M13）                                                         | [PR2 の SQL](#pr2-の-sql)                                                                                      |
| 2-5 | テスト                                                                                 | 下記                                                                                                           |
| 2-6 | 手順書                                                                                 | `add-tasks` の「ICPC / JAG 模擬国内の `problem_index` は問題記号にする」を JAG 全体に広げる                    |
| 2-7 | 照合スクリプトを削除する                                                               | PR1 と同じく、追加とは別のコミット                                                                             |

2-5 のテスト:

- `seed_problem_letters.test.ts` の範囲を 145 コンテスト / 1,257 問に広げる。補正していないコンテストは `assignProblemLetters` と一致し、補正した 8 コンテストは期待値を literal で書く（M18）。合宿系の title が `${problem id}. ` で始まらないことも見る
- `clients.test.ts`: JAG REGIONAL の取り込みで記号が付く。`usesProblemLetters` の JAG 条件を PRELIM だけに戻す変異を検出できること
- 書き換えたテストと追加したテストに `verify-test-strength` を当てる

PR2 の時点では、合宿系・模擬地区のコンテスト表はまだ無い。表示は問題一覧の出典欄（例: `JAG 夏合宿 2024 Day3 - H（AOJ）`）と title で確かめる。

**PR2 はクロスレビューが必須**（データ移行）。

### PR2.1 — 新しいデータの追加（10 コンテスト / スプレッドシート上 114 問）

DB に無い 10 コンテスト（[一覧](./investigation.md#db-に無いコンテスト)）を入れる（M17）。PR2 / PR2.5 とは前後してよい。

| #     | 内容                                                | 補足                                                                                                                                                                                                                                                                                                             |
| ----- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1-0 | `ATCODER_JAG` を新設する                            | `add-contest-table-provider` の Layer 1–3。schema の enum・`ContestType`・`contestTypePriorities`（18 にして `UNIVERSITY` 以降を +1）・`CLASSIFICATION_RULES` のいずれも `UNIVERSITY` の直前。`prefixes.ts` に `ATCODER_JAG`（contest_id → ラベル）を置き、4 つを完全一致で分類する。`LABEL_GENERATORS` にラベル |
| 2.1-1 | in AtCoder の 4 コンテストを seed に追加する        | AtCoder Problems の値（index は記号、title は `A. …`）。本番は管理画面の AtCoder 取り込みで入る（分類されれば skip されない）                                                                                                                                                                                    |
| 2.1-2 | 2025 / 2026 夏合宿の 6 コンテストを seed に追加する | 記号と素の title で書き、スプレッドシートと照合する                                                                                                                                                                                                                                                              |
| 2.1-3 | staging / production に Supabase の CSV で入れる    | 既存の合宿系と同じ方法。**その環境に PR2 の移行を適用した後**に入れる                                                                                                                                                                                                                                            |
| 2.1-4 | テスト                                              | 分類・優先度・ラベル（Layer 3）。seed の検査に 2025 / 2026 を足す                                                                                                                                                                                                                                                |

- 優先度をずらすので、`priority.ts` の JSDoc の範囲と、`src/test/lib/utils/task.test.ts` の優先度の差の期待値（ずれた項目を含むものだけ）を直す
- in AtCoder の contest_id が `regexForJag` に当たらないこと（当たると `getTaskUrl` が AOJ の URL を作る）を確かめる。AtCoder の contest_id は小文字の `jag…` の見込みで、`regexForJag` は `JAG(Prelim|…)` の大文字始まりなので当たらない
- CSV: `id` は取り込みと同じ `sha256(contest_id + task_id)`（16 進）にする（既存分の作り方は Q5）。`updated_at` は DB に既定値が無い（`@updatedAt` は Prisma 側の実装）ので CSV に含める。`created_at` / `grade` / `atcoder_problems_difficulty` には既定値がある。CSV の投入は `invalidateTaskCaches()` を経ないので、反映はキャッシュの TTL（1 時間）の後になる

**PR2.1 もクロスレビューが必須**（enum の追加は DB schema の変更）。

### PR2.5 — Provider（76 コンテスト、グループ「JAG 模擬地区」）

| #     | 内容                                                                                      |
| ----- | ----------------------------------------------------------------------------------------- |
| 2.5-1 | 並び順と括弧書きの配列（76 件）                                                           |
| 2.5-2 | Provider クラス（1 コンテスト = 1 テーブル）                                              |
| 2.5-3 | グループ「JAG 模擬地区」を、`contestTableProviderGroups` の `aojJagPrelim` の後に登録する |
| 2.5-4 | テスト（Provider とグループ）                                                             |

- 1 つのグループ（グループ名・ボタン名とも「JAG 模擬地区」）に、合宿系・模擬地区・in AtCoder のテーブルをコンテストごとに並べる（M15）
- 並びは、スプレッドシートの行順（新しいものが上）。contest_id からは導けないので（例: 2014 は 夏合宿 Day2 → 模擬地区（Day3 として開催）→ 夏合宿 Day4。冬合宿 2010 は 夏合宿 2011 の後）、明示的な配列で持つ。一覧は [investigation.md](./investigation.md#表示順76-コンテスト)
- テーブル名は `getContestNameLabel(contestId)` に括弧書きを付ける（M16）。例: `JAG 夏合宿 2024 Day2（有志）`、`JAG 模擬地区 2016（in JAG 夏合宿 2016 Day3）`、`JAG 春合宿 2015（JAG）`、`JAG 夏合宿 2015 Day3`（in AtCoder・過去問なので括弧なし）
- 出典欄は変えない。この配列は #4018 でコンテスト情報を DB に移すときの移行元になる
- 配列には PR2.1 の 10 件も入れる。データが無い間は表示されないので、PR2.1 より先に出してよい。そのため Q3 / Q4 の contest_id は PR2.5 までに確定させる
- Provider の `contestType` は全件 `AOJ_JAG` にする（provider key の名前空間として使うだけ。`getTaskTableHeaderName` での違いは ABC の H/Ex だけ）。`ATCODER_JAG` に依存しないので、PR2.1 と順序を問わない

```typescript
// src/features/tasks/utils/contest-table/jag_contest_table_entries.ts
export type JagContestTableEntry = {
  contestId: string;
  // Bracketed note after the contest name: 'JAG', '有志' or 'in JAG 夏合宿 2016 Day3'.
  note?: string;
};

export type JagContestTableEntries = JagContestTableEntry[];

// Newest first, following the maintainer's spreadsheet; contest ids cannot give this order.
export const JAG_CONTEST_TABLE_ENTRIES: Readonly<JagContestTableEntries>;

// src/features/tasks/utils/contest-table/aoj_jag_providers.ts
export class JagContestProvider extends ContestTableProviderBase {
  // section = contestId, so the provider key is e.g. AOJ_JAG::JAGSummer2024-day2.
  constructor(contestType: ContestType, entry: JagContestTableEntry);
  // filter: contest_id === entry.contestId
  // getHeaderIdsForTask: sortAojHeaderIds / getDisplayConfig: buildAojDisplayConfig
  // getMetadata(): { title: name + （note）, abbreviationName: contestId, titleStyle: AOJ_TITLE_STYLE }
}
```

テスト: グループの `getSize()` が 76、先頭と末尾、2014 の 3 件の並び、括弧書きの有無の 3 種（`JAG` / `in …` / なし）のテーブル名。

PR2.5 は DB を変えず、共有インターフェイスも変えないので、クロスレビューの条件には当たらない。

### PR3 — 欠落問題の補完

**実施する。ただし着手前に調査フェーズを置く。**

欠落には 2 種類あり、扱いが異なる。

- **AOJ に問題はあるが、コンテスト一覧に無い**（例: ICPC 国内予選 2002 の E = AOJ 1123。AOJ の Sources > ICPC - Prelim では 2002 年の問題として表示される）: ダミーは不要で、実在の ID で通常の問題として登録できる。ただし管理画面の取り込みは一覧を使うので取り込めない。seed への追加と、本番には移行 SQL の INSERT が要る
- **AOJ に問題そのものが無い**: ID が無いので、下記のダミー Task レコードの設計が要る

2026-10-24 にスプレッドシートと照合した結果（[一覧](./investigation.md#欠落の一覧pr3)、目視の暫定値）:

- PR2 の範囲で「AOJ 未収録」が 22 問（合宿系 18 / 模擬地区 4）。後者の種類（ダミーが要る）の候補
- 模擬地区 2013 の A〜C は、スプレッドシートにリンクがあるのに AOJ のコンテスト一覧に無い。前者の種類（ICPC 国内予選 2002 の E と同じ）の候補で、AOJ の問題番号を確かめる（Q6）
- 夏合宿 2024 Day3 の G（未収録）は、問題 ID 3643 の欠番に当たる。AOJ に 3643 があるかを確かめる（Q6）
- PR2 で記号を補正するので、これらを後から足しても既存の記号はずれない

| #   | 内容                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------- |
| 3-0 | **要調査**。PR1 / PR2 で判明した欠落について、AOJ に問題番号で存在するかを確かめて上の 2 種類に分け、実数と分布を確認する |
| 3-1 | 一覧に無いだけの問題を、通常の問題として登録する（seed と移行 SQL）                                                       |
| 3-2 | AOJ に無い問題のダミー Task レコードの設計 → 実装                                                                         |

3-2 で決めること:

- **`task_id` の採番**。AOJ に無い問題には ID が存在しないため、衝突しない採番規則が要る
- **提出リンクの扱い**。リンク先が存在しないので無効化するか、表示自体を変えるか
- **投票 / タグ / 問題集への登場可否**。FK が `task_id` 参照であるため、ダミーを入れると各機能に波及する

**PR1 / PR2 のデータ移行とは性質が異なる**（既存データの正規化ではなく、新しいレコードの設計判断）ため独立させる。

### Phase 0 の内訳（1-0 / 2-0 共通）

1. **基本ルールで対象範囲のコンテストをスクリプト生成** — 現行の導出と同じ結果になるので、この時点でコンテストテーブルの表示は現状と一致する
2. **コンテスト単位で欠落の有無を外部情報から確認** ← 人手が必要なのはここだけ。外部情報は**メンテナが管理している問題一覧のスプレッドシート**
3. 欠落が途中にあるコンテストだけ、記号を手で補正する（末尾の欠落は記号がずれないので補正不要）
4. 欠落した問題が AOJ に問題番号で存在するか（一覧から外れているだけか）を確かめ、PR3 に引き継ぐ

**1 で大半が埋まる。** 残るのは 2 の確認作業で、PR1 が 79 コンテスト、PR2 が 66 コンテスト。欠落が集中するのは PR2 の古い合宿系（2006〜2007）。

> **注意**: 「これまで正しく見えていた」は「欠落が無い」の証明ではない。欠落があっても表示は成立してしまう（前詰めでズレた記号が出るだけ）。 **PR1 でも確認工程 2 は省略しないこと。**

**生成スクリプトには総数のアサーションを入れる。** 抽出漏れが欠落の誤検出に直結する（調査中に実際に踏んだ。[事例](./investigation.md#5-調査中の誤りと訂正自戒)）。抽出件数が対象範囲の既知の値（PR1 は **79 コンテスト / 632 問**、PR2 は 66 / 625）と一致しなければ**エラーで停止**する。欠落として扱わない。

PR1 は `generate_aoj_problem_letters.ts` で行う（1-9 で削除済み。`git show 171bf3c9:docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_problem_letters.ts` で参照できる）。`prisma/tasks.ts` を直接 import するので、正規表現による抜き出しで取りこぼすことはない。

照合の内容:

- スプレッドシートのタイトルを記号順に書き写し（79 コンテスト / 633 問。AOJ のコンテスト一覧に無い 1 問を含む）、基本ルールで付けた記号の位置ごとに AOJ のタイトルと照合する。問題数・途中の欠番・**コンテスト内の順番の入れ替わり**まで検出できる
- 大文字小文字・空白・記号の違いは無視する。スプレッドシートのセル幅で末尾が切れていた 4 件は、推測で補わずに `…` を付け、見えている部分の前方一致で照合する
- 1 件でも合わなければ、対応表を出力せずに終了コード 1 で止まる
- わざと誤りを入れたコピー 5 種類（順番の入れ替え、途中のタイトルの誤り、途中の欠番、問題数の不足、`…` 付きタイトルの前半の誤り）で、すべて検出されることを確かめた

確認できないこと: スプレッドシート自体の誤りと、書き写しの際にスプレッドシートと AOJ の両方と同じ誤りをした場合。書き写しは 2026-10-21 のスクリーンショットからの一度きりの手作業である。

実行方法と期待する出力（終了コード 0）:

```bash
pnpm exec tsx docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_problem_letters.ts
# stderr:
#   Contests: 79, tasks: 632
#   Absent from prisma/tasks.ts: ICPCPrelim2002 E
#   All 632 titles match the official letters
# stdout: JSON (problem id -> letter, 632 entries)
```

stdout の JSON は 1-2 で `prisma/tasks.ts` を書き換えるときに使う。リポジトリには残さない（スクリプトを実行すれば同じものが得られる）。

PR1 の結果（2026-10-21）:

- 632 問すべてのタイトルが記号の位置で一致し、補正が要るコンテストは無い
- ICPC 国内予選 2002 の E（Enclosing Circles）は、AOJ に問題 1123 として存在するがコンテスト一覧に無く、`prisma/tasks.ts` にも本番にも無い。末尾の欠番なので A〜D の記号はずれない。PR3 で通常の問題として登録する対象（ID は A〜D の 1119〜1122 と 2003 年の A の 1124 の間）

PR2（2-0）は、PR1 のスクリプト（`git show 171bf3c9:…`）を次のように直して使う:

- 対象は `^JAG(Summer|Winter|Spring|Regional)` の 66 コンテスト / 625 問。模擬地区は 2-1 で seed に足してから読む。PR2.1 の 10 コンテストは含めない
- 書き写しの元は 2026-10-24 のスクリーンショット（スプレッドシート 16 枚、行 2〜1025）
- PR1 では記号を基本ルールで付け、位置ごとに照合した。PR2 では先頭・途中の欠落（`absentLetters`）があるので、記号はスプレッドシートの位置（欠落を飛ばした位置）から決める。基本ルールと違うコンテストは別に出力し、移行 SQL の補正（`VALUES`）に使う
- 期待する出力: 補正が要るのは 8 コンテスト / 45 行（目視の暫定値。[照合結果](./investigation.md#記号の補正が要るコンテスト)）。合わなければ、どちらが正しいかを個別に確かめる
- スプレッドシートのセルで末尾が切れていた `Person responsible for problem description don't w`（夏合宿 2010 Day2 の J）は、AOJ の title 自体も同じ所で切れている。前方一致の扱いは要らない

### テストの注意

テスト約 2,000 行と出典欄の fixture が、数値 index と全角括弧を前提にしている。全角括弧の分は PR0（0-3）、数値 index の分は PR1（[1-7](#1-7-のテスト)）で直す。作業は機械的だが、期待値を新形式へ一括置換すると **テストが仕様を検証しなくなる**。`docs/guides/agent-rules/testing.md` の Test integrity と `verify-test-strength` skill の適用対象。内訳は [investigation.md](./investigation.md#テストの影響範囲)。
