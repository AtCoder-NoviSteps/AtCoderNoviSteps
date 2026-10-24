# AOJ ICPC / JAG の `problem_index` を A/B/C 形式へ変更する

**日付**: 2026-09-09（2026-10-21 に現行コードと再照合し、参照・数値を更新）／ **状態**: 調査完了・実装未承認 **実測データと検討の経緯は** [investigation.md](./investigation.md)

## ゴール

`problem_index`（DB 上は `task_table_index`）に AOJ 問題ID ではなく**問題記号**を持たせ、 **表示側が変換なしにそれを使える状態にする。**

> **問題記号**: `A`, `B`, `C`… のように、そのコンテスト内で何番目の問題かを表す記号。AtCoder では `abc300_a` の `a` にあたる。AOJ には存在しない（難所 1）。コード上は `letter`。

|                                        | 現在                                        | 目標                                         |
| -------------------------------------- | ------------------------------------------- | -------------------------------------------- |
| **G1** 出典欄（`TaskList.svelte:124`） | `AOJ 3467（ICPC 国内予選 2024）`            | `ICPC 国内予選 2024 - F（AOJ）`              |
| **G2** コンテストテーブル              | 問題ID 3467 → ソート位置から `F` を**算出** | `task_table_index` の `F` を**そのまま使う** |

G2 は「アドホックな変換をなくす」ことが本体。位置ベース導出（`buildAojLetterMap`）が残る限りゴール未達になる。

### 対象と PR 分割

**全体で 1,099 問 / 129 コンテスト。**

|         | 範囲                                      | コンテスト | 問題数 | Provider | 到達点                                       |
| ------- | ----------------------------------------- | ---------- | ------ | -------- | -------------------------------------------- |
| **PR0** | 出典欄の書式（AOJ 全体）                  | —          | —      | —        | G1 の書式を先に入れる（index は数値のまま）  |
| **PR1** | ICPC 国内予選 / アジア地区 / JAG 模擬国内 | 79         | 632    | 実装済み | G1 / G2 をこの範囲で達成                     |
| **PR2** | JAG 夏合宿 / 冬合宿 / 春合宿              | 50         | 467    | 未実装   | 残りに拡大 + Provider 追加                   |
| **PR3** | 欠落問題の補完                            | —          | —      | —        | AOJ のコンテスト一覧に無い問題をどう埋めるか |

PR1 / PR2 は「AOJ のコンテスト一覧にある問題の記号を正しくする」で完結し、PR3 に進まなくても機能として成立する。

### スコープ外（残タスク）

PR0 の書式変更は出典欄の AOJ 分岐全体に効くが、index を記号にするのは ICPC / JAG 模擬国内 / JAG 合宿系だけである。次の範囲は数値の index のまま残し、別タスクとする。件数は本番の集計（2026-10-21）。

| 範囲         | 本番の件数（コンテスト / 問題） | PR0 後の出典欄                                        | 残す理由                                                  |
| ------------ | ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| AOJ Courses  | 8 / 247                         | `プログラミング入門 - ITP1_1_A（AOJ）` のように不格好 | 問題ID が非数値で、基本ルールの `task_id::int` が使えない |
| AOJ PCK      | 1 / 12                          | 数値の問題ID のまま                                   | 優先度が低い                                              |
| AOJ 大学系   | 27 / 30                         | `UTPC 2010 - 2207（AOJ）`                             | 優先度が低い（2279 だけは記号で登録済み）                 |
| JAG 模擬地区 | 16 / 158                        | 数値の問題ID のまま                                   | 本番にしか無く（seed は 0 件）、Provider も無い           |

## 3 つの難所

**難所 1: 問題記号は AOJ API から取得できない。** `mapToTask`（`src/lib/clients/aizu_online_judge/utils.ts:65`）のコメントが明言しているとおり、API は「その問題がコンテストで何番目か」を返さない。現在の数値は問題ID の代用。

ただし**基本ルール**（コンテスト内で問題ID が若い順に `A`, `B`, `C`…）で復元できる。これは現行 `buildAojLetterMap` の導出と同一なので、**生成した対応表は現在の表示を再現する**。PR1 の回帰確認はここに依拠できる。⇒ 対応表はスクリプトで機械生成できる。

