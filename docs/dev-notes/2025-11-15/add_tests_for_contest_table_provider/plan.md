````markdown
# ARC104OnwardsProvider テスト追加計画

**作成日**: 2025-11-15

**対象ブランチ**: #2835

**優先度**: High

---

## 参照ドキュメント

テストの書き方・スタイルについては、以下を参照：

📖 [`docs/dev-notes/2025-11-01/add_and_refactoring_tests_for_contest_table_provider/plan.md`](../../2025-11-01/add_and_refactoring_tests_for_contest_table_provider/plan.md)

📖 [`docs/dev-notes/2025-11-03/add_tests_for_contest_table_provider/plan.md`](../../2025-11-03/add_tests_for_contest_table_provider/plan.md)

📖 [`docs/dev-notes/2025-11-14/add_tests_for_contest_table_provider/plan.md`](../../2025-11-14/add_tests_for_contest_table_provider/plan.md)

---

## 実装チェックリスト

### 1. テスト設計 📋

- [ ] フィルタリングテスト（ARC104～999範囲内のみ抽出）
- [ ] コンテストタイプ判別テスト（ARC型のみ）
- [ ] メタデータ取得テスト
- [ ] ディスプレイ設定テスト
- [ ] ラウンドラベルフォーマットテスト
- [ ] エッジケーステスト（空入力など）
- [ ] 混合コンテストタイプ対応テスト
- [ ] 複数問題パターンテスト（4問、5問、6問、7問+F2）

### 2. モックデータ準備

- [ ] `src/test/lib/utils/test_cases/contest_table_provider.ts` に ARC104+ データを追加
- [ ] ARC104（6問: A, B, C, D, E, F）
- [ ] ARC120（7問: A, B, C, D, E, F, F2）- 例外的ケース
- [ ] ARC204（4問: A, B, C, D）
- [ ] ARC208（5問: A, B, C, D, E）

### 3. テスト実装

- [ ] 既存テスト（`ABC212ToABC318Provider` など）を参考に記述
- [ ] `ARC104OnwardsProvider` をテストファイルにインポート
- [ ] `describe.each()` に ARC104OnwardsProvider を追加（displayConfig 共通化）
- [ ] ARC104Onwards個別テストで複数問題パターンの検証を追加

### 4. テスト リファクタリング

- [ ] displayConfig 共通テストを `describe.each()` で統合
- [ ] ARC104Onwards固有テスト（フィルタリング範囲、複数パターン）を実装

### 5. 実装後の検証

- [ ] テスト実行: `pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts`
- [ ] Lint チェック: `pnpm format`
- [ ] 全テスト合格確認

---

## 1. テスト対象プロバイダー

### ARC104OnwardsProvider

| 項目             | 仕様                 | 備考               |
| ---------------- | -------------------- | ------------------ |
| **範囲**         | ARC 104 ～ 999       | 開始日: 2020/10/03 |
| **問題数**       | 4～7問               | ラウンドにより変動 |
| **フォーマット** | A, B, C, D, E, F, F2 | 標準は6問(F迄)     |

---

## 2. 問題パターン仕様

### パターン1: 4問コンテスト（ARC204）

```
task_table_index: A, B, C, D
```

**用例**: 一部の特殊ラウンド

---

### パターン2: 5問コンテスト（ARC208, 209）

```
task_table_index: A, B, C, D, E
```

**用例**: 比較的新しいラウンドの一部

---

### パターン3: 6問コンテスト（標準）

```
task_table_index: A, B, C, D, E, F
```

**用例**: ARC104, ARC150など大多数のラウンド

---

### パターン4: 7問コンテスト（ARC120のみ）

```
task_table_index: A, B, C, D, E, F, F2
```

**用例**: ARC120（非常に例外的）

---

## 3. 表示設定（displayConfig）

| 項目                  | 値                                                      |
| --------------------- | ------------------------------------------------------- |
| `isShownHeader`       | `true`                                                  |
| `isShownRoundLabel`   | `true`                                                  |
| `roundLabelWidth`     | `'xl:w-16'`                                             |
| `tableBodyCellsWidth` | `'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1'` |
| `isShownTaskIndex`    | `false`                                                 |

**備考**: `ABC126ToABC211Provider` と `ABC212ToABC318Provider` と同じ設定

---

