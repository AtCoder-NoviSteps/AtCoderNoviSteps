# AWC0150 コンテストテーブル実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AWC0150 を AWC0100 と同じ EDPC フォーマットの単独テーブルとして表示できるようにする

**Scope:** AWC0151OnwardsProvider は別 PR とする。AWC0150 開催時点で 0151+ のデータは存在しないため、このPRでは不要。

**Architecture:** `AWC0150Provider` (150 のみ, 15問 A-O, EDPC フォーマット) を新規追加する。既存の `AWC0101OnwardsProvider` は `AWC0101To0149Provider` にリネームし、フィルタ範囲を 101–149 に縮小する（名前と実態を一致させる）。AWC0100Provider のパターンをそのまま踏襲する。

**Tech Stack:** TypeScript, Vitest

**Closes:** #3988

**参考 PR:** #3716 (AWC0100 EDPC-format provider 追加時)

---

## 概要

### 設計根拠

- AWC0100 と AWC0150 はどちらも特別回（15問 A-O）。同じ EDPC 表示フォーマットを適用する
- 既存の AWC0100Provider のコードをほぼコピーし、contest_id のみ差し替えるシンプルな実装
- `AWC0101OnwardsProvider` → `AWC0101To0149Provider` にリネーム。フィルタが 101–149 なのに "Onwards" は名前と実態が一致しない

### 却下した代替案

- **AWC0150 を AWC0101OnwardsProvider 内に留める案**: 15 問のコンテストが 5 問テーブルに混在して表示が崩れる
- **動的に特別回を検出する案**: YAGNI。特別回が増えた時点で汎化すれば十分
- **3 分割（AWC0101To0149 / AWC0150 / AWC0151Onwards）案**: 0151+ のデータが存在しない現時点では過剰。0151 回開始時に別 PR で対応する

### 変更対象ファイル

| ファイル                                                                       | 操作 | 内容                                                                                              |
| ------------------------------------------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------- |
| `prisma/tasks.ts`                                                              | 変更 | AWC0150 ダミー seed データ追加                                                                    |
| `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`          | 変更 | AWC0150 フィクスチャ追加                                                                          |
| `src/features/tasks/utils/contest-table/awc_provider.ts`                       | 変更 | AWC0150Provider 追加、AWC0101OnwardsProvider → AWC0101To0149Provider リネーム+フィルタ縮小        |
| `src/features/tasks/utils/contest-table/awc_provider.test.ts`                  | 変更 | AWC0150Provider テスト追加、AWC0101To0149Provider テスト修正                                      |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`      | 変更 | プロバイダーグループ更新（AWC0101OnwardsProvider → AWC0101To0149Provider + AWC0150Provider 追加） |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts` | 変更 | AWC プロバイダーグループテスト更新（provider 数 3→4、section key 変更）                           |

### Phase 一覧

| Phase | 内容                                                                 | リスク |
| ----- | -------------------------------------------------------------------- | ------ |
| 1     | seed データ追加                                                      | 低     |
| 2     | AWC0150 フィクスチャ追加                                             | 低     |
| 3     | AWC0150Provider + テスト                                             | 低     |
| 4     | AWC0101OnwardsProvider → AWC0101To0149Provider リネーム + テスト修正 | 低     |
| 5     | プロバイダーグループ登録更新                                         | 低     |
| 6     | 全体検証                                                             | 低     |

---

## Phase 1: seed データ追加

### Task 1: prisma/tasks.ts に AWC0150 ダミーデータ追加

**Files:**

- Modify: `prisma/tasks.ts`

- [ ] **Step 1: AWC0100 の seed データの直後に AWC0150 のダミーデータ 15 件を追加**

問題はまだ公開されていないため、ダミータイトルを使用する。AWC0100 のパターンに合わせる。

A–O の 15 件すべて書く。パターンは AWC0100 と同一（`id: 'awc0150_{letter}'`, `contest_id: 'awc0150'`, `problem_index: '{Letter}'`）。問題名はダミー。

