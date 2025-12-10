# ABC001～041 & ARC001～057 テスト追加計画

**作成日**: 2025-12-10

**対象ブランチ**: #2838

**優先度**: High

---

## 概要

Issue #2838 で実装された `ABC001ToABC041Provider` と `ARC001ToARC057Provider` に対するテストを追加する計画。

**対象ファイル**:

- **Provider実装**: [`src/lib/utils/contest_table_provider.ts`](../../../../../src/lib/utils/contest_table_provider.ts)
  - `ABC001ToABC041Provider` (318行目～)
  - `ARC001ToARC057Provider` (401行目～)
- **テストファイル**: [`src/test/lib/utils/contest_table_provider.test.ts`](../../../../../src/test/lib/utils/contest_table_provider.test.ts)

**参照ドキュメント**:

- [`docs/dev-notes/2025-12-03/add_tests_for_contest_table_provider/plan.md`](../../2025-12-03/add_tests_for_contest_table_provider/plan.md) - ABC042～125 & ARC058～103 のテスト設計（参照パターン）
- [`prisma/tasks.ts`](../../../../../prisma/tasks.ts) - タスク ID のフォーマット確認

---

## 特徴と仕様

### ABC001～041 の仕様

- **範囲**: ABC001 ～ ABC041
- **特徴**: レーティング導入前のコンテスト
- **4問構成**: すべてのラウンドで A・B・C・D の4問
- **ID フォーマット**:
  - ABC001～019: `abc001_1`, `abc001_2`, `abc001_3`, `abc001_4` (数字サフィックス)
  - ABC020～041: `abc020_a`, `abc020_b`, `abc020_c`, `abc020_d` (英字サフィックス)
- **共有問題**: なし（ARC001～057 と共有問題がない）

### ARC001～057 の仕様

- **範囲**: ARC001 ～ ARC057
- **特徴**: レーティング導入前のコンテスト
- **4問構成**: すべてのラウンドで A・B・C・D の4問
- **ID フォーマット**:
  - ARC001～034: `arc001_1`, `arc001_2`, `arc001_3`, `arc001_4` (数字サフィックス)
  - ARC035～057: `arc035_a`, `arc035_b`, `arc035_c`, `arc035_d` (英字サフィックス)
- **共有問題**: なし（ABC001～041 と共有問題がない）

### 表示設定

両プロバイダーとも以下で統一:

- `tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1'`
- `isShownHeader: true`
- `isShownRoundLabel: true`
- `roundLabelWidth: 'xl:w-16'`
- `isShownTaskIndex: false`

---

## テスト設計

### 2.1 ABC001ToABC041Provider テスト

**ファイル**: `src/test/lib/utils/contest_table_provider.test.ts`

**配置**: ARC058ToARC103Provider テストの後、AGC001OnwardsProvider テストの前

テストケースは [`docs/dev-notes/2025-12-03/add_tests_for_contest_table_provider/plan.md`](../../2025-12-03/add_tests_for_contest_table_provider/plan.md) の テスト2.1.1～2.1.10 を参照して実装。共有問題がないため、テスト2.1.11・2.1.12 は不要。

#### テスト2.1.1: フィルタリング（Range検証）

ABC001～041 の範囲のみをフィルタリングすることを確認。古い ID フォーマット（数字サフィックス）と新しい ID フォーマット（英字サフィックス）の両方を含める。

```typescript
test('expects to filter tasks within ABC001-41 range', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);
  const mixed = [
    { contest_id: 'abc000', task_id: 'abc000_1', task_table_index: 'A' },
    { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' }, // 古いフォーマット
    { contest_id: 'abc020', task_id: 'abc020_a', task_table_index: 'A' }, // 新しいフォーマット
    { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(3);
  expect(filtered.map((t) => t.contest_id)).toEqual(['abc001', 'abc020', 'abc041']);
});
```

#### テスト2.1.2: コンテストタイプ判別（ABC のみ、ARC との分離）

ABC-type のみをフィルタリングし、ARC のコンテストが混ざらないことを確認。

```typescript
test('expects to filter only ABC-type contests and exclude ARC', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);
  const mixed = [
    { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
    { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' },
    { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
    { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(2);
  expect(filtered.every((t) => t.contest_id.startsWith('abc'))).toBe(true);
});
```

#### テスト2.1.3: メタデータ取得

```typescript
test('expects to return correct metadata', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('AtCoder Beginner Contest 001 〜 041（レーティング導入前）');
  expect(metadata.abbreviationName).toBe('fromAbc001ToAbc041');
});
```

