# PR3 — 欠落問題の補完

前提と共通の決定は [plan.md](./plan.md)。調べた結果と根拠は [investigation.md の 7 章](./investigation.md#7-pr3-欠けている問題)。採らなかった案は、すべて[下の節](#採らなかった案)にまとめた。

**状態**: 設計は決定（2026-10-28）。[実装計画](#実装計画)は承認待ち。

## 概要

AOJ の JAG / ICPC のコンテストで、公式の問題なのに seed に無い 26 問を足す。PR2 で今ある問題の記号を補正済みなので、足しても今ある記号は変わらない。

| 種類                                                   | 問題                                                                                                        | 入れ方                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| AOJ にあるが、取り込み元のコンテスト一覧に無い（5 問） | 1123（ICPC 国内予選 2002 の E）、3643（JAG 夏合宿 2024 Day3 の G）、2565〜2567（JAG 模擬地区 2013 の A〜C） | AOJ の問題 ID のまま、通常の問題として入れる             |
| AOJ に無い（21 問）                                    | 2005〜2008 年の JAG の 7 コンテスト（[一覧](./investigation.md#aoj-に無い-21-問)）                          | ダミーの Task として入れ、リンクは jag-icpc.org に向ける |

管理画面の取り込みは AOJ のコンテスト一覧を使うので、どちらも取り込めない。seed に足し、staging / 本番にはメンテナが Supabase の CSV で入れる。

## 決めたこと

### AOJ にある 5 問

- AOJ の問題 ID と、公式の記号で入れる
- 3643 は 2026-10-10 に AOJ に追加されたばかりで、公開前かもしれない（`available` が 4、提出が 0）が、今回入れる

### AOJ に無い 21 問（ダミー）

- **`task_id`**: `NoJudge-{contest_id}_{記号の小文字}`（例: `NoJudge-JAGWinter2006-day2_a`）。`task_table_index` は大文字（`A`）のまま
- **title**: jag-icpc.org の年度ページの一覧（= スプレッドシート）の表記。`Wireing Assistant` も原文どおり
- **リンク先**: jag-icpc.org の大会区分のページ（例: `2008/Practice/模擬地区予選`、計 5 ページ）。自分で採点するのに要る問題文・ジャッジデータ・講評のどれにも下りられる
- **リンクの出し方**: `getTaskUrl()` の URL ジェネレータに `NoJudgeGenerator` を足し、`AojGenerator` より前に置く。URL は `task_id` をキーにした map から引く
- **出典のラベル**: `（AOJ）` ではなく `（No Judge）` にする（例: `JAG 冬合宿 2006 Day2 - A（No Judge）`）
- **見た目**: アイコンもツールチップも入れない。採点が無いことは出典のラベルで伝える
- **出す場所**: コンテスト別の表・問題一覧・投票・タグ・問題集のすべて。Task のレコードがあれば動く
- **AOJ に後から追加されたら**: 管理画面から取り込まず、DB の `task_id` を AOJ の ID に UPDATE する（[手順](./investigation.md#aoj-に後から追加されたとき)）

変更が要る機能は、問題へのリンクと出典のラベルの 2 つ。影響範囲の全体は [investigation.md](./investigation.md#影響範囲)。

## 採らなかった案

| 対象               | 採らなかった案                                                    | 理由                                                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3643 の入れ方      | AOJ のコンテスト一覧に入るのを待ち、管理画面で取り込む            | 合宿系は管理画面の取り込みの対象外なので、一覧に入っても取り込めない                                                                                                                                                |
| ダミーの title     | 一覧でしか確かめていない 19 問を、問題文の PDF の表紙でも確かめる | 一覧はスプレッドシートとも一致していて、誤記が残る見込みは小さい                                                                                                                                                    |
| ダミーの `task_id` | 数字（100000 番台など）                                           | 既存のコードは壊れないが、AOJ の本物の ID と見分けられない。数字の範囲は AOJ が決める領域（通常の問題は 40xx 番台まで、AOJ 自身のダミーに 9900〜9995）で、衝突の心配が残る                                          |
| ダミーの `task_id` | 50xx 番台                                                         | AOJ の通常の採番がいずれ届く                                                                                                                                                                                        |
| ダミーの `task_id` | `Missing-`                                                        | 「欠けている」は AOJ にある 5 問にも当てはまり、意味がずれる。問題文はあるのに、中身の無い仮のレコードやエラーページにも読める                                                                                      |
| ダミーの `task_id` | `jag-icpc_` など出所を表す接頭辞                                  | 分岐の理由（採点が無い）ではなく、問題文の置き場所を表す                                                                                                                                                            |
| リンク先           | PDF への直リンク                                                  | 問題文までは 1 クリックだが、講評に辿れない。添付ファイル名が揃っておらず、切れる要因が増える                                                                                                                       |
| リンク先           | `問題文とデータセット` のページ                                   | 講評に辿れない                                                                                                                                                                                                      |
| リンクの出し方     | `getTaskUrl()` の先頭で map を引く                                | コードは 2〜3 行で済むが、`getTaskUrl()` に特別扱いが入る。判定が「map に載っているか」になり、出典のラベル（接頭辞で判定）と基準が割れる。map に漏れがあると AOJ のジェネレータに回り、開けない AOJ のリンクになる |
| リンクの出し方     | Task に `url` 列を足す                                            | マイグレーションが要り、`getTaskUrl()` の呼び出し元 9 ファイルに URL を渡す変更が波及する。21 件には重い。他サイトに対応するときに再検討する                                                                        |
| リンクの出し方     | URL を年・大会区分・ファイル名から組み立てる                      | 規則の推測が外れると、黙って間違ったリンクになる。ブラウザで開けた URL をそのまま貼る                                                                                                                               |
| リンクの出し方     | map を隠し、URL を取り出す関数だけを export する                  | seed との突き合わせのテストで、map のキーを列挙できない                                                                                                                                                             |
| リンクの出し方     | 外部リンクを CI で定期的に確かめる                                | 外部サイトの状態でテストが落ちるようになる                                                                                                                                                                          |
| 判定の置き場所     | `isNoJudgeTask()` を `src/lib/utils/` に置く                      | `src/lib/utils/task.ts` が `#lib/contests/index.js` を import しているので、`lib/contests` の `task_index_label.ts` から使うと循環 import になる                                                                    |
| 出典のラベル       | `taskId` を省略できる引数にする                                   | 渡し忘れた呼び出し元が、黙って `（AOJ）` のままになる。必須なら、型チェックが漏れを見つける                                                                                                                         |
| 見た目             | セルにアイコンを足す                                              | セルの幅が足りない（AOJ の表は 1 行に最大 6 列で、問題名はもう省略されている）                                                                                                                                      |
| 見た目             | リンクに `title` 属性のツールチップ                               | 幅は使わないが、スマホでは出ない。知らせる仕組みが必要になったら、最初に検討する                                                                                                                                    |
| 見た目             | 表のタイトルにコンテスト単位で書く（`note`）                      | `note` は主催者（JAG / 有志）の欄なので意味が混ざり、どの問題が対象かも分からない                                                                                                                                   |
| 見た目             | 問題の詳細ページに一文添える                                      | 表から直接開く人の目には入らない                                                                                                                                                                                    |

## 実装計画

1 つの PR で入れる。リスクの低い順に 5 段階で、各段階はテストを先に書く。

### 段階 1: ダミーの判定と URL（新しいモジュール。既存のコードには影響しない）

本体を `src/lib/contests/utils/no_judge.ts` に置き、外から使うものを `src/lib/contests/index.ts` から再 export する。

```typescript
export const NO_JUDGE_TASK_ID_PREFIX = 'NoJudge-';

export function isNoJudgeTask(taskId: string): boolean;

// Built from a private { url, taskIds }[] of the 5 jag-icpc.org pages.
export const NO_JUDGE_TASK_URLS: ReadonlyMap<string, string>;
```

- map は、5 ページ分の `{ url, taskIds }` の配列（外には出さない）から組み立てる
- URL はブラウザで開けたものを、パーセントエンコードのまま貼る
- テスト（`src/lib/contests/utils/no_judge.test.ts`）:
  - `returns true for task ids starting with NoJudge-`
  - `returns false for AOJ and AtCoder task ids`（`'1123'`、`'abc300_a'`、小文字の `'nojudge-...'`）
  - `maps each NoJudge task to its jag-icpc.org page url verbatim`（5 ページそれぞれ。期待値は URL のリテラル）
  - `has no entry for AOJ task ids`

### 段階 2: URL ジェネレータ（共有の型を変えるが、既存の実装は書き換えない）

- `src/lib/types/url.ts`: `canHandle(contestId: string, taskId: string): boolean` に広げ、TSDoc も直す。既存の `AojGenerator` / `AtCoderGenerator` は引数が少ないままでも型を満たす
- `src/lib/utils/task.ts`: `NoJudgeGenerator` を足して `AojGenerator` より前に置き、`getTaskUrl()` から `taskId` も渡す。`canHandle` は `isNoJudgeTask(taskId)`、`generateUrl` は `NO_JUDGE_TASK_URLS.get(taskId) ?? ''` を返す（map に漏れがあっても AOJ のジェネレータには回さない）
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
- `taskId` は省略できない引数にする。呼び出し元 6 ファイル（各 1 か所）で `task_id` を渡し、漏れは `pnpm check` が見つける: `TaskList.svelte`、`TaskListSorted.svelte`、`TaskForm.svelte`、`WorkBookTasksTable.svelte`、`src/routes/workbooks/[slug]/+page.svelte`、`TaskGradeTable.svelte`
- テスト: `src/lib/contests/fixtures/contest_name_and_task_index.ts` の型に `taskId` を足して既存のケースを直し、ダミーのケースを足す（`appends （No Judge） for a NoJudge task in a JAG contest`）

### 段階 4: seed のデータ（26 行）

`prisma/tasks.ts` に 26 行を足す。`name` と `title` は同じ値にする。

| 種類       | `id`                                  | `contest_id` と記号                                                 |
| ---------- | ------------------------------------- | ------------------------------------------------------------------- |
| AOJ にある | `1123`                                | `ICPCPrelim2002` E                                                  |
| AOJ にある | `3643`                                | `JAGSummer2024-day3` G                                              |
| AOJ にある | `2565` / `2566` / `2567`              | `JAGRegional2013` A / B / C                                         |
| ダミー     | `NoJudge-{contest_id}_{記号の小文字}` | 7 コンテストの 21 問（[一覧](./investigation.md#aoj-に無い-21-問)） |

先にテストの期待値を直す:

- `src/lib/clients/aizu_online_judge/seed_problem_letters.test.ts`
  - 件数を 1,329 問から 1,355 問にする（151 コンテストは変わらない）
  - `LETTERS_OF_SHIFTED_CONTESTS`: ダミーのある 7 コンテストを載せる。6 つは既にあるのでダミーの ID と記号を足し、`JAGRegional2008` は新しく足す。`assignProblemLetters()` は ID を `Number()` で並べるので、`NoJudge-` を含むコンテストは基本ルールの検査に通せない
  - `JAGRegional2013`（2565〜2574）と `JAGSummer2024-day3`（3637〜3647）は、ID が連番になって基本ルールに戻るので、`LETTERS_OF_SHIFTED_CONTESTS` から外す。`ICPCPrelim2002`（1119〜1123）は基本ルールのまま
  - テストを足す: `every contest with NoJudge tasks is in LETTERS_OF_SHIFTED_CONTESTS`（入れ忘れると基本ルールの検査が `NaN` を含む並べ替えになり、落ちるとは限らない）
  - `LETTERS_OF_SHIFTED_CONTESTS` の上のコメントに、`NoJudge-` の ID は `Number()` で並べられないことを書き足す
- `src/lib/contests/utils/no_judge.test.ts` に seed との突き合わせを足す
  - `every NoJudge task in prisma/tasks.ts has a page url`
  - `every task id with a page url exists in prisma/tasks.ts`（map のキーの打ち間違いを見つける）

### 段階 5: 仕上げ

- CSV 用の 26 行の一覧（`task_id`、`contest_id`、`contest_type`、`task_table_index`、`title`）を、下の「[staging / 本番への投入](#staging--本番への投入メンテナ)」に足す。`contest_type` は 1123 だけ `AOJ_ICPC`、ほかの 25 行は `AOJ_JAG`
- ガイドとスキルに、AOJ に無い問題をダミーで入れる手順を書く
  - `.agents/skills/add-tasks/instructions.md`（Collect rows）: AOJ に無い問題は末尾でも `NoJudge-` の行で入れ、`no_judge.ts` にページを登録し、コンテストを `LETTERS_OF_SHIFTED_CONTESTS` に足す。「`id` を contest_id から導かない」の例外であることも書く。AOJ にあるがコンテスト一覧に無い問題は、問題 ID のまま入れる。`contest_name_and_task_index.ts` は `taskId` が必須になる
  - `docs/guides/how-to-add-contest-table-provider.md`（「JAG 模擬地区は AOJ と AtCoder が混在する」の「記号」）: 同じ手順を 1 行で足す
- `pnpm format`、`pnpm lint`、`pnpm check`、`pnpm test:unit`、`git diff --check`
- 開発サーバーで JAG 冬合宿 2006 Day2 の表と問題一覧を開き、ダミーのリンク先と出典のラベルを目で確かめる
- 共有の型と汎用関数のシグネチャを変えるので、Codex でクロスレビューする

### staging / 本番への投入（メンテナ）

コードのデプロイの後に CSV を入れる（先に入れると、デプロイまでの間、ダミーが開けない AOJ のリンクと `（AOJ）` のラベルで出る）。

- 列は `id`・`contest_type`・`created_at`・`updated_at` も明示する。Supabase の CSV は Prisma の既定値を使わず、`created_at` は DB に既定値があっても空になった例がある（`docs/guides/agent-rules/prisma-db.md`）
- `id` は PR2.1 と同じく、メンテナのスクリプトで `sha256(contest_id + title)` にする
- CSV の投入は `invalidateTaskCaches()` を経ないので、画面に出るのはタスクのキャッシュの有効期限（1 時間）が切れた後
- 行の一覧は段階 5 でここに足す

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
