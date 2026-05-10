# Next DP Contest (NDPC) コンテストテーブル追加 実装計画

**Goal:** コンテストテーブルに Next DP Contest (NDPC) を追加し、EDPC・TDPC・FPS 24 グループに統合する。

**Architecture:** `ContestType.NDPC` を Prisma スキーマ → TypeScript 定数 → `classifyContest` / `contestTypePriorities` / `getContestNameLabel` → `NDPCProvider` → `dps` グループの順に追加する。TDD で各レイヤーを実装する。

**Tech Stack:** Prisma (PostgreSQL enum), TypeScript, Vitest

---

## Context

問題データ (`prisma/tasks.ts` 6349–6488 行) はすでに存在する (`contest_id: 'ndpc'`、問題 A–T の 20 問)。しかし `ContestType.NDPC` が未定義のため、コンテストテーブル上に表示されない。ユーザー指定の仕様：

- 順番: `TDPC` の直後に配置
- `dps` グループの buttonLabel: `EDPC・TDPC・NDPC・FPS 24`

## 設計の根拠

- `NDPCProvider` は `TDPCProvider` と同じ Pattern 2 (Single Source) — `contest_id === 'ndpc'` による単一フィルター
- `contestTypePriorities` に NDPC=6 を割り当て、以後のエントリを全て1ずつ上げる (PAST=7, ACL_PRACTICE=8, ..., AOJ_JAG=23)
  - 理由: 整数優先度の一貫性を保つ。浮動小数点は保守性を損なう。
- `dp_providers.ts` に同居させることで DP 系プロバイダーをひとつのファイルに集約する (EDPC・TDPC と同じ理由)

## 却下した代替案

- **独立ファイル `ndpc_provider.ts` に分離**: DP 系は `dp_providers.ts` に集約する既存慣習に反する。問題数の違いはプロバイダー実装に影響しない。

---

## 変更ファイル一覧

| ファイル                                                                       | 操作                                                                             |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                                         | `ContestType` enum に `NDPC` 追加                                                |
| `src/lib/types/contest.ts`                                                     | `ContestType` オブジェクトに `NDPC` 追加                                         |
| `src/lib/utils/contest.ts`                                                     | `classifyContest` / `contestTypePriorities` / `getContestNameLabel` に NDPC 追記 |
| `src/test/lib/utils/test_cases/contest_type.ts`                                | `ndpc` テストケース追加                                                          |
| `src/test/lib/utils/test_cases/contest_name_labels.ts`                         | `ndpc` テストケース追加                                                          |
| `src/test/lib/utils/contest.test.ts`                                           | 3 つの `describe` ブロック追加                                                   |
| `src/features/tasks/utils/contest-table/dp_providers.ts`                       | `NDPCProvider` クラス追加                                                        |
| `src/features/tasks/utils/contest-table/dp_providers.test.ts`                  | NDPC をパラメータ化テストに追加                                                  |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`      | `dps` プリセット更新                                                             |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts` | `dps` テスト更新                                                                 |

---

## Task 1: Prisma スキーマ + マイグレーション

**Files:**

- Modify: `prisma/schema.prisma:307`

- [ ] **Step 1: schema.prisma を編集**

`TDPC // Typical DP Contest` の直後に追加：

```prisma
NDPC // Next DP Contest
```

- [ ] **Step 2: マイグレーション実行**

```bash
pnpm exec prisma migrate dev --name add_ndpc_to_contest_type
```

Expected: `Your database is now in sync with your schema.` のようなメッセージ。`@prisma/client` が再生成され `ContestTypeOrigin` に `NDPC` が含まれる。

- [ ] **Step 3: 型チェック**

```bash
pnpm check
```

Expected: `src/lib/types/contest.ts` で型エラー（`NDPC` がオブジェクトに無い）。これは Task 2 で修正する。

---

## Task 2: TypeScript ContestType 定数更新

**Files:**

- Modify: `src/lib/types/contest.ts:37`

- [ ] **Step 1: NDPC を追加**

```typescript
NDPC: 'NDPC', // Next DP Contest
```

`TDPC: 'TDPC', // Typical DP Contest` の直後に挿入。

- [ ] **Step 2: 型チェック**

```bash
pnpm check
```

Expected: エラーなし（または NDPC 未使用の警告のみ）。

---

## Task 3: classifyContest / contestTypePriorities / getContestNameLabel 更新 (TDD)

**Files:**

- Modify: `src/test/lib/utils/test_cases/contest_type.ts`
- Modify: `src/test/lib/utils/test_cases/contest_name_labels.ts`
- Modify: `src/test/lib/utils/contest.test.ts`
- Modify: `src/lib/utils/contest.ts`

