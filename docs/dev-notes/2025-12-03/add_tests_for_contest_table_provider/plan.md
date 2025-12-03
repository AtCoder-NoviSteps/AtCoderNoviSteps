# ABC042～125 & ARC058～103 テスト追加計画

**作成日**: 2025-12-03

**対象ブランチ**: #2836

**優先度**: High

---

## 概要

Issue #2836 で実装された `ABC042ToABC125Provider` と `ARC058ToARC103Provider` に対するテストを追加する計画。

**対象ファイル**:

- **Provider実装**: [`src/lib/utils/contest_table_provider.ts`](../../../../../src/lib/utils/contest_table_provider.ts)
  - `ABC042ToABC125Provider` (299行目～)
  - `ARC058ToARC103Provider` (435行目～)
- **テストファイル**: [`src/test/lib/utils/contest_table_provider.test.ts`](../../../../../src/test/lib/utils/contest_table_provider.test.ts)

**参照ドキュメント**:

- [`docs/dev-notes/2025-11-19/add_tests_for_contest_table_provider/plan.md`](../../2025-11-19/add_tests_for_contest_table_provider/plan.md) - AGC001OnwardsProvider のテスト設計
- Issue #2837
- [`prisma/contest_task_pairs.ts`](../../../../../prisma/contest_task_pairs.ts) - 共有問題の対応関係

---

## 特徴と仕様

### ABC042～125 の仕様

- **範囲**: ABC042 ～ ABC125
- **特徴**: 大部分が ARC との同日開催（ABC051、054 など一部は単独開催）
- **共有問題**: ABC042、043 のみ ARC側で登録
  - ABC042：C・D 問題 = ARC058 の C・D 問題（task_id は `arc058_a`, `arc058_b`）
  - ABC043：C・D 問題 = ARC059 の C・D 問題（task_id は `arc059_a`, `arc059_b`）
- **その他**: ABC045～125 の共有問題は ABC側で登録されている

### ARC058～103 の仕様

- **範囲**: ARC058 ～ ARC103
- **特徴**: この範囲のすべての Round で ABC と同日開催
- **共有問題**: C・D 問題が ABC側で登録されている
  - ARC060 の C・D = ABC044 の C・D（task_id は `arc060_a`, `arc060_b`）
  - ARC061 の C・D = ABC045 の C・D（task_id は `arc061_a`, `arc061_b`）

### 表示設定

両プロバイダーとも以下で統一:

- `tableBodyCellsWidth: 'w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1'`
- `isShownHeader: true`
- `isShownRoundLabel: true`
- `roundLabelWidth: 'xl:w-16'`
- `isShownTaskIndex: false`

---

## テスト設計

### 2.1 ABC042ToABC125Provider テスト

**ファイル**: `src/test/lib/utils/contest_table_provider.test.ts`

**配置**: AGC 001 Onwards の直前（現在の "ABC 126 to ABC 211" の後）

#### テスト2.1.1: フィルタリング（Range検証）

```typescript
test('expects to filter tasks within ABC042-125 range', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);
  const mixed = [
    { contest_id: 'abc041', task_id: 'abc041_a', task_table_index: 'A' },
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
    { contest_id: 'abc125', task_id: 'abc125_a', task_table_index: 'A' },
    { contest_id: 'abc126', task_id: 'abc126_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(2);
  expect(filtered.map((t) => t.contest_id)).toEqual(['abc042', 'abc125']);
});
```

#### テスト2.1.2: コンテストタイプ判別

```typescript
test('expects to filter only ABC-type contests', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);
  const mixed = [
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
    { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(2);
  expect(filtered[0].contest_id).toBe('abc042');
  expect(filtered[1].contest_id).toBe('abc042');
});
```

#### テスト2.1.3: メタデータ取得

```typescript
test('expects to return correct metadata', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('AtCoder Beginner Contest 042 〜 125（ARC 同時開催が大半）');
  expect(metadata.abbreviationName).toBe('fromAbc042ToAbc125');
});
```

#### テスト2.1.4: ディスプレイ設定

```typescript
test('expects to return correct display config', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);
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
  const provider = new ABC042ToABC125Provider(ContestType.ABC);

  expect(provider.getContestRoundLabel('abc042')).toBe('042');
  expect(provider.getContestRoundLabel('abc125')).toBe('125');
});
```