## 4. テストケース仕様（12-14件）

### 4.1 共通テスト（describe.each()統合）

#### テスト1: displayConfig

```typescript
test('expects to get correct display configuration', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const config = provider.getDisplayConfig();

  expect(config.isShownHeader).toBe(true);
  expect(config.isShownRoundLabel).toBe(true);
  expect(config.roundLabelWidth).toBe('xl:w-16');
  expect(config.tableBodyCellsWidth).toBe('w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1');
  expect(config.isShownTaskIndex).toBe(false);
});
```

**期待値**: ABC等と同じ設定
**検証方法**: `toBe()` による厳密一致

---

#### テスト2: ラウンドラベルフォーマット

```typescript
test('expects to format contest round label correctly', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const label = provider.getContestRoundLabel('arc378');

  expect(label).toBe('378');
});
```

**期待値**: 「ARC」プレフィックス削除後の数字のみ
**検証方法**: `toBe()`

---

#### テスト3: 空入力処理

```typescript
test('expects to handle empty task results', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const filtered = provider.filter([] as TaskResults);

  expect(filtered).toEqual([] as TaskResults);
});
```

**期待値**: 空配列を空配列で返す
**検証方法**: `toEqual([])`

---

### 4.2 ARC104Onwards 固有テスト

#### テスト4: フィルタリング（範囲検証）

```typescript
test('expects to filter tasks to include only ARC104 and later', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const filtered = provider.filter(mockTaskResults);

  expect(filtered.every((task) => task.contest_id.startsWith('arc'))).toBe(true);
  expect(
    filtered.every((task) => {
      const round = getContestRound(task.contest_id, 'arc');
      return round >= 104 && round <= 999;
    }),
  ).toBe(true);
});
```

**期待値**: ARC104～999範囲内のみ
**検証方法**: `every()` + 数値範囲チェック

---

#### テスト5: メタデータ取得

```typescript
test('expects to get correct metadata', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('AtCoder Regular Contest 104 〜 ');
  expect(metadata.abbreviationName).toBe('arc104Onwards');
});
```

**期待値**: タイトル、略称が正確
**検証方法**: `toBe()`

---

#### テスト6: テーブル生成（複数パターン対応）

```typescript
test('expects to generate correct table structure', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const tasks = [
    { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
    { contest_id: 'arc104', task_id: 'arc104_b', task_table_index: 'B' },
    { contest_id: 'arc204', task_id: 'arc204_a', task_table_index: 'A' },
    { contest_id: 'arc204', task_id: 'arc204_d', task_table_index: 'D' },
  ];
  const table = provider.generateTable(tasks as TaskResults);

  expect(table).toHaveProperty('arc104');
  expect(table).toHaveProperty('arc204');
  expect(table['arc104']).toHaveProperty('A');
  expect(table['arc204']['D']).toEqual(expect.objectContaining({ task_id: 'arc204_d' }));
});
```

**期待値**: `{ 'arc104': { 'A': {...}, 'B': {...} }, 'arc204': { 'A': {...}, 'D': {...} } }`
**検証方法**: `toHaveProperty()` + `objectContaining()`

---

#### テスト7: ラウンド ID 取得

```typescript
test('expects to get contest round IDs correctly', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const tasks = [
    { contest_id: 'arc204', task_id: 'arc204_a', task_table_index: 'A' },
    { contest_id: 'arc120', task_id: 'arc120_a', task_table_index: 'A' },
    { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
  ];
  const roundIds = provider.getContestRoundIds(tasks as TaskResults);

  expect(roundIds).toEqual(['arc204', 'arc120', 'arc104']);
});
```

**期待値**: 降順ソート（新しい順）
**検証方法**: `toEqual()`

---

#### テスト8: ヘッダー ID 取得（複数問題対応）

```typescript
test('expects to get header IDs for tasks correctly', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const tasks = [
    { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
    { contest_id: 'arc104', task_id: 'arc104_f', task_table_index: 'F' },
    { contest_id: 'arc104', task_id: 'arc104_e', task_table_index: 'E' },
  ];
  const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

  expect(headerIds).toEqual(['A', 'E', 'F']);
});
```

**期待値**: 昇順ソート済みのタスク一覧
**検証方法**: `toEqual()`

---

#### テスト9: 4問パターン（ARC204）

