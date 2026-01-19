# Zod 3.25.76 → 4.3.5 / sveltekit-superforms 2.27.4 → 2.29.1 アップデート計画

**作成日**: 2026-01-19

**対象バージョン**:

- Zod: 3.25.76 → 4.3.5（メジャーバージョンアップ）
- sveltekit-superforms: 2.27.4 → 2.29.1（マイナーバージョンアップ）

**ステータス**: ✅ 実装完了（デプロイ待ち）

---

## 目次

1. [背景](#背景)
2. [破壊的変更と影響](#破壊的変更と影響)
3. [実装戦略](#実装戦略)
4. [実装タスク](#実装タスク)
5. [テスト戦略](#テスト戦略)
6. [検証チェックリスト](#検証チェックリスト)
7. [参考資料](#参考資料)

---

## 背景

Zod 4 のリリース（2025年度後半）に伴い、sveltekit-superforms の対応化を検討。Zod 3 から 4 への移行は複数の破壊的変更が含まれるため、段階的なアップグレードを計画。

**期間**: 2025-06-04（Zod 4.0.0）～ 2026-01-19（最新版確認）

**対象**:

- `zod@3.25.76` → `zod@4.3.5`
- `sveltekit-superforms@2.27.4` → `sveltekit-superforms@2.29.1`

---

## 破壊的変更と影響

### 🔴 1. エラーカスタマイズ API の統一 - **HIGH IMPACT**

| 項目       | Zod 3                                   | Zod 4                     |
| ---------- | --------------------------------------- | ------------------------- |
| API形式    | `{ message: '...' }`                    | `{ error: '...' }`        |
| 削除機能   | `invalid_type_error` / `required_error` | 代替なし（`error`に統一） |
| `errorMap` | 名称変更なし                            | `error` に名称変更        |

**プロジェクトへの影響**:

- **ファイル数**: 1 ファイル（[src/lib/zod/schema.ts](src/lib/zod/schema.ts)）
- **変更箇所**: 15+ 箇所のエラーメッセージ定義
- **影響スキーマ**: `authSchema`, `accountSchema`, `accountTransferSchema`, `workBookSchema`, `workBookTaskSchema`

**実装例**:

```typescript
// ❌ Zod 3
z.string().min(3, { message: '3文字以上入力してください' });

// ✅ Zod 4
z.string().min(3, { error: '3文字以上入力してください' });
```

**対応方針**: 全て `{ error: '...' }` に統一（自動置換可能）

---

### 🔴 2. FormData parsing での default 値挙動変更 - **MEDIUM-HIGH IMPACT**

| パターン                                                           | Zod 3                       | Zod 4                                                  |
| ------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------ |
| `z.object({ a: z.string().default('tuna').optional() }).parse({})` | `{}`                        | `{ a: 'tuna' }`                                        |
| FormData で `urlSlug: ""` 送信                                     | 空文字が `undefined` に変換 | `.transform()` で `undefined` に変換（default 非適用） |

**プロジェクトへの影響**:

- **問題**: `urlSlug` フィールドの空文字列処理
- **現在の実装**: [src/lib/zod/schema.ts:75-89](src/lib/zod/schema.ts#L75-L89) で `.transform()` で `""` → `undefined` に変換
- **テスト**: [src/test/lib/zod/workbook_schema.test.ts](src/test/lib/zod/workbook_schema.test.ts) に以下テストあり:
  - ✅ `when an url slug is given an empty string` (line 123)
  - ✅ `when an url slug is given null` (line 133)
  - ✅ `when an url slug is given undefined` (line 143)

**対応方針**: テストの期待値確認 + `.transform()` 実装の継続

---

### 🟡 3. z.nativeEnum() の deprecation - **LOW-MEDIUM IMPACT**

| 変更内容                                               |
| ------------------------------------------------------ |
| `z.nativeEnum(WorkBookType)` → `z.enum()` への移行推奨 |

**プロジェクトへの影響**:

- **使用箇所**: [src/lib/zod/schema.ts:72](src/lib/zod/schema.ts#L72)
- **機能**: `workBookType: z.nativeEnum(WorkBookType)` として使用
- **動作**: Zod 4 でも機能するが、deprecated 警告が出る可能性

**対応方針**: 互換性維持（移行は v5 以降）

---

### 🟡 4. エラーマップ優先順位の変更 - **LOW-MEDIUM IMPACT**

| バージョン | 優先度                                     |
| ---------- | ------------------------------------------ |
| Zod 3      | `.parse()` のエラーマップ > スキーマレベル |
| Zod 4      | スキーマレベル > `.parse()` のエラーマップ |

**プロジェクトへの影響**:

- sveltekit-superforms が国際化エラーメッセージを処理している場合に影響
- 現在: **日本語のみ** → 国際化対応なし → **影響なし**

**対応方針**: 現時点では対応不要

---

### 🟢 5. 新機能: z.fromJSONSchema(), z.xor(), z.looseRecord(), .exactOptional() - **LOW IMPACT**

| 機能                 | 用途                                       |
| -------------------- | ------------------------------------------ |
| `z.fromJSONSchema()` | OpenAPI/JSON Schema から自動生成           |
| `z.xor()`            | 排他的 union（今後活用可能）               |
| `z.looseRecord()`    | 部分的バリデーション（今後活用可能）       |
| `.exactOptional()`   | 厳密オプショナル（`urlSlug` など活用可能） |

**対応方針**: アップグレード後に活用検討

---

## 実装戦略

### 段階的アップグレード（保守的アプローチ）

```
Phase 1: 事前準備
  ↓
Phase 2: Zod 4 アップグレード + コード修正
  ↓
  [単体テスト実行] ← テスト: ユニットテストのみ
  ↓
Phase 3: sveltekit-superforms アップグレード + adapter 切り替え
  ↓
  [統合テスト実行] ← テスト: ユニット + E2E テスト
  ↓
Phase 4: ローカル検証・デプロイ確認
```

**メリット**:

- 🔍 各フェーズの問題を切り分けやすい
- 📊 Zod の破壊的変更が明確に検出される
- ⚙️ adapter の互換性を確認してから切り替え

---

## 実装タスク

### 📋 Phase 1: 事前準備

- [x] スキーマ全体のバックアップ確認
  - 確認ファイル: [src/lib/zod/schema.ts](src/lib/zod/schema.ts)
  - エラーメッセージ数: 15+

- [x] FormData パース時の挙動テスト
  - テスト確認: [src/test/lib/zod/workbook_schema.test.ts](src/test/lib/zod/workbook_schema.test.ts)
  - 特にチェック: `urlSlug` の `""` / `null` / `undefined` テスト

---

### 📋 Phase 2: Zod 4 アップグレード

#### Step 2.1: パッケージアップグレード

- [x] `package.json` 更新
  - `zod@3.25.76` → `zod@4.3.5` に変更
  - 変更ファイル: [package.json](package.json)

- [x] 依存関係インストール

  ```bash
  pnpm install
  ```

  - 互換性エラー確認
  - `sveltekit-superforms@2.27.4` との互換性確認（まだ `zod` adapter は使用）

- [x] ビルド動作確認

  ```bash
  pnpm build
  ```

  - エラー確認
  - 型チェック確認

#### Step 2.2: スキーマコード修正

- [x] [src/lib/zod/schema.ts](src/lib/zod/schema.ts) のエラーメッセージ API 統一
  - `{ message: '...' }` → `{ error: '...' }` に統一
  - 対象: 全15+箇所
    - `authSchema` の `.min()` / `.max()` / `.regex()` (5 箇所)
    - `accountSchema` の `.min()` / `.max()` / `.regex()` (3 箇所)
    - `accountTransferSchema` の `.refine()` (1 箇所)
    - `workBookTaskSchema` の `.max()` (1 箇所)
    - `workBookSchema` の `.min()` / `.max()` / `.refine()` (6 箇所)

**修正例**:

```typescript
// Before (Zod 3)
z.string().min(3, { message: '3文字以上入力してください' });

// After (Zod 4)
z.string().min(3, { error: '3文字以上入力してください' });
```

#### Step 2.3: TypeScript 型チェック

- [x] TypeScript エラー確認

  ```bash
  pnpm check
  ```

  - 型推論エラー確認
  - 必要に応じた型修正

---

### 📋 Phase 3: sveltekit-superforms アップグレード

#### Step 3.1: パッケージアップグレード

- [x] `package.json` 更新
  - `sveltekit-superforms@2.27.4` → `sveltekit-superforms@2.29.1` に変更
  - 変更ファイル: [package.json](package.json#L60)

- [x] 依存関係インストール

  ```bash
  pnpm install
  ```

  - 互換性エラー確認
  - Zod 4 との互換性確認

- [x] ビルド動作確認

  ```bash
  pnpm build
  ```

  - エラー確認

#### Step 3.2: Adapter 切り替え

- [x] Adapter の `zod()` → `zod4()` 切り替え

  **対象ファイル**: 3 ファイル、計 6 箇所

  **ファイル 1**: [src/routes/workbooks/create/+page.server.ts](src/routes/workbooks/create/+page.server.ts)

  ```typescript
  // Before (Line 3, 27, 55)
  import { zod } from 'sveltekit-superforms/adapters';
  ...
  const form = await superValidate(null, zod(workBookSchema));
  const form = await superValidate(request, zod(workBookSchema));

  // After
  import { zod4 } from 'sveltekit-superforms/adapters';
  ...
  const form = await superValidate(null, zod4(workBookSchema));
  const form = await superValidate(request, zod4(workBookSchema));
  ```

  **ファイル 2**: [src/routes/workbooks/edit/[slug]/+page.server.ts](src/routes/workbooks/edit/[slug]/+page.server.ts)

  ```typescript
  // Before (Line 3, 24, 28)
  import { zod } from 'sveltekit-superforms/adapters';
  ...
  const form = await superValidate(null, zod(workBookSchema));
  const form = await superValidate(request, zod(workBookSchema));

  // After
  import { zod4 } from 'sveltekit-superforms/adapters';
  ...
  const form = await superValidate(null, zod4(workBookSchema));
  const form = await superValidate(request, zod4(workBookSchema));
  ```

  **ファイル 3**: [src/routes/(admin)/account_transfer/+page.server.ts](<src/routes/(admin)/account_transfer/+page.server.ts>)

  ```typescript
  // Before (Line 5, 32, 49)
  import { zod } from 'sveltekit-superforms/adapters';
  ...
  const form = await superValidate(null, zod(accountTransferSchema));
  const form = await superValidate(request, zod(accountTransferSchema));

  // After
  import { zod4 } from 'sveltekit-superforms/adapters';
  ...
  const form = await superValidate(null, zod4(accountTransferSchema));
  const form = await superValidate(request, zod4(accountTransferSchema));
  ```

- [x] TypeScript 型チェック

  ```bash
  pnpm check
  ```

  - 型推論エラー確認

---

## テスト戦略

### 📋 Phase 4: テスト実行（段階的）

#### Step 4.1: Phase 2 後のテスト（Zod 4 のみ）

- [x] ユニットテスト実行

  ```bash
  pnpm test:unit
  ```

  - **目的**: Zod 4 のスキーマテスト確認
  - **対象テスト**:
    - [src/test/lib/zod/workbook_schema.test.ts](src/test/lib/zod/workbook_schema.test.ts) (63 tests)
    - [src/test/lib/zod/auth_schema.test.ts](src/test/lib/zod/auth_schema.test.ts)
    - [src/test/lib/zod/account_transfer_schema.test.ts](src/test/lib/zod/account_transfer_schema.test.ts)
  - **特に確認**: `urlSlug` の `""` / `null` / `undefined` 挙動
  - **期待**: ✅ 全テスト合格（テスト修正不要の可能性が高い）

#### Step 4.2: Phase 3 後のテスト（Zod 4 + superforms 2.29.1）

- [x] ユニットテスト再実行

  ```bash
  pnpm test:unit
  ```

  - **目的**: adapter 切り替え後のスキーマテスト再確認
  - **期待**: ✅ 全テスト合格

- [x] E2E テスト実行

  ```bash
  pnpm test:integration
  ```

  - **目的**: フロントエンド・フォーム送信の実装確認
  - **対象テスト**:
    - `tests/signin.test.ts` - ログイン・ログアウト
    - `tests/toppage.test.ts` - トップページ
    - その他 E2E テスト
  - **特に確認**: 問題集作成・編集フロー
  - **期待**: ✅ 全テスト合格

#### Step 4.3: フルテストスイート

- [x] 統合テスト実行

  ```bash
  pnpm test
  ```

  - **目的**: 全テストの最終確認
  - **構成**: `pnpm test:integration && pnpm test:unit`
  - **期待**: ✅ 全テスト合格

---

### 📋 Phase 5: ローカル検証・デプロイ確認

#### Step 5.1: ローカル環境確認

- [x] ローカル dev 環境起動

  ```bash
  pnpm dev
  ```

  - **確認項目**:
    - サーバー起動時エラー確認
    - ホットリロード動作確認
    - ブラウザコンソールエラー確認

- [x] UI 検証
  - 問題集作成画面にアクセス
  - フォーム送信（有効な入力値）
  - エラーメッセージ表示（無効な入力値）
  - 日本語エラーメッセージが表示されることを確認

- [x] ユーザー名が 3 文字未満の場合
  ```
  入力: "ab"
  期待: "3文字以上入力してください" (Zod 4の { error } で表示)
  ```

#### Step 5.2: コード品質確認

- [x] TypeScript チェック

  ```bash
  pnpm check
  ```

  - 型エラー確認

- [x] Lint / Format

  ```bash
  pnpm lint
  pnpm format
  ```

  - コード品質確認

#### Step 5.3: デプロイ確認

- [ ] Vercel preview デプロイ
  - GitHub Actions で CI/CD パイプライン確認
  - 自動デプロイが成功することを確認
  - Preview URL でブラウザ検証

- [ ] 本番環境への merge
  - Main ブランチへの merge
  - 本番デプロイ確認

---

## 検証チェックリスト

| 項目                                  | ステータス      | 備考         |
| ------------------------------------- | --------------- | ------------ |
| 破壊的変更分析                        | ✅ 完了         | Phase 1 完了 |
| Zod パッケージアップグレード          | ✅ 完了         | Phase 2.1    |
| Zod スキーマ修正                      | ✅ 完了         | Phase 2.2    |
| Zod ユニットテスト                    | ✅ 完了         | Phase 4.1    |
| sveltekit-superforms アップグレード   | ✅ 完了         | Phase 3.1    |
| adapter 切り替え（zod → zod4）        | ✅ 完了         | Phase 3.2    |
| ユニットテスト再実行                  | ✅ 完了         | Phase 4.2    |
| E2E テスト実行                        | ✅ 完了         | Phase 4.3    |
| ローカル dev 起動                     | ✅ 完了         | Phase 5.1    |
| 日本語エラーメッセージ表示確認        | ✅ 完了         | Phase 5.2    |
| TypeScript チェック                   | ✅ 完了         | Phase 5.3    |
| Lint / Format                         | ✅ 完了         | Phase 5.4    |
| 共有 util ファイルの adapter 切り替え | ✅ 完了         | Phase 3.2.1  |
| テストモック設定の同期更新            | ✅ 完了         | Phase 4.2    |
| Vercel preview デプロイ               | ⏳ 次のステップ | Phase 5.5    |
| 本番環境デプロイ                      | ⏳ 次のステップ | Phase 5.6    |

---

## 参考資料

### Zod 公式ドキュメント

- [Zod v4 Migration Guide](https://zod.dev/v4/changelog)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [Zod v4 Basic Usage](https://zod.dev/basics)

### sveltekit-superforms ドキュメント

- [sveltekit-superforms Releases](https://github.com/ciscoheat/sveltekit-superforms/releases)
- [v2.28.0 - Zod 4 adapter 追加](https://github.com/ciscoheat/sveltekit-superforms/releases/tag/v2.28.0)
- [v2.29.1 - Latest fixes](https://github.com/ciscoheat/sveltekit-superforms/releases/tag/v2.29.1)
- [Superforms Documentation](https://superforms.rocks/)

### プロジェクト関連ファイル

- **スキーマ定義**: [src/lib/zod/schema.ts](src/lib/zod/schema.ts)
- **スキーマテスト**:
  - [src/test/lib/zod/workbook_schema.test.ts](src/test/lib/zod/workbook_schema.test.ts)
  - [src/test/lib/zod/auth_schema.test.ts](src/test/lib/zod/auth_schema.test.ts)
  - [src/test/lib/zod/account_transfer_schema.test.ts](src/test/lib/zod/account_transfer_schema.test.ts)
- **実装ファイル**:
  - [src/routes/workbooks/create/+page.server.ts](src/routes/workbooks/create/+page.server.ts)
  - [src/routes/workbooks/edit/[slug]/+page.server.ts](src/routes/workbooks/edit/[slug]/+page.server.ts)
  - [src/routes/(admin)/account_transfer/+page.server.ts](<src/routes/(admin)/account_transfer/+page.server.ts>)

### CI/CD

- **テスト実行**: `pnpm test:unit` (vitest), `pnpm test:integration` (playwright)
- **デプロイ**: GitHub Actions → Vercel
- **環境**: Node.js 20+, pnpm 10.28.0

---

## 実装完了

**実行日時**: 2026-01-19 12:00 - 12:20（約20分）

**実行者**: GitHub Copilot（自動実装）

**テスト結果**:

- ユニットテスト: **1757 passed | 1 skipped** ✅
- E2E テスト: **18 passed | 1 skipped** ✅
- Lint/Format: **35 warnings（既存） | 0 新規エラー** ✅

**変更ファイル一覧**:

1. `package.json`: Zod 3.25.76 → 4.3.5、sveltekit-superforms 2.27.4 → 2.29.1
2. `src/lib/zod/schema.ts`: 20 箇所の `{ message }` → `{ error }` に統一
3. `src/routes/workbooks/create/+page.server.ts`: `zod` → `zod4` adapter 切り替え
4. `src/routes/workbooks/edit/[slug]/+page.server.ts`: `zod` → `zod4` adapter 切り替え
5. `src/routes/(admin)/account_transfer/+page.server.ts`: `zod` → `zod4` adapter 切り替え
6. `src/lib/utils/auth_forms.ts`: `zod` → `zod4` adapter 切り替え
7. `src/test/lib/utils/auth_forms.test.ts`: モック設定の `zod` → `zod4` 更新

---

## 教訓

### 1. **段階的アップグレードの重要性**

- Zod 3 → 4 のメジャーバージョンアップを、Phase 分割で対応することで、各フェーズの問題を明確に切り分けられた
- スキーマテスト → adapter 切り替え → E2E テストという段階的検証が効果的

### 2. **共有ユーティリティ内の adapter 切り替え漏れ**

- `auth_forms.ts` のような共有コードの `zod()` → `zod4()` 置換を見落とさないことが重要
- grep で全プロジェクトをスキャンして、adapter の全使用箇所を確認

### 3. **テストモック設定の同期更新**

- API 変更に伴い、テストの `vi.mock()` 定義も更新する必要がある
- `zod` export → `zod4` export の変更で、テスト実行時のエラーを防止

### 4. **エラーメッセージ API の統一**

- `{ message }` → `{ error }` への置換は全スキーマで一貫性が必要
- 正規表現検索で全置換箇所を検出可能

### 5. **ユニット + E2E テストの双方実施**

- adapter 切り替え後、ユニットテストと E2E テストの両方を実行してバックエンド・フロントエンド互換性を確認
- テスト全 pass で本番環境への信頼度が向上

### 6. **コード品質チェックの実施**

- Lint/Format で新規エラーが導入されていないことを確認
- 既存 warning との区別で、アップグレードの影響範囲を明確化
