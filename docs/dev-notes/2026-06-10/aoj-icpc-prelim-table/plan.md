# ICPC 国内予選テーブル 実装計画 (Issue #3633)

## 概要

Issue #3633「ICPC・国内予選」のテーブルを追加する。`src/lib/utils/contest.ts` の `AOJ_ICPC`（`ICPC_TRANSLATIONS = { Prelim: ' 国内予選 ', ... }`）相当の分類・ラベルは**既に存在**しており、`classifyContest` / `contestTypePriorities`（priority 23）/ `getContestNameLabel` / AOJ URL 生成（`AojGenerator`）まで実装済み。一方で **テーブルプロバイダ（ContestTableProviderGroup）は未実装**で、AOJ 系（PCK/JAG/ICPC/COURSES/UNIVERSITY）の表示テーブルは1つも登録されていない。本タスクは ICPC 国内予選を「最初の AOJ テーブル」として、EDPC（PR #2286）相当の形式で追加する。

スコープは **国内予選のみ**（`ICPCPrelim{year}`、1998〜2025 の28年分）。

### 今回の3つの新規要件（既存実装に前例なし）

1. **年度単位でテーブル分割（新しい年度が上）**: 年度クラスを28個作る代わりに、**1つのベースクラスをコンストラクタで年度指定して28回インスタンス化**する。既存の JOI/Tessoku は「セクションごとにサブクラス」だが、本件は「1クラス × year引数」とする。
2. **表示ラベルのプレフィックス付与（DB値は不変）**: DB の `task_table_index`（= AOJ 問題ID、例 `1664`）を数値として昇順ソートし、最小を `A`, 次を `B`… に対応付け、表示タイトルを `(問題名)` → `A. (問題名)` に前置変換。ジャッジの欠落で連番にならない年度は **contest_id ごとの上書き Map** で個別対応（Map の中身は後でユーザーが提供）。
   - **重要**: ICPC の DB タイトルは `"{name}"` のみ（`"{problem_index}. {name}"` ではない）。ICPC はアプリ側からの登録（初期仕様）で title にインデックスが付かなかったため。よって除去処理は不要で、letter を**前置するだけ**でよい（手入力の他 seed データは title にインデックス付きだが、ICPC は別扱い）。
3. **テーブルタイトルのフォントサイズをこのテーブルだけ小さく**: 現状 `TaskTable.svelte` で `text-2xl` ハードコードのため、**プロバイダ単位で指定可能にする**（このテーブルは `text-xl`）。

## 設計判断と既存資産の再利用

- **ContestType レイヤはスキップ**: `AOJ_ICPC` は schema enum / `ContestType` 定数 / `classifyContest` / `contestTypePriorities` / `getContestNameLabel` / 分類・ラベルのテスト（`AOJ_ICPC_TEST_DATA`）まで完備。skill の Layer 1〜3 は不要。
- **プロバイダ基盤の再利用**: `ContestTableProviderBase`（`src/features/tasks/utils/contest-table/contest_table_provider_base.ts`）を継承。`constructor(contestType, section?)` の `section` に年度文字列を渡すと provider key が `AOJ_ICPC::2025` となり一意化できる（`createProviderKey` 既存）。
- **ラベル付与は generateTable をオーバーライドして表示用 title を差し替える方式**（共有コンポーネント無改造）。ICPC の title は `"{name}"` のみなので除去は不要、`{letter}. ` を**前置するだけ**。`isShownTaskIndex: true` でセルは `taskResult.title` をそのまま表示。
- **letter 割当はピュアな util に切り出してテスト**（coding-style: business logic → utils + adjacent test）。
- **seed 行の形式**は既存 AOJ/JAG 行に準拠: `{ id, contest_id, problem_index, name, title }`、`grade` 省略 = PENDING。ただし **ICPC は `title = "{name}"`**（problem_index プレフィックスなし。アプリ登録の初期仕様に合わせる）。`problem_index` には AOJ id を入れる。

### 却下した代替案

- **年度ごとにサブクラス（JOI/Tessoku 流）**: 28クラスは冗長。ユーザー要件「ベースクラス1つ + コンストラクタで年度指定」に反する。→ 却下。
- **セル表示ロジックを `TaskTableBodyCell.svelte` 側に分岐追加**: 共有コンポーネントに ICPC 専用分岐が漏れる。generateTable で表示用 title を生成する方がプロバイダ内に閉じる。→ 却下。
- **`title` フォントサイズを全テーブル一律変更**: 他テーブルへ影響。→ 却下、プロバイダ単位の任意設定にする。
- **letter を AOJ API の配列順から決定**: 欠落年度では配列順≠正規レター。`task_table_index` 数値昇順 + 上書き Map の方が DB 単独で完結。→ 数値昇順を採用（ユーザー選択）。

---

## Phase 0: Seed データ収集（ブロッカー・最初に実施）

`prisma/tasks.ts` に ICPC 行が0件。AOJ Judge API から収集して追加する。

