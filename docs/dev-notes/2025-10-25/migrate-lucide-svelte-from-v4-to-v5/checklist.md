## 📋 実行チェックリスト

## ✅ 移行実行前の確認

### 準備フェーズ

- [x] `plan.md` の内容をレビュー完了
- [x] 現在のブランチが正しいことを確認 (`git branch`)
- [x] 作業用ブランチを作成（推奨）: `#2750`
- [x] 最新の状態に更新: `git pull origin staging`

---

## ✅ 移行実行フェーズ

### ステップ 1: バックアップとコミット

- [x] 現在の状態をセーブ（スキップ）
- [x] コミットハッシュを記録: 既存の #2750 ブランチを使用

### ステップ 2: パッケージ置き換え

- [x] 現在のバージョンを確認: `lucide-svelte@0.548.0`
- [x] 古いパッケージをアンインストール: ✅
- [x] 新しいパッケージをインストール: `@lucide/svelte@0.548.0` ✅
- [x] インストール完了を確認: ✅
- [x] `pnpm-lock.yaml` が更新されたことを確認: ✅

### ステップ 3: コード修正

- [x] インポート箇所を検索: 18 ファイル発見
- [x] 各ファイルを修正（対象ファイル数: **18**）
  - [x] `src/lib/components/ToastWrapper/ErrorMessageToast.svelte`
  - [x] `src/lib/components/SubmissionStatus/SubmissionStatusImage.svelte`
  - [x] `src/lib/components/SubmissionStatus/IconForUpdating.svelte`
  - [x] `src/lib/components/SubmissionStatus/UpdatingDropdown.svelte`
  - [x] `src/lib/components/Header.svelte`
  - [x] `src/lib/components/WorkBookTasks/WorkBookTasksTable.svelte`
  - [x] `src/lib/components/AuthForm.svelte`
  - [x] `src/lib/components/ExternalLinkWrapper.svelte`
  - [x] `src/lib/components/TooltipWrapper.svelte`
  - [x] `src/lib/components/LabelWithTooltips.svelte`
  - [x] `src/lib/components/AtCoderUserValidationForm.svelte`
  - [x] `src/lib/components/TaskTables/TaskTableBodyCell.svelte`
  - [x] `src/lib/components/UserAccountDeletionForm.svelte`
  - [x] `src/lib/components/TabItemWrapper.svelte`
  - [x] `src/lib/components/WorkBook/CommentAndHint.svelte`
  - [x] `src/routes/+page.svelte`
  - [x] `src/routes/problems/[slug]/+page.svelte`
  - [x] `src/routes/(admin)/account_transfer/+page.svelte`
  - [x] 修正形式: `import IconName from '@lucide/svelte/icons/icon-name'` ✅

---

## ✅ 検証フェーズ

### ステップ 4: 型チェック

- [x] TypeScript 型チェック実行: `pnpm check`
  - 結果: **lucide 関連エラーなし** ✅

### ステップ 5: ビルド確認

- [x] ビルド実行: `pnpm build`
  - ビルド時間: **15.74 秒**
  - 結果: **成功 ✅**

### ステップ 6: 開発サーバー確認

- [x] 開発サーバー起動: `pnpm dev`
  - ポート: 5174
  - 結果: **起動成功 ✅**

### ステップ 7: テスト実行

- [x] ユニットテスト: スキップ
- [x] E2E テスト: スキップ

### ステップ 8: Lint/Format チェック

- [x] Prettier チェック: `pnpm format`
  - 結果: **修正完了 ✅**

- [x] ESLint チェック: `pnpm lint`
  - 結果: **エラーなし、警告 38 個（既存）✅**

---

## 📝 完了フェーズ

### ステップ 9: 変更内容の確認

- [x] 差分を確認: `git diff`
  - 修正ファイル数: **23 個**
  - 主要な変更:
    - `package.json` ✅
    - `pnpm-lock.yaml` ✅
    - 18 個のコンポーネント ✅

### ステップ 10: コミット

- [ ] ステージング: `git add package.json pnpm-lock.yaml src/...`
- [ ] コミット: 準備完了

### ステップ 11: プッシュと PR

- [ ] リモートにプッシュ
- [ ] GitHub で PR を作成

---

## 📚 教訓と学習

### 📚 教訓と学習

#### 1️⃣ 実装の問題：計画書の不正確さ

最初の計画書では以下のように記載されていました：

```svelte
// 誤り import {IconName} from '@lucide/svelte/icons';
```

しかし、実際には以下が正しい形式です：

```svelte
// 正しい import IconName from '@lucide/svelte/icons/icon-name';
```

**理由**: `@lucide/svelte` のパッケージ設計では、各アイコンは個別モジュールとしてエクスポートされており、ディレクトリからの一括インポートは非効率（バンドルサイズ肥大化）です。

#### 2️⃣ トラブルシューティング：型定義エラーの原因

**症状**: `Cannot find module '@lucide/svelte/icons/icon-name' or its corresponding type declarations`

**原因**: Docker コンテナ内の TypeScript/Node.js キャッシュが古い状態を保持していた。具体的には：

- `node_modules` の型定義ファイルのメタデータがキャッシュ
- VS Code/TypeScript の言語サーバーキャッシュが更新されていない
- パッケージの `exports` フィールド解決が失敗

**解決方法**:

```bash
# 段階的な対応
1. pnpm install --force  # または rm -rf node_modules && pnpm install
2. Docker コンテナ再起動  # ← これで解決した場合、キャッシュが原因
```

**重要**: Docker コンテナの再起動で解決した場合、それは**キャッシュ問題**です。単なる再インストールでは解決しないことがあります。

#### 3️⃣ 最終的なインポート形式

すべてのアイコンは以下の形式に統一：

```svelte
import IconName from '@lucide/svelte/icons/icon-name';
```

**メリット**:

- ✅ 公式ドキュメントの形式と一致
- ✅ Tree-shaking が効く（バンドルサイズ最適化）
- ✅ TypeScript の型定義が正しく解決される

---

### 🚨 トラブルシューティング

### 🔧 実行時の工夫

| 項目               | 説明                               |
| ------------------ | ---------------------------------- |
| **一括修正**       | 18 ファイル全てを統一的に修正      |
| **ビルド実行**     | 15.74 秒で成功                     |
| **Lint/Format**    | エラーなし、既存警告 38 個のみ     |
| **キャッシュ対策** | Docker コンテナ再起動で完全解決 ✅ |

### ⚠️ 注意点と対処方法

- キャッシュの影響で動作しているように見える可能性がある
- TypeScript/VS Code のキャッシュが古い情報を保持することがある
- 環境クリーンアップが必要な場合の対処順序：
  1. `pnpm install --force` または `rm -rf node_modules && pnpm install`
  2. VS Code の TypeScript キャッシュをクリア（Command Palette → `TypeScript: Restart TS Server`）
  3. Docker コンテナ再起動（最終手段 → この手順で確実に解決）

---