- [ ] **Step 1: テストケースデータを追加 (contest_type.ts)**

`tdpc` エクスポートの直後に追加：

```typescript
export const ndpc = [
  createTestCaseForContestType('NDPC')({
    contestId: 'ndpc',
    expected: ContestType.NDPC,
  }),
];
```

- [ ] **Step 2: テストケースデータを追加 (contest_name_labels.ts)**

`tdpc` エクスポートの直後に追加：

```typescript
export const ndpc = [
  createTestCaseForContestNameLabel('NDPC')({
    contestId: 'ndpc',
    expected: 'NDPC',
  }),
];
```

- [ ] **Step 3: describe ブロックを追加 (contest.test.ts)**

`classifyContest`・`getContestPriority`・`getContestNameLabel` の各 `when contest_id is tdpc` describe の直後に、それぞれ以下を追加：

```typescript
describe('when contest_id is ndpc', () => {
  TestCasesForContestType.ndpc.forEach(({ name, value }) => {
    runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
      expect(classifyContest(contestId)).toEqual(expected);
    });
  });
});
```

```typescript
describe('when contest_id is ndpc', () => {
  TestCasesForContestType.ndpc.forEach(({ name, value }) => {
    runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestType) => {
      expect(getContestPriority(contestId)).toEqual(contestTypePriorities.get(expected));
    });
  });
});
```

```typescript
describe('when contest_id is ndpc', () => {
  TestCasesForContestNameLabel.ndpc.forEach(({ name, value }) => {
    runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
      expect(getContestNameLabel(contestId)).toEqual(expected);
    });
  });
});
```

- [ ] **Step 4: テスト失敗を確認**

```bash
pnpm test:unit src/test/lib/utils/contest.test.ts
```

Expected: NDPC 関連テストが FAIL。

- [ ] **Step 5: contest.ts を実装**

`classifyContest` — `if (contest_id === 'tdpc')` ブロックの直後に追加：

```typescript
if (contest_id === 'ndpc') {
  return ContestType.NDPC;
}
```

`contestTypePriorities` — 全体の優先度を調整：

- `[ContestType.NDPC, 6]` を TDPC の直後に追加
- 以後のエントリを全て 1 ずつ上げる (PAST: 6→7, ACL_PRACTICE: 7→8, ..., AOJ_JAG: 22→23)

新しい優先度マップ:

```typescript
[ContestType.ABS, 0],
[ContestType.ABC, 1],
[ContestType.APG4B, 2],
[ContestType.TYPICAL90, 3],
[ContestType.EDPC, 4],
[ContestType.TDPC, 5],
[ContestType.NDPC, 6],        // <- 新規
[ContestType.PAST, 7],        // <- 6→7
[ContestType.ACL_PRACTICE, 8], // <- 7→8
[ContestType.JOI, 9],         // <- 8→9
[ContestType.TESSOKU_BOOK, 10], // <- 9→10
[ContestType.MATH_AND_ALGORITHM, 11], // <- 10→11
[ContestType.ARC, 12],        // <- 11→12
[ContestType.AGC, 13],        // <- 12→13
[ContestType.ABC_LIKE, 14],   // <- 13→14
[ContestType.ARC_LIKE, 15],   // <- 14→15
[ContestType.AGC_LIKE, 16],   // <- 15→16
[ContestType.AWC, 17],        // <- 16→17
[ContestType.UNIVERSITY, 18], // <- 17→18
[ContestType.FPS_24, 19],     // <- 18→19
[ContestType.OTHERS, 20],     // <- 19→20
[ContestType.AOJ_COURSES, 21], // <- 20→21
[ContestType.AOJ_PCK, 22],    // <- 21→22
[ContestType.AOJ_JAG, 23],    // <- 22→23
```

`getContestNameLabel` — `if (contestId === 'tdpc') { return 'TDPC'; }` の直後に追加：

```typescript
if (contestId === 'ndpc') {
  return 'NDPC';
}
```

- [ ] **Step 6: テスト通過を確認**

```bash
pnpm test:unit src/test/lib/utils/contest.test.ts
```

Expected: すべて PASS。