**難所 2: 欠落があると基本ルールが破れる。しかも欠落は検出できない。** ここでの欠落は、公式の問題が AOJ のコンテスト一覧（管理画面の取り込み元）に無いことを指す。AOJ に登録されていない問題なら **ID も無い**ため、残った問題の ID は連番のままになる。AOJ に問題はあるのに一覧から外れている場合もある（ICPC 国内予選 2002 の E = AOJ 1123）。どちらの場合も、コンテスト内の連番性は欠落の有無を何も語らない。⇒ **コンテスト単位で外部確認するしかない**（唯一の手作業）。

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

## 決定事項

| #   | 決定                                                                      | 理由                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | DB の値そのものを A/B/C に直す                                            | 難所 3                                                                                                                                                                                                                |
| M2  | 移行 UPDATE を実施する                                                    | 破壊的変更 1                                                                                                                                                                                                          |
| M3  | JAG 合宿系 467 問も対象に含める（PR2 に分割）                             | seed にデータがあり Provider だけが無い                                                                                                                                                                               |
| M4  | `sortAojHeaderIds` の comparator を `localeCompare` へ                    | 破壊的変更 2                                                                                                                                                                                                          |
| M5  | 管理画面からの取り込み時に、ICPC / JAG 模擬国内は基本ルールで記号を付ける | 放置すると次回の取り込みで数値 index が再混入する。毎年の新しいコンテストも追記なしで記号になる                                                                                                                       |
| M6  | 対応表は基本ルールで生成し、欠落確認は人間が行う                          | 難所 2                                                                                                                                                                                                                |
| M7  | `buildAojLetterMap` / `AOJ_LABEL_OVERRIDES` を削除                        | **G2 そのもの**                                                                                                                                                                                                       |
| M8  | 移行は Prisma のデータマイグレーションで適用                              | CI の既存の仕組みに乗る                                                                                                                                                                                               |
| M9  | PR2 で合宿系の `title` から数値プレフィックスを除去                       | 破壊的変更 5                                                                                                                                                                                                          |
| M10 | `getTaskLabels` を削除し、セル側を `task_table_index` 直参照へ            | 恒等マップを組む無駄を残さない。G2 の趣旨                                                                                                                                                                             |
| M11 | `getAojContestLabel` / `getAojUniversityContestLabel` から全角括弧を外す  | 出典欄の目標書式ではコンテスト名を括弧で囲まない（括弧は末尾の `（AOJ）` だけで、コードベースの慣習どおり全角）。AOJ 大学系も出典欄の AOJ 分岐（`isAojContest`）を通るため両方が対象。**他 5 箇所への波及を許容する** |

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

採用は**取り込み時の基本ルール**: `AojChallengesApiClient.getTasks` で、ICPC（国内予選 / アジア地区）と JAG 模擬国内のときだけ、コンテストの問題を ID 昇順に並べて A, B, C… を付ける（[1-1 の契約](#1-1-の契約)）。seed は生成スクリプトで書き換える。途中に欠番がある新しいコンテストでは記号がずれるが、気づけないのは現状の表示と同じである。見つかった時点で補正表を足す（PR1 の範囲では補正の必要が無いため、補正表は作らない）。

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
         )) AS letter
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

**範囲は `contest_type` だけでは絞れない。** 合宿系（`JAGSummer` / `JAGWinter` / `JAGSpring`）も模擬国内と同じ `AOJ_JAG` に分類される（`src/lib/contests/utils/classification.ts:76` の `regexForJag`）。`contest_type IN ('AOJ_ICPC', 'AOJ_JAG')` のままだと PR1 で合宿系 467 件まで更新される。そうなると破壊的変更 5 が PR1 で起き、欠落確認前の記号が合宿系に入る。このため `contest_id` の接頭辞で絞る。

PR2 の SQL は同じ形で、CTE と外側の `WHERE` の両方の条件を合宿系に差し替える。PR1 の範囲を含めたまま流すと、欠落対応で手補正した記号が基本ルールの値に戻るため、PR2 でも範囲を絞る。

```sql
-- PR2 scope: JAG training camps only.
contest_type = 'AOJ_JAG' AND contest_id ~ '^JAG(Summer|Winter|Spring)'
```

DB の実データに対して実行されるので seed との差異が問題にならない。 `task_id::int` は安全（129 コンテストすべてで問題ID が数値であることを確認済み）、1 コンテスト最大 14 問なので `chr(64 + n)` は A〜Z に収まる（`row_number()` は 1 始まりなので `chr(65)` = `A` から）。

