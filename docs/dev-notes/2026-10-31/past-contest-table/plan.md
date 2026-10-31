# PAST（アルゴリズム実技検定）のコンテスト別テーブル

## 概要

`ContestType.PAST` の第 1〜24 回を、ICPC アジア地区と同じ形式で表示するテーブルを追加する。
1 回 = 1 テーブルで、見出しは `PAST 第 N 回`、セルは `A. 問題名`。新しい回を上に並べる。
ボタンのラベルは `PAST` で、`AWC 0001 〜` の直後（画面上では右）に置く（暫定）。

## 決まったこと（ユーザー確認済み）

- 表示する回は第 1〜24 回（24 回まで開催済みと確認済み）。
- `pastbook2022`（典型アルゴリズム問題集 上級〜エキスパート編）は、ContestType は PAST のままで、このテーブルには出さない。
- seed（`prisma/tasks.ts`）に全 24 回 × 15 問を入れる。problems.json の行はユーザーから受け取り、[past_problems.json](./past_problems.json) に置いた（360 行、各回 A–O の 15 問がそろうことを確認済み）。
- 列の幅と折り返しは ICPC と同じ（`lg:w-1/6`、`columnWrapThreshold: 6`）。

## 既にあるもの（変更しない）

- `ContestType.PAST`（schema と `src/lib/contests/types/contest.ts`）、分類（`classification.ts` の `startsWith('past')`）、優先度（`priority.ts`）。skill の Layer 1–2 と、Layer 3 の分類・優先度は不要。
- ラベル: `getPastContestLabel(PAST_TRANSLATIONS, contestId)`（`src/lib/contests/utils/labels/past.ts`）が `past201912-open` → `PAST 第 1 回`、`past15-open` → `PAST 第 15 回` に変換する。`getContestNameLabel` からも呼ばれる。
- ICPC アジア地区の形式は PR #3683 で入った `AojIcpcRegionalProvider`（`aoj_icpc_providers.ts`）。表示の設定は `aoj_labels.ts` の `AOJ_TITLE_STYLE` と `buildAojDisplayConfig`。

## contest_id と task_id

- 第 1〜14 回の contest_id は `past{YYYYMM}-open`、第 15 回以降は `past{N}-open`。
- task_id は contest_id から導けない。第 15・16 回は `past202306_*`・`past202309_*`、第 17 回以降は `past17_*` の形。Provider は contest_id だけでフィルタするので影響しないが、seed は貼られたデータの `id` をそのまま使う。
- 文字列の降順では `past24-open` < `past202303-open` となり、回の順に並ばない。回数を引数にすれば、並び順をこの問題から切り離せる。

## 設計

ICPC と同じ Pattern 4（コンストラクタパラメータ型）で、引数は回数。回数から contest_id への変換は、`PAST_TRANSLATIONS` と同じデータから作る。

### 回数 → contest_id（`src/lib/contests/utils/labels/past.ts`）

第 1〜14 回の年月を順序付きの配列にし、`PAST_TRANSLATIONS` をそこから作る（中身は今と同じ）。同じ配列から contest_id も引く。

```typescript
// Rounds 1-14 put the year and month in the contest id; index + 1 is the round.
const PAST_YEAR_MONTHS = ['201912', '202004', /* ... */ '202303'] as const;

export const PAST_TRANSLATIONS: ContestLabelTranslations = Object.fromEntries(
  PAST_YEAR_MONTHS.map((yearMonth, index) => [yearMonth, ` 第 ${index + 1} 回`]),
);

// 1 → 'past201912-open', 14 → 'past202303-open', 15 → 'past15-open'
export function getPastContestId(round: number): string;
```

`#lib/contests/index.ts` から `getPastContestId` を export する。

### Provider（`src/features/tasks/utils/contest-table/past_provider.ts`）

```typescript
export class PastProvider extends ContestTableProviderBase {
  constructor(contestType: ContestType, round: number); // provider key: PAST::24

  // taskResult.contest_id === getPastContestId(round)。pastbook2022 と他の回は落ちる
  protected setFilterCondition(): (taskResult: TaskResult) => boolean;

  // { title: 'PAST 第 24 回', abbreviationName: 'past24', titleStyle: PER_CONTEST_TITLE_STYLE }
  getMetadata(): ContestTableMetaData;

  // buildPerContestDisplayConfig()（ICPC と同じ）
  getDisplayConfig(): ContestTableDisplayConfig;

  // title と同じ 'PAST 第 24 回'（isShownRoundLabel が false なので表示には出ない）
  getContestRoundLabel(_contestId: string): string;
}
```

- title は `getContestNameLabel(contestId)` で作り、constructor で持つ。
- `getHeaderIdsForTask` は基底のまま。PAST の `task_table_index` は A–O の 1 文字なので、基底の `sort()` で正しく並ぶ。
- セルは `isShownTaskIndex: true` で `A. ` を付け直す（`buildTitleWithTaskIndex` は付いている記号を外してから付ける）。Provider で title を加工しない。

### 表示設定の共有（`aoj_labels.ts` の改名）

