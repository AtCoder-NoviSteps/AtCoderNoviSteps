# MathAndAlgorithmProvider テスト追加計画

**作成日**: 2025-11-03

**対象ブランチ**: #2785

**優先度**: High

---

## 参照ドキュメント

テストの書き方・スタイル・ベストプラクティスについては、以下を参照：

📖 [`docs/dev-notes/2025-11-01/add_and_refactoring_tests_for_contest_table_provider/plan.md`](../../2025-11-01/add_and_refactoring_tests_for_contest_table_provider/plan.md)

---

## 1. 概要

### 背景

`MathAndAlgorithmProvider` は `TessokuBookProvider` と同じ構造で、複数のコンテストの問題を統合した問題集を提供します。

- **セクション範囲**: 001 ～ 104（一部欠損）
- **フォーマット**: 3桁数字（0 padding）
- **複数ソース対応**: 異なる `task_id`（問題集のリンク）

### 目的

TessokuBook テストと同等の粒度で、MathAndAlgorithmProvider の単体テスト 11 個を追加。

---

## 2. 仕様要件

| 項目               | 仕様                        | 備考                     |
| ------------------ | --------------------------- | ------------------------ |
| **セクション範囲** | 001 ～ 104                  | 一部欠損あり（原典準拠） |
| **ソート順序**     | 昇順（001 → 102 → ... 104） | 必須                     |
| **フォーマット**   | 3桁数字（0 padding）        | 例: 001, 028, 102        |
| **複数ソース対応** | 異なる problem_id           | DB 一意制約で保証        |

---

## 3. テストケース（11件）

### テスト1: フィルタリング

```typescript
test('expects to filter tasks to include only math-and-algorithm contest', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const mixedTasks = [
    { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
    { contest_id: 'math-and-algorithm', task_id: 'math_and_algorithm_a', task_table_index: '001' },
    { contest_id: 'math-and-algorithm', task_id: 'typical90_o', task_table_index: '101' },
    { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
  ];
  const filtered = provider.filter(mixedTasks);

  expect(filtered?.every((task) => task.contest_id === 'math-and-algorithm')).toBe(true);
  expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
});
```

---

### テスト2: メタデータ取得

```typescript
test('expects to get correct metadata', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('アルゴリズムと数学');
  expect(metadata.abbreviationName).toBe('math-and-algorithm');
});
```

---

### テスト3: 表示設定

```typescript
test('expects to get correct display configuration', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const displayConfig = provider.getDisplayConfig();

  expect(displayConfig.isShownHeader).toBe(false);
  expect(displayConfig.isShownRoundLabel).toBe(false);
  expect(displayConfig.roundLabelWidth).toBe('');
  expect(displayConfig.tableBodyCellsWidth).toBe(
    'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
  );
  expect(displayConfig.isShownTaskIndex).toBe(true);
});
```

---

### テスト4: ラウンドラベルフォーマット

```typescript
test('expects to format contest round label correctly', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const label = provider.getContestRoundLabel('math-and-algorithm');

  expect(label).toBe('');
});
```

---

### テスト5: テーブル生成（複数ソース対応）

```typescript
test('expects to generate correct table structure with mixed problem sources', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const tasks = [
    { contest_id: 'math-and-algorithm', task_id: 'math_and_algorithm_a', task_table_index: '001' },
    { contest_id: 'math-and-algorithm', task_id: 'dp_a', task_table_index: '028' },
    { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
    { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
  ];
  const table = provider.generateTable(tasks);

  expect(table).toHaveProperty('math-and-algorithm');
  expect(table['math-and-algorithm']).toHaveProperty('028');
  expect(table['math-and-algorithm']['028']).toEqual(expect.objectContaining({ task_id: 'dp_a' }));
});
```

---

### テスト6: ラウンド ID 取得

```typescript
test('expects to get contest round IDs correctly', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const tasks = [
    { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
    { contest_id: 'math-and-algorithm', task_id: 'typical90_o', task_table_index: '101' },
  ];
  const roundIds = provider.getContestRoundIds(tasks);

  expect(roundIds).toEqual(['math-and-algorithm']);
});
```

---

### テスト7: ヘッダー ID 取得（昇順・複数ソース混在）

```typescript
test('expects to get header IDs for tasks correctly in ascending order', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const tasks = [
    { contest_id: 'math-and-algorithm', task_id: 'math_and_algorithm_a', task_table_index: '001' },
    { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
    { contest_id: 'math-and-algorithm', task_id: 'dp_a', task_table_index: '028' },
    { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
  ];
  const headerIds = provider.getHeaderIdsForTask(tasks);

  expect(headerIds).toEqual(['001', '028', '036', '102']);
});
```

---

### テスト8: ソート順序の厳密性（数字ソート）

