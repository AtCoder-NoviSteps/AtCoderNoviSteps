# ABSProvider 単体テスト追加計画

**作成日**: 2025-12-11

**対象ブランチ**: #2919

**優先度**: High

---

## 概要

`ABSProvider`（AtCoder Beginners Selection）に対する単体テストを追加する計画。

**対象ファイル**:

- **Provider実装**: [`src/lib/utils/contest_table_provider.ts`](../../../../../src/lib/utils/contest_table_provider.ts)
  - `ABSProvider` (136行目～)
- **テストファイル**: [`src/test/lib/utils/contest_table_provider.test.ts`](../../../../../src/test/lib/utils/contest_table_provider.test.ts)
- **テストケースファイル**: [`src/test/lib/utils/test_cases/contest_table_provider.ts`](../../../../../src/test/lib/utils/test_cases/contest_table_provider.ts)

**参照ドキュメント**:

- [`docs/dev-notes/2025-12-03/add_tests_for_contest_table_provider/plan.md`](../../2025-12-03/add_tests_for_contest_table_provider/plan.md) - テスト設計パターンの参考
- [`prisma/tasks.ts`](../../../../../prisma/tasks.ts) - practice_1 及び各問題のタスク定義
- [`prisma/contest_task_pairs.ts`](../../../../../prisma/contest_task_pairs.ts) - ABS の問題対応関係（11問）

---

## ABSProvider の仕様と特徴

### 基本情報

- **名称**: AtCoder Beginners Selection
- **contest_id**: `'abs'`
- **ContestType**: `ContestType.ABS`

### 問題構成

ABSは入門者向けのコンテンツで、異なるコンテストから選ばれた**11問**で構成されている：

| 問題番号 | task_id    | 元のcontest_id | problem_index |
| -------- | ---------- | -------------- | ------------- |
| 1        | practice_1 | abs            | A             |
| 2        | abc086_a   | abc086         | B             |
| 3        | abc081_a   | abc081         | C             |
| 4        | abc081_b   | abc081         | D             |
| 5        | abc087_b   | abc087         | E             |
| 6        | abc083_b   | abc083         | F             |
| 7        | abc088_b   | abc088         | G             |
| 8        | abc085_b   | abc085         | H             |
| 9        | abc085_c   | abc085         | I             |
| 10       | arc065_a   | abc049         | J             |
| 11       | arc089_a   | abc086         | K             |

**重要な特徴**:

- **複数コンテスト由来**: 同じ問題IDを別のコンテストで使用している問題が大半（abc081, abc085など2問ずつ、その他は各1問）
- **難易度順**: A～K の順序が入門者向けコンテンツとして意図した難易度順になっている
- **contest_idの単一化**: すべての問題のcontest_idは'abs'で統一される

### ディスプレイ設定

ABSProviderは他のプロバイダーと異なる設定を持つ：

```typescript
{
  isShownHeader: false,      // ヘッダーを非表示
  isShownRoundLabel: false,  // ラウンドラベルを非表示
  isShownTaskIndex: false,   // タスクインデックスを非表示
  tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-2',
  roundLabelWidth: '',       // ラウンドラベル幅なし
}
```

---

## テスト設計

### テストファイル配置

**ファイル**: `src/test/lib/utils/contest_table_provider.test.ts`

**配置**: 「ABC Latest 20 Rounds」セクションの直前（ABC providers セクション内の最初）

### テストデータ構築

#### テストケースファイルでの準備

`src/test/lib/utils/test_cases/contest_table_provider.ts`に以下を追加：

```typescript
/**
 * Test data for ABSProvider (AtCoder Beginners Selection)
 * 11 problems from various contests, problem_index from A to K
 */
export const taskResultsForABS: TaskResults = [
  createContestTasksForABS('practice_1', 'abs', 'A'),
  createContestTasksForABS('abc086_a', 'abs', 'B'),
  createContestTasksForABS('abc081_a', 'abs', 'C'),
  createContestTasksForABS('abc081_b', 'abs', 'D'),
  createContestTasksForABS('abc087_b', 'abs', 'E'),
  createContestTasksForABS('abc083_b', 'abs', 'F'),
  createContestTasksForABS('abc088_b', 'abs', 'G'),
  createContestTasksForABS('abc085_b', 'abs', 'H'),
  createContestTasksForABS('abc085_c', 'abs', 'I'),
  createContestTasksForABS('arc065_a', 'abs', 'J'),
  createContestTasksForABS('arc089_a', 'abs', 'K'),
];

function createContestTasksForABS(
  taskId: string,
  contestId: string,
  taskTableIndex: string,
): TaskResult {
  return createTaskResultWithTaskTableIndex(contestId, taskId, taskTableIndex, AC);
}
```

### テストケース詳細

#### テスト1.1: フィルタリング（contest_id検証）

contest_id='abs' のタスクのみをフィルタリングすることを確認。

