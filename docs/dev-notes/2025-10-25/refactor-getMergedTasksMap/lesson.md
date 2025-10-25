# getMergedTasksMap のリファクタリング教訓

## 学習内容

### 1. **参照 vs コピー**

TypeScript（JavaScript）の `const newTask = task;` は参照をコピーするため、`newTask` を変更すると元の `task` も変更されます。

- **浅いコピー**: `const newTask = { ...task };`
- **深いコピー**: `const newTask = JSON.parse(JSON.stringify(task));`

### 2. **TypeScript らしいコード書き方**

- `map()` で初期化: `new Map(tasks.map(task => [task.task_id, task]))`
- ループではなく関数型メソッド (`filter()`, `map()`, `flatMap()`)
- スプレッド演算子で Map をマージ: `new Map([...map1, ...map2])`

### 3. **`flatMap()` vs `map()`**

`flatMap()` は返した配列を1段階フラット化するため、条件付きの可変長結果に最適：

```typescript
// flatMap で条件分岐を自然に表現
.flatMap((pair) => {
  if (!task || !contestType) return [];
  return [createMergedTask(...)];
});
// 結果: 該当する要素だけが含まれる
```

### 4. **読みやすさ > 1行でまとめる**

無理やり `return` や1行で書く必要はない：

- 複雑な条件は `if` 文で早期リターン
- オブジェクト生成は `key` と `value` を分けて記述
- 難しいロジックはヘルパー関数に抽出

### 5. **計算量の分析**

- 全体: **O(N + M)** （N: タスク数、M: ペア数）
- `Map.has()`, `Map.get()` は **O(1)** なのでループ内で複数回呼んでもOK

### 6. **ドキュメント化のポイント**

- 関数の目的と副作用を明確に
- **計算量と根拠** を記載
- **使用例** を `@example` で示す
- 戻り値の構造を詳しく説明

## コード例（改善版）

src/lib/services/tasks.ts を参照

## キーポイント

- ✅ 非破壊的な変更（スプレッド演算子）
- ✅ 関数型パラダイム（`filter()`, `flatMap()` 使用）
- ✅ 早期リターンで複雑さを減らす
- ✅ ヘルパー関数で責任分離
- ✅ 明確なドキュメント化

---

# createContestTaskPairKey のテスト設計教訓

## テスト作成で学んだこと

### 1. **ヘルパー関数で重複削減**

同じパターンのテストコードは **ヘルパー関数** に抽出：

```typescript
// ❌ Before: 重複が多い
const key1 = createTestKey(pair);
const key2 = createTestKey(pair);
expect(key1).toBe(key2);

// ✅ After: ヘルパー関数化
const expectKeysToBeConsistent = (pair: TestPair): void => {
  const key1 = createTestKey(pair);
  const key2 = createTestKey(pair);
  expect(key1).toBe(key2);
};
expectKeysToBeConsistent(pair);
```

### 2. **パラメタライズテスト（test.each）で 4 個 → 1 個に**

4 つの似たテストは `test.each()` で 1 つにまとめる：

```typescript
// ❌ Before: 4 つのテスト関数
test('expects empty contest_id to throw an error', () => { ... });
test('expects empty task_id to throw an error', () => { ... });
test('expects whitespace-only contest_id to throw an error', () => { ... });
test('expects whitespace-only task_id to throw an error', () => { ... });

// ✅ After: 1 つのパラメタライズテスト
test.each<[string, string, string]>([
  ['', 'abc123_a', 'contestId must be a non-empty string'],
  ['   ', 'abc123_a', 'contestId must be a non-empty string'],
  ['abc123', '', 'taskId must be a non-empty string'],
  ['abc123', '   ', 'taskId must be a non-empty string'],
])('expects error when contest_id="%s" and task_id="%s"', (contestId, taskId, expectedError) => {
  expect(() => createContestTaskPairKey(contestId, taskId)).toThrow(expectedError);
});
```

### 3. **テストデータを集約して保守性向上**

テストデータを `pairs` オブジェクトで一元管理：

```typescript
const pairs = {
  normal: [...],    // 正常系ケース
  edge: [...],      // エッジケース
  anomaly: [...],   // 異常系ケース
};
```

### 4. **テストカバレッジの考え方**

- **正常系**: 期待通りに動くか
- **エッジケース**: 空文字列、ホワイトスペース、長い文字列
- **異常系**: 特殊文字、Unicode、改行、タブ
- **キー検証**: フォーマット、一意性、可逆性

### 5. **べストプラクティス**

| 改善内容             | 効果                 |
| -------------------- | -------------------- |
| ヘルパー関数化       | コード重複 -40%      |
| パラメタライズテスト | テスト関数数 削減    |
| テストデータ集約     | 保守性向上           |
| beforeEach で初期化  | テスト間の独立性確保 |

## テスト統計

- **総テスト数**: 27 個（全成功 ✅）
- **パラメタライズテスト**: 2 グループ（合計 8 ケース）
- **ヘルパー関数**: 5 個
- **テストデータセット**: 3 グループ（normal, edge, anomaly）