```typescript
test('expects to handle 4-problem contest pattern (ARC204)', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const tasks = [
    { contest_id: 'arc204', task_id: 'arc204_a', task_table_index: 'A' },
    { contest_id: 'arc204', task_id: 'arc204_b', task_table_index: 'B' },
    { contest_id: 'arc204', task_id: 'arc204_c', task_table_index: 'C' },
    { contest_id: 'arc204', task_id: 'arc204_d', task_table_index: 'D' },
  ];
  const filtered = provider.filter(tasks as TaskResults);
  const headerIds = provider.getHeaderIdsForTask(filtered);

  expect(filtered).toHaveLength(4);
  expect(headerIds).toEqual(['A', 'B', 'C', 'D']);
});
```

**期待値**: 4問(A, B, C, D)のみ取得
**検証方法**: `toHaveLength()` + `toEqual()`

---

#### テスト10: 5問パターン（ARC208）

```typescript
test('expects to handle 5-problem contest pattern (ARC208)', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const tasks = [
    { contest_id: 'arc208', task_id: 'arc208_a', task_table_index: 'A' },
    { contest_id: 'arc208', task_id: 'arc208_b', task_table_index: 'B' },
    { contest_id: 'arc208', task_id: 'arc208_c', task_table_index: 'C' },
    { contest_id: 'arc208', task_id: 'arc208_d', task_table_index: 'D' },
    { contest_id: 'arc208', task_id: 'arc208_e', task_table_index: 'E' },
  ];
  const filtered = provider.filter(tasks as TaskResults);
  const headerIds = provider.getHeaderIdsForTask(filtered);

  expect(filtered).toHaveLength(5);
  expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E']);
});
```

**期待値**: 5問(A, B, C, D, E)のみ取得
**検証方法**: `toHaveLength()` + `toEqual()`

---

#### テスト11: 7問パターン+F2（ARC120）

```typescript
test('expects to handle 7-problem contest pattern with F2 (ARC120)', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const tasks = [
    { contest_id: 'arc120', task_id: 'arc120_a', task_table_index: 'A' },
    { contest_id: 'arc120', task_id: 'arc120_b', task_table_index: 'B' },
    { contest_id: 'arc120', task_id: 'arc120_c', task_table_index: 'C' },
    { contest_id: 'arc120', task_id: 'arc120_d', task_table_index: 'D' },
    { contest_id: 'arc120', task_id: 'arc120_e', task_table_index: 'E' },
    { contest_id: 'arc120', task_id: 'arc120_f', task_table_index: 'F' },
    { contest_id: 'arc120', task_id: 'arc120_f2', task_table_index: 'F2' },
  ];
  const filtered = provider.filter(tasks as TaskResults);
  const headerIds = provider.getHeaderIdsForTask(filtered);

  expect(filtered).toHaveLength(7);
  expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'F2']);
});
```

**期待値**: 7問(A, B, C, D, E, F, F2)すべて取得
**検証方法**: `toHaveLength()` + `toEqual()`

---

#### テスト12: 混合コンテストタイプの排除

```typescript
test('expects to handle task results with different contest types', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const mixedTasks = [
    { contest_id: 'arc200', task_id: 'arc200_a', task_table_index: 'A' },
    { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
    { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
    { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
  ];
  const filtered = provider.filter(mixedTasks as TaskResults);

  expect(filtered).toHaveLength(2);
  expect(filtered?.every((task) => task.contest_id.startsWith('arc'))).toBe(true);
});
```

**期待値**: `arc` で始まるタスクのみ、他を完全に排除
**検証方法**: `toHaveLength()` + `every()`

---

#### テスト13: 範囲外コンテストの排除（ARC103以下）

```typescript
test('expects to exclude contests below ARC104', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const mixedTasks = [
    { contest_id: 'arc100', task_id: 'arc100_a', task_table_index: 'A' },
    { contest_id: 'arc103', task_id: 'arc103_a', task_table_index: 'A' },
    { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
    { contest_id: 'arc105', task_id: 'arc105_a', task_table_index: 'A' },
  ];
  const filtered = provider.filter(mixedTasks as TaskResults);

  expect(filtered).toHaveLength(2);
  expect(
    filtered?.every((task) => {
      const round = getContestRound(task.contest_id, 'arc');
      return round >= 104;
    }),
  ).toBe(true);
});
```