```typescript
test('expects to filter tasks with contest_id "abs"', () => {
  const provider = new ABSProvider(ContestType.ABS);
  const mixed = [
    { contest_id: 'abs', task_id: 'practice_1', task_table_index: 'A' },
    { contest_id: 'abs', task_id: 'abc086_a', task_table_index: 'B' },
    { contest_id: 'abc086', task_id: 'abc086_a', task_table_index: 'A' },
    { contest_id: 'abc081', task_id: 'abc081_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResults);

  expect(filtered).toHaveLength(2);
  expect(filtered.every((task) => task.contest_id === 'abs')).toBe(true);
});
```

#### テスト1.2: コンテストタイプ判別

ContestType.ABS のみをフィルタリングすることを確認。

```typescript
test('expects to filter only ABS-type contests', () => {
  const provider = new ABSProvider(ContestType.ABS);
  const mixed = [
    { contest_id: 'abs', task_id: 'practice_1', task_table_index: 'A' },
    { contest_id: 'abc378', task_id: 'abc378_a', task_table_index: 'A' },
    { contest_id: 'arc100', task_id: 'arc100_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResults);

  expect(filtered).toHaveLength(1);
  expect(filtered[0].contest_id).toBe('abs');
});
```

#### テスト1.3: メタデータ取得

```typescript
test('expects to return correct metadata', () => {
  const provider = new ABSProvider(ContestType.ABS);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('AtCoder Beginners Selection');
  expect(metadata.abbreviationName).toBe('abs');
});
```

#### テスト1.4: ディスプレイ設定確認

ディスプレイ設定がABS固有の値であることを確認。

```typescript
test('expects to return correct display config with ABS-specific settings', () => {
  const provider = new ABSProvider(ContestType.ABS);
  const config = provider.getDisplayConfig();

  expect(config.isShownHeader).toBe(false);
  expect(config.isShownRoundLabel).toBe(false);
  expect(config.isShownTaskIndex).toBe(false);
  expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-2');
  expect(config.roundLabelWidth).toBe('');
});
```

#### テスト1.5: ラウンドラベルフォーマット

ABSではラウンドラベルが空文字列で返されることを確認。

```typescript
test('expects to return empty string for contest round label', () => {
  const provider = new ABSProvider(ContestType.ABS);

  expect(provider.getContestRoundLabel('abs')).toBe('');
  expect(provider.getContestRoundLabel('abc086')).toBe('');
});
```

#### テスト1.6: テーブル生成（11問全数）

ABSの全11問がテーブルに含まれることを確認。

```typescript
test('expects to generate correct table structure with all 11 problems', () => {
  const provider = new ABSProvider(ContestType.ABS);
  const table = provider.generateTable(taskResultsForABS);

  expect(table).toHaveProperty('abs');
  expect(Object.keys(table.abs)).toHaveLength(11);
  expect(Object.keys(table.abs)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']);
});
```

#### テスト1.7: ラウンドID取得

```typescript
test('expects to return correct contest round ids', () => {
  const provider = new ABSProvider(ContestType.ABS);
  const roundIds = provider.getContestRoundIds(taskResultsForABS);

  expect(roundIds).toEqual(['abs']);
});
```

#### テスト1.8: ヘッダーID取得

```typescript
test('expects to return correct header ids for all problems', () => {
  const provider = new ABSProvider(ContestType.ABS);
  const headerIds = provider.getHeaderIdsForTask(taskResultsForABS);

  expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']);
});
```

#### テスト1.9: 複数コンテスト由来の確認

ABS内の問題が複数の異なるコンテスト由来であることを確認（重要な特徴）。

```typescript
test('expects to verify that ABS problems come from multiple different contests', () => {
  const provider = new ABSProvider(ContestType.ABS);
  const filtered = provider.filter(taskResultsForABS);

  // task_id から元のcontest_idを抽出
  const sourceContests = new Set(
    filtered.map((task) => {
      const match = task.task_id.match(/^(arc|abc)\d+/);
      return match ? match[0] : null;
    }),
  );

  // practice_1 以外の10問から8つの異なるcontest由来
  expect(sourceContests.size).toBeGreaterThanOrEqual(8);
  expect(Array.from(sourceContests)).toContain('abc086');
  expect(Array.from(sourceContests)).toContain('abc081');
  expect(Array.from(sourceContests)).toContain('arc089');
  expect(Array.from(sourceContests)).toContain('arc065');
});
```

#### テスト1.10: 空入力ハンドリング

```typescript
test('expects to handle empty input gracefully', () => {
  const provider = new ABSProvider(ContestType.ABS);

  const filteredEmpty = provider.filter([] as TaskResults);
  const tableEmpty = provider.generateTable([] as TaskResults);
  const idsEmpty = provider.getContestRoundIds([] as TaskResults);
  const headerIdsEmpty = provider.getHeaderIdsForTask([] as TaskResults);

  expect(filteredEmpty).toEqual([]);
  expect(tableEmpty).toEqual({});
  expect(idsEmpty).toEqual([]);
  expect(headerIdsEmpty).toEqual([]);
});
```

---

## 実装手順

### ステップ1: テストデータ準備

