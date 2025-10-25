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