**期待値**: ARC104以上のみ（ARC100、103は除外）
**検証方法**: `toHaveLength()` + `every()`

---

#### テスト14: 提供元ヘッダー ID 順序（昇順確認）

```typescript
test('expects to maintain proper alphabetical/numeric sort order', () => {
  const provider = new ARC104OnwardsProvider(ContestType.ARC);
  const tasks = [
    { contest_id: 'arc104', task_id: 'arc104_f', task_table_index: 'F' },
    { contest_id: 'arc104', task_id: 'arc104_c', task_table_index: 'C' },
    { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
    { contest_id: 'arc104', task_id: 'arc104_f2', task_table_index: 'F2' },
  ];
  const headerIds = provider.getHeaderIdsForTask(tasks as TaskResults);

  expect(headerIds).toEqual(['A', 'C', 'F', 'F2']);
});
```

**期待値**: A → C → F → F2 の正確な昇順
**検証方法**: `toEqual()`

---

## 5. モックデータ設計

### 5.1 追加先

`src/test/lib/utils/test_cases/contest_table_provider.ts`

### 5.2 構成

#### パターンA: ARC104（6問、標準）

```typescript
const [arc104_a, arc104_b, arc104_c, arc104_d, arc104_e, arc104_f] = createContestTasks('arc104', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
  { taskTableIndex: 'F', statusName: AC },
]);
```

---

#### パターンB: ARC120（7問、F2含む）

```typescript
const [arc120_a, arc120_b, arc120_c, arc120_d, arc120_e, arc120_f, arc120_f2] = createContestTasks(
  'arc120',
  [
    { taskTableIndex: 'A', statusName: AC },
    { taskTableIndex: 'B', statusName: AC },
    { taskTableIndex: 'C', statusName: AC },
    { taskTableIndex: 'D', statusName: AC_WITH_EDITORIAL },
    { taskTableIndex: 'E', statusName: TRYING },
    { taskTableIndex: 'F', statusName: PENDING },
    { taskTableIndex: 'F2', statusName: AC },
  ],
);
```

---

#### パターンC: ARC204（4問）

```typescript
const [arc204_a, arc204_b, arc204_c, arc204_d] = createContestTasks('arc204', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'C', statusName: TRYING },
  { taskTableIndex: 'D', statusName: PENDING },
]);
```

---

#### パターンD: ARC208（5問）

```typescript
const [arc208_a, arc208_b, arc208_c, arc208_d, arc208_e] = createContestTasks('arc208', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
]);
```

---

### 5.3 エクスポート

```typescript
export const taskResultsForARC104OnwardsProvider: TaskResults = [
  arc104_a,
  arc104_b,
  arc104_c,
  arc104_d,
  arc104_e,
  arc104_f,
  arc120_a,
  arc120_b,
  arc120_c,
  arc120_d,
  arc120_e,
  arc120_f,
  arc120_f2,
  arc204_a,
  arc204_b,
  arc204_c,
  arc204_d,
  arc208_a,
  arc208_b,
  arc208_c,
  arc208_d,
  arc208_e,
];
```

---

## 6. 実装手順

**ステップ1**: モックデータを `src/test/lib/utils/test_cases/contest_table_provider.ts` に追加

**ステップ2**: `src/test/lib/utils/contest_table_provider.test.ts` に以下を追加

- `describe.each()` に `ARC104OnwardsProvider` を追加（displayConfig等共通テスト）
- `describe('ARC 104 Onwards')` セクションで固有テスト14個を実装

**ステップ3**: テスト実行・検証

```bash
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts
```

**ステップ4**: Lint チェック

```bash
pnpm format
```

---

## 7. 注意点

### 7.1 ソート順序

文字列の辞書順ソート（`'A' < 'B' < 'C' < 'D' < 'E' < 'F' < 'F2'`）

**補足**: `'F'` < `'F2'` であることが重要（`'F2'` は2文字）

---

### 7.2 複数パターン対応

- 4問（ARC204）: A, B, C, D
- 5問（ARC208, 209）: A, B, C, D, E
- 6問（標準）: A, B, C, D, E, F
- 7問（ARC120のみ）: A, B, C, D, E, F, F2

各パターンで独立したテストを用意し、複数パターン同時の場合も検証

