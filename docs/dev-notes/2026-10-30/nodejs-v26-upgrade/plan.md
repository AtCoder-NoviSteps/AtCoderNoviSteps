# Node.js v24 → v26 アップグレード

**作成日**: 2026-10-30（最終更新: 2026-10-31）

**ステータス**: リポジトリ側は完了し、Node 26 で検証済み（issue #4263）。staging・production への反映待ち

## 概要

devcontainer・CI・Vercel の Node.js を v24.x から v26.x（2026-10-28 に LTS、EOL 2029-04-30）へ上げた。v24 は Maintenance 期間に入っており、依存の対応が揃った今が最も移行コストが小さい。変更内容は `dep-upgrade` skill の Node 更新手順のとおり。

## 知っておくべきこと

- Node 26 でビルド・デプロイするには、`@sveltejs/adapter-vercel` 7.0.2 以上と Vercel CLI 65.8.0 以上が必要。どちらも本タスクの前にマージ済み（#4256、#4252・#4262）。
- Vercel 側の Node.js Version は Dashboard の設定で、2026-10-31 に 26.x へ変更済み（リポジトリのコードには現れない）。
- Node 24 の環境では、`pnpm exec` やコミット時の lefthook で `ERR_PNPM_UNSUPPORTED_ENGINE` が出る。devcontainer を rebuild すれば解消する。
- Node 26 の[破壊的変更](https://nodejs.org/en/blog/release/v26.0.0)のうち、リポジトリに該当するものはない。

## 意思決定

- **adapter の `runtime` は指定しない**: ビルド時の Node から `nodejs26.x` が自動で選ばれるので、Node を上げるたびに書き換えずに済む。
- **CI は Node 26 だけでテストする**: `engineStrict: true` のため Node 24 では install できない。本番も単一のランタイムなので、両方をテストする価値は小さい。
- **Prisma は 5.22.0 のまま**: Node 26 の公式サポートは Prisma 8 からだが、engine が Node-API 製なので動作する（検証済み）。5 → 8 の更新は影響範囲が別なので、別タスクにする。

## 検証結果

2026-10-31 に Node 26 の devcontainer で、install・lint・check・unit test・build・seed・e2e がすべて成功した。生成された関数のランタイムは `nodejs26.x` で、Node 由来の DeprecationWarning は出なかった。

## 残りタスク

- [ ] PR を staging にマージし、preview deploy の成功と動作を確認する（ログイン、AtCoder Problems / AOJ からの取得、`/workbooks/{slug}`、DB の読み書き）
- [ ] production に deploy し、Vercel の Function logs にエラーや DeprecationWarning が出ていないことを確認する

問題が出たら PR を revert し、Dashboard の Node.js Version を 24.x に戻す。