#### テスト2.1.4: ディスプレイ設定

```typescript
test('expects to return correct display config', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);
  const config = provider.getDisplayConfig();

  expect(config.isShownHeader).toBe(true);
  expect(config.isShownRoundLabel).toBe(true);
  expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1');
  expect(config.roundLabelWidth).toBe('xl:w-16');
  expect(config.isShownTaskIndex).toBe(false);
});
```

#### テスト2.1.5: ラウンドラベルフォーマット

```typescript
test('expects to format contest round label correctly', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);

  expect(provider.getContestRoundLabel('abc001')).toBe('001');
  expect(provider.getContestRoundLabel('abc041')).toBe('041');
});
```

#### テスト2.1.6: テーブル生成（古い ID フォーマット）

古いフォーマット（数字サフィックス）での正しいテーブル生成を確認。

```typescript
test('expects to generate correct table structure with old ID format (numeric suffix)', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);
  const mockTasks = [
    { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
    { contest_id: 'abc001', task_id: 'abc001_2', task_table_index: 'B' },
    { contest_id: 'abc001', task_id: 'abc001_3', task_table_index: 'C' },
    { contest_id: 'abc001', task_id: 'abc001_4', task_table_index: 'D' },
  ];

  const table = provider.generateTable(mockTasks as TaskResult[]);

  expect(table).toHaveProperty('abc001');
  expect(table.abc001).toHaveProperty('A');
  expect(table.abc001).toHaveProperty('B');
  expect(table.abc001).toHaveProperty('C');
  expect(table.abc001).toHaveProperty('D');
});
```

#### テスト2.1.7: テーブル生成（新しい ID フォーマット）

新しいフォーマット（英字サフィックス）での正しいテーブル生成を確認。

```typescript
test('expects to generate correct table structure with new ID format (alphabet suffix)', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);
  const mockTasks = [
    { contest_id: 'abc020', task_id: 'abc020_a', task_table_index: 'A' },
    { contest_id: 'abc020', task_id: 'abc020_b', task_table_index: 'B' },
    { contest_id: 'abc020', task_id: 'abc020_c', task_table_index: 'C' },
    { contest_id: 'abc020', task_id: 'abc020_d', task_table_index: 'D' },
  ];

  const table = provider.generateTable(mockTasks as TaskResult[]);

  expect(table).toHaveProperty('abc020');
  expect(table.abc020).toHaveProperty('A');
  expect(table.abc020).toHaveProperty('B');
  expect(table.abc020).toHaveProperty('C');
  expect(table.abc020).toHaveProperty('D');
});
```

#### テスト2.1.8: コンテスト ID 取得

```typescript
test('expects to return correct contest round ids', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);
  const mockTasks = [
    { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
    { contest_id: 'abc020', task_id: 'abc020_a', task_table_index: 'A' },
    { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
  ];

  const ids = provider.getContestRoundIds(mockTasks as TaskResult[]);

  expect(ids).toContain('abc001');
  expect(ids).toContain('abc020');
  expect(ids).toContain('abc041');
});
```

#### テスト2.1.9: ヘッダー ID 取得

```typescript
test('expects to return correct header ids', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);
  const mockTasks = [
    { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
    { contest_id: 'abc001', task_id: 'abc001_2', task_table_index: 'B' },
    { contest_id: 'abc001', task_id: 'abc001_3', task_table_index: 'C' },
    { contest_id: 'abc001', task_id: 'abc001_4', task_table_index: 'D' },
  ];

  const ids = provider.getHeaderIdsForTask(mockTasks as TaskResult[]);

  expect(ids).toEqual(['A', 'B', 'C', 'D']);
});
```

#### テスト2.1.10: 空入力処理

```typescript
test('expects to handle empty input gracefully', () => {
  const provider = new ABC001ToABC041Provider(ContestType.ABC);

  const filteredEmpty = provider.filter([] as TaskResult[]);
  const tableEmpty = provider.generateTable([] as TaskResult[]);
  const idsEmpty = provider.getContestRoundIds([] as TaskResult[]);
  const headerIdsEmpty = provider.getHeaderIdsForTask([] as TaskResult[]);

  expect(filteredEmpty).toEqual([]);
  expect(tableEmpty).toEqual({});
  expect(idsEmpty).toEqual([]);
  expect(headerIdsEmpty).toEqual([]);
});
```

---

### 2.2 ARC001ToARC057Provider テスト

**ファイル**: `src/test/lib/utils/contest_table_provider.test.ts`

