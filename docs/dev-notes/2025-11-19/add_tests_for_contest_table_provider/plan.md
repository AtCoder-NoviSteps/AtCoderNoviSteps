# AGC001OnwardsProvider テスト追加計画

**作成日**: 2025-11-19

**対象ブランチ**: #2837

**優先度**: High

---

## 参照ドキュメント

テストの書き方・スタイルについては、以下を参照：

📖 [`docs/dev-notes/2025-11-15/add_tests_for_contest_table_provider/plan.md`](../../2025-11-15/add_tests_for_contest_table_provider/plan.md) (ARC104OnwardsProvider)

**本ドキュメントは ARC版の差分版です。基本構造は ARC版に準じます。**

---

## 実装チェックリスト

### 1. テスト設計 📋

- [ ] フィルタリングテスト（AGC001～999範囲内のみ抽出）
- [ ] コンテストタイプ判別テスト（AGC型のみ）
- [ ] メタデータ取得テスト
- [ ] ディスプレイ設定テスト
- [ ] ラウンドラベルフォーマットテスト
- [ ] エッジケーステスト（空入力など）
- [ ] 混合コンテストタイプ対応テスト
- [ ] **複数問題パターンテスト（4問、5問、6問、7問）**

### 2. モックデータ準備

- [ ] `src/test/lib/utils/test_cases/contest_table_provider.ts` に AGC001+ データを追加
- [ ] AGC001（6問: A, B, C, D, E, F）- 標準パターン
- [ ] AGC002（6問: A, B, C, D, E, F）- 標準パターン
- [ ] AGC009（5問: A, B, C, D, E）- 例外パターン
- [ ] AGC028（7問: A, B, C, D, E, F, F2）- 2025年11時点で、唯一の7問パターン
- [ ] AGC073（4問: A, B, C, D）- 2025年11時点で、唯一の4問パターン
- [ ] AGC074（5問: A, B, C, D, E）- AGC067以降の5問パターン

### 3. テスト実装

- [ ] 既存テスト（ARC104OnwardsProvider）を参考に記述
- [ ] `AGC001OnwardsProvider` をテストファイルにインポート
- [ ] `describe.each()` に AGC001OnwardsProvider を追加（displayConfig 共通化）
- [ ] AGC001Onwards個別テストで複数問題パターンの検証を追加

### 4. テスト リファクタリング

- [ ] displayConfig 共通テストを `describe.each()` で統合
- [ ] AGC001Onwards固有テスト（フィルタリング範囲、複数パターン）を実装

### 5. 実装後の検証

- [ ] テスト実行: `pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts`
- [ ] Lint チェック: `pnpm format`
- [ ] 全テスト合格確認

---

## 1. テスト対象プロバイダー

### AGC001OnwardsProvider

| 項目             | 仕様                 | 備考               |
| ---------------- | -------------------- | ------------------ |
| **範囲**         | AGC 001 ～ 999       | 開始日: 2016/07/16 |
| **問題数**       | 4～7問               | ラウンドにより変動 |
| **フォーマット** | A, B, C, D, E, F, F2 | 標準は6問(F迄)     |

---

## 2. 問題パターン仕様

### パターン1: 4問コンテスト（AGC073）

```
task_table_index: A, B, C, D
```

**用例**: AGC073（唯一）

---

### パターン2: 5問コンテスト（AGC009、AGC067～）

```
task_table_index: A, B, C, D, E
```

**用例**: AGC009（歴史的）、AGC067以降（標準）

---

### パターン3: 6問コンテスト（標準）

```
task_table_index: A, B, C, D, E, F
```

**用例**: AGC001, AGC002, AGC010～AGC066 など大多数のラウンド

---

### パターン4: 7問コンテスト（AGC028のみ）

```
task_table_index: A, B, C, D, E, F, F2
```

**用例**: AGC028（非常に例外的）

---

## 3. 表示設定（displayConfig）

| 項目                  | 値                                                      |
| --------------------- | ------------------------------------------------------- |
| `isShownHeader`       | `true`                                                  |
| `isShownRoundLabel`   | `true`                                                  |
| `roundLabelWidth`     | `'xl:w-16'`                                             |
| `tableBodyCellsWidth` | `'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1'` |
| `isShownTaskIndex`    | `false`                                                 |

**備考**: `ARC104OnwardsProvider` と同じ設定

---

## 4. テストケース仕様