- [ ] **Step 7: コミット**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/types/contest.ts src/lib/utils/contest.ts src/test/lib/utils/test_cases/contest_type.ts src/test/lib/utils/test_cases/contest_name_labels.ts src/test/lib/utils/contest.test.ts
git commit -m "feat: add NDPC ContestType with classifyContest and name label support"
```

---

## Task 4: NDPCProvider 実装 (TDD)

**Files:**

- Modify: `src/features/tasks/utils/contest-table/dp_providers.test.ts`
- Modify: `src/features/tasks/utils/contest-table/dp_providers.ts`

- [ ] **Step 1: テストを追加 (dp_providers.test.ts)**

`describe.each` の配列に NDPC エントリを追加：

```typescript
{
  providerClass: NDPCProvider,
  contestType: ContestType.NDPC,
  contestId: 'ndpc',
  title: 'Next DP Contest',
  abbreviationName: 'ndpc',
  label: 'NDPC provider',
},
```

import 行も更新：

```typescript
import { EDPCProvider, TDPCProvider, NDPCProvider } from './dp_providers';
```

- [ ] **Step 2: テスト失敗を確認**

```bash
pnpm test:unit src/features/tasks/utils/contest-table/dp_providers.test.ts
```

Expected: `NDPCProvider` が未定義で FAIL。

- [ ] **Step 3: NDPCProvider を実装 (dp_providers.ts)**

`TDPCProvider` クラスの直後に追加：

```typescript
export class NDPCProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }

      return taskResult.contest_id === 'ndpc';
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'Next DP Contest',
      abbreviationName: 'ndpc',
    };
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

- [ ] **Step 4: テスト通過を確認**

```bash
pnpm test:unit src/features/tasks/utils/contest-table/dp_providers.test.ts
```

Expected: すべて PASS。

---

## Task 5: dps グループに NDPCProvider を登録

**Files:**

- Modify: `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts:26,187-195`
- Modify: `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts`

- [ ] **Step 1: テストを更新 (contest_table_provider_groups.test.ts)**

`expects to create DPs preset correctly` テストを更新：

```typescript
test('expects to create DPs preset correctly', () => {
  const group = prepareContestProviderPresets().dps();

  expect(group.getGroupName()).toBe('EDPC・TDPC・NDPC・FPS 24');
  expect(group.getMetadata()).toEqual({
    buttonLabel: 'EDPC・TDPC・NDPC・FPS 24',
    ariaLabel: 'EDPC, TDPC, NDPC and FPS 24 contests',
  });
  expect(group.getSize()).toBe(4);
  expect(group.getProvider(ContestType.EDPC)).toBeInstanceOf(EDPCProvider);
  expect(group.getProvider(ContestType.TDPC)).toBeInstanceOf(TDPCProvider);
  expect(group.getProvider(ContestType.NDPC)).toBeInstanceOf(NDPCProvider);
  expect(group.getProvider(ContestType.FPS_24)).toBeInstanceOf(FPS24Provider);
});
```

import 行に `NDPCProvider` を追加。

- [ ] **Step 2: テスト失敗を確認**

```bash
pnpm test:unit src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts
```

Expected: グループ名・サイズ・NDPC provider のアサーションが FAIL。

- [ ] **Step 3: contest_table_provider_groups.ts を更新**

import 行を更新：

```typescript
import { EDPCProvider, TDPCProvider, NDPCProvider } from './dp_providers';
```

`dps` プリセットを更新：

```typescript
dps: () =>
  new ContestTableProviderGroup(`EDPC・TDPC・NDPC・FPS 24`, {
    buttonLabel: 'EDPC・TDPC・NDPC・FPS 24',
    ariaLabel: 'EDPC, TDPC, NDPC and FPS 24 contests',
  }).addProviders(
    new EDPCProvider(ContestType.EDPC),
    new TDPCProvider(ContestType.TDPC),
    new NDPCProvider(ContestType.NDPC),
    new FPS24Provider(ContestType.FPS_24),
  ),
```

- [ ] **Step 4: テスト通過を確認**

```bash
pnpm test:unit src/features/tasks/utils/contest-table/
```

Expected: すべて PASS。

- [ ] **Step 5: 全テストを実行**

```bash
pnpm test:unit
```

Expected: すべて PASS。

- [ ] **Step 6: 型チェック**

```bash
pnpm check
```

Expected: エラーなし。

- [ ] **Step 7: コミット**

```bash
git add src/features/tasks/utils/contest-table/dp_providers.ts src/features/tasks/utils/contest-table/dp_providers.test.ts src/features/tasks/utils/contest-table/contest_table_provider_groups.ts src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts
git commit -m "feat: add NDPCProvider and register in dps contest group"
```

---

## Verification

```bash
# 全テスト
pnpm test:unit

# 型チェック
pnpm check

# lint
pnpm lint
```

期待動作: `pnpm dev` 起動後、コンテストテーブルのフィルターに `EDPC・TDPC・NDPC・FPS 24` ボタンが表示され、NDPC の 20 問 (A–T) が表示される。