---

### 7.3 範囲検証

ARC104 ～ 999の範囲内を厳密に検証

- `arc103` 以下: 除外
- `arc104` 以上: 含包

---

### 7.4 displayConfig 共通化

`ABC126ToABC211Provider` と `ABC212ToABC318Provider` と同じ displayConfig を持つため、`describe.each()` に統合可能

| 項目                  | 値                                                      |
| --------------------- | ------------------------------------------------------- |
| `isShownHeader`       | `true`                                                  |
| `isShownRoundLabel`   | `true`                                                  |
| `roundLabelWidth`     | `'xl:w-16'`                                             |
| `tableBodyCellsWidth` | `'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1'` |
| `isShownTaskIndex`    | `false`                                                 |

---

## 8. テスト数想定

| カテゴリ                          | 個数      | 備考                                                                                                                                                   |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 共通テスト（describe.each()統合） | 3-4       | displayConfig, ラウンドラベル, 空入力など                                                                                                              |
| ARC104Onwards固有テスト           | 11-12     | 1. フィルタリング 2. メタデータ 3. テーブル生成 4. ラウンドID 5. ヘッダーID 6-8. 複数問題パターン(4,5,7問) 9. 型混合処理 10. 範囲外除外 11. ソート順序 |
| **合計**                          | **14-16** |                                                                                                                                                        |

---

## 9. 実装パターン参考

### 参照実装: ABC212ToABC318Provider

```typescript
describe.each([
  {
    providerClass: ABC212ToABC318Provider,
    label: '212 to 318',
    displayConfig: {
      roundLabelWidth: 'xl:w-16',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
    },
  },
])('$label', ({ providerClass, displayConfig }) => {
  test('expects to get correct display configuration', () => {
    const provider = new providerClass(ContestType.ABC);
    const config = provider.getDisplayConfig();

    expect(config.isShownHeader).toBe(true);
    expect(config.isShownRoundLabel).toBe(true);
    expect(config.roundLabelWidth).toBe(displayConfig.roundLabelWidth);
    expect(config.tableBodyCellsWidth).toBe(displayConfig.tableBodyCellsWidth);
    expect(config.isShownTaskIndex).toBe(false);
  });

  // 他のテスト...
});

// ARC104Onwards固有テスト
describe('ARC 104 Onwards', () => {
  test('expects to filter tasks to include only ARC104 and later', () => {
    // ...
  });

  test('expects to handle 4-problem contest pattern (ARC204)', () => {
    // ...
  });

  // 他のテスト...
});
```

---

## 10. 教訓・ベストプラクティス

### 参照ドキュメントから得られた知見

1. **複数パターン対応**: ARC104Onwards の複数問題パターン（4, 5, 6, 7問）は、各々を明示的にテストすることで、将来的な問題数変動に対応できる設計

2. **F2の例外処理**: ARC120のみの例外ケースを専用テストで検証することで、メンテナンス性が向上

3. **displayConfig の統一**: ABC系プロバイダーと ARC系プロバイダーが同じ表示設定を持つことで、UI 層での一貫性が保証される

4. **テスト粒度の統一**: フィルタリング、メタデータ、表示設定、テーブル生成など、すべてのプロバイダーで等しいテスト粒度を適用

5. **ソート順序の厳密化**: 文字列ソートと数値ソートの違いを理解し、期待値を正確に指定することが重要

---

## 11. 実装完了記録

**実装日**: 2025-11-15

**テスト結果**: 127 テスト全合格

### 実装時の学習

1. **モック関数の完全性**: テスト対象が新しいコンテストタイプ（ARC）を扱う場合、モック関数（`classifyContest`, `getContestNameLabel`）にもそのコンテストタイプの処理を追加する必要がある

2. **describe.each() の型安全性**: 複数のプロバイダーを単一の describe.each() でテストする場合、プロバイダーごとに異なるコンテストタイプ（ABC vs ARC）を使用する場合は分離したほうがシンプル

3. **複数パターンテストの有効性**: 4, 5, 6, 7 問のパターンを個別テストすることで、将来の仕様変更にも対応しやすい設計が実現

4. **小規模な mock データの活用**: 固有テスト用に限定的な mock データセット（`taskResultsForARC104OnwardsProvider`）を用意することで、テスト意図が明確になる
````