PAST は AtCoder のコンテストだが、ICPC と同じ見出しのスタイルと表示設定を使う。AOJ の名前のまま PAST から import すると誤解を招くので、ファイルと export を中立な名前に変える。値は変えない。

| 今                           | 変更後                                     |
| ---------------------------- | ------------------------------------------ |
| `aoj_labels.ts` / `.test.ts` | `per_contest_table_layout.ts` / `.test.ts` |
| `AOJ_TITLE_STYLE`            | `PER_CONTEST_TITLE_STYLE`                  |
| `buildAojDisplayConfig()`    | `buildPerContestDisplayConfig()`           |
| `sortAojHeaderIds()`         | `sortHeaderIdsByTaskTableIndex()`          |

### グループ登録（`contest_table_provider_groups.ts`）

```typescript
export const PAST_OLDEST_ROUND = 1;
export const PAST_LATEST_ROUND = 24;

PAST: () => {
  const group = new ContestTableProviderGroup('PAST', {
    buttonLabel: 'PAST',
    ariaLabel: 'Filter PAST (Practical Algorithm Skill Test)',
  });
  // Iterate from latest to oldest so the newest round's table renders on top.
  for (let round = PAST_LATEST_ROUND; round >= PAST_OLDEST_ROUND; round--) {
    group.addProvider(new PastProvider(ContestType.PAST, round));
  }

  return group;
},

// contestTableProviderGroups のキー順 = ボタンの並び
awc0001Onwards: presets.AWC0001Onwards(),
past: presets.PAST(),
fromAbc001ToAbc041: presets.ABC001ToABC041(),
```

## 採らなかった案

- **ABC のような範囲型（1 テーブル、行 = 回、列 = A–O）:** ICPC アジア地区の形式にしたいという要望に合わない。基底の `getContestRoundIds` は文字列の降順なので、`past24-open` が `past202303-open` より下になる。
- **contest_id を引数にして、24 個の配列を並べる（JAG 夏合宿・模擬地区と同じ方式）:** contest_id は回数から導けるので、配列は `PAST_TRANSLATIONS` の年月と二重になる。新しい回では `PAST_LATEST_ROUND` を 1 つ上げるだけで済む方式にする。
- **`PAST_TRANSLATIONS` を値（` 第 N 回`）で逆引きする、またはキーの並びに頼る:** 表示用の文字列を解析することになる。キーの並びは、整数に見えるキーを JS が数値の昇順に並べることに頼るので、読み手に分かりにくい。
- **AOJ の名前のまま import する / PAST 用に同じ値の定数を作る:** 前者は名前が中身と合わない。後者は ICPC と同じ設定を二重に持つ。
- **`classifyContest(...) === PAST` でフィルタする:** contest_id の完全一致で足り、`pastbook2022` を除くための条件も要らない。

## フェーズ

### Phase 0: 着手前の確認

- [ ] 本番 DB に PAST の問題がそろっているか、ユーザーに確かめてもらう。そろっていない回は、データが入るまで見出しと空の枠が出る。

  ```sql
  SELECT contest_id, COUNT(*) AS task_count, MIN(task_table_index) AS first_index, MAX(task_table_index) AS last_index
  FROM task
  WHERE contest_id LIKE 'past%'
  GROUP BY contest_id
  ORDER BY contest_id;
  ```

  期待: `past*-open` が 24 行で、どれも 15 問・A〜O（ほかに `pastbook2022` の 1 行）。

### Phase 1: 表示設定の改名（振る舞いの変更なし）

- 層: `src/features/tasks/utils/contest-table/`。責務: 1 回 = 1 テーブルの表示設定を共有する。
- [ ] `git mv` で `aoj_labels.ts` / `aoj_labels.test.ts` を改名し、export と `aoj_icpc_providers.ts`・`aoj_jag_providers.ts` の import を変える。
- [ ] テスト名: `describe('sortHeaderIdsByTaskTableIndex')`、`describe('buildPerContestDisplayConfig')` / `test('returns the shared per-contest display config')`。
- 改名だけで分岐が無いので、テスト先行は省略する。既存のテストと `pnpm check` で確かめる。
- commit: `refactor(contest-table): rename AOJ layout helpers for reuse by non-AOJ providers`

### Phase 2: 回数 → contest_id（lib、TDD）

- 層: `src/lib/contests/utils/labels/`。責務: PAST の回数と contest_id の対応を 1 か所で持つ。
- [ ] `past.test.ts` に先にテストを書く（RED）。
  - `describe('getPastContestId')`
  - `test.each`: `'returns past201912-open for round 1'`、`'returns past202303-open for round 14'`、`'returns past15-open for round 15'`、`'returns past24-open for round 24'`
  - `test('round-trips with getPastContestLabel for rounds 1 to 24')`（24 は lib のテストに直書きし、features の定数は import しない）
- [ ] `PAST_YEAR_MONTHS` を作り、`PAST_TRANSLATIONS` をそこから作る。`getPastContestId` を足し、`#lib/contests/index.ts` から export する（GREEN）。既存の `getPastContestLabel` のテストもそのまま通ること。
- commit: `feat(contests): add getPastContestId to map PAST rounds to contest ids`

