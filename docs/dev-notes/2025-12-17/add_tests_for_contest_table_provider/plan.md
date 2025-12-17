# ACLPracticeProvider 単体テスト追加計画

**作成日**: 2025-12-17

**対象ブランチ**: #2962

**優先度**: High

---

## 概要

`ACLPracticeProvider`（AtCoder Library Practice Contest）に対する単体テストを追加する計画。

**対象ファイル**:

- **Provider実装**: [`src/lib/utils/contest_table_provider.ts`](../../../../../src/lib/utils/contest_table_provider.ts)
  - `ACLPracticeProvider` (773行目～)
- **テストファイル**: [`src/test/lib/utils/contest_table_provider.test.ts`](../../../../../src/test/lib/utils/contest_table_provider.test.ts)
- **テストケースファイル**: [`src/test/lib/utils/test_cases/contest_table_provider.ts`](../../../../../src/test/lib/utils/test_cases/contest_table_provider.ts)

**参照ドキュメント**:

- [`docs/dev-notes/2025-12-11/add_tests_for_contest_table_provider/plan.md`](../../2025-12-11/add_tests_for_contest_table_provider/plan.md) - ABSProvider テスト設計パターンの参考
- [`prisma/tasks.ts`](../../../../../prisma/tasks.ts) - practice2 及び各問題のタスク定義
- [`src/lib/utils/contest.ts`](../../../../../src/lib/utils/contest.ts) - contest_id 'practice2' → ContestType.ACL_PRACTICE の判別ロジック

---

## ACLPracticeProvider の仕様と特徴

### 基本情報

- **名称**: AtCoder Library Practice Contest
- **contest_id**: `'practice2'`
- **ContestType**: `ContestType.ACL_PRACTICE`

### 問題構成

ACL Practice は高度なアルゴリズム技法を学ぶための教育的コンテンツで、**12問**で構成されている：

| 問題番号 | task_id     | 難易度 | problem_index |
| -------- | ----------- | ------ | ------------- |
| 1        | practice2_a | Q3     | A             |
| 2        | practice2_b | Q1     | B             |
| 3        | practice2_c | D2     | C             |
| 4        | practice2_d | D2     | D             |
| 5        | practice2_e | D3     | E             |
| 6        | practice2_f | D2     | F             |
| 7        | practice2_g | D2     | G             |
| 8        | practice2_h | D2     | H             |
| 9        | practice2_i | D2     | I             |
| 10       | practice2_j | D1     | J             |
| 11       | practice2_k | D2     | K             |
| 12       | practice2_l | D2     | L             |

**重要な特徴**:

- **単一コンテスト由来**: すべての問題が同じコンテスト 'practice2' に属する（複数コンテスト由来の問題はない）
- **難易度順**: A～L の順序が段階的難易度を表している
- **contest_idの統一**: すべての問題のcontest_idは'practice2'で統一される

### ディスプレイ設定

ACLPracticeProviderは EDPCProvider と同じ設定を持つ：

```typescript
{
  isShownHeader: false,         // ヘッダーを非表示
  isShownRoundLabel: false,     // ラウンドラベルを非表示
  isShownTaskIndex: true,       // タスクインデックスを表示
  tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
  roundLabelWidth: '',          // ラウンドラベル幅なし
}
```

---

## テスト設計

### テストファイル配置

**ファイル**: `src/test/lib/utils/contest_table_provider.test.ts`

**配置**: 「JOI First Qual Round provider」セクションの直前（1981行目付近）

### テストデータ構築

#### テストケースファイルでの準備

`src/test/lib/utils/test_cases/contest_table_provider.ts`に以下を追加：

```typescript
/**
 * Test data for ACLPracticeProvider (AtCoder Library Practice Contest)
 * 12 problems with progressive difficulty, problem_index from A to L
 * Test data includes varied submission statuses:
 */
export const taskResultsForACLPracticeProvider: TaskResults = [
  createContestTasksForACLPractice('practice2_a', 'practice2', 'A', AC),
  createContestTasksForACLPractice('practice2_b', 'practice2', 'B', AC),
  createContestTasksForACLPractice('practice2_c', 'practice2', 'C', AC_WITH_EDITORIAL),
  createContestTasksForACLPractice('practice2_d', 'practice2', 'D', AC_WITH_EDITORIAL),
  createContestTasksForACLPractice('practice2_e', 'practice2', 'E', TRYING),
  createContestTasksForACLPractice('practice2_f', 'practice2', 'F', AC_WITH_EDITORIAL),
  createContestTasksForACLPractice('practice2_g', 'practice2', 'G', AC_WITH_EDITORIAL),
  createContestTasksForACLPractice('practice2_h', 'practice2', 'H', TRYING),
  createContestTasksForACLPractice('practice2_i', 'practice2', 'I', TRYING),
  createContestTasksForACLPractice('practice2_j', 'practice2', 'J', AC),
  createContestTasksForACLPractice('practice2_k', 'practice2', 'K', PENDING),
  createContestTasksForACLPractice('practice2_l', 'practice2', 'L', AC_WITH_EDITORIAL),
];

function createContestTasksForACLPractice(
  taskId: string,
  contestId: string,
  taskTableIndex: string,
  statusName: string,
): TaskResult {
  return createTaskResultWithTaskTableIndex(contestId, taskId, taskTableIndex, statusName);
}
```

### テストケース詳細

#### テスト1.1: フィルタリング（contest_id検証）

contest_id='practice2' のタスクのみをフィルタリングすることを確認。

```typescript
test('expects to filter tasks with contest_id "practice2"', () => {
  const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
  const mixed = [
    { contest_id: 'practice2', task_id: 'practice2_a', task_table_index: 'A' },
    { contest_id: 'practice2', task_id: 'practice2_l', task_table_index: 'L' },
    { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
    { contest_id: 'abc123', task_id: 'abc123_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResults);

  expect(filtered).toHaveLength(2);
  expect(filtered.every((task) => task.contest_id === 'practice2')).toBe(true);
});
```

