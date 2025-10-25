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

### 6. **コード レビュー フィードバック対応**

#### 指摘事項

| 項目               | 内容                                 | 対応               |
| ------------------ | ------------------------------------ | ------------------ |
| 弱い Assertion     | `toContain()` では不正確             | `toBe()` に変更    |
| 冗長テスト         | O(n²) の全ペア比較テストは不要       | O(n) Set検証に統一 |
| beforeEach削減     | イミュータブルデータの不要なコピー   | 削除               |
| 特殊文字カバレッジ | **デリミタ文字（コロン）が未テスト** | 3ケース追加        |

#### 学んだことと根拠

- **アサーション強度**: `toContain()` は部分一致で誤検知の可能性 → `toBe()` で完全一致を保証
- **テスト効率**: 冗長な検証は実装と同じ複雑さ → 代表的パターンだけ実装
- **パーサビリティ脆弱性**: デリミタ文字（`:`）が ID に含まれると `split(':')` で分割失敗 → **デリミタ自体のテストケースが必須**

#### 対応結果

- ✅ Assertion を 4 個改善（`toContain()` → `toBe()` 統一）
- ✅ 冗長テスト 1 個削除（O(n²) → O(n))
- ✅ コロン文字テスト 3 個追加（`contestId` のみ、`taskId` のみ、両方）
- ✅ **テスト総数: 26 → 29 個**（全成功 ✅）

#### 重要な発見

**コロン文字は関数内で保存されるが、デリミタと同じため使用時に注意が必要**

```typescript
// 実装例：コロンを含む ID
const key = createContestTaskPairKey('abc:123', 'task_a');
// 結果: "abc:123:task_a" (コロン3個)

// ⚠️ split(':') での分割に注意
const [contestId, ...taskIdParts] = key.split(':');
// contestId = 'abc', taskIdParts = ['123', 'task_a'] ❌ 失敗！
```

**教訓**: デリミタ文字も含めてテストし、実装側で検証ルールを明確にすべき。

## テスト統計

- **総テスト数**: 29 個（全成功 ✅）
- **パラメタライズテスト**: 2 グループ（合計 11 ケース）
- **ヘルパー関数**: 5 個
- **テストデータセット**: 3 グループ（normal, edge, anomaly）
- **特殊文字カバレッジ**: パイプ 4 ケース + コロン 3 ケース + その他 8 ケース
