# PR3 — 欠落問題の補完

前提と共通の決定は [plan.md](./plan.md)。欠落の一覧は [investigation.md](./investigation.md#欠落の一覧pr3)。

**状態**: 調査（3-0）は完了、3-1 / 3-2 は設計まで決定（いずれも 2026-10-28）。3-1 と 3-2 は 1 つの PR で実装する。[実装計画](#実装計画)は承認待ち。PR1 / PR2 のデータ移行とは性質が異なる（既存データの正規化ではなく、新しいレコードの設計判断）ため独立させる。PR2 で記号を補正するので、欠落を後から足しても既存の記号はずれない。

## 欠落の 2 種類

| 種類                                     | 例                                                                                         | 扱い                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| AOJ に問題はあるが、コンテスト一覧に無い | ICPC 国内予選 2002 の E = AOJ 1123（AOJ の Sources > ICPC - Prelim では 2002 年の問題）    | 実在の ID で通常の問題として登録できる。管理画面の取り込みは一覧を使うので取り込めず、seed と本番への INSERT が要る |
| AOJ に問題そのものが無い                 | スプレッドシートで「AOJ 未収録」のもの（ただし下記の 3643 のように、AOJ にある場合もある） | ID が無いので、ダミー Task レコードの設計が要る                                                                     |

## 分かっている欠落

| 問題                                                     | 分かっていること                                                                                                                                                                                                                                                                                                          | 種類                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| ICPC 国内予選 2002 の E                                  | AOJ 1123。PR1 で判明                                                                                                                                                                                                                                                                                                      | 前者                   |
| JAG 夏合宿 2024 Day3 の G（Interactive String Guessing） | スプレッドシートでは「AOJ 未収録」だが、AOJ に 3643 の問題ページがある（`onlinejudge.u-aizu.ac.jp/challenges/search/titles/3643`）。コンテスト一覧に無いだけ（2026-10-24 にメンテナが確認）。2026-10-10 に AOJ に追加されたばかりで、問題一覧 API では `available` が 4（2565〜2567 は 1）、提出が 0（2026-10-28 に確認） | 前者（公開前の可能性） |
| JAG 模擬地区 2013 の A〜C                                | AOJ の問題一覧 API に 2565 / 2566 / 2567 として存在し、問題名がスプレッドシートと一致する。コンテスト一覧（`challenges/cl/jag/regional`）に無いだけで、D〜J（2568〜2574）と ID が連番（2026-10-28 にメンテナが確認）                                                                                                      | 前者                   |
| 上記以外の「AOJ 未収録」21 問（合宿系 17 / 模擬地区 4）  | 問題一覧 API で問題名を部分一致で検索したが、ID が見つからない（2026-10-28 にメンテナが確認）                                                                                                                                                                                                                             | 後者                   |

3643 の例から、スプレッドシートの「AOJ 未収録」は AOJ に無いことの保証にならない。2565〜2567 と 3643 はどちらもコンテスト一覧に無いが、問題一覧 API には載っていた。3-0 では 21 問すべてを問題一覧 API で問題名から確かめ、いずれも見つからなかった。AOJ は過去の問題を後から追加する（3643 は 2026-10-10）ので、この結果は 2026-10-28 時点のもの。一覧は [investigation.md](./investigation.md#欠落の一覧pr3)。

## タスク

| #   | 内容                                                                                                                                                                                                                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3-0 | 「AOJ 未収録」21 問について、AOJ の問題一覧 API に問題名で存在するかを確かめて上の 2 種類に分け、実数と分布を確認する。見つかった問題は `available` と提出数も記録する。**完了**: 前者 5 問（1123、3643、2565〜2567）、後者 21 問。後者はすべて 2005〜2008 年のコンテストで、冬合宿 2006 の Day2 / Day3 に 13 問が集中する |
| 3-1 | 一覧に無いだけの問題を、通常の問題として登録する（seed と本番への INSERT）。判明分は 1123、3643、2565〜2567                                                                                                                                                                                                                |
| 3-2 | AOJ に無い問題（21 問）のダミー Task レコードの設計 → 実装。設計は決定（下記）                                                                                                                                                                                                                                             |

3-1 で決めたこと（2026-10-28）:

- **対象は 5 問すべて**（1123、3643、2565〜2567）。通常の AOJ の問題として、問題 ID のまま seed と staging / 本番に入れる
- **3643 も今回入れる**。2026-10-10 に AOJ に追加されたばかりで、`available` が 4、提出が 0。公開前なら、しばらく AOJ で提出できない可能性がある（`available` の値の意味は未確認）。不採用: AOJ のコンテスト一覧に入るのを待ち、管理画面の取り込みで入れる

3-2 で決めたこと（2026-10-28）。根拠、採らなかった案の詳細、影響範囲は [investigation.md の 7 章](./investigation.md#7-pr3-のダミーの設計と影響範囲)。

- **`task_id`**: `NoJudge-{contest_id}_{記号の小文字}`（例: `NoJudge-JAGWinter2006-day2_a`）。`task_table_index` は大文字（`A`）のまま。不採用: 数字（100000 番台、50xx 番台）、`Missing-` などの接頭辞
- **リンク先**: jag-icpc.org の大会区分のページ（例: `2008/Practice/模擬地区予選`、計 5 ページ）。自分で採点するのに要る問題文・ジャッジデータ・講評のどれにも下りられる。不採用: PDF への直リンク、`問題文とデータセット` のページ
- **リンク先の持ち方**: `getTaskUrl()`（`src/lib/utils/task.ts`）の URL ジェネレータに `NoJudgeGenerator` を足し、`AojGenerator` より前に置く。`UrlGenerator.canHandle` に `taskId` を足す（既存の 2 つの実装は書き換え不要）。判定は出典のラベルと共通の `isNoJudgeTask()`、URL は `task_id` をキーにした map から引く。map は `{ url, taskIds }` をページごとに並べて組み立てる。URL はブラウザで開けたものをパーセントエンコードのまま貼る。テストで、URL をそのまま返すこと、ジェネレータの並び順、seed の `NoJudge-` が全件 map にあること、map のキーがすべて seed にあることを固定する。不採用: `getTaskUrl()` の先頭で map を引く、Task に `url` 列を足す
- **出典のラベル**: ダミーは `（AOJ）` ではなく `（No Judge）` にする（例: `JAG 冬合宿 2006 Day2 - A（No Judge）`）。汎用関数 `addContestNameToTaskIndex()`（`src/lib/contests/utils/task_index_label.ts`）に `taskId` を省略できない引数として足し、呼び出し元 6 ファイル（各 1 か所）で渡す
- **見た目**: アイコンもツールチップも入れない。採点が無いことは出典のラベルの文字で伝える
- **投票・タグ・問題集・コンテスト別の表**: すべてに出す。Task のレコードを足せば動く。変更が要る機能は、問題へのリンク（`getTaskUrl()`）と出典のラベル（`addContestNameToTaskIndex()`）の 2 つ（新しいモジュール `no_judge.ts` と型 `UrlGenerator` の変更を含む。[実装計画](#実装計画)）
- **AOJ に後から追加されたら**: 管理画面からは取り込まない（取り込みは AOJ の一覧の ID 順で記号を振るので、欠けたコンテストではずれた記号が付き、今の記号と重なる。[investigation.md](./investigation.md#aoj-に後から追加された場合)）。代わりに DB の `task_id` を AOJ の ID に UPDATE し（参照する外部キーはすべて `ON UPDATE CASCADE`。記号はそのまま残る）、map のエントリを消す。seed（`prisma/tasks.ts`）の行の `id` と、`seed_problem_letters.test.ts` の期待値も直す。出典のラベルは `task_id` から決まるので、自動で `（AOJ）` に戻る

## 実装計画

3-1（5 問）と 3-2（21 問）を 1 つの PR で入れる。リスクの低い順に 5 段階。各段階はテストを先に書く。

### 段階 1: ダミーの判定と URL（新しいモジュール。既存のコードには影響しない）

`src/lib/contests/utils/no_judge.ts` を新しく作り、`src/lib/contests/index.ts` から export する。

```typescript
export const NO_JUDGE_TASK_ID_PREFIX = 'NoJudge-';

export function isNoJudgeTask(taskId: string): boolean;

// Built from a private { url, taskIds }[] of the 5 jag-icpc.org pages.
export const NO_JUDGE_TASK_URLS: ReadonlyMap<string, string>;
```

- `lib/contests` に置く理由: `src/lib/utils/task.ts` は `#lib/contests/index.js` を import している。判定を `lib/utils` に置くと、`task_index_label.ts`（`lib/contests`）からの import で循環する。`lib/contests` は `lib/utils` に依存していない
- URL の map は、同じファイルの中で `{ url, taskIds }` を 5 ページ分並べた配列（こちらは外に出さない）から組み立て、読み取り専用の `NO_JUDGE_TASK_URLS` として export する。取り出し用の関数は作らない（段階 4 のテストで seed と突き合わせるのにキーの列挙が要る）
- テスト（`src/lib/contests/utils/no_judge.test.ts`）:
  - `returns true for task ids starting with NoJudge-`
  - `returns false for AOJ and AtCoder task ids`（`'1123'`、`'abc300_a'`、小文字の `'nojudge-...'`）
  - `maps each NoJudge task to its jag-icpc.org page url verbatim`（5 ページそれぞれ `get` で引く。期待値は URL のリテラル）
  - `has no entry for AOJ task ids`

### 段階 2: URL ジェネレータ（共有の型を変えるが、既存の実装は書き換えない）

- `src/lib/types/url.ts`: `canHandle(contestId: string, taskId: string): boolean` に広げ、TSDoc も直す
- `src/lib/utils/task.ts`: `NoJudgeGenerator` を足して `AojGenerator` より前に置き、`getTaskUrl()` の呼び出しで `taskId` を渡す。`canHandle` は `isNoJudgeTask(taskId)`、`generateUrl` は `NO_JUDGE_TASK_URLS.get(taskId) ?? ''` を返す（map に漏れがあっても AOJ のジェネレータには回さない）。データは持たない
- テスト（`src/test/lib/utils/test_cases/task_url.ts` に足す）:
  - `returns the jag-icpc.org page for a NoJudge task in a JAG contest`
  - `returns the AOJ problem url for an AOJ task in the same JAG contest`（並び順の固定）

### 段階 3: 出典のラベル（汎用関数のシグネチャを変え、呼び出し元 6 ファイルに波及する）

```typescript
export const addContestNameToTaskIndex = (
  contestId: string,
  taskTableIndex: string,
  taskId: string,
): string;
```

- ダミーなら `` `${contestName} - ${taskTableIndex}（No Judge）` `` を返す
- 呼び出し元 6 ファイル（各 1 か所）で `task_id` を渡す: `TaskList.svelte`、`TaskListSorted.svelte`、`TaskForm.svelte`、`WorkBookTasksTable.svelte`、`src/routes/workbooks/[slug]/+page.svelte`、`TaskGradeTable.svelte`。漏れは型チェック（`pnpm check`）が見つける
- テスト: `src/lib/contests/fixtures/contest_name_and_task_index.ts` の型に `taskId` を足して既存のケースを直し、ダミーのケースを足す（`appends （No Judge） for a NoJudge task in a JAG contest`）

### 段階 4: seed のデータ（26 行）

`prisma/tasks.ts` に 26 行を足す。`name` と `title` は同じ値にし、21 問は jag-icpc.org の年度ページの一覧（= スプレッドシート）の表記どおりにする（[investigation.md](./investigation.md#欠落の一覧pr3)）。問題文の PDF の表紙で確かめたのは 2 問だけだが、残る 19 問も一覧の表記を使う（2026-10-28 に決定）。

| 種類 | `id`                                  | `contest_id` と記号         |
| ---- | ------------------------------------- | --------------------------- |
| 3-1  | `1123`                                | `ICPCPrelim2002` E          |
| 3-1  | `3643`                                | `JAGSummer2024-day3` G      |
| 3-1  | `2565` / `2566` / `2567`              | `JAGRegional2013` A / B / C |
| 3-2  | `NoJudge-{contest_id}_{記号の小文字}` | 7 コンテストの 21 問        |

先にテストの期待値を直す:

- `src/lib/clients/aizu_online_judge/seed_problem_letters.test.ts`
  - 件数を 151 コンテスト・1,329 問から 151 コンテスト・1,355 問にする（コンテストは増えない）
  - `LETTERS_OF_SHIFTED_CONTESTS`: ダミーのある 7 コンテストのうち、すでに載っている 6 コンテストにはダミーの ID と記号を足し、載っていない `JAGRegional2008` は新しく足す。`assignProblemLetters()` は ID を `Number()` で並べるので、`NoJudge-` を含むコンテストは基本ルールの検査に通せない
  - `JAGRegional2013`（2565〜2574）と `JAGSummer2024-day3`（3637〜3647）は、足すと ID が連番になって基本ルールに戻るので、`LETTERS_OF_SHIFTED_CONTESTS` から外す。`ICPCPrelim2002` は 1119〜1123 で基本ルールのまま
  - テストを足す: `every contest with NoJudge tasks is in LETTERS_OF_SHIFTED_CONTESTS`。ダミーを足して一覧に入れ忘れると、基本ルールの検査が `NaN` を含む並べ替えになり、落ちるとは限らないため
  - `LETTERS_OF_SHIFTED_CONTESTS` の上のコメント（「AOJ に無い問題があると基本ルールがずれる」）に、`NoJudge-` の ID は `Number()` で並べられないことも書き足す
- `src/lib/contests/utils/no_judge.test.ts` に seed との突き合わせを足す
  - `every NoJudge task in prisma/tasks.ts has a page url`（`NO_JUDGE_TASK_URLS.has`）
  - `every task id with a page url exists in prisma/tasks.ts`（`NO_JUDGE_TASK_URLS.keys()`。map のキーの打ち間違いを見つける）

### 段階 5: 投入用の行の一覧と仕上げ

- メンテナが CSV を作るための 26 行の一覧（`task_id`、`contest_id`、`contest_type`、`task_table_index`、`title`）を、下の「[staging / 本番への投入](#staging--本番への投入メンテナ)」に足す。`contest_type` は `ICPCPrelim2002`（1123）だけ `AOJ_ICPC`、ほかの 25 行は `AOJ_JAG`。`id` は PR2.1 と同じく、メンテナのスクリプトで `sha256(contest_id + title)` にする
- ガイドとスキルを、AOJ に無い問題をダミーで入れる手順に合わせて直す（`docs/guides/agent-rules/` のルールは変更不要）
  - `.agents/skills/add-tasks/instructions.md`（Collect rows）: 今は「最後より前の問題が AOJ に無ければ、記号をスプレッドシートから取り `LETTERS_OF_SHIFTED_CONTESTS` に足す」とだけある。AOJ に無い問題は、末尾でも `NoJudge-{contest_id}_{記号の小文字}` の行で入れ、`no_judge.ts` に jag-icpc.org のページを登録し、コンテストを `LETTERS_OF_SHIFTED_CONTESTS` に足す、と書く。「`id` を contest_id から導かない」の例外であることも明記する。AOJ にあるがコンテスト一覧に無い問題は、問題 ID のまま入れる。Tests の `contest_name_and_task_index.ts` は `taskId` が必須になる
  - `docs/guides/how-to-add-contest-table-provider.md`（「JAG 模擬地区は AOJ と AtCoder が混在する」の「記号」）: 同じ手順を 1 行で足す
- `pnpm format`、`pnpm lint`、`pnpm check`、`pnpm test:unit`、`git diff --check`
- 開発サーバーで JAG 冬合宿 2006 Day2 の表と問題一覧を開き、ダミーのリンク先と出典のラベルを目で確かめる
- 共有の型と汎用関数のシグネチャを変えるので、Codex でクロスレビューする

### staging / 本番への投入（メンテナ）

コードのデプロイの後に CSV を入れる。先に入れると、デプロイまでの間、ダミーが AOJ の開けないリンクと `（AOJ）` のラベルで表示される。Supabase の CSV は Prisma の既定値を使わないので、`id`・`contest_type`・`created_at`・`updated_at` を明示する（`docs/guides/agent-rules/prisma-db.md`。`created_at` は DB に既定値があっても、CSV の取り込みで空になった例がある）。行の一覧は実装の段階 5 でここに足す。

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