### Phase 3: seed の追加

- 層: `prisma/`。責務: ローカルで全 24 回のテーブルが埋まるようにする。
- [ ] `src/lib/contests/fixtures/contest_type.ts` の PAST に `{ name: 'PAST 24th', contestId: 'past24-open' }` を足す（分類は既存の規則で通る見込みなので RED にならなくてよい）。
- [ ] `prisma/tasks.ts` の PAST の 5 行（`past18_a` 〜 `past202209_g`）を、スクリプトで生成した 360 行に置き換える。
  - 並び: 回の新しい順（第 24 回 → 第 1 回）、回の中は O → A。
  - 既存の 5 行の `grade`（`past18_a`: Q8、`past202309_a`: Q8、`past202306_b`: Q9、`past202306_a`: Q8、`past202209_g`: Q1）を引き継ぐ。ほかは `grade` を付けない。
  - `pastbook2022` の 8 行はそのまま残す。
- [ ] `grep -c "contest_id: 'past[0-9]*-open'" prisma/tasks.ts` が 360 になることを確かめる。`pnpm db:seed` が通ることも確かめる。
- [ ] `past_problems.json` を消す（seed に入れたら不要）。
- commit: `chore(seed): add all PAST rounds 1-24 to tasks`

### Phase 4: `PastProvider`（TDD）

- 層: `src/features/tasks/utils/contest-table/`。責務: 1 回分のタスクを選び、ICPC 形式のメタデータと表示設定を返す。
- [ ] `past_provider.test.ts` に先にテストを書く（RED）。fixture は第 1 回（`past201912-open`）・第 15 回（`past15-open`、task_id は `past202306_*`）・第 24 回（`past24-open`）と `pastbook2022` の数問を、テストファイルの中に置く。
  - `describe('filter')`: `'returns only tasks of the given round'`、`'maps round 1 to past201912-open'`、`'maps round 15 to past15-open'`、`'excludes tasks from other rounds'`、`'excludes pastbook2022 tasks'`、`'returns empty array for empty input'`
  - `describe('getProviderKey')`: `'returns PAST::{round}'`
  - `describe('getMetadata')`: `'returns PAST 第 N 回 as the title'`、`'returns pastN as abbreviationName'`、`'returns the per-contest title style'`
  - `describe('getDisplayConfig')`: `'returns the per-contest display config'`
  - `describe('getHeaderIdsForTask')`: `'returns A to O in ascending order regardless of input order'`
  - `describe('generateTable')`: `'keys the table by contest_id and task_table_index'`
  - `describe('getContestRoundLabel')`: `'returns the same label as the title'`
- [ ] `past_provider.ts` を実装する（GREEN）。
- commit は Phase 5 とまとめる。

### Phase 5: グループ登録（TDD）

- 層: 同上。責務: PAST の Provider を新しい順に並べ、ボタンを AWC の直後に置く。
- [ ] `contest_table_provider_groups.test.ts` に先にテストを書く（RED）。
  - `describe('round-range presets')` / `test('PAST registers one provider per round, newest first')`: group 名・`buttonLabel`・`ariaLabel`・`getSize() === PAST_LATEST_ROUND - PAST_OLDEST_ROUND + 1`・先頭が `PAST::24`、末尾が `PAST::1`・`getProvider(ContestType.PAST, '15')` が定義済み。
  - `describe('contestTableProviderGroups')` / `test('places the PAST button right after AWC 0001 onwards')`: `Object.keys` で `past` が `awc0001Onwards` の次にあること。
- [ ] `contest_table_provider_groups.ts` に定数・preset・`past` キーを足す（GREEN）。
- [ ] `pnpm test:unit src/features/tasks/utils/contest-table/`
- commit: `feat(contest-table): add PastProvider for PAST rounds 1-24`

### Phase 6: ドキュメントと仕上げ

- [ ] `docs/guides/how-to-add-contest-table-provider.md` の「コンストラクタパラメータ型」の表に PAST の行を足し、最終更新を変える。

  | コンテスト | フィルタ方式   | 備考                                                                                      |
  | ---------- | -------------- | ----------------------------------------------------------------------------------------- |
  | PAST       | 回数パラメータ | `PastProvider(type, round)`。第 1〜14 回は `past{YYYYMM}-open`。`getPastContestId` で変換 |

- [ ] `pnpm dev` で `PAST` ボタンが `AWC 0001 〜` の右にあり、第 24 回が一番上、第 1 回が一番下、`pastbook2022` が出ないことを見る。
- [ ] `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- [ ] cross-review: 手で編集するファイルは約 14 で 30 未満だが、`#lib/contests` の公開 API（`getPastContestId`）と、共有している表示設定の名前を変えるので、Codex でレビューする。

## 新しい回が出たとき

`PAST_LATEST_ROUND` を上げ、seed（と本番 DB）にその回の問題を入れる。第 15 回以降は contest_id が `past{N}-open` の形なので、`past.ts` の変更は要らない。