`src/test/lib/utils/test_cases/contest_table_provider.ts`に以下を追加：

- `createContestTasksForABS` ヘルパー関数
- `taskResultsForABS` 定数（11問のテストデータ）

### ステップ2: テストケース作成

`src/test/lib/utils/contest_table_provider.test.ts`の「ABC Latest 20 Rounds」セクション直前に新しい`describe('ABS')`セクションを追加：

- テスト1.1～1.10 を実装
- インポート句に`ABSProvider`を追加
- インポート句に`taskResultsForABS`を追加

### ステップ3: テスト実行と検証

```bash
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts
```

---

## 確認事項テンプレート（今後の参考用）

ContestTableProviderの新規テスト追加時に確認すべき事項：

### データソース確認

- [ ] `prisma/tasks.ts`で当該contest_idのエントリを確認
- [ ] `prisma/contest_task_pairs.ts`で共有問題の有無を確認
- [ ] 問題数、ID フォーマット（数字/英字サフィックス）を把握

### ContestType確認

- [ ] 対応する`ContestType`が`src/lib/types/contest.ts`に存在するか確認
- [ ] Providerクラスに正しく指定されているか確認

### テスト項目標準化

- 基本的なフィルタリング（contest_id/type検証）
- メタデータ取得（title, abbreviationName）
- ディスプレイ設定確認（isShownHeader, isShownRoundLabel等）
- ラウンドラベルフォーマット
- テーブル生成（問題数確認）
- ラウンドID取得
- ヘッダーID取得
- 当該Providerの特徴的な検証（共有問題確認、複数由来確認等）
- 空入力ハンドリング

### テストデータ構築方法

- `createTaskResultWithTaskTableIndex` ヘルパーを使用
- 専用の`taskResultsFor[ProviderName]`定数を作成
- contest_id, task_id, task_table_indexを明確に指定

---

## 参考資料

- **既存のプロバイダーテスト**: ABC042ToABC125Provider, ABC001ToABC041Provider などを参考
- **テスト設計パターン**: [`docs/dev-notes/2025-12-03/add_tests_for_contest_table_provider/plan.md`](../../2025-12-03/add_tests_for_contest_table_provider/plan.md)

---

## 実装結果

**実施日**: 2025-12-11

**ステータス**: ✅ 完了（全テストパス）

### 実装サマリー

計画通りにABSProviderの単体テスト10項目をすべて実装し、全196テストがパスしました。

**実装内容**:

- `src/test/lib/utils/test_cases/contest_table_provider.ts` に `taskResultsForABS` 定数を追加（11問分のテストデータ）
- `src/test/lib/utils/contest_table_provider.test.ts` の「ABC Latest 20 Rounds」セクション直前に `describe('ABS')` ブロックを追加
- テスト1.1～テスト1.10 をすべて実装

### 発見事項と解決策

#### Issue: Mock関数のcontestId分類が不完全

**問題**: テストで mock されている `classifyContest` 関数が `'abs'` に対応していなかったため、ABSProviderの filter メソッドが正常に機能しませんでした。

**原因**: mockの `classifyContest` に 'abs' の分類ロジックがなく、`ContestType.OTHERS` にデフォルト分類されていました。

**解決方法**: mock関数に以下の条件を最初に追加しました：

```typescript
if (contestId === 'abs') {
  return ContestType.ABS;
}
```

**教訓**:

- **新しいContestType対応時は、テストの mock 関数も同時に更新する必要があります**
  - テストケースの実装だけでなく、テストヘルパー・mock関数の整備も確認すべき
  - classifyContest のような汎用utility関数の mock は、すべてのContestType対応を列挙する形で保守する必要がある

### テスト実行結果

```
✓ src/test/lib/utils/contest_table_provider.test.ts (196 tests) 24ms

 Test Files  1 passed (1)
      Tests  196 passed (196)
```

**新規テスト**（ABS関連）: 10テスト

- テスト1.1: フィルタリング（contest_id検証） ✅
- テスト1.2: コンテストタイプ判別 ✅
- テスト1.3: メタデータ取得 ✅
- テスト1.4: ディスプレイ設定確認 ✅
- テスト1.5: ラウンドラベルフォーマット ✅
- テスト1.6: テーブル生成（11問全数） ✅
- テスト1.7: ラウンドID取得 ✅
- テスト1.8: ヘッダーID取得 ✅
- テスト1.9: 複数コンテスト由来の確認 ✅
- テスト1.10: 空入力ハンドリング ✅

### 気づき

1. **ContestType追加時のチェックリスト**: 新しいContestTypeを追加する際は、以下の3つのセットで更新する必要があります：
   - ✅ ContestType enum の定義
   - ✅ Provider クラスの実装
   - ✅ **テストの mock 関数の更新（見落としやすい！）**

2. **計画通りの実装が重要**: このドキュメントで定義したテストケース（10項目）を順番に実装することで、スムーズに完了できました

3. **複数コンテスト由来の問題テストが有効**: テスト1.9で複数元のコンテスト由来を検証することで、ABSの特徴的な仕様を確認できました