#### テスト1.2: コンテストタイプ判別

ContestType.ACL_PRACTICE のみをフィルタリングすることを確認。

```typescript
test('expects to filter only ACL_PRACTICE-type contests', () => {
  const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
  const mixed = [
    { contest_id: 'practice2', task_id: 'practice2_a', task_table_index: 'A' },
    { contest_id: 'dp', task_id: 'dp_a', task_table_index: 'A' },
    { contest_id: 'abc378', task_id: 'abc378_a', task_table_index: 'A' },
  ];

  const filtered = provider.filter(mixed as TaskResults);

  expect(filtered).toHaveLength(1);
  expect(filtered[0].contest_id).toBe('practice2');
});
```

#### テスト1.3: メタデータ取得

```typescript
test('expects to return correct metadata', () => {
  const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
  const metadata = provider.getMetadata();

  expect(metadata.title).toBe('AtCoder Library Practice Contest');
  expect(metadata.abbreviationName).toBe('aclPractice');
});
```

#### テスト1.4: ディスプレイ設定確認

ディスプレイ設定が ACL Practice 固有の値であることを確認。

```typescript
test('expects to return correct display config with ACL Practice-specific settings', () => {
  const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
  const config = provider.getDisplayConfig();

  expect(config.isShownHeader).toBe(false);
  expect(config.isShownRoundLabel).toBe(false);
  expect(config.isShownTaskIndex).toBe(true);
  expect(config.tableBodyCellsWidth).toBe(
    'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
  );
  expect(config.roundLabelWidth).toBe('');
});
```

#### テスト1.5: ラウンドラベルフォーマット

ACL Practice ではラウンドラベルが空文字列で返されることを確認。

```typescript
test('expects to return empty string for contest round label', () => {
  const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);

  expect(provider.getContestRoundLabel('practice2')).toBe('');
});
```

#### テスト1.6: テストケースデータ検証

準備されたテストケースデータが正しく構成されていることを確認。

```typescript
test('expects test data to have 12 tasks with correct properties', () => {
  expect(taskResultsForACLPracticeProvider).toHaveLength(12);
  expect(taskResultsForACLPracticeProvider.every((task) => task.contest_id === 'practice2')).toBe(
    true,
  );

  const expectedIndices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const actualIndices = taskResultsForACLPracticeProvider.map((task) => task.task_table_index);

  expect(actualIndices).toEqual(expectedIndices);
});
```

#### テスト1.7: フィルタリング統合テスト

実際のテストケースデータを使用して、フィルタリング機能を検証。

```typescript
test('expects to filter test data correctly', () => {
  const provider = new ACLPracticeProvider(ContestType.ACL_PRACTICE);
  const allTasks = [...taskResultsForACLPracticeProvider, ...someOtherContestTasks];

  const filtered = provider.filter(allTasks);

  expect(filtered).toHaveLength(12);
  expect(filtered).toEqual(taskResultsForACLPracticeProvider);
});
```

---

## 実装ステップ

### ステップ 1: テストケースデータの追加

`src/test/lib/utils/test_cases/contest_table_provider.ts` に以下を追加：

1. `taskResultsForACLPracticeProvider` 定数の定義
2. `createContestTasksForACLPractice` ヘルパー関数の定義

### ステップ 2: テストケースのエクスポート

`src/test/lib/utils/test_cases/contest_table_provider.ts` のエクスポート一覧に `taskResultsForACLPracticeProvider` を追加

### ステップ 3: テストスイートの追加

`src/test/lib/utils/contest_table_provider.test.ts` に以下を追加：

1. インポート文に `taskResultsForACLPracticeProvider` を追加
2. 「JOI First Qual Round provider」セクションの直前に「ACL Practice Provider」セクションを追加
3. 上記のテストケース（1.1～1.7）を実装

### ステップ 4: テスト実行と検証

```bash
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts
```

すべてのテストが PASSすることを確認

---

## 注記

- テストケースのステータス分布は現実的な使用パターンを反映：初期問題は解けているが、高度な問題は挑戦中
- ACLPracticeProvider は EDPCProvider と同じ表示設定を共有するため、比較的シンプルなテスト設計が可能
- テストは JOI First Qual Round provider の前に配置されることで、テストスイートの論理的な順序を保つ

---

## 実装後の教訓

### ✅ 実装完了

- **テスト結果**: 203/203 PASS ✅
- テストケースデータ追加 + テストスイート実装完了

### 📌 重要な学習ポイント

#### 1. **モック関数の漏れは必ず発生する** ⚠️

- `classifyContest` モックに `practice2` → `ContestType.ACL_PRACTICE` を忘れずに追加すること
- **毎回チェックリスト**:
  - [ ] 新しい contest_id に対応するモック処理を追加したか
  - [ ] テストデータの contest_id とモックの対応が一致しているか
  - [ ] 初回実行で失敗した場合、モック定義を最優先で確認すること

#### 2. **既存ヘルパー関数の活用**

- `createContestTasks` 関数を使用することで、テストデータの一貫性を維持
- 手動で TaskResult を構築するより、ヘルパー関数を優先する

#### 3. **統合テストの重要性**

- 単体テスト（個別コンテスト）だけでなく、同一問題で複数コンテストが混在するテストも必須
- フィルタリングの正確性確保には、他のコンテストデータとの組み合わせが効果的

#### 4. **テスト配置の順序**

- 新しいテストスイートは既存のセクション構成を考慮して配置
- 論理的な順序（年代順・難易度順など）を保つことで保守性が向上