**配置**: ABC001ToABC041Provider テストの後、AGC001OnwardsProvider テストの前

テストケースは [`docs/dev-notes/2025-12-03/add_tests_for_contest_table_provider/plan.md`](../../2025-12-03/add_tests_for_contest_table_provider/plan.md) の テスト2.2.1～2.2.10 を参照して実装。共有問題がないため、テスト2.2.11・2.2.12 は不要。

各テストはパターンとして ABC001ToABC041Provider と同等ですが、以下の点で異なります：

- Provider クラス: `ARC001ToARC057Provider`
- コンテスト ID の範囲: `arc001` ～ `arc057`
- ID フォーマット:
  - ARC001～034: 数字サフィックス (`arc001_1`, `arc001_2`, ...)
  - ARC035～057: 英字サフィックス (`arc035_a`, `arc035_b`, ...)
- メタデータ:
  - title: `'AtCoder Regular Contest 001 〜 057（レーティング導入前）'`
  - abbreviationName: `'fromArc001ToArc057'`

#### テスト2.2.1: フィルタリング（Range検証）

ARC001～057 の範囲のみをフィルタリングすることを確認。古い ID フォーマット（数字サフィックス）と新しい ID フォーマット（英字サフィックス）の両方を含める。

```typescript
test('expects to filter tasks within ARC001-57 range', () => {
  const provider = new ARC001ToARC057Provider(ContestType.ARC);
  const mixed = [
    { contest_id: 'arc000', task_id: 'arc000_1', task_table_index: 'A' },
    { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' }, // 古いフォーマット
    { contest_id: 'arc035', task_id: 'arc035_a', task_table_index: 'A' }, // 新しいフォーマット
    { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(3);
  expect(filtered.map((t) => t.contest_id)).toEqual(['arc001', 'arc035', 'arc057']);
});
```

#### テスト2.2.2: コンテストタイプ判別（ARC のみ、ABC との分離）

ARC-type のみをフィルタリングし、ABC のコンテストが混ざらないことを確認。

```typescript
test('expects to filter only ARC-type contests and exclude ABC', () => {
  const provider = new ARC001ToARC057Provider(ContestType.ARC);
  const mixed = [
    { contest_id: 'arc001', task_id: 'arc001_1', task_table_index: 'A' },
    { contest_id: 'abc001', task_id: 'abc001_1', task_table_index: 'A' },
    { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
    { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(2);
  expect(filtered.every((t) => t.contest_id.startsWith('arc'))).toBe(true);
});
```

#### テスト2.2.3～2.2.10

ABC001ToABC041Provider のテスト2.1.3～2.1.10 と同等の構成で実装。

詳細は [`docs/dev-notes/2025-12-03/add_tests_for_contest_table_provider/plan.md`](../../2025-12-03/add_tests_for_contest_table_provider/plan.md) のテスト2.2.3～2.2.10 を参照。

---

## テスト実装時の注意点

### 1. モックデータの準備

`src/test/lib/utils/test_cases/contest_table_provider.ts` に、以下のモックデータを追加する必要があります：

- ABC001～041 (古いフォーマット・新しいフォーマットの両方)
- ARC001～057 (古いフォーマット・新しいフォーマットの両方)

### 2. task_table_index の取り扱い

古い ID フォーマット（`abc001_1`）でも、`task_table_index` は必ず `'A'`, `'B'`, `'C'`, `'D'` になることに注意。

### 3. 共有問題への対応

ABC001～041 と ARC001～057 には共有問題がないため、共有問題に関するテストケースは不要です。

### 4. テストの配置

既存テストの構成を崩さないよう、以下の順序で配置：

1. ABC 関連テスト（ABCLatest20Rounds → ABC319Onwards → ABC212ToABC318 → ABC126ToABC211 → ABC042ToABC125 → **ABC001ToABC041**)
2. ARC 関連テスト（ARC104Onwards → ARC058ToARC103 → **ARC001ToARC057**)
3. AGC001OnwardsProvider テスト以降

---

## 実装を開始する前の確認事項（設計パターン）

### Q1. 参照ドキュメント

計画では `docs/dev-notes/2025-12-03/add_tests_for_contest_table_provider/plan.md` のテスト設計を参照していますが、このファイルで ABC042ToABC125 & ARC058ToARC103 のテストが既に実装されていますか？

**A1. YES** - 既に実装済み。参照パターンとして利用可。

### Q2. モックデータファイル

`src/test/lib/utils/test_cases/contest_table_provider.ts` は既に存在していますか？

