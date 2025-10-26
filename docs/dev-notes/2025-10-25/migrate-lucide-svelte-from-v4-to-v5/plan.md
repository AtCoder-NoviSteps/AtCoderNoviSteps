# lucide-svelte から @lucide/svelte への移行計画

## 📋 概要

**現状**: Svelte 5.41.4 プロジェクトで Svelte 4 用の `lucide-svelte@0.548.0` を使用
**目標**: Svelte 5 に最適化した `@lucide/svelte` に移行し、バンドルサイズを削減

---

## 🎯 移行の利点

- ✅ **Svelte 5 に最適化**: パフォーマンス向上
- ✅ **バンドルサイズ削減**: tree-shaking による効率化
- ✅ **型安全性**: TypeScript の型定義が改善
- ✅ **アイコン直接インポート**: `@lucide/svelte/icons` からの軽量インポート対応

---

## 📐 技術的背景

### 現在の状況

```json
{
  "dependencies": {
    "lucide-svelte": "^0.548.0" // Svelte 4 用
  },
  "devDependencies": {
    "svelte": "5.41.4" // Svelte 5
  }
}
```

**問題点**:

- インポートパス `lucide-svelte/icons/arrow-right` が Svelte 5 では解決されない
- バンドルが不必要に大きくなる可能性

### 新しい構成

```json
{
  "dependencies": {
    "@lucide/svelte": "latest" // Svelte 5 専用
  },
  "devDependencies": {
    "svelte": "5.41.4"
  }
}
```

---

## 🔄 移行手順

### フェーズ 1: 準備

1. **現在の状態をコミット**

   ```bash
   git status
   git add -A
   git commit -m "docs: add lucide-svelte migration plan"
   ```

2. **pnpm の依存関係をロック**

   ```bash
   pnpm list lucide-svelte
   ```

   - 現在: `lucide-svelte@0.548.0` を確認

### フェーズ 2: パッケージ置き換え

1. **古いパッケージをアンインストール**

   ```bash
   pnpm remove lucide-svelte
   ```

2. **新しいパッケージをインストール**

   ```bash
   pnpm add @lucide/svelte
   ```

3. **lock ファイル更新を確認**

   ```bash
   pnpm list @lucide/svelte
   ```

   - `pnpm-lock.yaml` が自動で更新される

### フェーズ 3: コード修正

#### 3-1. インポート方式の確認

**現在のコード** (`src/routes/+page.svelte`):

```svelte
import ArrowRight from 'lucide-svelte/icons/arrow-right';
```

**修正対象**: 全インポート文を以下の形式に統一

- アイコンモジュールから直接インポート（推奨）

```svelte
import ArrowRight from '@lucide/svelte/icons/arrow-right';
```

**使用方法**:

````svelte
<ArrowRight class="w-4 h-4" color="#ff3e98" />

#### 3-2. ファイル別の修正対象 ```bash # lucide-svelte のインポートを使用しているファイルを検索 grep
-r "from 'lucide-svelte" src/ --include="*.svelte" --include="*.ts" --include="*.js"
````

**想定される修正ファイル**:

- `src/routes/+page.svelte` - `ArrowRight` のインポート

### フェーズ 4: 検証

1. **ビルド確認**

   ```bash
   pnpm check
   ```

   - TypeScript エラーがないか確認

2. **ビルドサイズ測定**

   ```bash
   pnpm build
   ```

   - Vite のビルドレポートで lucide 関連のサイズを確認

3. **開発サーバー起動**

   ```bash
   pnpm dev
   ```

   - ブラウザで画面を確認
   - Console エラーがないか確認

4. **ユニットテスト実行**

   ```bash
   pnpm test:unit
   ```

5. **E2E テスト実行**

   ```bash
   pnpm test:integration
   ```

### フェーズ 5: 完了

1. **変更をコミット**

   ```bash
   git add package.json pnpm-lock.yaml src/routes/+page.svelte
   git commit -m "refactor: migrate lucide-svelte to @lucide/svelte for Svelte 5"
   ```

2. **動作確認**
   - ステージング環境でのデプロイテスト

---

## 📌 pnpm 特有の注意事項

### ✅ 自動処理

- **lock ファイル更新**: `pnpm-lock.yaml` は自動更新
- **型定義**: `@lucide/svelte` に含まれる `.d.ts` は自動で認識

### ⚠️ 確認が必要な点

| 項目                       | 内容                                                            | 対応                        |
| -------------------------- | --------------------------------------------------------------- | --------------------------- |
| **スコープ付きパッケージ** | `@lucide/svelte` は `node_modules/.pnpm/@lucide+svelte/` に配置 | 通常、問題なし              |
| **CI/CD パイプライン**     | `pnpm install --frozen-lockfile` を使用している場合             | lock ファイル更新後に再実行 |
| **Workspace 設定**         | 現在 monorepo でない                                            | 影響なし                    |

### 確認コマンド

```bash
# 依存関係の確認
pnpm list @lucide/svelte

# node_modules の構造確認
ls -la node_modules/@lucide/

# キャッシュをクリア（問題が出た場合）
pnpm store prune
pnpm install
```

---

## 📊 期待される効果

| メトリクス                   | 現在                        | 期待値          |
| ---------------------------- | --------------------------- | --------------- |
| **バンドルサイズ**           | 不明（Svelte 4 ライブラリ） | 削減予想 15-25% |
| **ビルド時間**               | -                           | 若干改善        |
| **型安全性**                 | 標準                        | 向上            |
| **ランタイムパフォーマンス** | -                           | Svelte 5 最適化 |

---

## 🚨 リスクと対策

| リスク                   | 可能性 | 対策                      |
| ------------------------ | ------ | ------------------------- |
| **インポート経路の漏れ** | 中     | grep で全体検索確認       |
| **互換性問題**           | 低     | E2E テストで確認          |
| **キャッシュの不具合**   | 低     | `pnpm store prune` で対応 |
| **CI/CD 失敗**           | 低     | lock ファイル更新確認     |

---

## 📚 参考資料

- [lucide-svelte 公式ガイド](https://lucide.dev/guide/packages/lucide-svelte)
- [Svelte 5 マイグレーション](https://svelte.dev/docs/migration-guide)
- [pnpm ドキュメント](https://pnpm.io/)

---

## ✨ 追加の改善機会

移行後に検討する項目：

- [ ] 他の Svelte 4 ライブラリがないか確認
- [ ] `svelte-5-ui-lib` のバージョン確認（最新版に対応しているか）
- [ ] TypeScript 厳格モードでの型チェック強化
- [ ] バンドルサイズ測定ツール (Bundle Analyzer) の導入

---

**更新日**: 2025-10-25
**ステータス**: 📝 計画段階 → 🔄 実行準備中 → ✅ 完了予定
