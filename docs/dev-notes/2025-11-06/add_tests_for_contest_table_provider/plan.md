# FPS24Provider テスト追加計画

**作成日**: 2025-11-06

**対象ブランチ**: #2797

**優先度**: High

---

## 参照ドキュメント

テストの書き方・スタイル・ベストプラクティスについては、以下を参照：

📖 [`docs/dev-notes/2025-11-03/add_tests_for_contest_table_provider/plan.md`](../../2025-11-03/add_tests_for_contest_table_provider/plan.md)

---

## 1. 概要

### 背景

`FPS24Provider` は `EDPCProvider`・`TDPCProvider` と同じ構造で、単一のコンテスト(`fps-24`)からなる問題集を提供します。

- **セクション範囲**: A ～ X（24文字）
- **フォーマット**: 大文字アルファベット（A, B, C, ..., X）
- **単一ソース**: `contest_id === 'fps-24'` で統一

### 目的

EDPC・TDPC テストと同等の粒度で、FPS24Provider の単体テスト 8 個を追加。

---

## 2. 仕様要件

| 項目               | 仕様                  | 備考                      |
| ------------------ | --------------------- | ------------------------- |
| **セクション範囲** | A ～ X                | 24文字分                  |
| **ソート順序**     | 昇順（A → B → ... X） | 必須                      |
| **フォーマット**   | 大文字アルファベット  | 例: A, B, X               |
| **単一ソース**     | contest_id = 'fps-24' | EDPC・TDPC と同じパターン |

---

## 3. テストケース（8件）

### テスト1: フィルタリング

```typescript
test('expects to filter tasks to include only fps-24 contest', () => {
  const provider = new FPS24Provider(ContestType.FPS_24);
  const mixedTasks = [
    { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
    { contest_id: 'fps-24', task_id: 'fps-24_a', task_table_index: 'A' },
    { contest_id: 'fps-24', task_id: 'fps-24_b', task_table_index: 'B' },
    { contest_id: 'typical90', task_id: 'typical90_a', task_table_index: '001' },
  ];
  const filtered = provider.filter(mixedTasks);

  expect(filtered?.every((task) => task.contest_id === 'fps-24')).toBe(true);
  expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'abc123' }));
  expect(filtered).not.toContainEqual(expect.objectContaining({ contest_id: 'typical90' }));
});
```

---

### テスト2: メタデータ取得

```typescript
test('expects to get correct metadata', () => {
  const provider = new FPS24Provider(ContestType.FPS_24);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('FPS 24 題');
  expect(metadata.abbreviationName).toBe('fps-24');
});
```

---

### テスト3: 表示設定

```typescript
test('expects to get correct display configuration', () => {
  const provider = new FPS24Provider(ContestType.FPS_24);
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
  const provider = new FPS24Provider(ContestType.FPS_24);
  const label = provider.getContestRoundLabel('fps-24');

  expect(label).toBe('');
});
```

---

### テスト5: テーブル生成

```typescript
test('expects to generate correct table structure', () => {
  const provider = new FPS24Provider(ContestType.FPS_24);
  const tasks = [
    { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
    { contest_id: 'fps-24', task_id: 'fps_24_b', task_table_index: 'B' },
    { contest_id: 'fps-24', task_id: 'fps_24_x', task_table_index: 'X' },
  ];
  const table = provider.generateTable(tasks);

  expect(table).toHaveProperty('fps-24');
  expect(table['fps-24']).toHaveProperty('A');
  expect(table['fps-24']).toHaveProperty('B');
  expect(table['fps-24']).toHaveProperty('X');
  expect(table['fps-24']['A']).toEqual(expect.objectContaining({ task_id: 'fps-24_a' }));
});
```

---

### テスト6: ラウンド ID 取得

```typescript
test('expects to get contest round IDs correctly', () => {
  const provider = new FPS24Provider(ContestType.FPS_24);
  const tasks = [
    { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
    { contest_id: 'fps-24', task_id: 'fps_24_x', task_table_index: 'X' },
  ];
  const roundIds = provider.getContestRoundIds(tasks);

  expect(roundIds).toEqual(['fps-24']);
});
```

---

### テスト7: ヘッダー ID 取得（昇順）

```typescript
test('expects to get header IDs for tasks correctly in ascending order', () => {
  const provider = new FPS24Provider(ContestType.FPS_24);
  const tasks = [
    { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
    { contest_id: 'fps-24', task_id: 'fps_24_x', task_table_index: 'X' },
    { contest_id: 'fps-24', task_id: 'fps_24_m', task_table_index: 'M' },
    { contest_id: 'fps-24', task_id: 'fps_24_b', task_table_index: 'B' },
  ];
  const headerIds = provider.getHeaderIdsForTask(tasks);

  expect(headerIds).toEqual(['A', 'B', 'M', 'X']);
});
```

---

### テスト8: セクション範囲検証（A ～ X）

```typescript
test('expects to handle section boundaries correctly (A-X)', () => {
  const provider = new FPS24Provider(ContestType.FPS_24);
  const tasks = [
    { contest_id: 'fps-24', task_id: 'fps_24_a', task_table_index: 'A' },
    { contest_id: 'fps-24', task_id: 'fps_24_x', task_table_index: 'X' },
  ];
  const headerIds = provider.getHeaderIdsForTask(tasks);

  expect(headerIds).toEqual(['A', 'X']);
});
```