```typescript
  { id: 'awc0150_a', contest_id: 'awc0150', problem_index: 'A', name: 'Dummy Problem A', title: 'A. Dummy Problem A' },
  { id: 'awc0150_b', contest_id: 'awc0150', problem_index: 'B', name: 'Dummy Problem B', title: 'B. Dummy Problem B' },
  { id: 'awc0150_c', contest_id: 'awc0150', problem_index: 'C', name: 'Dummy Problem C', title: 'C. Dummy Problem C' },
  { id: 'awc0150_d', contest_id: 'awc0150', problem_index: 'D', name: 'Dummy Problem D', title: 'D. Dummy Problem D' },
  { id: 'awc0150_e', contest_id: 'awc0150', problem_index: 'E', name: 'Dummy Problem E', title: 'E. Dummy Problem E' },
  { id: 'awc0150_f', contest_id: 'awc0150', problem_index: 'F', name: 'Dummy Problem F', title: 'F. Dummy Problem F' },
  { id: 'awc0150_g', contest_id: 'awc0150', problem_index: 'G', name: 'Dummy Problem G', title: 'G. Dummy Problem G' },
  { id: 'awc0150_h', contest_id: 'awc0150', problem_index: 'H', name: 'Dummy Problem H', title: 'H. Dummy Problem H' },
  { id: 'awc0150_i', contest_id: 'awc0150', problem_index: 'I', name: 'Dummy Problem I', title: 'I. Dummy Problem I' },
  { id: 'awc0150_j', contest_id: 'awc0150', problem_index: 'J', name: 'Dummy Problem J', title: 'J. Dummy Problem J' },
  { id: 'awc0150_k', contest_id: 'awc0150', problem_index: 'K', name: 'Dummy Problem K', title: 'K. Dummy Problem K' },
  { id: 'awc0150_l', contest_id: 'awc0150', problem_index: 'L', name: 'Dummy Problem L', title: 'L. Dummy Problem L' },
  { id: 'awc0150_m', contest_id: 'awc0150', problem_index: 'M', name: 'Dummy Problem M', title: 'M. Dummy Problem M' },
  { id: 'awc0150_n', contest_id: 'awc0150', problem_index: 'N', name: 'Dummy Problem N', title: 'N. Dummy Problem N' },
  { id: 'awc0150_o', contest_id: 'awc0150', problem_index: 'O', name: 'Dummy Problem O', title: 'O. Dummy Problem O' },
```

- [ ] **Step 2: コミット**

```bash
git add prisma/tasks.ts
git commit -m "feat(seed): add AWC0150 dummy task data"
```

---

## Phase 2: フィクスチャ追加

### Task 2: AWC0150 / AWC0101To0149 テスト用フィクスチャ追加

**Files:**

- Modify: `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`

- [ ] **Step 1: AWC0150 フィクスチャを追加**

AWC0100 と同じ 15 問 (A-O) 構成。`taskResultsForAWC0100Provider` の直後に追加する。

```typescript
// AWC0150 (special edition): 15 tasks (A-O)
const [
  awc0150_a,
  awc0150_b,
  awc0150_c,
  awc0150_d,
  awc0150_e,
  awc0150_f,
  awc0150_g,
  awc0150_h,
  awc0150_i,
  awc0150_j,
  awc0150_k,
  awc0150_l,
  awc0150_m,
  awc0150_n,
  awc0150_o,
] = createContestTasks('awc0150', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: AC },
  { taskTableIndex: 'E', statusName: TRYING },
  { taskTableIndex: 'F', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'G', statusName: TRYING },
  { taskTableIndex: 'H', statusName: PENDING },
  { taskTableIndex: 'I', statusName: PENDING },
  { taskTableIndex: 'J', statusName: PENDING },
  { taskTableIndex: 'K', statusName: PENDING },
  { taskTableIndex: 'L', statusName: PENDING },
  { taskTableIndex: 'M', statusName: PENDING },
  { taskTableIndex: 'N', statusName: PENDING },
  { taskTableIndex: 'O', statusName: PENDING },
]);

export const taskResultsForAWC0150Provider: TaskResults = [
  awc0150_a,
  awc0150_b,
  awc0150_c,
  awc0150_d,
  awc0150_e,
  awc0150_f,
  awc0150_g,
  awc0150_h,
  awc0150_i,
  awc0150_j,
  awc0150_k,
  awc0150_l,
  awc0150_m,
  awc0150_n,
  awc0150_o,
];
```