- データ源: `https://judgeapi.u-aizu.ac.jp/challenges/cl/icpc/prelim`
  - `contests[].abbr`（例 `ICPCPrelim2025`）、`contests[].days[].problems[]` に `id`（数値文字列）・`name`。
- 各 problem を1行に変換（`prisma/tasks.ts` の配列へ追記）:
  ```js
  {
    id: '1664',
    contest_id: 'ICPCPrelim2023',
    problem_index: '1664',  // = AOJ id（DB の task_table_index にマップ）
    name: '<API の name>',
    title: '<API の name>', // ICPC は name のみ（index プレフィックスを付けない）
    // grade 省略 → PENDING
  }
  ```
- 28年分（1998〜2025、各4〜9問、計 ~170行）。
- 検証: `classifyContest('ICPCPrelim2023') === ContestType.AOJ_ICPC`、`getContestNameLabel` が `（ICPC 国内予選 2023）` 系を返すこと（既存テストの延長で確認可）。

> 注: gap（ジャッジ欠落で A,B,C… が連続しない年度）の特定は Phase 2 の上書き Map 用データとして別途ユーザーが提供。Phase 0 では API が返す問題のみ seed する。

**critical file**: `prisma/tasks.ts`

---

## Phase 1: タイトルフォントサイズのプロバイダ単位設定（低リスク・独立）

- `ContestTableMetaData`（`src/features/tasks/types/contest-table/contest_table_provider.ts`）に任意フィールド追加:
  ```ts
  titleFontSize?: string; // Tailwind class, e.g. 'text-xl'. Defaults to 'text-2xl' at render.
  ```
- `TaskTable.svelte` のタイトル描画を変更（L227 付近）:
  ```svelte
  <Heading tag="h2" class="{metadata.titleFontSize ?? 'text-2xl'} pb-3 text-gray-900 dark:text-white">
  ```
- 既存プロバイダは未指定 → デフォルト `text-2xl` 維持（後方互換）。

**critical files**: `contest_table_provider.ts`, `TaskTable.svelte`

---

## Phase 2: letter 割当ユーティリティ（TDD）

新規 util（feature-scoped）: `src/features/tasks/utils/contest-table/aoj_icpc_labels.ts`

- 上書き Map 定数（初期は空 or 既知の gap 年度のみ。中身は後日ユーザー提供）:
  ```ts
  // contest_id -> (task_table_index -> letter). Used only for years with judge gaps.
  export const ICPC_PRELIM_LABEL_OVERRIDES: Record<string, Record<string, string>> = {
    // e.g. ICPCPrelim2007: { '1150': 'A', '1152': 'C', ... }
  };
  ```
- 関数:
  ```ts
  // Build task_table_index -> letter map for one contest.
  // Default: sort indices numerically asc, assign A, B, C...
  // Override: if ICPC_PRELIM_LABEL_OVERRIDES[contestId] exists, use it.
  export function buildAojIcpcLetterMap(
    contestId: string,
    taskTableIndices: string[],
  ): Map<string, string>;
  ```
- 隣接テスト `aoj_icpc_labels.test.ts`:
  - 自動連番: `['1665','1664']` → `{1664:'A', 1665:'B'}`（数値昇順）。
  - 上書き Map 経路: フィクスチャ contest_id で Map が優先されること。
  - ICPC 国内予選は最大9問（A〜I）で収まる前提を明記。

**critical file**: `aoj_icpc_labels.ts`（+ test）

---

## Phase 3: AojIcpcPrelimProvider（TDD・1クラス×year引数）

新規 `src/features/tasks/utils/contest-table/aoj_icpc_providers.ts`

```ts
export class AojIcpcPrelimProvider extends ContestTableProviderBase {
  private readonly year: number;
  private readonly contestId: string;

  constructor(contestType: ContestType, year: number) {
    super(contestType, String(year)); // provider key: AOJ_ICPC::{year}
    this.year = year;
    this.contestId = `ICPCPrelim${year}`;
  }

  protected setFilterCondition() {
    return (taskResult: TaskResult) => taskResult.contest_id === this.contestId;
  }

  // Override: prepend assigned letter to the title (display only; DB unchanged).
  // ICPC titles are stored as "{name}" only, so no prefix removal is needed.
  generateTable(filtered: TaskResults): ContestTable {
    const letterMap = buildAojIcpcLetterMap(
      this.contestId,
      filtered.map((taskResult) => taskResult.task_table_index),
    );
    const table: ContestTable = { [this.contestId]: {} };

    for (const taskResult of filtered) {
      const index = taskResult.task_table_index;
      const letter = letterMap.get(index) ?? index;
      table[this.contestId][index] = { ...taskResult, title: `${letter}. ${taskResult.title}` };
    }

    return table;
  }

  // Ensure left-to-right cell order is numeric (A,B,C...). Safeguard for variable-width ids.
  getHeaderIdsForTask(filtered: TaskResults): string[] {
    return Array.from(new Set(filtered.map((taskResult) => taskResult.task_table_index))).sort(
      (first, second) => Number(first) - Number(second),
    );
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: `ICPC 国内予選 ${this.year}`,
      abbreviationName: `icpcPrelim${this.year}`,
      titleFontSize: 'text-xl',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2', // EDPC 相当
      isShownTaskIndex: true, // show transformed "{letter}. {name}" as-is
    };
  }

  getContestRoundLabel(): string {
    return `ICPC 国内予選 ${this.year}`; // unused (isShownRoundLabel: false) but required
  }
}
```