#### テスト2.1.6: テーブル生成

```typescript
test('expects to generate correct table structure', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);
  const mockTasks = [
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
    { contest_id: 'abc042', task_id: 'abc042_b', task_table_index: 'B' },
    { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'abc042', task_id: 'arc058_b', task_table_index: 'D' },
  ];

  const table = provider.generateTable(mockTasks as TaskResult[]);

  expect(table).toHaveProperty('abc042');
  expect(table.abc042).toHaveProperty('A');
  expect(table.abc042).toHaveProperty('B');
  expect(table.abc042).toHaveProperty('C');
  expect(table.abc042).toHaveProperty('D');
});
```

#### テスト2.1.7: ラウンド ID 取得

```typescript
test('expects to return correct round id', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);

  expect(provider.getContestRoundIds('abc042')).toBe('abc042');
  expect(provider.getContestRoundIds('abc125')).toBe('abc125');
});
```

#### テスト2.1.8: ヘッダー ID 取得

```typescript
test('expects to return correct header id', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);

  expect(provider.getHeaderIdsForTask()).toMatch(/fromAbc042ToAbc125/);
});
```

#### テスト2.1.9: 空入力処理

```typescript
test('expects to handle empty input', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);

  const table = provider.generateTable([] as TaskResult[]);

  expect(table).toEqual({});
});
```

#### テスト2.1.10: 混合コンテストタイプ排除

```typescript
test('expects to exclude non-ABC contests even if in range', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);
  const mixed = [
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
    { contest_id: 'abc043', task_id: 'abc043_a', task_table_index: 'A' },
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'arc059', task_id: 'arc059_a', task_table_index: 'C' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(2);
  expect(filtered.every((t) => t.contest_id.startsWith('abc'))).toBe(true);
});
```

#### テスト2.1.11: 共有問題の正しい処理（ABC042の特殊性）

```typescript
test('expects to generate correct table structure with shared problems (ABC042 with ARC058)', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);
  const mockAbc042Tasks = [
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
    { contest_id: 'abc042', task_id: 'abc042_b', task_table_index: 'B' },
    { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'abc042', task_id: 'arc058_b', task_table_index: 'D' },
  ];

  const table = provider.generateTable(mockAbc042Tasks as TaskResult[]);

  expect(table).toHaveProperty('abc042');
  expect(table.abc042).toHaveProperty('A'); // ABC専用
  expect(table.abc042).toHaveProperty('B'); // ABC専用
  expect(table.abc042).toHaveProperty('C'); // 共有問題（ARC側のtask_id）
  expect(table.abc042).toHaveProperty('D'); // 共有問題（ARC側のtask_id）
});
```

#### テスト2.1.12: 単独開催と同時開催の混在処理

```typescript
test('expects to handle both solo and concurrent contests correctly', () => {
  const provider = new ABC042ToABC125Provider(ContestType.ABC);
  const mixed = [
    // ABC042：ARC058と同時開催
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
    { contest_id: 'abc042', task_id: 'arc058_a', task_table_index: 'C' },
    // ABC051：単独開催（ARC同時開催なし）
    { contest_id: 'abc051', task_id: 'abc051_c', task_table_index: 'C' },
    { contest_id: 'abc051', task_id: 'abc051_d', task_table_index: 'D' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);
  const table = provider.generateTable(filtered);

  expect(table).toHaveProperty('abc042');
  expect(table).toHaveProperty('abc051');
  expect(table.abc042).toHaveProperty('C'); // 共有問題
  expect(table.abc051).toHaveProperty('C');
  expect(table.abc051).toHaveProperty('D');
});
```

---

### 2.2 ARC058ToARC103Provider テスト

**ファイル**: `src/test/lib/utils/contest_table_provider.test.ts`

**配置**: ARC 104 Onwards の直後

#### テスト2.2.1: フィルタリング（Range検証）

```typescript
test('expects to filter tasks within ARC058-103 range', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);
  const mixed = [
    { contest_id: 'arc057', task_id: 'arc057_a', task_table_index: 'A' },
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'arc103', task_id: 'arc103_a', task_table_index: 'C' },
    { contest_id: 'arc104', task_id: 'arc104_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(2);
  expect(filtered.map((t) => t.contest_id)).toEqual(['arc058', 'arc103']);
});
```

