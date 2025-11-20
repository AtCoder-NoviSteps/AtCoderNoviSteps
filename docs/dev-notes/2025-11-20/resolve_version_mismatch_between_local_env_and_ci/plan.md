# ローカル環境とCI環境のPrismaバージョン不一致解決計画

**作成日**: 2025-11-20

**優先度**: High

**対象**: CI自動デプロイメント（preview、production）

---

## 概要

ローカル環境で指定されているPrisma v5.22とCI環境で使用されるPrisma v7.xのバージョン不一致を解決するための計画です。

### 現象

- **エラー**: CI環境で `schema.prisma` の `url` および `directUrl` 属性が廃止されたとのエラーが発生
- **原因**: `.github/workflows/ci.yml` で `pnpm dlx prisma migrate deploy` を実行する際、レジストリから最新版（v7.x）をダウンロードしているため
- **期待動作**: ローカル環境と同じPrisma v5.22（`package.json`で指定）をCI環境でも使用すること

---

## 背景

### Prisma バージョン戦略

- **ローカル環境**: v5.22.0（明示的に指定）
- **CI環境（現在）**: v7.x（最新版、意図しない）
- **理由**: Lucia v2.7.7（認証ライブラリ）との互換性維持

### コマンドの挙動の違い

| コマンド           | 動作                             | バージョン                         |
| ------------------ | -------------------------------- | ---------------------------------- |
| `pnpm dlx prisma`  | レジストリからダウンロード＆実行 | **最新版（v7.x）**                 |
| `pnpm exec prisma` | node_modules内のバージョンを実行 | **package.json指定版（v5.22）** ✅ |