- [ ] **Step 2: AWC0101To0149 フィクスチャを追加**

既存の awc0101, awc0102 は 101–149 範囲内なのでそのまま使える。境界値 awc0149 を追加する。
`taskResultsForAWC0101To0149Provider` を新規 export として追加（旧 `taskResultsForAWC0101OnwardsProvider` は Phase 4 完了まで残す）。

```typescript
// AWC 0101-0149: 5 tasks (A, B, C, D, E)
const [awc0149_a, awc0149_b, awc0149_c, awc0149_d, awc0149_e] = createContestTasks('awc0149', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'C', statusName: AC },
  { taskTableIndex: 'D', statusName: PENDING },
  { taskTableIndex: 'E', statusName: TRYING },
]);

export const taskResultsForAWC0101To0149Provider: TaskResults = [
  awc0101_a,
  awc0101_b,
  awc0101_c,
  awc0101_d,
  awc0101_e,
  awc0102_a,
  awc0102_b,
  awc0102_c,
  awc0102_d,
  awc0102_e,
  awc0149_a,
  awc0149_b,
  awc0149_c,
  awc0149_d,
  awc0149_e,
];
```

- [ ] **Step 3: ビルド確認**

Run: `pnpm check`
Expected: 型エラーなし（新フィクスチャは export 済み、旧フィクスチャも残存）

---

## Phase 3: AWC0150Provider + テスト

### Task 3: AWC0150Provider 実装

**Files:**

- Modify: `src/features/tasks/utils/contest-table/awc_provider.ts`
- Modify: `src/features/tasks/utils/contest-table/awc_provider.test.ts`

- [ ] **Step 1: failing テストを書く**

AWC0100Provider のテストをコピーし、`awc0100` → `awc0150` に差し替える。

```typescript
describe('AWC0150Provider', () => {
  test('expects to filter only awc0150 tasks', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const combined = [...taskResultsForAWC0101To0149Provider, ...taskResultsForAWC0150Provider];
    const filtered = provider.filter(combined);

    expect(filtered.length).toBe(15);
    expect(filtered.every((task) => task.contest_id === 'awc0150')).toBe(true);
  });

  test('expects to exclude awc0101 and awc0149', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const combined = [...taskResultsForAWC0101To0149Provider, ...taskResultsForAWC0150Provider];
    const filtered = provider.filter(combined);

    expect(filtered.some((task) => task.contest_id === 'awc0101')).toBe(false);
    expect(filtered.some((task) => task.contest_id === 'awc0149')).toBe(false);
  });

  test('expects to get correct metadata', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('AtCoder Weekday Contest 0150');
    expect(metadata.abbreviationName).toBe('awc0150');
  });

  test('expects to return correct display config (EDPC format)', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(false);
    expect(config.isShownRoundLabel).toBe(false);
    expect(config.roundLabelWidth).toBe('');
    expect(config.tableBodyCellsWidth).toBe(
      'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
    );
    expect(config.isShownTaskIndex).toBe(true);
  });

  test('expects getContestRoundLabel to return empty string', () => {
    const provider = new AWC0150Provider(ContestType.AWC);

    expect(provider.getContestRoundLabel('awc0150')).toBe('');
  });

  test('expects generateTable to produce 15 tasks (A-O) for awc0150', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0150Provider);
    const table = provider.generateTable(filtered);

    expect(table).toHaveProperty('awc0150');
    const problems = table['awc0150'];
    expect(Object.keys(problems)).toHaveLength(15);
    expect(Object.keys(problems)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
    ]);
  });

  test('expects to handle empty task results', () => {
    const provider = new AWC0150Provider(ContestType.AWC);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test:unit src/features/tasks/utils/contest-table/awc_provider.test.ts -- -t "AWC0150"`
