# 実行チェックリスト

## 📋 移行実行前の確認

### 準備フェーズ

- [ ] `plan.md` の内容をレビュー完了
- [ ] 現在のブランチが正しいことを確認 (`git branch`)
- [ ] 作業用ブランチを作成（推奨）: `git checkout -b refactor/lucide-migration`
- [ ] 最新の状態に更新: `git pull origin staging`

---

## 🔄 移行実行フェーズ

### ステップ 1: バックアップとコミット

- [ ] 現在の状態をセーブ: `git add -A && git commit -m "backup: before lucide migration"`
- [ ] コミットハッシュを記録: `git log --oneline -1`

### ステップ 2: パッケージ置き換え

- [ ] 現在のバージョンを確認: `pnpm list lucide-svelte`
  - 記録: `lucide-svelte@______`
- [ ] 古いパッケージをアンインストール: `pnpm remove lucide-svelte`
- [ ] 新しいパッケージをインストール: `pnpm add @lucide/svelte`
- [ ] インストール完了を確認: `pnpm list @lucide/svelte`
  - 記録: `@lucide/svelte@______`
- [ ] `pnpm-lock.yaml` が更新されたことを確認: `git status`

### ステップ 3: コード修正

- [ ] インポート箇所を検索: `grep -r "from 'lucide-svelte" src/`
- [ ] 各ファイルを修正（対象ファイル数: **\_**)
  - [ ] `src/routes/+page.svelte`
    - [ ] 修正前: `import ArrowRight from 'lucide-svelte/icons/arrow-right'`
    - [ ] 修正後: `import { ArrowRight } from '@lucide/svelte/icons'`
    - [ ] 保存完了

---

## ✅ 検証フェーズ

### ステップ 4: 型チェック

- [ ] TypeScript 型チェック実行: `pnpm check`
  - 結果: **\*\***\_\_\_**\*\***
  - [ ] エラーなし ✅
  - [ ] エラーあり (詳細: **\*\***\_\_\_\_**\*\***)

### ステップ 5: ビルド確認

- [ ] ビルド実行: `pnpm build`
  - ビルド時間: **\_** 秒
  - [ ] 成功 ✅
  - [ ] 失敗 (エラー: **\*\***\_\_\_\_**\*\***)
- [ ] ビルドレポートを確認
  - lucide 関連のサイズ: **\_** KB
  - 前回との比較: **\_** KB (削減/増加)

### ステップ 6: 開発サーバー確認

- [ ] 開発サーバー起動: `pnpm dev`
  - ポート: 5173
  - [ ] 起動成功 ✅

- [ ] ブラウザで画面確認
  - URL: http://localhost:5173
  - [ ] ページ表示 OK ✅
  - [ ] ArrowRight アイコン表示 OK ✅
  - [ ] コンソールエラー: なし ✅

- [ ] ページ操作確認
  - [ ] ナビゲーション動作 OK ✅
  - [ ] アイコンレンダリング OK ✅

### ステップ 7: テスト実行

- [ ] ユニットテスト: `pnpm test:unit`
  - 結果: **\*\***\_\_\_**\*\***
  - [ ] 全テスト成功 ✅
  - [ ] 失敗 (テスト: **\*\***\_\_\_\_**\*\***)

- [ ] E2E テスト: `pnpm test:integration`
  - 結果: **\*\***\_\_\_**\*\***
  - [ ] 全テスト成功 ✅
  - [ ] 失敗 (テスト: **\*\***\_\_\_\_**\*\***)

### ステップ 8: Lint/Format チェック

- [ ] Prettier チェック: `pnpm format`
  - [ ] 修正なし ✅
  - [ ] 修正あり (ファイル数: \_\_\_\_)

- [ ] ESLint チェック: `pnpm lint`
  - [ ] エラーなし ✅
  - [ ] エラーあり (詳細: **\*\***\_\_\_\_**\*\***)

---

## 📝 完了フェーズ

### ステップ 9: 変更内容の確認

- [ ] 差分を確認: `git diff`
  - 修正ファイル数: \_\_\_\_
  - 主要な変更:
    - `package.json` ✅
    - `pnpm-lock.yaml` ✅
    - `src/routes/+page.svelte` ✅

### ステップ 10: コミット

- [ ] ステージング: `git add package.json pnpm-lock.yaml src/routes/+page.svelte`
- [ ] コミット:
  ```bash
  git commit -m "refactor: migrate lucide-svelte to @lucide/svelte for Svelte 5"
  ```
- [ ] コミット完了確認: `git log --oneline -1`

### ステップ 11: プッシュと PR

- [ ] ローカル変更完了
  - [ ] 全テスト成功
  - [ ] ビルド成功
- [ ] リモートにプッシュ: `git push origin refactor/lucide-migration`
- [ ] GitHub で PR を作成
  - [ ] PR タイトル入力
  - [ ] 説明文を追加（`plan.md` のリンク）
  - [ ] レビュアー指定

---

## 🚨 トラブルシューティング

### エラーが発生した場合

| エラー                                    | 原因                  | 対策                                  |
| ----------------------------------------- | --------------------- | ------------------------------------- |
| **`Cannot find module '@lucide/svelte'`** | インストール失敗      | `pnpm install` を再実行               |
| **型定義エラー**                          | TypeScript キャッシュ | `pnpm dlx tsc --noEmit` で確認        |
| **ビルド失敗**                            | 未修正インポート      | `grep -r "lucide-svelte" src/` で検索 |
| **テスト失敗**                            | キャッシュ問題        | `pnpm store prune && pnpm install`    |

### ロールバック手順

エラーが解決しない場合：

```bash
# 最後のコミットに戻す
git revert HEAD

# または
git reset --hard <backup-commit-hash>

# lock ファイルも復元
pnpm install
```

---

## 📊 記録

| 項目                 | 値                       |
| -------------------- | ------------------------ |
| **開始日時**         | 2025-10-25 **_:_**       |
| **完了日時**         | 2025-10-25 **_:_**       |
| **所要時間**         | **\_** 分                |
| **修正ファイル数**   | **\_**                   |
| **ビルドサイズ削減** | **\_** KB (**\_** %)     |
| **テスト成功率**     | **\_** / **\_** ✅       |
| **備考**             | **\*\***\_\_\_\_**\*\*** |

---

**チェックリスト作成日**: 2025-10-25
**バージョン**: 1.0
