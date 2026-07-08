# JAG 模擬国内予選テーブル追加（issue #3828）

## 概要（背景）

AOJ の「JAG 模擬国内（JAG Prelim）」コンテストを、年度単位のテーブルとしてコンテスト一覧に表示したい（issue #3828）。ICPC 国内予選（PR #3635, Pattern 4）と同じ方式で実装する。

現状の調査結果:

- **`ContestType.AOJ_JAG` は既に存在**（`prisma/schema.prisma`・`src/lib/types/contest.ts`・`contestTypePriorities` に priority 25 で登録済み）。JAG Prelim/Regional/合宿を包含する共通型。→ **新規 ContestType は不要**。ICPC が Prelim/Regional を 1 つの `AOJ_ICPC` 型で扱うのと同じく、JAG Prelim も `AOJ_JAG` を流用する。
- seed（`prisma/tasks.ts` 12272〜13456 行、計 169 問 / 23 contest_id）は 2005〜2026 が連続で存在。欠年なし。**2016 のみ `JAGPrelim2016A`（7問）と `JAGPrelim2016B`（7問）の 2 コンテストに分割**。問題数は 6→9 と年次で増加。`problem_index` は AOJ 問題番号（例 `'2738'`）で、各コンテスト内で昇順連番。
- **「p で拾えるか」= AtCoder Problems の `problems.json` 経由で admin `/tasks` の fetch に拾われるか**、という意味。拾われる条件は「problems.json に存在」かつ「`classifyContest(contest_id) !== null`」。現行の `regexForJag`（`src/lib/utils/contest.ts:3`）は `JAGPrelim2016A` / `JAGPrelim2016B` にマッチせず（末尾の裸 `[A-Z]` は `-day\d+` 前置が必須のため）、**2016A/B が拾われない**。→ 修正が必要。

### 決定事項（ユーザー確認済み）

1. **スコープ**: JAG Prelim のみ（Regional・合宿は将来対応）。1 グループ `aojJagPrelim` を追加。
2. **見出し表記**: `JAG 模擬国内 {year}`。2016 は `JAG 模擬国内 2016 A` / `JAG 模擬国内 2016 B` の 2 テーブル（A が上、B が下）。
3. **ラベルヘルパー**: 既存 `aoj_icpc_labels.ts` を中立名 `aoj_labels.ts` にリネームし、ICPC/JAG で共有（下記 Phase 1）。タイトル接頭辞 `A. ` を付ける関数は `TaskTableBodyCell` で既に共有済みなので流用。

## 設計方針

- **Pattern 4（コンストラクタパラメータ型）** を踏襲。`JagPrelimProvider(contestType, year, suffix?)`。`super(contestType, \`${year}${suffix}\`)` で provider key を一意化（`AOJ_JAG::2016A` 等）。
- **2016 の A/B 分割**: コンストラクタ第3引数 `suffix: '' | 'A' | 'B'` で吸収。`contestId = \`JAGPrelim${year}${suffix}\``。グループ登録ループで 2016 のみ A→B の 2 インスタンスを追加。
- **表示ラベル `A.`**: `getTaskLabels` が `{ [contestId]: { [task_table_index]: letter } }` を返し、`TaskTableBodyCell` の `$derived displayTitle` が共有関数 `formatAojTitle`（旧 `formatAojIcpcTitle`）で `A. {title}` を生成。**`generateTable` ではタイトルを一切変更しない**（optimistic update での接頭辞累積を防ぐ、Issue #3636）。
- **数値ソート**: `task_table_index` が数値文字列なので `getHeaderIdsForTask` を数値昇順でオーバーライド（共有 `sortAojHeaderIds`）。
- **override map 不要**: JAG は `problem_index` が連番のため、デフォルトの数値ソート→A,B,C… で正しく割り当てられる（judge gap なし）。

### 却下した代替案

- **新規 ContestType（例 `AOJ_JAG_PRELIM`）を追加して AOJ_JAG から分離**: ICPC が 1 型で Prelim/Regional を扱う前例に反し、priorities の再採番・schema マイグレーション・fixtures 移設が発生。利得なし。→ 却下。
- **ラベルヘルパーを `aoj_jag_labels.ts` に複製**: 汎用関数 4 つの重複。共有（Phase 1 リネーム）の方が DRY。→ 却下。
- **2016 を `year` だけで扱い contest_id をマップで特殊分岐**: `suffix` 引数の方が provider key の一意化と自然に噛み合う。→ 却下。

---

## Phase 0: `regexForJag` 修正（「p で拾える」化）＋分類テスト — 最小リスク

`src/lib/utils/contest.ts:3` の regex を修正し、裸の末尾 `[A-Z]`（2016A/B）を許容:

