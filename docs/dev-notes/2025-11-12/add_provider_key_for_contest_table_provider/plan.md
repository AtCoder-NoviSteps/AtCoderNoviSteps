````markdown
# ContestTableProviderBase へのプロバイダーキー機能追加計画

**作成日**: 2025-11-12

**対象ファイル**:

- `src/lib/utils/contest_table_provider.ts`
- `src/test/lib/utils/contest_table_provider.test.ts`

**優先度**: High

---

## 1. 概要

### 背景

現在の `ContestTableProviderGroup` では、`ContestType` をキーとして Provider を管理しているため、同じ `ContestType` で複数の異なるテーブル（例：Tessoku Book の例題・応用・力試し）を持つことができません。

### 目的

- 同じ `ContestType` で複数のセクション（'examples', 'practicals', 'challenges'）を区別できる設計に改善
- Provider 自身に ID 管理責務を持たせ、関心の分離を徹底
- 後方互換性を維持しつつ、拡張性を確保

### 実装方針

`static createProviderKey()` メソッドで キー生成ロジックを一元化し、Provider 自身が `getProviderKey()` で自分の識別子を返すようにする。

---

## 2. 仕様要件

| 項目                          | 仕様                                                                     | 備考                               |
| ----------------------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| **キー型**                    | `type ProviderKey = \`${ContestType}\` \| \`${ContestType}::${string}\`` | TypeScript テンプレートリテラル型  |
| **セクション識別子**          | 'examples', 'practicals', 'challenges'                                   | 現在は TessokuBook のみ            |
| **getProviderKey() アクセス** | protected                                                                | ContestTableProviderGroup 内部のみ |
| **後方互換性**                | getProvider(contestType) で section 未指定時は複合キーなしで取得         | 既存コード変更なし                 |

---

## 3. 変更対象

### 3.1 ContestTableProviderBase クラス

#### 追加メンバー

```typescript
// クラスプロパティ
protected readonly section?: string;

// static メソッド
static createProviderKey(contestType: ContestType, section?: string): string {
  return section ? `${contestType}::${section}` : `${contestType}`;
}

// インスタンスメソッド（protected）
protected getProviderKey(): string {
  return ContestTableProviderBase.createProviderKey(this.contestType, this.section);
}
```

#### コンストラクタ修正

```typescript
constructor(contestType: ContestType, section?: string) {
  this.contestType = contestType;
  this.section = section;
}
```

#### 制約

- `contestType` は `readonly` に変更
- `section` は `readonly` に変更

---

### 3.2 Tessoku Book プロバイダー修正

#### TessokuBookForExamplesProvider

```typescript
constructor(contestType: ContestType) {
  super(contestType, 'examples');
}
```

#### TessokuBookForPracticalsProvider

```typescript
constructor(contestType: ContestType) {
  super(contestType, 'practicals');
}
```

#### TessokuBookForChallengesProvider

```typescript
constructor(contestType: ContestType) {
  super(contestType, 'challenges');
}
```

---

### 3.3 ContestTableProviderGroup クラス

#### Map キー型を変更

```typescript
private providers = new Map<string, ContestTableProviderBase>();
```

#### addProvider() メソッド修正

```typescript
addProvider(provider: ContestTableProviderBase): this {
  const key = provider['getProviderKey']();
  this.providers.set(key, provider);

  return this;
}
```

**注**: `protected` メソッドへのアクセスのため、角括弧表記を使用

#### addProviders() メソッド修正

```typescript
addProviders(...providers: ContestTableProviderBase[]): this {
  providers.forEach((provider) => {
    const key = provider['getProviderKey']();
    this.providers.set(key, provider);
  });
  return this;
}
```

#### getProvider() メソッド修正（後方互換性維持）

```typescript
getProvider(
  contestType: ContestType,
  section?: string,
): ContestTableProviderBase | undefined {
  const key = ContestTableProviderBase.createProviderKey(contestType, section);
  return this.providers.get(key);
}
```

