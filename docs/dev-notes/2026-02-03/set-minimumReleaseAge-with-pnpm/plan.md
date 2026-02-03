# pnpm minimumReleaseAge 設定ドラフト

## 概要

サプライチェーン攻撃対策として、pnpm の `minimumReleaseAge` および `blockExoticSubdeps` をプロジェクトに導入する。

## 設定方針

- **セキュリティ重視**: 本番リリース週1～3回のため、慎重な依存関係管理が有効
- **開発生産性確保**: 検証環境での高速更新に対応するため、特定パッケージは除外
- **シンプルな構成**: `trustPolicy` は一旦無効化し、段階的に強化

## 設定内容

### pnpm-workspace.yaml に追加

```yaml
onlyBuiltDependencies:
  - '@prisma/client'
  - '@prisma/engines'
  - esbuild
  - lefthook
  - prisma
  - puppeteer

# セキュリティ設定：供給チェーン攻撃対策
# 新しくリリースされたパッケージの導入を遅延させ、悪意のあるコードが検出される時間を確保

# 最小リリース経過時間（分）: パッケージ公開後1日経過したバージョンのみインストール可能
minimumReleaseAge: 1440

# 上記の制限から除外するパッケージ（常に最新版をインストール可能にする）
minimumReleaseAgeExclude:
  # Prisma: スキーマ同期が重要なため、最新版の早期導入が有効
  - prisma
  - '@prisma/client'
  # tsx: 開発スクリプト実行用。検証環境での頻繁な更新に対応
  - tsx

# Git/Tarball ソースからの推移的依存関係を防止（セキュリティ強化）
blockExoticSubdeps: true
```

## 設定の詳細

### minimumReleaseAge: 1440

- **値の意味**: パッケージ公開後**1日（1440分）経過**したバージョンのみをインストール可能
- **効果**: 悪意のあるコードが含まれたパッケージは通常1時間以内に検出・削除されるため、セキュリティリスクを軽減
- **対象**: 直接依存関係と推移的依存関係の両方に適用

### minimumReleaseAgeExclude

**除外対象パッケージ（常に最新版をインストール）**:

1. **prisma** / **@prisma/client**
   - Prisma スキーマの同期が重要
   - 最新版バグ修正への迅速な対応が有効

2. **tsx**
   - 開発スクリプト実行用
   - 検証環境での頻繁な更新に必要

### blockExoticSubdeps: true

- **効果**: Git や Tarball など、パッケージレジストリ外のソースからの推移的依存関係を防止
- **セキュリティ**: 不正なパッケージ置換を検出・ブロック

## 参考

- pnpm v10.16.0 以降で利用可能
- [pnpm 公式ドキュメント](https://pnpm.io)

## 実装完了 ✅

実装日時: 2026-02-03

### 実施内容

- `pnpm-workspace.yaml` にセキュリティ設定を追加完了
- `minimumReleaseAge: 1440` でパッケージの最小リリース経過時間を1日に設定
- `minimumReleaseAgeExclude` で Prisma と tsx を除外
- `blockExoticSubdeps: true` で不正なパッケージ置換をブロック
- `pnpm install` で動作確認済み

### 教訓

セキュリティと開発効率のバランスが重要。全パッケージに同じ制約をかけるのではなく、ビジネスロジックに直結するパッケージ（Prisma）と開発ツール（tsx）は除外することで、ワークフロー遅延なくセキュリティを向上させられる。