```typescript
// Before
export const regexForJag = /^JAG(Prelim|Regional|Summer|Winter|Spring)\d{4}(-day\d+[A-Z]?)?$/;
// After: make -day optional and allow a trailing single letter independently
export const regexForJag = /^JAG(Prelim|Regional|Summer|Winter|Spring)\d{4}(-day\d+)?[A-Z]?$/;
```

マッチ確認: `JAGPrelim2016A`✓ `JAGPrelim2016B`✓ `JAGPrelim2016-day1A`✓ `JAGPrelim2016-day1`✓ `JAGPrelim2015`✓。

影響先（いずれも修正不要・破壊なし、テストで確認）:

- `classifyContest` → 2016A/B が `AOJ_JAG` に分類され admin `/tasks` fetch に拾われる（`src/routes/(admin)/tasks/+page.server.ts` の `filterUnregisteredTasks`）。
- `getContestNameLabel`/`getAojContestLabel` → `.replace('Prelim', …)` で `（JAG 模擬国内 2016A）` を生成（末尾 A は残る。許容）。
- `src/lib/utils/task.ts` の `AojGenerator.canHandle` → 2016A/B が AOJ URL 生成対象に（URL は taskId ベースなので副作用なし）。

テスト追加（TDD、先に RED）:

- `src/test/lib/utils/test_cases/contest_type.ts`: `aojJag` に `JAGPrelim2016A` / `JAGPrelim2016B` / `JAGPrelim2025` / `JAGPrelim2026` を追加（expected `AOJ_JAG`）。
- `src/test/lib/utils/test_cases/contest_name_labels.ts`: `aojJag` に 2016A/B の期待ラベル（`（JAG 模擬国内 2016A）` 等）を追加。
- 検証: `pnpm test:unit src/test/lib/utils/contest.test.ts`。

## Phase 1: `aoj_icpc_labels.ts` → `aoj_labels.ts` リネーム（中立化リファクタ、挙動不変）

`src/features/tasks/utils/contest-table/aoj_icpc_labels.ts` を `aoj_labels.ts` に `git mv`、エクスポートを中立名にリネーム:

| 旧                          | 新                      |
| --------------------------- | ----------------------- |
| `formatAojIcpcTitle`        | `formatAojTitle`        |
| `buildAojIcpcLetterMap`     | `buildAojLetterMap`     |
| `sortAojIcpcHeaderIds`      | `sortAojHeaderIds`      |
| `buildAojIcpcDisplayConfig` | `buildAojDisplayConfig` |
| `AOJ_ICPC_TITLE_STYLE`      | `AOJ_TITLE_STYLE`       |
| `ICPC_LABEL_OVERRIDES`      | `AOJ_LABEL_OVERRIDES`   |

参照追従（挙動不変・機械的置換）:

- `aoj_icpc_providers.ts`（import 元）
- `aoj_icpc_providers.test.ts`（`ICPC_LABEL_OVERRIDES` 参照）
- `aoj_icpc_labels.test.ts` → `aoj_labels.test.ts` に `git mv` し参照更新
- `src/features/tasks/components/contest-table/TaskTableBodyCell.svelte`（`formatAojIcpcTitle` import → `formatAojTitle`）

検証: `pnpm test:unit src/features/tasks/utils/contest-table/` と `pnpm check`（既存 ICPC テストが全て GREEN のままであること）。

## Phase 2: `JagPrelimProvider` 実装（TDD）

新規 `src/features/tasks/utils/contest-table/aoj_jag_providers.ts`（ICPC を範に、共有 `aoj_labels.ts` を利用）:

```typescript
export class JagPrelimProvider extends ContestTableProviderBase {
  private readonly year: number;
  private readonly suffix: string; // '' | 'A' | 'B'
  private readonly contestId: string;

  constructor(contestType: ContestType, year: number, suffix: '' | 'A' | 'B' = '') {
    super(contestType, `${year}${suffix}`); // provider key: AOJ_JAG::2016A
    this.year = year;
    this.suffix = suffix;
    this.contestId = `JAGPrelim${year}${suffix}`;
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult) => taskResult.contest_id === this.contestId;
  }

  override getHeaderIdsForTask(filtered: TaskResults): string[] {
    return sortAojHeaderIds(filtered);
  }

  getMetadata(): ContestTableMetaData {
    const title = this.buildTitle();
    return {
      title,
      abbreviationName: `jagPrelim${this.year}${this.suffix}`,
      titleStyle: AOJ_TITLE_STYLE,
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return buildAojDisplayConfig();
  }

  getContestRoundLabel(): string {
    return this.buildTitle();
  }

  override getTaskLabels(filtered: TaskResults): Record<string, Record<string, string>> {
    const letterMap = buildAojLetterMap(
      this.contestId,
      filtered.map((taskResult) => taskResult.task_table_index),
    );
    return { [this.contestId]: Object.fromEntries(letterMap) };
  }

  private buildTitle(): string {
    return this.suffix ? `JAG 模擬国内 ${this.year} ${this.suffix}` : `JAG 模擬国内 ${this.year}`;
  }
}
```