---

### 3.4 prepareContestProviderPresets() 修正

#### TessokuBook プリセット

```typescript
TessokuBook: () =>
  new ContestTableProviderGroup(`競技プログラミングの鉄則`, {
    buttonLabel: '競技プログラミングの鉄則',
    ariaLabel: 'Filter Tessoku Book',
  }).addProviders(
    new TessokuBookForExamplesProvider(ContestType.TESSOKU_BOOK),
    new TessokuBookForPracticalsProvider(ContestType.TESSOKU_BOOK),
    new TessokuBookForChallengesProvider(ContestType.TESSOKU_BOOK),
  ),
```

**変更点**: 引数形式から `ContestTableProviderBase` インスタンスへ直接変更

---

## 4. テスト計画

### 4.1 追加・修正するテスト

**参照**: `docs/dev-notes/2025-11-03/add_tests_for_contest_table_provider/plan.md`

#### TessokuBook 関連テスト

- ✅ TessokuBookForExamplesProvider の getProviderKey() = 'TESSOKU_BOOK::examples'
- ✅ TessokuBookForPracticalsProvider の getProviderKey() = 'TESSOKU_BOOK::practicals'
- ✅ TessokuBookForChallengesProvider の getProviderKey() = 'TESSOKU_BOOK::challenges'
- ✅ 3 つの Provider を同時登録できるか検証

#### ContestTableProviderGroup 関連テスト

- ✅ addProvider() で Provider 自身の getProviderKey() を使用
- ✅ addProviders() で複数 Provider の複合キーを別々に登録
- ✅ getProvider(ContestType.TESSOKU_BOOK, 'examples') で正しく取得
- ✅ getProvider(ContestType.TESSOKU_BOOK, 'practicals') で正しく取得
- ✅ getProvider(ContestType.TESSOKU_BOOK, 'challenges') で正しく取得
- ✅ getProvider(ContestType.TESSOKU_BOOK) で section 未指定時は complex key なしで検索（後方互換性）

### 4.2 テスト実行

```bash
# 単体テスト実行
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts

# Lint チェック
pnpm lint src/lib/utils/contest_table_provider.ts
pnpm lint src/test/lib/utils/contest_table_provider.test.ts

# Format 確認
pnpm format src/lib/utils/contest_table_provider.ts
```

---

## 5. 実装手順（Todo リスト）

| #   | タスク                                 | 説明                                                                                                  | 依存 |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---- |
| 1   | **型定義追加**                         | `ProviderKey` 型を定義（テンプレートリテラル型）                                                      |      |
| 2   | **ContestTableProviderBase 修正**      | `section` プロパティ追加、`readonly` 指定、`static createProviderKey()` 追加、`getProviderKey()` 実装 | 1    |
| 3   | **Tessoku Book Provider 修正**         | 3 つの子クラスの constructor に section を追加                                                        | 2    |
| 4   | **ContestTableProviderGroup 修正**     | Map キー型変更、addProvider/addProviders/getProvider メソッド修正                                     | 2    |
| 5   | **prepareContestProviderPresets 修正** | TessokuBook プリセット の引数形式を変更                                                               | 3, 4 |
| 6   | **既存テスト確認**                     | 現在のテストが修正後も通るか検証                                                                      | 5    |
| 7   | **新規テスト追加**                     | 複合キー関連の新テストを 6～8 個追加                                                                  | 6    |
| 8   | **Lint & Format**                      | ESLint, Prettier で統一                                                                               | 7    |
| 9   | **最終検証**                           | 全テスト実行、coverage 確認                                                                           | 8    |

---

## 6. 教訓・参照ドキュメント

- **テストパターン**: TessokuBook テスト の構造を参照（`docs/dev-notes/2025-11-03/add_tests_for_contest_table_provider/plan.md`）

---

## 7. 注意点

### 実装時の留意事項