**A2. YES** - 既に存在。新しいテストケース用のモックデータを追加する。

### Q3. 現在の実装状態

`src/lib/utils/contest_table_provider.ts` で ABC001ToABC041Provider と ARC001ToARC057Provider は既に実装されていますか？

**A3. YES** - 既に実装済み（Issue #2838）。テスト追加のみ。

---

## 実装完了と教訓

### 実装結果

**テスト数**:

- ABC001ToABC041Provider: 10テスト
- ARC001ToARC057Provider: 10テスト
- 合計新規追加: 20テスト
- 全体テストパス数: 186テスト（既存166テスト）

**実装内容**:

1. テストケースデータを `src/test/lib/utils/test_cases/contest_table_provider.ts` に追加
   - ABC001, ABC019, ABC020, ABC041（数字・英字サフィックスの両方をカバー）
   - ARC001, ARC034, ARC035, ARC057（数字・英字サフィックスの両方をカバー）

2. テストを `src/test/lib/utils/contest_table_provider.test.ts` に追加
   - ABC042ToABC125 テストの直後に ABC001ToABC041Provider テスト
   - ARC058ToARC103 テストの直後に ARC001ToARC057Provider テスト

### テスト設計パターンの活用

参照ドキュメント（2025-12-03のテスト設計）を活用することで、以下のベストプラクティスを実装：

1. **フィルタリング検証**: 正しい範囲のコンテストのみを抽出していることを確認
2. **コンテストタイプ判別**: ABC/ARC の分離が正確に機能していることを確認
3. **メタデータ検証**: title と abbreviationName が正確であることを確認
4. **ディスプレイ設定**: UI関連の設定が統一されていることを確認
5. **ラウンドラベルフォーマット**: 3桁のゼロパディングが正確であることを確認
6. **テーブル生成（両フォーマット）**: 古いフォーマット（数字）と新しいフォーマット（英字）の両方に対応していることを確認
7. **ID取得**: コンテスト ID とヘッダー ID の取得が正確であることを確認
8. **エッジケース処理**: 空入力の処理が正確であることを確認

### 実装上の重要なポイント

1. **レーティング導入前コンテストの特性**: ABC001-041 と ARC001-057 はレーティング導入前のコンテストで、以下の特性を持つ
   - ID フォーマットの移行期がある（ABC020 から、ARC035 から）
   - 共有問題がない
   - すべて 4 問構成

2. **テストケースデータの設計**: モックデータは以下の観点を網羅
   - 新旧 ID フォーマットの両方を含める
   - 複数のステータス（AC, AC_WITH_EDITORIAL, TRYING, PENDING）を含める
   - 範囲の開始・中盤・終了を網羅

3. **テスト配置の重要性**: テスト実行順序と配置
   - ABC関連: ABCLatest20Rounds → ... → ABC042ToABC125 → **ABC001ToABC041** → ARC104Onwards
   - ARC関連: ARC104Onwards → ARC058ToARC103 → **ARC001ToARC057** → AGC001Onwards
   - 既存テストの構成を維持することが重要

### 学習した設計パターン

今後、新しいコンテスト期間のプロバイダーをテストする際に活用可能なパターン：

```typescript
// 1. テストケースデータ: 新旧フォーマットを含める
const [xxx_old_format] = createContestTasks('xxxNNN', [
  { taskId: 'xxxnnn_1', taskTableIndex: 'A', statusName: AC },
  // ... old format
]);

const [xxx_new_format] = createContestTasks('xxxNNN', [
  { taskId: 'xxxnnn_a', taskTableIndex: 'A', statusName: AC },
  // ... new format
]);

// 2. テスト: 確認すべき項目を系統的に検証
describe('XXXToYYYProvider', () => {
  test('expects to filter tasks within XXX-YYY range', () => {
    /* ... */
  });
  test('expects to filter only appropriate contest type', () => {
    /* ... */
  });
  test('expects to return correct metadata', () => {
    /* ... */
  });
  test('expects to return correct display config', () => {
    /* ... */
  });
  test('expects to format contest round label correctly', () => {
    /* ... */
  });
  test('expects to generate correct table structure with old ID format', () => {
    /* ... */
  });
  test('expects to generate correct table structure with new ID format', () => {
    /* ... */
  });
  test('expects to return correct contest round ids', () => {
    /* ... */
  });
  test('expects to return correct header ids', () => {
    /* ... */
  });
  test('expects to handle empty input gracefully', () => {
    /* ... */
  });
});
```

このパターンにより、新しいプロバイダーの網羅的なテストを体系的に実装できる。