新規テスト `aoj_jag_providers.test.ts`（ICPC テスト構造を範に、**インライン fixture**）:

- 代表年: 2005（6問, 最古）/ 2023（8問）/ 2026（9問, 最新）。
- **2016A / 2016B**: contest_id・key・title（`… 2016 A` / `… 2016 B`）・フィルタ分離を検証。
- `filter`（contest_id 一致 / 非該当・別コンテスト混在の除外）、`getMetadata`、`getDisplayConfig`、`getContestRoundLabel`、`getHeaderIdsForTask`（数値昇順・重複排除・空）、`getTaskLabels`（A,B,C… / contestId キー / 空入力）、`generateTable`（生タイトル保持・非破壊）。
- 検証: `pnpm test:unit src/features/tasks/utils/contest-table/aoj_jag_providers.test.ts`（RED→GREEN）。

## Phase 3: グループ登録（TDD）

`src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`:

```typescript
export const JAG_PRELIM_OLDEST_YEAR = 2005;
export const JAG_PRELIM_LATEST_YEAR = 2026;
// 2016 was held twice in the same year, split into JAGPrelim2016A / JAGPrelim2016B.
// Kept as data so future split years only need to be added to this set.
const JAG_PRELIM_YEARS_HELD_AS_A_AND_B = new Set([2016]);

// inside prepareContestProviderPresets()
AojJagPrelim: () => {
  const group = new ContestTableProviderGroup('JAG 模擬国内', {
    buttonLabel: 'JAG 模擬国内',
    ariaLabel: 'Filter JAG Domestic Preliminary',
  });
  // Latest year on top. addProvider order = display order (first = top).
  for (let year = JAG_PRELIM_LATEST_YEAR; year >= JAG_PRELIM_OLDEST_YEAR; year--) {
    if (JAG_PRELIM_YEARS_HELD_AS_A_AND_B.has(year)) {
      group.addProvider(new JagPrelimProvider(ContestType.AOJ_JAG, year, 'A')); // top
      group.addProvider(new JagPrelimProvider(ContestType.AOJ_JAG, year, 'B')); // bottom
    } else {
      group.addProvider(new JagPrelimProvider(ContestType.AOJ_JAG, year));
    }
  }
  return group;
},
```

- import 追加、`contestTableProviderGroups` に `aojJagPrelim: presets.AojJagPrelim()` を登録。
- `contest_table_provider_groups.test.ts`: グループ名 `'JAG 模擬国内'`、metadata（buttonLabel/ariaLabel）、**`getSize()` = (2026−2005+1) + `JAG_PRELIM_YEARS_HELD_AS_A_AND_B.size` = 22 + 1 = 23**（2016 が A/B の 2 テーブルになるため）、`getProvider(ContestType.AOJ_JAG, '2016A')`/`'2016B'`/`'2023'` の型アサーション、`presets.AojJagPrelim` が function であるテストを追加。
- 検証: `pnpm test:unit src/features/tasks/utils/contest-table/`（RED→GREEN）。

## Phase 4: 最終検証・リファクタサイクル

- `pnpm test:unit` / `pnpm check` / `pnpm lint` / `pnpm format`。
- **手動 E2E 検証**: `pnpm dev` → コンテスト一覧で「JAG 模擬国内」フィルタを開き、
  - 2026 が最上部、2005 が最下部、年次降順。
  - 2016 が「A」テーブル（上）・「B」テーブル（下）に分割表示。
  - 各セルが `2738.` ではなく `A. A-un Breathing` のように英字ラベル表示。
- admin `/tasks` の fetch で `JAGPrelim2016A` / `JAGPrelim2016B` が未登録タスクとして拾われることを確認（regex 修正の効果）。
- AGENTS.md の refactor cycle: 本 `plan.md` に実装教訓を追記、`coderabbit review --plain` の findings を記載。

## 主要変更ファイル

- `src/lib/utils/contest.ts`（regex 1 行）
- `src/test/lib/utils/test_cases/contest_type.ts`, `contest_name_labels.ts`（テストケース追加）
- `src/features/tasks/utils/contest-table/aoj_labels.ts`（旧 `aoj_icpc_labels.ts` をリネーム）＋ `aoj_labels.test.ts`
- `src/features/tasks/utils/contest-table/aoj_icpc_providers.ts` / `.test.ts`（import 追従）
- `src/features/tasks/components/contest-table/TaskTableBodyCell.svelte`（import 追従）
- `src/features/tasks/utils/contest-table/aoj_jag_providers.ts`（新規）＋ `aoj_jag_providers.test.ts`（新規）
- `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts` / `.test.ts`（グループ登録）

コミット分割: Phase 0（regex+分類テスト）／ Phase 1（ラベルリネーム）／ Phase 2–3（provider+group）を別コミット。