**参照**: [pnpm公式ドキュメント](https://pnpm.io/cli/dlx) と [pnpm exec](https://pnpm.io/cli/exec)

---

## 前提条件

1. **Lucia v2互換性**: 現在の`@lucia-auth/adapter-prisma` v3.0.2はPrisma v5対応設計
   - Lucia v3も開発終了（deprecated）のため移行の必然性あり
   - ただし即座のアップグレードは非推奨（検証不足）

2. **Prisma v7への本格移行**: 将来的に以下が必要
   - `schema.prisma`から`url`/`directUrl`を`prisma.config.ts`に移行
   - Lucia認証ライブラリの刷新検討
   - 本対応は「今後のタスク」セクションに記載

3. **現在の選択肢**: v5.22に留まり、バージョン指定の堅牢化

---

## 修正計画

### 対象ファイル

- `.github/workflows/ci.yml`

### 修正内容

#### 1. preview ジョブ

```yaml
# 修正前
- name: Apply all pending migrations to the database
  run: pnpm dlx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.PREVIEW_DATABASE_URL }}
    DIRECT_URL: ${{ secrets.PREVIEW_DIRECT_URL }}

# 修正後
- name: Apply all pending migrations to the database
  run: pnpm exec prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.PREVIEW_DATABASE_URL }}
    DIRECT_URL: ${{ secrets.PREVIEW_DIRECT_URL }}
```

#### 2. production ジョブ

```yaml
# 修正前
- name: Apply all pending migrations to the database
  run: pnpm dlx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
    DIRECT_URL: ${{ secrets.PRODUCTION_DIRECT_URL }}

# 修正後
- name: Apply all pending migrations to the database
  run: pnpm exec prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
    DIRECT_URL: ${{ secrets.PRODUCTION_DIRECT_URL }}
```

### 修正の効果

| 項目           | 修正前                        | 修正後          |
| -------------- | ----------------------------- | --------------- |
| 実行バージョン | v7.x（最新）                  | v5.22（指定版） |
| エラー発生     | ✅ 発生（datasource url廃止） | ❌ 発生しない   |
| 環境一貫性     | ❌ ローカルと異なる           | ✅ 統一         |
| Lucia互換性    | ❌ 不安定                     | ✅ 維持         |

---

## 実装チェックリスト

### ステップ1: ファイル修正

- [x] `.github/workflows/ci.yml` の preview ジョブ内「Apply all pending migrations to the database」ステップで `pnpm dlx` を `pnpm exec` に変更
- [x] `.github/workflows/ci.yml` の production ジョブ内「Apply all pending migrations to the database」ステップで `pnpm dlx` を `pnpm exec` に変更

### ステップ2: 動作確認

- [x] ローカルユニットテスト実行: `pnpm test:unit` ✅ パス (1683 passed | 1 skipped)
- [ ] preview環境へのデプロイ実行、ログ確認（DATABASE_URL、DIRECT_URLが正しく参照されているか）
- [ ] production環境へのデプロイ実行、ログ確認
- [ ] マイグレーション実行完了の確認

### ステップ3: ドキュメント

- [x] このファイルに実装完了記録を追記

---

## 検証項目

| 項目                 | 方法                                              | 期待値             |
| -------------------- | ------------------------------------------------- | ------------------ |
| バージョン確認       | CI ログで `prisma` コマンド実行時のバージョン表示 | v5.22.0            |
| マイグレーション成功 | preview/production環境でのデプロイ完了            | エラーなし         |
| スキーマ整合性       | データベースのスキーマ検証                        | 既存スキーマと同一 |

---

## 今後のタスク（将来対応）

### タスク1: Prisma v7への本格移行

**対象**: Prisma v5.22 → v7.x へのアップグレード

**必要な実装**:

1. `prisma/prisma.config.ts` を新規作成（datasource設定を移行）
2. `prisma/schema.prisma` から `url` と `directUrl` を削除
3. `PrismaClient` の初期化時に `adapter` または `accelerateUrl` を指定
4. CI環境での環境変数設定を見直し
5. すべてのテスト実行確認

**優先度**: Medium（Lucia検証後）

**参照**: [Prisma v7 migration guide](https://pris.ly/d/config-datasource)

### タスク2: Lucia 認証ライブラリの刷新検討

**背景**:

- Lucia v2: 開発終了（レガシー）
- Lucia v3: メンテナンスモード（deprecated）
- Prisma v7への対応状況が不明確

**必要な検討**:

1. 代替ライブラリ調査（例: Better Auth, NextAuth.js v5、Auth.js等）
2. 機能要件確認（ユーザー認証、セッション管理など）
3. 既存実装との互換性評価
4. 段階的移行戦略の立案
5. テストスイートの拡充

**優先度**: Medium

**依存関係**: タスク1（Prisma v7）の完了後推奨

### タスク3: prisma.config.ts移行ガイド作成

**対象**: 開発チーム向けドキュメント

**含める内容**:

- `prisma.config.ts` の設定方法
- `schema.prisma` の移行チェックリスト
- 環境変数の新しい管理方法
- よくある問題とトラブルシューティング

**優先度**: Low（タスク1完了後）

---

## 参考: Prisma v7 breaking changes

### datasource url廃止の理由

Prisma v7では以下の設計変更により、`datasource`内で接続URLを指定することを廃止：

1. **構成の分離**: スキーマ定義と環境設定を明確に分離
2. **ランタイムの柔軟性**: PrismaClientの初期化時に接続情報を指定可能に
3. **Accelerate対応**: データベース接続の最適化オプション（proxy層）への対応

### v5.22で対応している属性

- ✅ `provider`（データベースプロバイダー）
- ✅ `url`（環境変数参照: `env("DATABASE_URL")`）
- ✅ `directUrl`（環境変数参照: `env("DIRECT_URL")`）
- ✅ `shadowDatabaseUrl`（テスト・マイグレーション用DB）

### v7.xで廃止された属性

- ❌ `url`（schema.prisma内での指定）
- ❌ `directUrl`（schema.prisma内での指定）

---

## Q&A

### Q1: なぜ `prisma.config.ts` は v5.22でサポートされていないのか？

**A**: `prisma.config.ts` はPrisma v6.18.0で試験的機能（Early Access）として導入されました。v5.22ではこの機能が存在しないため、使用できません。したがって、現在v5.22を使用する場合は、`schema.prisma`内で接続情報を指定する従来の方法が唯一の選択肢です。

### Q2: v5.22のままでいつまで使用可能か？

**A**: 公式のサポート終了日は明記されていませんが、新機能やセキュリティ修正の提供は期待できません。v7系への移行は数ヶ月〜1年以内の実施が推奨されます。

### Q3: 修正後、スキーマファイルに変更は必要か？

**A**: いいえ。修正はCIの実行コマンドのみです。`prisma/schema.prisma` は変更不要です。

---

## 実装完了記録

### 実装日

- [x] 2025-11-20

### 修正内容

- [x] preview ジョブ: `pnpm dlx` → `pnpm exec` に変更
- [x] production ジョブ: `pnpm dlx` → `pnpm exec` に変更

### テスト結果

- [x] ローカルユニットテスト: ✅ PASS (1683 tests, 1 skipped)
- [ ] CI実行: ✅ / ❌（GitHub Actions実行待機中）
- [ ] preview環境デプロイ: ✅ / ❌
- [ ] production環境デプロイ: ✅ / ❌
- [ ] マイグレーション実行: ✅ / ❌

### 備考

**修正内容**:

- `pnpm dlx prisma migrate deploy` → `pnpm exec prisma migrate deploy`
- `pnpm dlx` はレジストリから最新版（v7.x）をダウンロード実行する
- `pnpm exec` は `node_modules` 内の指定版（v5.22）を実行する
- 修正後、CI環境でもローカル環境と同じPrisma v5.22が使用される

**得られた教訓**:

1. **バージョン指定の重要性**: `pnpm dlx` と `pnpm exec` の挙動の違いを理解することが、環境の一貫性確保に不可欠
2. **コマンドの選択が与える影響**: 一見単純なコマンド名の違いが、CI/CD環境で大きな問題につながる可能性
3. **Prisma のバージョン管理**: メジャーバージョン間のbreaking changes（v5 → v7での `datasource url` 廃止）は、移行戦略とテストが重要
4. **段階的アプローチの有効性**: 即座のメジャーバージョンアップグレードより、バージョン指定の堅牢化で環境統一を優先するのが安全

---

## 参照リンク

- 📖 [pnpm dlx ドキュメント](https://pnpm.io/cli/dlx)
- 📖 [pnpm exec ドキュメント](https://pnpm.io/cli/exec)
- 📖 [Prisma v7 datasource config](https://pris.ly/d/config-datasource)
- 📖 [Prisma v7 PrismaClient config](https://pris.ly/d/prisma7-client-config)