> 詳細は [`docs/dev-notes/2025-11-15/add_tests_for_contest_table_provider/plan.md`](../../2025-11-15/add_tests_for_contest_table_provider/plan.md) の「4. テストケース仕様」を参照。
>
> AGC版では以下の差分のみ記載：

### 4.1 共通テスト（describe.each()統合）

ARC版と同様（displayConfig, ラウンドラベルフォーマット, 空入力処理）

### 4.2 AGC001Onwards 固有テスト（差分）

#### テスト: フィルタリング（範囲検証）

```typescript
test('expects to filter tasks to include only AGC001 and later', () => {
  const provider = new AGC001OnwardsProvider(ContestType.AGC);
  const filtered = provider.filter(mockTaskResults);

  expect(filtered.every((task) => task.contest_id.startsWith('agc'))).toBe(true);
  expect(
    filtered.every((task) => {
      const round = getContestRound(task.contest_id, 'agc');
      return round >= 1 && round <= 999;
    }),
  ).toBe(true);
});
```

**期待値**: AGC001～999範囲内のみ
**参照**: ARC版テスト4を AGC用に適応

---

#### テスト: メタデータ取得

```typescript
test('expects to get correct metadata', () => {
  const provider = new AGC001OnwardsProvider(ContestType.AGC);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('AtCoder Grand Contest 001 〜 ');
  expect(metadata.abbreviationName).toBe('agc001Onwards');
});
```

**参照**: ARC版テスト5

---

#### テスト: 4問パターン（AGC073）

```typescript
test('expects to handle 4-problem contest pattern (AGC073)', () => {
  const provider = new AGC001OnwardsProvider(ContestType.AGC);
  const tasks = [
    { contest_id: 'agc073', task_id: 'agc073_a', task_table_index: 'A' },
    { contest_id: 'agc073', task_id: 'agc073_b', task_table_index: 'B' },
    { contest_id: 'agc073', task_id: 'agc073_c', task_table_index: 'C' },
    { contest_id: 'agc073', task_id: 'agc073_d', task_table_index: 'D' },
  ];
  const filtered = provider.filter(tasks as TaskResults);
  const headerIds = provider.getHeaderIdsForTask(filtered);

  expect(filtered).toHaveLength(4);
  expect(headerIds).toEqual(['A', 'B', 'C', 'D']);
});
```

**参照**: ARC版テスト9を AGCに適用

---

#### テスト: 5問パターン（AGC009・AGC074）

```typescript
test('expects to handle 5-problem contest pattern (AGC009, AGC074)', () => {
  const provider = new AGC001OnwardsProvider(ContestType.AGC);
  const tasks = [
    { contest_id: 'agc009', task_id: 'agc009_a', task_table_index: 'A' },
    { contest_id: 'agc009', task_id: 'agc009_b', task_table_index: 'B' },
    { contest_id: 'agc009', task_id: 'agc009_c', task_table_index: 'C' },
    { contest_id: 'agc009', task_id: 'agc009_d', task_table_index: 'D' },
    { contest_id: 'agc009', task_id: 'agc009_e', task_table_index: 'E' },
  ];
  const filtered = provider.filter(tasks as TaskResults);
  const headerIds = provider.getHeaderIdsForTask(filtered);

  expect(filtered).toHaveLength(5);
  expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E']);
});
```

**参照**: ARC版テスト10を AGCに適用

---

#### テスト: 7問パターン+F2（AGC028）

```typescript
test('expects to handle 7-problem contest pattern with F2 (AGC028)', () => {
  const provider = new AGC001OnwardsProvider(ContestType.AGC);
  const tasks = [
    { contest_id: 'agc028', task_id: 'agc028_a', task_table_index: 'A' },
    { contest_id: 'agc028', task_id: 'agc028_b', task_table_index: 'B' },
    { contest_id: 'agc028', task_id: 'agc028_c', task_table_index: 'C' },
    { contest_id: 'agc028', task_id: 'agc028_d', task_table_index: 'D' },
    { contest_id: 'agc028', task_id: 'agc028_e', task_table_index: 'E' },
    { contest_id: 'agc028', task_id: 'agc028_f', task_table_index: 'F' },
    { contest_id: 'agc028', task_id: 'agc028_f2', task_table_index: 'F2' },
  ];
  const filtered = provider.filter(tasks as TaskResults);
  const headerIds = provider.getHeaderIdsForTask(filtered);

  expect(filtered).toHaveLength(7);
  expect(headerIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'F2']);
});
```