- 隣接テスト `aoj_icpc_providers.test.ts`（Pattern 2 系・年度フィクスチャで検証）:
  - `filter`: `ICPCPrelim2023` の行のみ抽出。
  - `generateTable`: title が `A. ...` / `B. ...` に置換（DB の `task_table_index`/`task_id` は不変）。
  - `getMetadata`: `title === 'ICPC 国内予選 2023'`、`titleFontSize === 'text-xl'`。
  - `getDisplayConfig`: `isShownHeader === false` 等。
  - 上書き Map フィクスチャ年度で letter が Map 通りになること。

**critical files**: `aoj_icpc_providers.ts`（+ test）

---

## Phase 4: グループ登録（TDD・新規グループ）

`src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`

```ts
// Range of ICPC domestic-prelim years available on AOJ.
// OLDEST is a stable domain constant (first season on AOJ).
// LATEST must be bumped when a new season is seeded into prisma/tasks.ts.
const ICPC_PRELIM_OLDEST_YEAR = 1998;
const ICPC_PRELIM_LATEST_YEAR = 2025;

AojIcpcPrelim: () => {
  const group = new ContestTableProviderGroup('ICPC 国内予選', {
    buttonLabel: 'ICPC 国内予選',
    ariaLabel: 'Filter ICPC Domestic Preliminary',
  });
  // Iterate from latest to oldest so the newest year's table renders on top.
  for (let year = ICPC_PRELIM_LATEST_YEAR; year >= ICPC_PRELIM_OLDEST_YEAR; year--) {
    group.addProvider(new AojIcpcPrelimProvider(ContestType.AOJ_ICPC, year));
  }
  return group;
},
```

- `contestTableProviderGroups` に `aojIcpcPrelim: presets.AojIcpcPrelim()` を追加（JOI 群の後ろ＝外部プラットフォーム位置）。
- 定数 `ICPC_PRELIM_OLDEST_YEAR` / `ICPC_PRELIM_LATEST_YEAR` はモジュール冒頭に配置（`prepareContestProviderPresets` の外）。
- `contest_table_provider_groups.test.ts` 更新:
  - 新グループ名 / buttonLabel / ariaLabel。
  - `getSize() === ICPC_PRELIM_LATEST_YEAR - ICPC_PRELIM_OLDEST_YEAR + 1`（= 28）。
  - `getProvider(ContestType.AOJ_ICPC, '2023')` が `AojIcpcPrelimProvider` を返す。
  - import 追加。
- （任意）drift 検知: seed 中の最新 `ICPCPrelim` 年度が `ICPC_PRELIM_LATEST_YEAR` と一致することを検証するテストを追加すると、seed 追加時の定数未更新を防げる。

**critical files**: `contest_table_provider_groups.ts`（+ group test）

---

## Phase 5: 最終検証

- `pnpm test:unit`（特に `src/features/tasks/utils/contest-table/`）
- `pnpm check`
- `pnpm lint` / `pnpm format`
- 手動/E2E 確認:
  - `pnpm dev` → タスク一覧でボタン「ICPC 国内予選」を選択。
  - 年度テーブルが **2025 → 1998 の順**で縦に並ぶ。
  - 各セルが `A. (問題名)`、`B. (問題名)`… で表示され、タイトル見出しが他テーブルより小さい（`text-xl`）。
  - 外部リンクが AOJ（`judge.u-aizu.ac.jp/.../id={task_id}`）へ遷移。

---

## 実装メモ

- コミット粒度: Phase 0（seed）／ Phase 1（font config）／ Phase 2-3（util + provider）／ Phase 4（group）で分割。
- gap 年度の上書き Map データはユーザー提供待ち。提供後に `ICPC_PRELIM_LABEL_OVERRIDES` を埋め、該当年度のテストを追加。
- 26問超は ICPC 国内予選では発生しない（最大9問）ため A〜Z 超のロジックは実装しない（YAGNI）。

## チェックリスト

- [ ] Phase 0: AOJ API から seed 収集し `prisma/tasks.ts` に追加（1998〜2025）
- [ ] Phase 1: `titleFontSize` 追加 + `TaskTable.svelte` 反映
- [ ] Phase 2: `aoj_icpc_labels.ts`（letter util + 上書き Map）+ test
- [ ] Phase 3: `aoj_icpc_providers.ts`（AojIcpcPrelimProvider）+ test
- [ ] Phase 4: グループ登録 + groups test 更新
- [ ] Phase 5: `pnpm test:unit` / `check` / `lint` / 手動確認
- [ ] gap 年度 上書き Map（ユーザー提供後）