---

## 4. モックデータ

追加先: `src/test/lib/utils/test_cases/contest_table_provider.ts`

```typescript
export const taskResultsForFPS24Provider: TaskResults = [
  {
    contest_id: 'fps-24',
    task_id: 'fps_24_a',
    task_table_index: 'A',
  },
  {
    contest_id: 'fps-24',
    task_id: 'fps_24_b',
    task_table_index: 'B',
  },
  {
    contest_id: 'fps-24',
    task_id: 'fps_24_m',
    task_table_index: 'M',
  },
  {
    contest_id: 'fps-24',
    task_id: 'fps_24_x',
    task_table_index: 'X',
  },
];
```

---

## 5. テスト統合パターン

### 既存テスト構造（変更しない）

以下は変更対象外：

- Typical90 provider テスト
- TessokuBook provider テスト
- MathAndAlgorithm provider テスト

### 新規追加パターン

`describe.each()` に FPS24 を追加（EDPC・TDPC と同じ共通テストパターン）：

```typescript
describe.each([
  {
    providerClass: EDPCProvider,
    contestType: ContestType.EDPC,
    title: 'Educational DP Contest / DP まとめコンテスト',
    abbreviationName: 'edpc',
    label: 'EDPC provider',
  },
  {
    providerClass: TDPCProvider,
    contestType: ContestType.TDPC,
    title: 'Typical DP Contest',
    abbreviationName: 'tdpc',
    label: 'TDPC provider',
  },
  {
    providerClass: FPS24Provider,
    contestType: ContestType.FPS24,
    title: 'FPS 24 題',
    abbreviationName: 'fps-24',
    label: 'FPS24 provider',
  },
])('$label', ({ providerClass, contestType, title, abbreviationName }) => {
  // 共通テスト: メタデータ、表示設定、ラウンドラベル
});
```

### FPS24 特有テスト

独立した `describe('FPS24 provider', ...)` ブロックで以下をテスト：

- フィルタリング機能
- テーブル生成
- ラウンド ID 取得
- ヘッダー ID 取得（昇順）
- セクション範囲検証（A ～ X）

---

## 6. 実装手順

**ステップ1**: ✅ モックデータを `src/test/lib/utils/test_cases/contest_table_provider.ts` に追加

**ステップ2**: ✅ `describe.each()` に FPS24 パラメータを追加（EDPC・TDPC と並べる）

**ステップ3**: ✅ FPS24 特有テスト 7 個を `src/test/lib/utils/contest_table_provider.test.ts` に追加

**ステップ4**: ✅ テスト実行・検証

```bash
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts
```

**ステップ5**: ✅ Lint チェック

```bash
pnpm lint src/test/lib/utils/contest_table_provider.test.ts
```

---

## 7. 注意点

1. **セクション形式**: 大文字アルファベット（A ～ X）であり、3桁数字ではない
2. **コンテスト ID**: `contest_id === 'fps-24'` で統一（ハイフン含む）
3. **単一ソース**: EDPC・TDPC と同様に、常に `contest_id === 'fps-24'`
4. **ソート順序**: 文字列の辞書順ソート（`'A' < 'B' < ... < 'X'`）

---

## 8. 参考資料

- PR #2286: FPS24Provider 実装（https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/2286）
- PR #2780: リファクタリング（https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/2780）
- 参照ドキュメント: `docs/dev-notes/2025-11-01/add_and_refactoring_tests_for_contest_table_provider/plan.md`

---

## 9. 実装結果・教訓

### ✅ 実装完了

**実施時間**: 12.4 秒（テスト実行 7.47 秒含む）

**実装内容**:

1. モックデータ追加: 4 個のサンプルタスク（`fps_24_a`, `fps_24_b`, `fps_24_m`, `fps_24_x`）を `contest_table_provider.ts` に追加
2. classifyContest mock 拡張: `fps-24` → `ContestType.FPS_24` のマッピングを追加
3. describe.each に FPS24 パラメータ追加: EDPC・TDPC と並べて共通テスト（メタデータ、表示設定、ラウンドラベル）を定義
4. FPS24 特有テスト 7 個を実装: フィルタリング、テーブル生成、ラウンド ID 取得、ヘッダー ID 取得（昇順）、セクション範囲検証、空入力処理、混合コンテストタイプ処理

### 📚 得られた教訓

1. **既存のプリセット関数への影響**：新規プロバイダーを `prepareContestProviderPresets().dps()` に追加する際、既存テストケース（`expects to create DPs preset correctly`）が自動的に期待値が変わることに注意。既存テストを更新する必要がある

2. **共通テストパターンの有効性確認**：FPS24 が EDPC・TDPC と全く同じ構造（単一コンテスト ID、大文字アルファベット形式）であることから、`describe.each()` による共通テスト化が非常に効果的。テストコードの重複排除に成功

3. **アルファベット順ソートの正確性**：大文字アルファベット（A ～ X）のソートは JavaScript の標準文字列ソート（`sort()`）で正しく動作することを確認。ただし Unicode 順序に依存するため、テストケースで明示的に検証することは重要

4. **プリセット機能と外部ラベルの同期**：`prepareContestProviderPresets().dps()` が返すグループ名・ボタンラベル・aria-label が既に FPS24 を含むよう更新されていたため、テストの期待値調整が必須。実装時はプリセット関数の実装と共にテストも確認すること