#### テスト2.2.2: コンテストタイプ判別

```typescript
test('expects to filter only ARC-type contests', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);
  const mixed = [
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'arc058', task_id: 'arc058_f', task_table_index: 'F' },
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(2);
  expect(filtered[0].contest_id).toBe('arc058');
  expect(filtered[1].contest_id).toBe('arc058');
});
```

#### テスト2.2.3: メタデータ取得

```typescript
test('expects to return correct metadata', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('AtCoder Regular Contest 058 〜 103（ABC 同時開催）');
  expect(metadata.abbreviationName).toBe('fromArc058ToArc103');
});
```

#### テスト2.2.4: ディスプレイ設定

```typescript
test('expects to return correct display config', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);
  const config = provider.getDisplayConfig();

  expect(config.isShownHeader).toBe(true);
  expect(config.isShownRoundLabel).toBe(true);
  expect(config.tableBodyCellsWidth).toBe('w-1/2 md:w-1/3 lg:w-1/4 px-1 py-1');
  expect(config.roundLabelWidth).toBe('xl:w-16');
  expect(config.isShownTaskIndex).toBe(false);
});
```

#### テスト2.2.5: ラウンドラベルフォーマット

```typescript
test('expects to format contest round label correctly', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);

  expect(provider.getContestRoundLabel('arc058')).toBe('058');
  expect(provider.getContestRoundLabel('arc103')).toBe('103');
});
```

#### テスト2.2.6: テーブル生成

```typescript
test('expects to generate correct table structure', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);
  const mockTasks = [
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'arc058', task_id: 'arc058_b', task_table_index: 'D' },
    { contest_id: 'arc058', task_id: 'arc058_c', task_table_index: 'E' },
    { contest_id: 'arc058', task_id: 'arc058_d', task_table_index: 'F' },
  ];

  const table = provider.generateTable(mockTasks as TaskResult[]);

  expect(table).toHaveProperty('arc058');
  expect(table.arc058).toHaveProperty('C');
  expect(table.arc058).toHaveProperty('D');
  expect(table.arc058).toHaveProperty('E');
  expect(table.arc058).toHaveProperty('F');
});
```

#### テスト2.2.7: ラウンド ID 取得

```typescript
test('expects to return correct round id', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);

  expect(provider.getContestRoundIds('arc058')).toBe('arc058');
  expect(provider.getContestRoundIds('arc103')).toBe('arc103');
});
```

#### テスト2.2.8: ヘッダー ID 取得

```typescript
test('expects to return correct header id', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);

  expect(provider.getHeaderIdsForTask()).toMatch(/fromArc058ToArc103/);
});
```

#### テスト2.2.9: 空入力処理

```typescript
test('expects to handle empty input', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);

  const table = provider.generateTable([] as TaskResult[]);

  expect(table).toEqual({});
});
```

#### テスト2.2.10: 混合コンテストタイプ排除

```typescript
test('expects to exclude non-ARC contests even if in range', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);
  const mixed = [
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'arc059', task_id: 'arc059_a', task_table_index: 'C' },
    { contest_id: 'abc042', task_id: 'abc042_a', task_table_index: 'A' },
    { contest_id: 'abc043', task_id: 'abc043_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResult[]);

  expect(filtered).toHaveLength(2);
  expect(filtered.every((t) => t.contest_id.startsWith('arc'))).toBe(true);
});
```

#### テスト2.2.11: 共有問題の正しい処理（ARC058の構成）

```typescript
test('expects to generate correct table structure with shared and exclusive problems (ARC058)', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);
  const mockArc058Tasks = [
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'arc058', task_id: 'arc058_b', task_table_index: 'D' },
    { contest_id: 'arc058', task_id: 'arc058_c', task_table_index: 'E' },
    { contest_id: 'arc058', task_id: 'arc058_d', task_table_index: 'F' },
  ];

  const table = provider.generateTable(mockArc058Tasks as TaskResult[]);

  expect(table).toHaveProperty('arc058');
  expect(table.arc058).toHaveProperty('C'); // ABC側と共有
  expect(table.arc058).toHaveProperty('D'); // ABC側と共有
  expect(table.arc058).toHaveProperty('E'); // ARC専用
  expect(table.arc058).toHaveProperty('F'); // ARC専用
});
```