**参照**: ARC版テスト11を AGCに適用

---

#### その他のテスト

- テスト: 混合コンテストタイプの排除
- テスト: 範囲外コンテストの排除（AGC000以下）
- テスト: ソート順序（昇順確認）
- テスト: テーブル生成
- テスト: ラウンド ID 取得
- テスト: ヘッダー ID 取得

**参照**: ARC版テスト6, 7, 8, 12, 13, 14

---

## 5. モックデータ設計

### 5.1 追加先

`src/test/lib/utils/test_cases/contest_table_provider.ts`

### 5.2 構成

#### パターンA: AGC001（6問、標準）

```typescript
const [agc001_a, agc001_b, agc001_c, agc001_d, agc001_e, agc001_f] = createContestTasks('agc001', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
  { taskTableIndex: 'F', statusName: PENDING },
]);
```

---

#### パターンB: AGC002（6問、標準）

```typescript
const [agc002_a, agc002_b, agc002_c, agc002_d, agc002_e, agc002_f] = createContestTasks('agc002', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC },
  { taskTableIndex: 'D', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'E', statusName: TRYING },
  { taskTableIndex: 'F', statusName: PENDING },
]);
```

---

#### パターンC: AGC009（5問、歴史的例外）

```typescript
const [agc009_a, agc009_b, agc009_c, agc009_d, agc009_e] = createContestTasks('agc009', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
]);
```

---

#### パターンD: AGC028（7問、F2含む）

```typescript
const [agc028_a, agc028_b, agc028_c, agc028_d, agc028_e, agc028_f, agc028_f2] = createContestTasks(
  'agc028',
  [
    { taskTableIndex: 'A', statusName: AC },
    { taskTableIndex: 'B', statusName: AC },
    { taskTableIndex: 'C', statusName: AC },
    { taskTableIndex: 'D', statusName: AC_WITH_EDITORIAL },
    { taskTableIndex: 'E', statusName: TRYING },
    { taskTableIndex: 'F', statusName: PENDING },
    { taskTableIndex: 'F2', statusName: PENDING },
  ],
);
```

---

#### パターンE: AGC073（4問）

```typescript
const [agc073_a, agc073_b, agc073_c, agc073_d] = createContestTasks('agc073', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'C', statusName: TRYING },
  { taskTableIndex: 'D', statusName: PENDING },
]);
```

---

#### パターンF: AGC074（5問、AGC067以降の標準）

```typescript
const [agc074_a, agc074_b, agc074_c, agc074_d, agc074_e] = createContestTasks('agc074', [
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
export const taskResultsForAGC001OnwardsProvider: TaskResults = [
  agc001_a,
  agc001_b,
  agc001_c,
  agc001_d,
  agc001_e,
  agc001_f,
  agc002_a,
  agc002_b,
  agc002_c,
  agc002_d,
  agc002_e,
  agc002_f,
  agc009_a,
  agc009_b,
  agc009_c,
  agc009_d,
  agc009_e,
  agc028_a,
  agc028_b,
  agc028_c,
  agc028_d,
  agc028_e,
  agc028_f,
  agc028_f2,
  agc073_a,
  agc073_b,
  agc073_c,
  agc073_d,
  agc074_a,
  agc074_b,
  agc074_c,
  agc074_d,
  agc074_e,
];
```

---

## 6. 実装手順

**ステップ1**: モックデータを `src/test/lib/utils/test_cases/contest_table_provider.ts` に追加

**ステップ2**: `src/test/lib/utils/contest_table_provider.test.ts` に以下を追加

- `describe.each()` に `AGC001OnwardsProvider` を追加（displayConfig等共通テスト）
- `describe('AGC 001 Onwards')` セクションで固有テスト（14個以上）を実装

**ステップ3**: テスト実行・検証

```bash
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts
```

**ステップ4**: Lint チェック

```bash
pnpm format
```

---

## 7. AGC固有の注意点

### 7.1 複数例外パターンの網羅

AGCは以下4つの問題数パターンを持つため、各パターンを明示的にテストすることが重要：

- 4問（AGC073）
- 5問（AGC009、AGC067～）
- 6問（〜AGC066の標準）
- 7問+F2（AGC028）

### 7.2 モックデータの多様性

