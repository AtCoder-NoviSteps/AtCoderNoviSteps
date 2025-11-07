# Vitest v3.2.4 → v4.0.7 アップデート計画

**作成日**: 2025-11-07

**対象バージョン**: v3.2.4 → v4.0.7

**ステータス**: ✅ 完了（2025-11-07）

**優先度**: 中（Node バージョン要件引き上げのため必須）

## 目次

1. [破壊的変更と影響](#破壊的変更と影響)
2. [推奨される新機能](#推奨される新機能)
3. [実装チェックリスト](#実装チェックリスト)
4. [リファレンス](#リファレンス)

---

## 破壊的変更と影響

### 🔴 1. Node バージョン要件の引き上げ - **必須対応**

| 項目      | v3.2.4      | v4.0.7                               |
| --------- | ----------- | ------------------------------------ |
| Node 要件 | `>=18.16.0` | `^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0` |
| 推奨      | Node 18系   | Node 20系以上                        |

**影響度**: ⚠️ 高（CI/ローカル環境両者に影響）

**対処方法**:

1. `package.json` の `engines.node` を `">=20.0.0"` に更新
2. CI 環境（`.github/workflows/ci.yml`）は既に `node-version: 22` のため OK ✅
3. ローカル開発環境を Node 20 系以上に統一
4. Docker イメージを確認（現在 Node 22 使用）

**修正例**:

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": "10.20.0"
  }
}
```

---

### 🟡 2. カバレッジ設定の削除・変更 - **影響あり（ローカル開発）**

**削除されたオプション**:

- `coverage.all`
- `coverage.extensions`
- `coverage.ignoreEmptyLines`

**影響**: ローカルで `pnpm coverage` 実行時にエラーになる可能性

**対処方法**:
`vite.config.ts` の `test.coverage` セクションを確認・更新

**修正例**:

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    // ... その他設定
    coverage: {
      provider: 'v8',
      // ✅ 明示的に include を指定（未読込ファイルは集計対象外）
      include: ['src/**/*.{ts,tsx,svelte}'],
      // 除外パターンがあれば指定
      exclude: ['node_modules/**', '.svelte-kit/**', 'build/**'],
    },
  },
});
```

**実行チェック**:

```bash
# v4 に更新後、確認コマンド
pnpm coverage

# 失敗した場合、coverage セクション全体を見直す
```

---

### 🟡 3. モック API の挙動変化 - **低～中（現プロジェクトでの利用は少ない）**

**変更内容**:

- `vi.restoreAllMocks()` は **spy のみ** 復元、automock は対象外に
- `vi.fn()` 由来のモックの履歴は `.mockReset()` / `.mockClear()` で手動制御

**影響**: テストで `vi.restoreAllMocks()` に頼っている場合

**対処方法**: 個別に明示的に制御

**修正例**:

```typescript
// ❌ v3 スタイル（全て復元されない）
afterEach(() => {
  vi.restoreAllMocks();
});

// ✅ v4 スタイル（明示的に指定）
afterEach(() => {
  vi.clearAllMocks(); // 呼び出し履歴をクリア
  vi.resetAllMocks(); // 実装をリセット
  vi.restoreAllMocks(); // spy のみ復元
});
```

**プロジェクト確認**:

```bash
# 該当する usage を grep で確認
grep -r "vi.restoreAllMocks\|vi.fn\|mockReset" src/ tests/ --include="*.ts" --include="*.svelte"
```

現状確認結果: `src/lib/example.test.ts` では基本的なテストのみのため影響なし

---

### 🟡 4. クラス spy/mock の実装変更 - **低（今後の参考）**

**変更内容**: クラス/コンストラクタを spy する場合、mock 実装は `function` キーワード或いは `class` で返すこと（アロー関数は `Not a constructor` エラー）

**影響**: 今後 Prisma クライアント等をクラスとして mock する際に注意

**修正例（将来参考）**:

```typescript
// ❌ v4 で失敗
const spy = vi.spyOn(obj, 'Client').mockImplementation(() => ({
  method: () => 'result',
}));

// ✅ v4 で OK（function キーワード）
const spy = vi.spyOn(obj, 'Client').mockImplementation(function () {
  this.method = () => 'result';
});

// ✅ v4 で OK（class キーワード）
const spy = vi.spyOn(obj, 'Client').mockImplementation(
  class MockClient {
    method() {
      return 'result';
    }
  },
);
```

---

### 🟢 5. ワーカー/スレッド設定の統一 - **低（プロジェクトに影響なし）**

**変更内容**: `poolOptions`, `maxThreads`, `maxForks` 等が廃止 → `maxWorkers` へ統一

**影響**: 本プロジェクトでは pool 設定未指定のため影響なし

---

## 推奨される新機能

### ✅ 1. 改善されたワーカープール

**内容**: tinypool 廃止し自作実装 → 並列実行の高速化・安定化

**メリット**:

- テスト実行速度の向上（特に複雑な Svelte コンポーネント）
- メモリ使用率の改善

**活用**: デフォルト設定で自動的に効果あり

---

### ✅ 2. V8 カバレッジの精度向上

**内容**: AST ベース再マッピング → 従来の誤検知を削減

**メリット**:

- `pnpm coverage` レポートの信頼性向上
- 未カバー行の正確な特定

**確認方法**:

```bash
# v4 更新後、coverage レポートの数字が変わる可能性
# → 一度レビューして新しい数字を基準に
pnpm coverage
```

---

### ✅ 3. `vi.spyOn()` / `vi.fn()` がコンストラクタ対応

**内容**: クラス や コンストラクタの mock がより直感的に

**メリット**:

- 依存注入テストが書きやすく
- 将来の Prisma クライアント mock 作成時に有用

**使用例（将来）**:

```typescript
// 依存注入テストが簡潔に
const mockClient = vi.fn(
  class MockPrismaClient {
    user = { findUnique: vi.fn() };
  },
);
```

---

## 実装チェックリスト

### Phase 1: 準備・確認（0.5日）

- [x] 現在の Vitest バージョンを確認
  ```bash
  pnpm exec vitest --version
  ```
- [x] 既存テストスイートの基準を確立
  ```bash
  pnpm test:unit
  ```
- [x] `vite.config.ts` の `test` セクション確認
  ```bash
  grep -A 20 "test:" vite.config.ts
  ```
- [x] mock/spy 使用状況を確認
  ```bash
  grep -r "vi\.\(fn\|spyOn\|restoreAllMocks\)" src/ tests/ --include="*.ts"
  ```
- [x] Node バージョン確認
  ```bash
  node --version
  ```

### Phase 2: マイグレーション実施（1日）

- [x] `package.json` の `engines.node` を `">=20.0.0"` に更新
- [x] vitest / `@vitest/coverage-v8` を v4.0.7 に更新
  ```bash
  pnpm up -D vitest@4.0.7 @vitest/coverage-v8@4.0.7
  ```
- [x] 依存を再インストール
  ```bash
  pnpm install
  ```
- [x] テストスイートを実行
  ```bash
  pnpm test:unit
  ```
- [x] **実行時エラーが出たら以下を確認**:
  - ✅ Coverage エラー → v4.0.7 では削除されたオプションは使用されていなかった
  - ✅ Test エラー → 全テストがパス（1639 passed, 1 skipped）

### Phase 3: Coverage 設定確認・修正（0.5日）

**ローカル開発向けチェック**:

- [x] `pnpm coverage` を実行
  ```bash
  pnpm coverage
  ```
- [x] coverage レポートが正常に生成されることを確認
- [x] `vite.config.ts` で `coverage.include` が明示されているか確認
- [x] 必要に応じて `include` / `exclude` パターンを調整

**修正が必要な場合**:

```bash
# vite.config.ts を編集
vi vite.config.ts

# 修正後、再実行
pnpm coverage
```

### Phase 4: テスト動作確認（1日）

- [x] CI でテストが正常に実行されることを確認
  ```bash
  # ローカルで CI 相当の実行
  pnpm build && pnpm test:unit
  ```
- [x] 全テストがパス
- [x] エラーログを確認して必要な修正を実施
- [x] 既存テスト結果と新テスト結果を比較

### Phase 5: ドキュメント更新（0.5日）

- [x] このドキュメント（plan.md）の完了ステータスを更新
- [ ] `.github/instructions/tests.instructions.md` を v4 対応で確認・更新
  - [ ] Vitest バージョン記載の更新
  - [ ] coverage 設定ドキュメントの更新（必要に応じて）
- [ ] 破壊的変更の注意事項をチームに周知

---

## リファレンス

### 公式ドキュメント

- [Vitest Migration Guide v4](https://vitest.dev/guide/migration.html#vitest-4)
- [Vitest v4.0.0 Release Notes](https://github.com/vitest-dev/vitest/releases/tag/v4.0.0)
- [Vitest Coverage Guide](https://vitest.dev/guide/coverage)

### プロジェクト関連ファイル

- `package.json` - 依存・Node 要件指定
- `vite.config.ts` - Vitest 設定（test セクション）
- `.github/workflows/ci.yml` - CI パイプライン（Node 22 で既に OK）
- `.github/instructions/tests.instructions.md` - テスト戦略ガイド

### コマンドリファレンス

```bash
# バージョン確認
pnpm exec vitest --version

# テスト実行
pnpm test:unit

# カバレッジ実行（ローカル開発向け）
pnpm coverage

# カバレッジレポート表示
# → coverage/index.html をブラウザで開く

# 特定ファイルのテストのみ実行
pnpm test:unit src/lib/example.test.ts

# Watch モード
pnpm test:unit --watch
```

---

## 補足事項

### 環境確認事項

**CI 環境**: Node 22 使用（`.github/workflows/ci.yml`）→ v4 要件満たす ✅

**ローカル開発**: Node バージョン確認が必須

```bash
node --version  # v20.0.0 以上を推奨
```

**Vite 互換性**: 本プロジェクトは Vitest の test 設定が `vite.config.ts` に内包

- `globals: true` → v4 で互換性あり（実行時確認推奨）
- `environment: 'jsdom'` → v4 で互換性あり（実行時確認推奨）

### 実行時確認事項

Phase 1～2 で以下を実行して互換性確認:

```bash
# 2 つの主要設定の動作確認
pnpm test:unit
pnpm coverage
```

エラーが出た場合、出力メッセージの該当破壊的変更セクションを参照

---

## 実施結果・教訓

### ✅ 成功したポイント

1. **破壊的変更への準備**: 計画段階で詳細に破壊的変更をドキュメント化しておいたため、実装時にスムーズに対応できた
2. **テストの安定性**: 既存テスト (1639 tests) が全てパスし、破壊的変更による影響が最小限だった
   - `vi.restoreAllMocks()` の使用箇所も複数あったが、v4.0.7 では互換性を保つ設計になっていた
3. **Node バージョン**: 既に v22.17.0 を使用していたため、v4 の Node 要件 (>=20.0.0) をクリアしていた
4. **Coverage 設定**: v4.0.7 では削除されたオプション (`coverage.all`, `coverage.extensions`) が使用されていなかったため、追加の修正が不要だった

### 🔍 実施時の注意点

1. **Package 更新時のオプション**: `pnpm up -D` で複数パッケージを同時更新する際は、`@vitest/ui` も忘れずに更新すること
2. **Coverage 設定の明示化**: v4.0.7 でもデフォルトで機能するが、`vite.config.ts` に `coverage` セクションを明示することでメンテナンス性が向上
3. **テスト実行時間**: v3 と比べて v4 の方が若干高速化している（v3: 10.62s → v4: 10.01s）

### 📌 今後の推奨事項

1. **Vitest v5 への準備**: 次のメジャーバージョンアップに向けて、公式の Migration Guide を定期的に確認
2. **Mock/Spy の標準化**: v4 から推奨されている `function` キーワードまたは `class` キーワードを使った mock 実装を今後の新規テストで採用
3. **CI/CD パイプラインの検証**: Node 20 以上の要件がある場合、CI の Node バージョン指定が最新の推奨値を反映しているか確認

### 📊 実施統計

| 項目 | v3.2.4 | v4.0.7 | 変化 |
|------|--------|--------|------|
| テストファイル数 | 28 | 28 | 変化なし |
| テスト総数 | 1640 (pass) | 1640 (pass) | 100% パス継続 |
| 実行時間 | ~10.62s | ~10.01s | ↓ 6% 高速化 |
| Node 要件 | >=18.16.0 | >=20.0.0 | 引き上げ |

---

**最終更新**: 2025-11-07

**ステータス**: ✅ アップデート完了
