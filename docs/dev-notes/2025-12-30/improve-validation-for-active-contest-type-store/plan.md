# ActiveContestTypeStore の初期化バグ修正計画

## 背景・動機

JOI（二次予選・予選・本選）の追加後、dev モードで以下エラーが発生：

```
Cannot read properties of undefined (reading 'getAllProviders')
at TaskTable.svelte:52:42
```

## 原因分析

### 根本原因

`ActiveContestTypeStore` のコンストラクタに**検証ロジックが不足**していたため、ローカルストレージに無効なキーが残存した場合に `undefined` を返す。

### 詳細

1. **旧コード（バグあり）**

   ```typescript
   constructor(defaultContestType: ContestTableProviderGroups = 'abcLatest20Rounds') {
     if (defaultContestType !== 'abcLatest20Rounds' || !this.storage.value) {
       this.storage.value = defaultContestType;
     }
   }
   ```

   - ローカルストレージの値が `contestTableProviderGroups` に存在するか検証していない
   - JOI 追加前の古いキーが残存すると、そのキーを返す → `undefined` になる

2. **影響範囲**
   - TaskTable コンポーネント内で `providerGroups.getAllProviders()` が呼び出せない
   - テーブルが表示されない

### 環境依存性

- **dev モード**：エラーが表示される
- **preview モード**：エラーがスキップまたは表示されない

## 対処方法

### 実装タスク

#### 1. `ActiveContestTypeStore` の修正 ✅

- コンストラクタで `isValidContestType()` メソッドを使用
- ローカルストレージの値が有効か検証
- 無効な場合はデフォルト値にリセット

**修正内容**

```typescript
constructor(defaultContestType: ContestTableProviderGroups = 'abcLatest20Rounds') {
  if (!this.isValidContestType(this.storage.value)) {
    this.storage.value = defaultContestType;
  }
}

private isValidContestType(contestType: ContestTableProviderGroups | null | undefined): boolean {
  return (
    contestType !== null &&
    contestType !== undefined &&
    Object.keys(contestTableProviderGroups).includes(contestType)
  );
}
```

#### 2. TaskTable コンポーネントの防御的修正 ✅

- `providerGroups` が `undefined` の場合に備え、オプショナルチェーン対応
- `providers` にフォールバック値を設定

**修正内容**

```typescript
let providerGroups: ContestTableProviderGroup | undefined = $derived(
  contestTableProviderGroups[activeContestType as ContestTableProviderGroups],
);
let providers = $derived(providerGroups?.getAllProviders() ?? []);
```

#### 3. テスト強化 ✅

`src/test/lib/stores/active_contest_type.svelte.test.ts` に以下ケースを追加：

- 正しいコンテストタイプの検証
- 無効なキーでの初期化 → デフォルト値へのリセット
- `null`/`undefined` での初期化
- カスタムデフォルト値での初期化
- 有効な値の保持

## 検証方法

### ユーザー向け対応

```bash
# ブラウザコンソールで実行
localStorage.removeItem('contest_table_providers');
```

### 開発者向け検証

```bash
# テスト実行
pnpm test:unit src/test/lib/stores/active_contest_type.svelte.test.ts

# dev モードで動作確認
pnpm dev
```

期待結果：

- dev モードでエラーが表示されない
- テーブルが正常に表示される
- テストが全て pass

## Q&A

**Q: なぜこのエラーが JOI 追加後に出現した？**
A: JOI 追加前のコードを使用していたユーザーのローカルストレージに古いコンテストタイプキーが保存されており、新しい `contestTableProviderGroups` に存在しないキーが返されたため。

**Q: preview モードで発生していないのはなぜ？**
A: dev モードのみ詳細なエラーが表示される仕様。実際には同じ状況だが、エラーハンドリングが緩い可能性がある。

**Q: 他のストアでも同じ問題が発生する可能性は？**
A: あり。ローカルストレージに依存するストアは同様の検証ロジック追加が推奨される。

## 関連リソース

- TaskTable.svelte
- active_contest_type.svelte.ts
- contest_table_provider.ts

## 教訓

1. **ストアの検証ロジックは必須**
   - ローカルストレージからの値は常に無効である可能性がある
   - コンストラクタで `isValidContestType()` 相当の検証を実装すべき

2. **UI層での防御的プログラミング**
   - ストアが `undefined` を返す可能性に備える
   - オプショナルチェーン（`?.`）とフォールバック値（`??`）を活用

3. **テストにおけるモック管理**
   - `beforeEach` で共有オブジェクト（`mockStorage`）を完全にクリアする
   - 新規インスタンス作成時の初期化を厳密にテストする