AGC001, AGC002（標準6問）、AGC009（歴史的5問）、AGC028（特殊7問）、AGC073（4問）、AGC074（新5問）の6パターンを用意することで、仕様変更に対応しやすい設計

### 7.3 displayConfig の確認

ARC104OnwardsProvider と同一

---

## 8. テスト数想定

| カテゴリ                          | 個数      | 備考                                                  |
| --------------------------------- | --------- | ----------------------------------------------------- |
| 共通テスト（describe.each()統合） | 3-4       | displayConfig, ラウンドラベル, 空入力など             |
| AGC001Onwards固有テスト           | 14-16     | パターン4つ＋その他（フィルタリング、メタデータなど） |
| **合計**                          | **17-20** | ARC版（14-16）より若干多い（パターン数増加のため）    |

---

## 9. 参考: 歴史的背景

- **AGC001-AGC008**: 基本は6問
- **AGC009**: 例外的に5問
- **AGC010-AGC027**: 基本は6問
- **AGC028**: 例外的に7問（F2含む）
- **AGC029-AGC066**: 基本は6問
- **AGC067-AGC072**: 基本は5問（仕様変更）
- **AGC073**: 例外的に4問
- **AGC074以降**: 標準5問

---

## 10. 実装前確認事項

### 確認日: 2025-11-19

#### Q1: 既存テストファイルの存在状況

**結果**: ✅ Yes

- `src/test/lib/utils/contest_table_provider.test.ts` は存在
- ARC104OnwardsProvider のテストが既に実装済み（約150行）
- テストパターン: フィルタリング、メタデータ、4/5/6/7問パターン等

**参照**: Lines 385-530 の "ARC 104 Onwards" describe ブロック

---

#### Q2: モックデータファイルの存在状況

**結果**: ✅ Yes

- `src/test/lib/utils/test_cases/contest_table_provider.ts` は存在
- 複数のABC、ARC、Typical90等のモックデータが既に定義
- `taskResultsForARC104OnwardsProvider` がエクスポート済み

**参照**: Lines 1-151（以降も続く）で各コンテストタイプのデータ定義

---

#### Q3: AGC001OnwardsProvider の実装状況

**結果**: ✅ Yes

- `src/lib/utils/contest_table_provider.ts` Lines 287-310 に実装済み
- 実装内容:
  - `setFilterCondition()`: AGC001～AGC999のフィルタリング
  - `getMetadata()`: タイトル 'AtCoder Grand Contest 001 〜 '
  - `getContestRoundLabel()`: コンテスト名ラベル生成
  - ヘルパー関数 `parseContestRound()` で丸め処理

---

## 11. 実装完了記録

**実装日**: 2025-11-19

**テスト結果**: ✅ All tests passed (142 tests passed)

**実装時の学習**:

1. **モック設定の重要性**: テストファイルの`vi.mock()`セクションでは、被テストのコードが使用するすべての依存関数に対応する必要がある。AGC対応の際、モックに`classifyContest`と`getContestNameLabel`のAGC処理が不足していたため、フィルタリングが機能しなかった。

2. **複数パターン対応のテスト設計**: AGCは4/5/6/7問の4つのパターンを持つため、各パターンを個別にテストすることで、仕様変更に対応しやすいテストスイートを実現できた。モックデータ（agc001, agc002, agc009, agc028, agc073, agc074）を6つのコンテストで用意することで、パターンごとの検証が明確になった。

3. **ARC版との差分適用**: ARC104OnwardsProvider（2025-11-15計画）のテスト実装を参考にすることで、同様の構造のAGC001OnwardsProviderテストをスムーズに実装できた。既存実装パターンを活用することで、開発効率が大幅に向上した。

4. **テスト駆動による品質確認**: 計画で指定された全要件（フィルタリング、メタデータ、displayConfig、4/5/6/7問パターン、ソート順序、エッジケース等）に対してテストを実装することで、実装の正確性を機械的に検証できた。

**成果物**:

- AGC001OnwardsProvider用モックデータ6パターン（33個のテスク）追加
- AGC001Onwards固有テスト18個追加（16個実装 + displayConfig・ラウンドラベル共通テスト）
- テストモック更新（classifyContest, getContestNameLabelにAGC対応追加）

**次ステップ**:

- 他のコンテストプロバイダー（例: ABC系列、Typical90など）への同様テスト実装をスケール
- テストカバレッジの継続的監視と改善
