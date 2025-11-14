# ABC126ToABC211Provider テスト追加計画

**作成日**: 2025-11-14

**対象ブランチ**: #2830

**優先度**: High

---

## 参照ドキュメント

テストの書き方・スタイルについては、以下を参照：

📖 [`docs/dev-notes/2025-11-03/add_tests_for_contest_table_provider/plan.md`](../../2025-11-03/add_tests_for_contest_table_provider/plan.md)

---

## 実装チェックリスト

### 1. テスト設計 ✅

- [x] フィルタリングテスト（ABC126～211範囲内のみ抽出）
- [x] コンテストタイプ判別テスト（ABC型のみ）
- [x] メタデータ取得テスト
- [x] ディスプレイ設定テスト
- [x] ラウンドラベルフォーマットテスト
- [x] エッジケーステスト（空入力など）
- [x] 混合コンテストタイプ対応テスト

### 2. モックデータ準備

- [x] `src/test/lib/utils/test_cases/contest_table_provider.ts` に ABC126～211 データを追加
- [x] ABC126, ABC150, ABC211 の 3 コンテストでサンプルデータを作成
- [x] task_table_index は A, B, C, D, E, F に対応

### 3. テスト実装

- [x] 既存テスト（`ABC212ToABC318Provider` など）を参考に記述
- [x] `ABC126ToABC211Provider` をテストファイルにインポート
- [x] `describe.each()` に ABC126ToABC211Provider を追加（displayConfig 共通化）

### 4. テスト リファクタリング

- [x] `describe.each()` に ABC126ToABC211 を追加：displayConfig, label format, empty results テストを共通化
- [x] ABC126ToABC211 個別テストから重複テストを削除：5 個削除 → 4 個に削減

### 5. 実装後の検証

- [x] テスト実行: `pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts` → **115 テスト全てパス**
- [x] Lint チェック: `pnpm format` → **フォーマット完了**
- [x] 全テスト合格確認 → **✅ PASS**

---

## テスト仕様

### 対象プロバイダー

`ABC126ToABC211Provider`

### フィルタ範囲

- **最小**: ABC 126
- **最大**: ABC 211
- **対象数**: 86 コンテスト

### 表示設定

| 項目                  | 値                                                      |
| --------------------- | ------------------------------------------------------- |
| `isShownHeader`       | `true`                                                  |
| `isShownRoundLabel`   | `true`                                                  |
| `roundLabelWidth`     | `'xl:w-16'`                                             |
| `tableBodyCellsWidth` | `'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1'` |
| `isShownTaskIndex`    | `false`                                                 |

---

## 実装結果・教訓

### ✅ 実装完了

**実施時間**: 約 5 分（リファクタリング含む）

**実装内容**:

1. モックデータ追加: ABC126, ABC150, ABC211 の 3 コンテスト分（9 タスク）
2. `describe.each()` に ABC126ToABC211Provider を追加
3. ABC126ToABC211 個別テストから重複テストを削除（5→4）
4. テストコード削減: 39 行削除、DRY 原則に従う

### 📚 得られた教訓

1. **パラメータ化テストの活用**: `describe.each()` で同一構造のプロバイダーをシェアすることで、メンテナンス性向上とコード削減が実現。新規プロバイダー追加時は同じ表示設定を持つ場合、`describe.each()` への統合を検討すべき

2. **テスト重複の排除**: 共通テスト（displayConfig, label format, empty results）と固有テスト（フィルタリング範囲）の分離により、テストの意図が明確化され、保守が容易に

3. **プロバイダー設計の統一性**: ABC126～211 と ABC212～318 が同じ displayConfig を持つことは、プロバイダー実装の設計が一貫していることを示す。新規プロバイダー追加時は既存設計との整合性を確認することが重要

---

## 改善提案（実装完了）✅

### `describe.each()` パターンへの統合

**実施内容**:

`ABC126ToABC211Provider` を `describe.each()` に追加し、displayConfig などの共通テストをシェア。

**変更内容**:

```typescript
// 追加されたパラメータ
{
  providerClass: ABC126ToABC211Provider,
  label: '126 to 211',
  displayConfig: {
    roundLabelWidth: 'xl:w-16',
    tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1',
  },
},
```

**ABC126ToABC211 個別テストから削除**:

- `test('expects to get correct display configuration', ...)`
- `test('expects to format contest round label correctly', ...)`
- `test('expects to handle empty task results', ...)`
- `test('expects to generate correct table structure', ...)`
- `test('expects to get contest round IDs correctly', ...)`

**結果**: テストコード 39 行削減、テスト数 115（変わらず）、DRY 原則に従う構造へ改善