#### テスト2.2.12: ABC同時開催パターンの検証

```typescript
test('expects to correctly handle ARC58-103 where all rounds are concurrent with ABC', () => {
  const provider = new ARC058ToARC103Provider(ContestType.ARC);

  // ARC058（ABC042と同時開催）
  const arc058Tasks = [
    { contest_id: 'arc058', task_id: 'arc058_a', task_table_index: 'C' },
    { contest_id: 'arc058', task_id: 'arc058_b', task_table_index: 'D' },
  ];

  // ARC060（ABC044と同時開催）
  const arc060Tasks = [
    { contest_id: 'arc060', task_id: 'arc060_a', task_table_index: 'C' },
    { contest_id: 'arc060', task_id: 'arc060_b', task_table_index: 'D' },
  ];

  const mixed = [...arc058Tasks, ...arc060Tasks];
  const filtered = provider.filter(mixed as TaskResult[]);
  const table = provider.generateTable(filtered);

  expect(filtered).toHaveLength(4);
  expect(table).toHaveProperty('arc058');
  expect(table).toHaveProperty('arc060');
});
```

---

## 実装手順

1. **モックデータ作成**: 各プロバイダーのテストに必要なモック TaskResult を定義
2. **ABC042ToABC125Provider テスト実装**: テスト2.1.1 ～ 2.1.12 を順次実装
3. **ARC058ToARC103Provider テスト実装**: テスト2.2.1 ～ 2.2.12 を順次実装
4. **テスト実行**: `pnpm test` ですべてのテストが通ることを確認
5. **カバレッジ確認**: 両プロバイダーで 100% のカバレッジを達成

---

## 実装時の注意事項

### any の使用を避ける

モックデータ型指定時は、`as TaskResult[]` ではなく、以下のように型安全に実装すること：

```typescript
const mockTasks: TaskResult[] = [
  // ... 正しい型定義
];
```

### 共有問題表現の統一

- ABC042/043：ARC側の task_id を使用（`arc058_a`, `arc059_a` など）
- ARC058～103：すべてのコンテストで ABC と共有する C・D 問題あり

### テーブル構造の検証

`generateTable` の戻り値は以下の構造：

```typescript
type ContestTable = {
  [contestId: string]: {
    [taskIndex: string]: TaskResult;
  };
};
```

---

## 参考資料

- [AGC001OnwardsProvider テスト](../../2025-11-19/add_tests_for_contest_table_provider/plan.md) - 基本パターン
- [`src/lib/utils/contest_table_provider.ts`](../../../../../src/lib/utils/contest_table_provider.ts) - 実装コード
- [`prisma/contest_task_pairs.ts`](../../../../../prisma/contest_task_pairs.ts) - 共有問題対応関係

---

## 実装結果と教訓

### 実装完了

- **ABC042ToABC125Provider**: 12個のテストを実装・パス ✓
- **ARC058ToARC103Provider**: 12個のテストを実装・パス ✓
- **合計テスト数**: 166個のテストがすべてパス

### 教訓

1. **メソッド名の確認が重要**: `getRoundId()` や `getHeaderId()` などのメソッドは実装されていないため、`getContestRoundIds()` や `getMetadata().abbreviationName` など、実装済みのメソッドを使うべき。事前に ContestTableProviderBase の実装を確認してからテストを書くこと。

2. **Range検証とType検証を分離**: フィルタリングのテストでは、Range（範囲）の検証とContestType（コンテストタイプ）の検証を別々のテストケースで行うと、問題の原因特定が容易になる。

3. **共有問題のテストは実装の詳細を反映**: ABC042/043や ARC058～103の共有問題は、テスト時も実装の動作に合わせて task_id を正しく設定すること。これにより、実装と テストの一貫性が保証される。

4. **Plan.md の役割の重要性**: 実装前に計画書を詳細に作成・確認することで、「どのメソッドを使うべきか」「どのような入力パターンをカバーすべきか」が明確になり、実装効率が大幅に向上する。