```typescript
test('expects to maintain proper sort order with numeric indices', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const tasks = [
    { contest_id: 'math-and-algorithm', task_id: 'typical90_bz', task_table_index: '045' },
    { contest_id: 'math-and-algorithm', task_id: 'abc168_c', task_table_index: '036' },
  ];
  const headerIds = provider.getHeaderIdsForTask(tasks);

  // 036 < 045 の順序を厳密に検証
  expect(headerIds).toEqual(['036', '045']);
});
```

---

### テスト9: セクション範囲検証

```typescript
test('expects to handle section boundaries correctly (001-104)', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const tasks = [
    { contest_id: 'math-and-algorithm', task_id: 'math_and_algorithm_a', task_table_index: '001' },
    { contest_id: 'math-and-algorithm', task_id: 'math_and_algorithm_bx', task_table_index: '104' },
  ];
  const headerIds = provider.getHeaderIdsForTask(tasks);

  expect(headerIds).toEqual(['001', '104']);
});
```

---

### テスト10: 空入力処理

```typescript
test('expects to handle empty task results', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const filtered = provider.filter([]);

  expect(filtered).toEqual([]);
});
```

---

### テスト11: 混合コンテストタイプの排除

```typescript
test('expects to handle task results with different contest types', () => {
  const provider = new MathAndAlgorithmProvider(ContestType.MATH_AND_ALGORITHM);
  const mixedTasks = [
    { contest_id: 'math-and-algorithm', task_id: 'math_and_algorithm_a', task_table_index: '001' },
    { contest_id: 'math-and-algorithm', task_id: 'arc117_c', task_table_index: '102' },
    { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: 'A' },
  ];
  const filtered = provider.filter(mixedTasks);

  expect(filtered).toHaveLength(2);
  expect(filtered?.every((task) => task.contest_id === 'math-and-algorithm')).toBe(true);
});
```

---

## 4. モックデータ

追加先: `src/test/lib/utils/test_cases/contest_table_provider.ts`

```typescript
export const taskResultsForMathAndAlgorithmProvider: TaskResults = [
  {
    contest_id: 'math-and-algorithm',
    task_id: 'dp_a',
    task_table_index: '028',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'abc168_c',
    task_table_index: '036',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'typical90_bz',
    task_table_index: '045',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'abc007_3',
    task_table_index: '046',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'arc084_b',
    task_table_index: '048',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'abc145_d',
    task_table_index: '052',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'abc172_d',
    task_table_index: '042',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'typical90_j',
    task_table_index: '095',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'typical90_o',
    task_table_index: '101',
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'arc117_c',
    task_table_index: '102',
  },
];
```

**出典**: [`prisma/contest_task_pairs.ts`](../../../../prisma/contest_task_pairs.ts) 行 14 ～ 52

---

## 5. 実装手順

**ステップ1**: モックデータを `src/test/lib/utils/test_cases/contest_table_provider.ts` に追加

**ステップ2**: 上記 11 個のテストを `src/test/lib/utils/contest_table_provider.test.ts` に追加

**ステップ3**: テスト実行・検証

```bash
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts
```

**ステップ4**: Lint チェック

```bash
pnpm lint src/test/lib/utils/contest_table_provider.test.ts
```

---

## 6. 注意点

詳細は参照ドキュメント「教訓統合」セクションを参照。特に以下を確認：

- **ソート順序**: 文字列の辞書順ソート（`'028' < '036' < '045'`）
- **複数ソース混在**: `problem_id` が異なる複雑なテストケース（テスト5・11）
- **パラメータ化テスト**: TessokuBook との共通パターン活用可能（参考ドキュメント フェーズ3）

---

## 7. 実装結果・教訓

### ✅ 実装完了

**実施時間**: 13.4 秒（テスト実行含む）

**実装内容**:

1. モックデータ追加: 10 個のサンプルタスク（`contest_table_provider.ts`）
2. テストケース実装: 11 個の単体テスト
3. モック拡張: `classifyContest` に `math-and-algorithm` サポートを追加

### 📚 得られた教訓

1. **コンテストタイプのモック更新**：新規プロバイダー追加時、`vi.mock()` に新しいコンテストタイプを追加する必要あり。参照ドキュメント（2025-11-01）では言及されていなかった重要なポイント

2. **テストの再利用性**：TessokuBook と MathAndAlgorithmProvider は構造同一のため、テストテンプレートを完全流用可能。共有パターン化の価値が確認できた

3. **ソート順序の自動確認**：文字列ソート（昇順）が正確に機能するため、インデックス形式の統一（3桁数字）が重要

4. **ファイルフォーマット**：Prettier による自動フォーマットで一部ファイルが修正されたため、実装後の linting 実行は必須
