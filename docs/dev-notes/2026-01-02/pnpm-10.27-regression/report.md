# pnpm v10.27 メモリリーク問題の調査と解決

**日付:** 2026-01-02

**根本原因:** pnpm v10.27.0 のグローバルストア構造変更

**状態:** ✅ 解決

## 問題の症状

`pnpm dev` でローカル開発サーバが起動しない。

**エラーメッセージ:**

```text
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**プロセス終了コード:** 134 (SIGABRT)

**発生タイミング:** 最近の pnpm アップデート後（10.26.2 → 10.27.0）

## 調査プロセス

### 消費したリソース確認（メモリ分析）

**Node メモリ上限の増加が効果なし:**

```bash
NODE_OPTIONS=--max-old-space-size=8192 pnpm dev  # 失敗（4096 でも失敗）
```

### 初期の仮説と検証結果

| 仮説                          | 検証                                                         | 結果                          |
| ----------------------------- | ------------------------------------------------------------ | ----------------------------- |
| Playwright の自動起動         | [playwright.config.ts](../../../playwright.config.ts) を確認 | ✅ 否定（dev モードで無効化） |
| vitest の watch モード暴走    | `pnpm dev` では vitest は実行されない                        | ✅ 否定                       |
| .svelte-kit キャッシュ肥大化  | `du -sh .svelte-kit/` = 4.2M                                 | ✅ 否定（正常範囲）           |
| Prisma 生成コード巨大化       | `postinstall` 実行時間 = 188ms                               | ✅ 否定（小さい）             |
| Node.js 22 での V8 メモリ管理 | 1年前から同じバージョン                                      | ✅ 否定（可能性低い）         |
| OrbStack のメモリ上限削減     | 公式ドキュメント確認                                         | ✅ 否定（設定変更なし）       |

### 根本原因の特定

**pnpm v10.27.0 の semi-breaking change**

[GitHub Release - pnpm v10.27.0](https://github.com/pnpm/pnpm/releases/tag/v10.27.0) より：

> **Semi-breaking.** Changed the location of unscoped packages in the virtual global store. They will now be stored under a directory named `@` to maintain a uniform 4-level directory depth.

**影響分析:**

- グローバル仮想ストアの内部ディレクトリ構造が変更
- ローカルの `node_modules` キャッシュが古い構造を参照して不整合
- Vite + SvelteKit の開発サーバ起動時に、watch モード初期化でメモリを過剰消費

## 解決方法（v10.28.0 へのアップグレード）

**状態:** ✅ 2026-01-18 に検証完了

pnpm v10.28.0 で v10.27.0 の問題が修正されました。

### v10.28.0 での修正内容

[pnpm v10.28.0 Release Notes](https://github.com/pnpm/pnpm/releases/tag/v10.28.0) のパッチ `#10411` にて以下が修正されました：

> Do not add a symlink to the project into the store's project registry if the store is in a subdirectory of the project

**影響:** Docker + OrbStack 環境でのストア位置管理の問題を解決

### アップグレード手順

[package.json](../../../package.json) の devDependencies を変更：

```json
{
  "devDependencies": {
    "pnpm": "10.28.0"
  },
  "packageManager": "pnpm@10.28.0"
}
```

実行コマンド：

```bash
pnpm install --no-frozen-lockfile
```

### 動作確認結果

- ✅ `pnpm dev` - 正常に起動、メモリリークなし
- ✅ `pnpm test:unit` - 正常に実行、watch モード安定動作
- ✅ `pnpm build` - 正常にビルド完了

## 結果（従来の方法）

✅ `pnpm dev` が正常に起動

**ローカル開発サーバの状態:**

- メモリリークなし
- watch モード正常動作
- ブラウザ自動オープン機能も動作

## 補足

### pnpm 10.27.0 の他の変更

同バージョンには以下の変更も含まれている：

- **グローバルストアのガベージコレクション追加** (`pnpm store prune` の改善)
- **プロジェクト登録メカニズムの変更** (symlinks in `{storeDir}/v10/projects/`)

これらが相互作用して、ローカル環境でメモリ問題を引き起こした可能性がある。

### 参考リンク

- [pnpm v10.27.0 Release Notes](https://github.com/pnpm/pnpm/releases/tag/v10.27.0)
- [pnpm Global Store Documentation](https://pnpm.io/pnpm-7-8-migration#store-changes)
- [Vite Dependency Pre-Bundling](https://vite.dev/guide/dep-pre-bundling.html)