Expected: FAIL — `AWC0150Provider` が未定義

- [ ] **Step 3: AWC0150Provider を実装**

AWC0100Provider をコピーし、`awc0100` → `awc0150`、section `'0100'` → `'0150'` に差し替える。

```typescript
// AWC0150 (special edition, 15 tasks: A-O)
export class AWC0150Provider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, '0150');
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === 'awc0150';
    };
  }

  getMetadata(): ContestTableMetaData {
    return { title: 'AtCoder Weekday Contest 0150', abbreviationName: 'awc0150' };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(_contestId: string): string {
    return '';
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test:unit src/features/tasks/utils/contest-table/awc_provider.test.ts -- -t "AWC0150"`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/tasks/utils/contest-table/awc_provider.ts \
        src/features/tasks/utils/contest-table/awc_provider.test.ts
git commit -m "feat(contest-table): add AWC0150Provider with EDPC format"
```

---

## Phase 4: AWC0101OnwardsProvider → AWC0101To0149Provider リネーム

### Task 4: AWC0101OnwardsProvider を AWC0101To0149Provider にリネーム + フィルタ縮小

**Files:**

- Modify: `src/features/tasks/utils/contest-table/awc_provider.ts`
- Modify: `src/features/tasks/utils/contest-table/awc_provider.test.ts`
- Modify: `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`

- [ ] **Step 1: 既存の AWC0101OnwardsProvider テストを AWC0101To0149Provider に修正**

`describe('AWC0101OnwardsProvider', ...)` ブロックを以下のように変更する:

- クラス名: `AWC0101OnwardsProvider` → `AWC0101To0149Provider`
- フィクスチャ: `taskResultsForAWC0101OnwardsProvider` → `taskResultsForAWC0101To0149Provider`
- フィルタ範囲テスト: combined に AWC0150 フィクスチャを含め、0150 が除外されることを確認
- 境界値: awc9999 → awc0149（上限境界）、awc0150 は除外確認
- メタデータ: `title: 'AtCoder Weekday Contest 0101 〜 0149'`, `abbreviationName: 'awc0101To0149'`

```typescript
describe('AWC0101To0149Provider', () => {
  test('expects to filter tasks to include only AWC 0101-0149 contests', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0101To0149Provider);

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((task) => task.contest_id.startsWith('awc'))).toBe(true);
  });

  test('expects to filter by range (awc0101 to awc0149)', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const combined = [
      ...taskResultsForAWC0001To0099Provider,
      ...taskResultsForAWC0100Provider,
      ...taskResultsForAWC0101To0149Provider,
      ...taskResultsForAWC0150Provider,
    ];
    const filtered = provider.filter(combined);

    expect(filtered.some((task) => task.contest_id === 'awc0101')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0102')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0149')).toBe(true);
    expect(filtered.some((task) => task.contest_id === 'awc0099')).toBe(false);
    expect(filtered.some((task) => task.contest_id === 'awc0100')).toBe(false);
    expect(filtered.some((task) => task.contest_id === 'awc0150')).toBe(false);
  });

  test('expects to get correct metadata', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const metadata = provider.getMetadata();

    expect(metadata.title).toBe('AtCoder Weekday Contest 0101 〜 0149');
    expect(metadata.abbreviationName).toBe('awc0101To0149');
  });

  test('expects to return correct display config', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(true);
    expect(config.isShownRoundLabel).toBe(true);
    expect(config.tableBodyCellsWidth).toBe('w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1');
    expect(config.roundLabelWidth).toBe('xl:w-16');
    expect(config.isShownTaskIndex).toBe(false);
  });

  test('expects to format contest round label correctly', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);

    expect(provider.getContestRoundLabel('awc0101')).toBe('0101');
    expect(provider.getContestRoundLabel('awc0149')).toBe('0149');
  });

  test('expects to generate table for multiple AWC contests', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0101To0149Provider);
    const table = provider.generateTable(filtered);

    expect(Object.keys(table).length).toBeGreaterThan(0);
    expect(table).toHaveProperty('awc0101');
    expect(table).toHaveProperty('awc0102');
    expect(table).toHaveProperty('awc0149');
  });

  test('expects each AWC contest to have 5 problems (A-E)', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const filtered = provider.filter(taskResultsForAWC0101To0149Provider);
    const table = provider.generateTable(filtered);

    Object.entries(table).forEach(([_contestId, problems]) => {
      const problemCount = Object.keys(problems).length;
      expect(problemCount).toBe(5);
      expect(Object.keys(problems)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });
  });

  test('expects to handle empty task results', () => {
    const provider = new AWC0101To0149Provider(ContestType.AWC);
    const filtered = provider.filter([] as TaskResults);

    expect(filtered).toEqual([] as TaskResults);
  });
});
```

- [ ] **Step 2: AWC0101OnwardsProvider を AWC0101To0149Provider にリネーム**

`awc_provider.ts` の `AWC0101OnwardsProvider` クラスを変更する:

- クラス名: `AWC0101OnwardsProvider` → `AWC0101To0149Provider`
- section: `'0101To9999'` → `'0101To0149'`
- フィルタ範囲: `contestRound >= 101 && contestRound <= 9999` → `contestRound >= 101 && contestRound <= 149`
- title: `'AtCoder Weekday Contest 0101 〜 '` → `'AtCoder Weekday Contest 0101 〜 0149'`
- abbreviationName: `'awc0101Onwards'` → `'awc0101To0149'`

```typescript
// AWC0101 〜 0149 (5 tasks per contest)
export class AWC0101To0149Provider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, '0101To0149');
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      const contestRound = parseContestRound(taskResult.contest_id, 'awc');
      return contestRound >= 101 && contestRound <= 149;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Weekday Contest 0101 〜 0149',
      abbreviationName: 'awc0101To0149',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      roundLabelWidth: 'xl:w-16',
      tableBodyCellsWidth: 'w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('AWC ', '');
  }
}
```

- [ ] **Step 3: 旧フィクスチャ `taskResultsForAWC0101OnwardsProvider` を削除**

`contest_table_provider.ts` から旧 export を削除する。テスト側の import は全て `taskResultsForAWC0101To0149Provider` に置き換え済みのため安全に削除できる。

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test:unit src/features/tasks/utils/contest-table/awc_provider.test.ts`
Expected: 全 describe (AWC0001To0099, AWC0100, AWC0150, AWC0101To0149) が PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/tasks/utils/contest-table/awc_provider.ts \
        src/features/tasks/utils/contest-table/awc_provider.test.ts \
        src/features/tasks/fixtures/contest-table/contest_table_provider.ts