1. **protected メソッドへのアクセス**
   - `getProviderKey()` は protected なため、Group 内では `provider['getProviderKey']()` で呼び出す
   - TypeScript の暗黙の型チェックを通すため、角括弧表記が必須

2. **後方互換性**
   - `getProvider(contestType)` で section 未指定時、複合キーなしで検索
   - 既存の `getProvider(ContestType.ABC)` などの呼び出しが動作継続

3. **Prettier フォーマット**
   - 実装後は必ず `pnpm format` を実行
   - インデントは Tab、printWidth は 100

---

## 8. 完了チェックリスト

- [ ] 型定義 `ProviderKey` 追加完了
- [ ] ContestTableProviderBase クラス修正完了
- [ ] Tessoku Book 3 プロバイダー修正完了
- [ ] ContestTableProviderGroup 修正完了
- [ ] prepareContestProviderPresets 修正完了
- [ ] 既存テスト全て通過
- [ ] 新規テスト 6～8 個追加完了
- [ ] Lint エラーなし
- [ ] Format 統一完了
- [ ] 最終テスト実行 & coverage 確認完了

---

## 9. 実装完了報告

**実施日**: 2025-11-12

### 実施内容

すべてのタスク（1～9）を完了しました。

### 主な成果

1. **ProviderKey 型定義**: テンプレートリテラル型 `ProviderKey = \`${ContestType}\` | \`${ContestType}::${string}\`` を定義
2. **ContestTableProviderBase 拡張**: `section` プロパティ、`static createProviderKey()`、`protected getProviderKey()` を追加
3. **Tessoku Book プロバイダー強化**: 3 つの子クラスに section パラメータを追加（'examples', 'practicals', 'challenges'）
4. **ContestTableProviderGroup 再設計**: Map キーを文字列に変更し、複合キーに対応
5. **API 統一化**: `addProvider(provider)`, `addProviders(...providers)`, `getProvider(contestType, section?)` の新シグネチャに統一
6. **後方互換性維持**: 既存コード（`getProvider(contestType)` のセクション省略）は引き続き動作

### テスト結果

- **全テスト実行結果**: 1,646 テスト合格（1 スキップ）
- **contest_table_provider.test.ts**: 105 テスト合格
- **新規テスト追加**: 複合キー機能に関する 7 個の新テスト追加

### コード品質

- **Prettier**: フォーマット完了（Tab インデント、printWidth 100）
- **ESLint**: 警告なし（設定ファイル互換性警告のみ）
- **型安全性**: TypeScript strict mode で検証済み

---

## 10. 教訓

### 実装パターン

1. **ProviderKey 型の活用**: `type ProviderKey = \`${ContestType}\` | \`${ContestType}::${string}\`` でテンプレートリテラル型を定義し、メソッドの戻り値型として使用することで型安全性を向上
2. **保護メソッドの外部アクセス**: Protected メソッドへの外部アクセスは角括弧表記 `provider['getProviderKey']()` で実装
3. **複合キー設計**: 単純キー（ContestType）と複合キー（ContestType + section）の併存は後方互換性を損なわず拡張性を確保
4. **静的ファクトリメソッド**: `createProviderKey()` を static メソッドで共通化することで、キー生成ロジックの一元管理を実現

### テスト戦略

1. **複合キー検証**: 複数 section を持つ Provider の登録・取得を個別テストで検証
2. **後方互換性テスト**: セクション省略時の動作も明示的にテスト
3. **ProviderKey 型確認**: テストでは戻り値の型を runtime で検証（string 型、`::` 区切り文字など）
4. **新規テスト構成**: 既存テスト 98 個 + 新規テスト 7 個 = 合計 105 テスト

### 開発効率

- **段階的実装**: 型定義 → ベースクラス → 子クラス → Group クラス → プリセット の順序で実装することで、依存関係を最小化
- **型安全性と実用性のバランス**: TypeScript のテンプレートリテラル型で型安全性を確保しつつ、runtime では string として柔軟に操作

---

**状態**: ✅ 完了（ProviderKey 型を活用）
````
