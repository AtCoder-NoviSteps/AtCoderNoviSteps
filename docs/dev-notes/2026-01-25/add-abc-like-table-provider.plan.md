# ABC-Like Contest Provider 実装計画

**Date**: 2026-01-25
**Issue**: [#2840](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2840)
**Reference**: [docs/guides/how-to-add-contest-table-provider.md](../../guides/how-to-add-contest-table-provider.md)

---

## 概要

ABC-Like コンテストプロバイダーをテスト駆動開発（TDD）で実装します。複数のABC相当コンテスト（計15種類）を統合表示し、A～H問題（最大8問）でフィルタリングします。

### 対象コンテスト（src/lib/utils/contest.ts ABC_LIKE より）

1. **tenka1-2017-beginner** - Tenka1 Programmer Beginner Contest 2017
2. **abl** - ACL Beginner Contest
3. **caddi2018b** - CADDi 2018 for Beginners
4. **soundhound2018-summer-qual** - SoundHound Inc. Programming Contest 2018 -Masters Tournament-
5. **tenka1-2018-beginner** - Tenka1 Programmer Beginner Contest 2018
6. **aising2019** - エイシング プログラミング コンテスト 2019
7. **sumitrust2019** - 三井住友信託銀行プログラミングコンテスト2019
8. **tenka1-2019-beginner** - Tenka1 Programmer Beginner Contest 2019
9. **aising2020** - エイシング プログラミング コンテスト 2020
10. **hhkb2020** - HHKB プログラミングコンテスト 2020
11. **m-solutions2020** - M-SOLUTIONS プロコンオープン 2020
12. **panasonic2020** - パナソニックプログラミングコンテスト 2020
13. **jsc2021** - 第二回日本最強プログラマー学生選手権
14. **zone2021** - ZONeエナジー プログラミングコンテスト "HELLO SPACE"
15. **jsc2025advance-final** - 日本最強プログラマー学生選手権～Advance～

### 複合型コンテスト（テスト重点対象）

- **jsc2025advance-final**: ABC422 の task_id を参照
- **tenka1-{2017,2018,2019}-beginner**: 各 tenka1 のコンテストの task_id を参照

---

## 実装タスク

### 1. テストデータの準備

**ファイル**: [src/test/lib/services/task_results.test.ts](../../../src/test/lib/services/task_results.test.ts)

- `vi.mock('$lib/services/tasks')` 内の `mockTasksData` に15種類のコンテストの代表タスクを追加
- **複合型テストの重点**:
  - jsc2025advance-final → ABC422 の task_id 参照を含める
  - tenka1-{2017,2018,2019}-beginner → 各 tenka1 コンテストの task_id 参照を含める
- [prisma/tasks.ts](../../../prisma/tasks.ts) と [prisma/contest_task_pairs.ts](../../../prisma/contest_task_pairs.ts) を参照してモックを構成

**参考**: [src/lib/services/tasks.ts](../../../src/lib/services/tasks.ts) の `getMergedTasksMap` により、task_id 参照は自動的に解決される

### 2. ContestTableProvider テストの追加

**ファイル**: [src/test/lib/utils/contest_table_provider.test.ts](../../../src/test/lib/utils/contest_table_provider.test.ts)

- `test_cases/contest_table_provider.ts` に `taskResultsForABCLikeProvider` を定義
- テストケース項目:
  - **正常系**: 複数コンテストのタスク取得、A～H問題範囲の抽出
  - **複合型検証**: jsc2025advance-final と ABC422、tenka1-beginner と tenka1 の参照関係
  - **境界値**: A 問題（最小）、H 問題（最大）の判定
- ABC212-318 プロバイダー実装を参考に実装

### 3. ContestType の確認

**ファイル**: [src/lib/types/contest.ts](../../../src/lib/types/contest.ts)

- `ABC_LIKE: 'ABC_LIKE'` 型は既に定義済み
- [src/lib/utils/contest.ts](../../../src/lib/utils/contest.ts) の `classifyContest()` が正しく ABC_LIKE を分類することを確認（実装済み）

### 4. ABCLikeProvider クラスの実装

**ファイル**: [src/lib/utils/contest_table_provider.ts](../../../src/lib/utils/contest_table_provider.ts)

**配置**: `AGC001OnwardsProvider` の直後に追加

```typescript
export class ABCLikeProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      return classifyContest(taskResult.contest_id) === this.contestType;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'ABC-Like Contest',
      abbreviationName: 'abcLike',
    };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      roundLabelWidth: 'xl:w-28',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
    };
  }

  getContestRoundLabel(contestId: string): string {
    return contestId;
  }
}
```

**要点**:

- `setFilterCondition()`: `ContestType.ABC_LIKE` でのみフィルタリング（複合型は `getMergedTasksMap` で自動解決）
- `getDisplayConfig()`: `roundLabelWidth: 'xl:w-28'`（コンテスト名が長い場合対応）
- `getContestRoundLabel()`: contestId をそのまま返す

### 5. プロバイダー登録

**ファイル**: [src/lib/utils/contest_table_provider.ts](../../../src/lib/utils/contest_table_provider.ts)

#### 5-1. prepareContestProviderPresets() への登録

`AGC001Onwards` の後に以下を追加:

```typescript
ABCLike: () =>
  new ContestTableProviderGroup('ABCLike', {
    buttonLabel: 'ABC-Like',
    ariaLabel: 'Filter contests from ABC-Like',
  }).addProvider(new ABCLikeProvider(ContestType.ABC_LIKE)),
```

#### 5-2. contestTableProviderGroups への登録

`fromArc001ToArc057` の後に以下を追加:

```typescript
abcLike: prepareContestProviderPresets().ABCLike(),
```

### 6. UI コンポーネント修正

**ファイル**: [src/lib/components/TaskTables/TaskTable.svelte](../../../src/lib/components/TaskTables/TaskTable.svelte)

- `roundLabelWidth` が `'xl:w-28'` の場合、コンテスト名がはみ出すことを想定して `truncate` クラスを追加
- これにより末尾が自動的に省略される

---

## 注意事項

1. **複合型の参照関係**:
   - jsc2025advance-final と ABC422 が同じ task_id を参照
   - tenka1-{2017,2018,2019}-beginner と tenka1 が同じ task_id を参照
   - これらは `getMergedTasksMap` により自動的に解決されるため、`setFilterCondition()` では `ContestType` フィルタリングのみで十分

2. **テストデータの構成**:
   - [src/test/lib/services/task_results.test.ts](../../../src/test/lib/services/task_results.test.ts) の mockTasksData に上記15種類をすべて追加
   - [src/test/lib/utils/contest_table_provider.test.ts](../../../src/test/lib/utils/contest_table_provider.test.ts) のテストで、複合型コンテストの参照が正しく解決されることを確認

3. **roundLabelWidth の末尾省略**:
   - UI コンポーネント側で `truncate` クラスを適用することで、tailwind CSS で自動的に末尾が省略される

---

## 実装順序

1. **テストデータ追加** → 2. **Provider テスト実装** → 3. **ABCLikeProvider クラス実装** → 4. **プロバイダー登録** → 5. **UI コンポーネント修正**

---

## 参考資料

- [docs/guides/how-to-add-contest-table-provider.md](../../guides/how-to-add-contest-table-provider.md)
- [.github/instructions/tests.instructions.md](../../../.github/instructions/tests.instructions.md)
- [ABC212ToABC318Provider 実装例](../../../src/lib/utils/contest_table_provider.ts#L194-L230)