git commit -m "refactor(contest-table): rename AWC0101OnwardsProvider to AWC0101To0149Provider

Narrow filter range from 101-9999 to 101-149. AWC0151OnwardsProvider
will be added in a follow-up PR when 0151+ data exists."
```

---

## Phase 5: プロバイダーグループ登録更新

### Task 5: contest_table_provider_groups.ts の更新

**Files:**

- Modify: `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`
- Modify: `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts`

- [ ] **Step 1: import 文を更新**

```typescript
// Before
import { AWC0001To0099Provider, AWC0100Provider, AWC0101OnwardsProvider } from './awc_provider';

// After
import {
  AWC0001To0099Provider,
  AWC0100Provider,
  AWC0101To0149Provider,
  AWC0150Provider,
} from './awc_provider';
```

- [ ] **Step 2: AWC0001Onwards プリセットのプロバイダー登録を更新**

表示順序は新しい回が上。addProvider の登録順 = 表示順（first = top）。
AWC0151OnwardsProvider は別 PR で追加するため、ここでは登録しない。

```typescript
// Before
AWC0001Onwards: () =>
  new ContestTableProviderGroup(`AWC 0001 Onwards`, {
    buttonLabel: 'AWC 0001 〜 ',
    ariaLabel: 'Filter contests from AWC 0001 onwards',
  })
    .addProvider(new AWC0101OnwardsProvider(ContestType.AWC))
    .addProvider(new AWC0100Provider(ContestType.AWC))
    .addProvider(new AWC0001To0099Provider(ContestType.AWC)),