読み方と計算量の分析は [investigation.md](./investigation.md#sql-の読み方)。

**PR1 のみ**: 2279 の `title` を素の形に揃える。index は本番も `I` で正しいため触らない。現在値を条件にしているので、既に揃っている環境では 0 件で終わる。

```sql
-- Align the AOJ-KUPC2011 title with the plain AOJ title format.
UPDATE "task"
SET "title" = 'Mountain'
WHERE "task_id" = '2279'
  AND "title" = 'I. Mountain';
```

**PR2 のみ**: `title` の正規化（M9）。`contest_type = 'AOJ_JAG'` には模擬国内も含まれるが、 `~ '^[0-9]+\. '` の条件で対象は合宿系のみになる。

```sql
-- Strip the legacy numeric-id prefix from AOJ training camp titles.
UPDATE "task"
SET "title" = regexp_replace("title", '^[0-9]+\. ', '')
WHERE "contest_type" = 'AOJ_JAG'
  AND "title" ~ '^[0-9]+\. ';
```

### 手順と確認

1. `pnpm exec prisma migrate dev --create-only --name update_aoj_task_table_index`
2. SQL + 例外の上書きを `migration.sql` に書く
3. **ローカル DB で `UPDATE` を `SELECT` に置き換えて「現在値 → 変更後」を確認する**
4. ローカルで `pnpm exec prisma migrate dev` を実行して適用し、表示を確認する
5. PR を開く → staging へマージして確認 → `main` へ昇格

手順 3–4 は**必ず PR を開く前に**済ませる。PR を開いた時点で preview DB に適用されうるうえ（[移行手段](#移行手段)の要確認）、適用済みのマイグレーションは編集しても再適用されない。PR を開いた後に SQL の誤りが見つかったら、新しいマイグレーションを積む。ローカル DB は seed 由来なので、確かめられるのは SQL のロジックまでである。

手順 3 により **SQL の正しさを構文から判断する必要がなくなる**ので、必ず通すこと。全件を見る必要はないが、**コンテストの切り替わり目（記号が `A` に戻る箇所）**と **問題数の少ない古いコンテスト**は目視する価値がある。

ローカル（手順 3–4）と staging での確認項目:

- **更新件数**が想定（PR1 = 632 と 2279 の title 1 件、PR2 = 467）と一致するか。PR1 で 1,099 件になったら合宿系を除外できていない
- `EXPLAIN ANALYZE` に想定外の `Seq Scan` が無いか
- コンテストテーブルの表示が**変わらない**こと（基本ルールは現行の導出と同一のため）

**staging が防げないもの**: **対応表・欠落判断そのものの誤り**。誤った記号でも SQL は正常に完走し、staging では「それらしい表示」になる（難所 2）。

### 事故対策

| 観点                     | 内容                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **爆発半径**             | 復元できるのは AOJ ICPC/JAG の 1,099 件のみ。WHERE 句が壊れて AtCoder 系に波及すると**一括復元の手段が無くなる**（[実測](./investigation.md#復元可能性の実測)）。外側 `WHERE` の重複条件はこのため |
| **復元**                 | 一度目の適用に限り、`task_table_index` も `title` のプレフィックスも `task_id` から再構成できる                                                                                                    |
| **バックアップ**         | Supabase Pro のため PITR が利用可。復元トリックが効くのは一度目だけなので、**再修正時は PITR が唯一の手段**                                                                                        |
| **`updated_at`**         | `@updatedAt` は Prisma Client 側の実装で DB トリガーではない。生 SQL では更新されない。**意図的に含めない**                                                                                        |
| **キャッシュ**           | TTL 1 時間（`src/lib/clients/cache.ts:157`）。生 SQL は `invalidateTaskCaches()` を経由しない。ローカル / staging で「更新したのに表示が変わらない」ときはこれを疑う                               |
| **トランザクション境界** | Prisma は PostgreSQL でマイグレーションファイル単位のトランザクションを張る挙動だが**本リポジトリでは未確認**。ローカル（手順 4）で先に確認すること                                                |
| **デプロイ直前の数分**   | マイグレーションの適用から Vercel のデプロイ完了までの間は、旧コードが記号のデータを `Number()` で並べるため、記号がずれて表示されうる。数分で解消するので**許容する**                             |

## フェーズ

**PR0（出典欄の書式）→ PR1（ICPC / JAG 模擬国内）→ PR2（合宿系）→ PR3（欠落補完）** の順。PR0 は DB に依存しないので先に出し、ラベル周りのテストを PR1 から切り離す。PR1 を合宿系より先にする理由: 出典欄はコンテストごとに正しくなるため PR1 完了時点で成果が見える／PR1 は欠落が少なく対応表フォーマットを楽なケースで確立できる／合宿系は Provider が無いため comparator 差し替えの影響を受けず **PR1 内で完結する**。逆順を採らなかった理由は [investigation.md](./investigation.md#逆順合宿系を先を採らなかった理由)。

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

`AojChallengesApiClient.getTasks`（`src/lib/clients/aizu_online_judge/clients.ts:91-99`）は、`contestType === 'ICPC'` または `contestType === 'JAG' && round === 'PRELIM'` のときだけ記号を付ける。取り込み時の `contest_id` は `contest.abbr` でコンテスト単位なので、日ごとではなく `contest.days.flatMap((day) => day.problems)` にまとめて `assignProblemLetters` を当てる。JAG 模擬地区と PCK は数値のまま（[スコープ外](#スコープ外残タスク)）。合宿系は管理画面から取り込めない（`JagRound` は `PRELIM` / `REGIONAL` のみ）。

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

本番の ICPC 国内予選 / アジア地区 / JAG 模擬国内は 79 コンテスト / 632 問で、seed と一致する（2026-10-21 に集計、[内訳](./investigation.md#本番の件数2026-10-21)）。本番の `AOJ_JAG` が seed より多い分（16 コンテスト / 158 問）は JAG 模擬地区で、PR1 / PR2 の移行 SQL の条件から外れる。

### PR2 — JAG 夏 / 冬 / 春合宿（50 コンテスト / 467 問）

| #   | 内容                                       | 制約                                                                         |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| 2-0 | **対応表を作る**（50 コンテスト分）        | 欠落の判断が要るのは主にここ                                                 |
| 2-1 | 取り込み側の変更は不要                     | 合宿系は管理画面から取り込めない（`JagRound` は `PRELIM` / `REGIONAL` のみ） |
| 2-2 | `prisma/tasks.ts` の該当 467 件を書き換え  |                                                                              |
| 2-3 | 移行 UPDATE（467 件）                      |                                                                              |
| 2-4 | **`title` の数値プレフィックス除去**（M9） | 省くと問題ID がタイトルに露出する                                            |
| 2-5 | **合宿系の Provider 追加**                 | PR2 の本体。`add-contest-table-provider` skill が使える                      |
| 2-6 | テスト追加                                 | 新規 Provider 分                                                             |

PR2 完了時点で G1 / G2 が全 129 コンテストに行き渡る。

### PR3 — 欠落問題の補完

**実施する。ただし着手前に調査フェーズを置く。**

欠落には 2 種類あり、扱いが異なる。

- **AOJ に問題はあるが、コンテスト一覧に無い**（例: ICPC 国内予選 2002 の E = AOJ 1123。AOJ の Sources > ICPC - Prelim では 2002 年の問題として表示される）: ダミーは不要で、実在の ID で通常の問題として登録できる。ただし管理画面の取り込みは一覧を使うので取り込めない。seed への追加と、本番には移行 SQL の INSERT が要る
- **AOJ に問題そのものが無い**: ID が無いので、下記のダミー Task レコードの設計が要る

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

**1 で大半が埋まる。** 残るのは 2 の確認作業で、PR1 が 79 コンテスト、PR2 が 50 コンテスト。欠落が集中するのは PR2 の合宿系。

> **注意**: 「これまで正しく見えていた」は「欠落が無い」の証明ではない。欠落があっても表示は成立してしまう（前詰めでズレた記号が出るだけ）。 **PR1 でも確認工程 2 は省略しないこと。**

**生成スクリプトには総数のアサーションを入れる。** 抽出漏れが欠落の誤検出に直結する（調査中に実際に踏んだ。[事例](./investigation.md#5-調査中の誤りと訂正自戒)）。抽出件数が対象範囲の既知の値（PR1 は **79 コンテスト / 632 問**、PR2 は 50 / 467）と一致しなければ**エラーで停止**する。欠落として扱わない。

PR1 は [generate_aoj_problem_letters.ts](./generate_aoj_problem_letters.ts) で行う。`prisma/tasks.ts` を直接 import するので、正規表現による抜き出しで取りこぼすことはない。

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

### テストの注意

テスト約 2,000 行と出典欄の fixture が、数値 index と全角括弧を前提にしている。全角括弧の分は PR0（0-3）、数値 index の分は PR1（[1-7](#1-7-のテスト)）で直す。作業は機械的だが、期待値を新形式へ一括置換すると **テストが仕様を検証しなくなる**。`docs/guides/agent-rules/testing.md` の Test integrity と `verify-test-strength` skill の適用対象。内訳は [investigation.md](./investigation.md#テストの影響範囲)。