// After
AWC0001Onwards: () =>
  new ContestTableProviderGroup(`AWC 0001 Onwards`, {
    buttonLabel: 'AWC 0001 〜 ',
    ariaLabel: 'Filter contests from AWC 0001 onwards',
  })
    .addProvider(new AWC0150Provider(ContestType.AWC))
    .addProvider(new AWC0101To0149Provider(ContestType.AWC))
    .addProvider(new AWC0100Provider(ContestType.AWC))
    .addProvider(new AWC0001To0099Provider(ContestType.AWC)),
```

- [ ] **Step 3: `contest_table_provider_groups.test.ts` を更新**

import 文の変更:

```typescript
// Before
AWC0101OnwardsProvider,

// After
AWC0101To0149Provider,
AWC0150Provider,
```

テスト本体の変更:

```typescript
test('expects to create AWC0001Onwards preset correctly', () => {
  const group = prepareContestProviderPresets().AWC0001Onwards();

  expect(group.getGroupName()).toBe('AWC 0001 Onwards');
  expect(group.getMetadata()).toEqual({
    buttonLabel: 'AWC 0001 〜 ',
    ariaLabel: 'Filter contests from AWC 0001 onwards',
  });
  expect(group.getSize()).toBe(4);
  expect(group.getProvider(ContestType.AWC, '0150')).toBeInstanceOf(AWC0150Provider);
  expect(group.getProvider(ContestType.AWC, '0101To0149')).toBeInstanceOf(AWC0101To0149Provider);
  expect(group.getProvider(ContestType.AWC, '0100')).toBeInstanceOf(AWC0100Provider);
  expect(group.getProvider(ContestType.AWC)).toBeInstanceOf(AWC0001To0099Provider);
});
```

- [ ] **Step 4: テストが通ることを確認**

Run: `pnpm test:unit src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/tasks/utils/contest-table/contest_table_provider_groups.ts \
        src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts
git commit -m "feat(contest-table): register AWC0150Provider and AWC0101To0149Provider in group"
```

---

## Phase 6: 全体検証

### Task 6: 全テスト実行 + lint

- [ ] **Step 1: AWC 関連テストをすべて実行**

Run: `pnpm test:unit src/features/tasks/utils/contest-table/awc_provider.test.ts`
Expected: 全 PASS

- [ ] **Step 2: contest-table 全体テストを実行**

Run: `pnpm test:unit src/features/tasks/utils/contest-table/`
Expected: 全 PASS（他プロバイダーに影響がないことを確認）

- [ ] **Step 3: 型チェック**

Run: `pnpm check`
Expected: エラーなし

- [ ] **Step 4: lint + format**

Run: `pnpm format && pnpm lint`
Expected: エラーなし

- [ ] **Step 5: 旧シンボルの残留確認**

```bash
rg -ni 'AWC0101OnwardsProvider\|taskResultsForAWC0101OnwardsProvider\|0101To9999' -g '*.ts' -g '*.svelte'
```

Expected: 0 件（旧クラス名・旧フィクスチャ名・旧 section key が残っていたら修正）
