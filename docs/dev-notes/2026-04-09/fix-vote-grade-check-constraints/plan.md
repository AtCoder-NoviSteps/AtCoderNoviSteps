# staging 環境の failed migration 修復計画

## 概要

`20260406112057_add_vote_grade_check_constraints` migration が staging DB で P3009 エラー（失敗中状態）で止まっており、以降の migration deploy が全てブロックされている状態を GHA 経由で修復する。

## 根本原因

migration.sql 内のテーブル名が Pascal Case クォート形式（例: `"VotedGradeCounter"`）で記述されているが、`schema.prisma` の `@@map` により実際の PostgreSQL テーブル名は小文字（`votedgradecounter`）。

```sql
-- 誤（失敗した migration）
ALTER TABLE "VotedGradeCounter" ADD CONSTRAINT ...

-- 正（@@map に合わせた正しい記述）
ALTER TABLE "votedgradecounter" ADD CONSTRAINT ...
```

PostgreSQL はクォート付きの識別子を大文字小文字区別で処理するため、`"VotedGradeCounter"` は存在しないテーブルを参照して ALTER TABLE が失敗。`_prisma_migrations` に `finished_at = NULL` のレコードが残り P3009 状態となった。

## 他 AI 提案のレビュー・却下理由

| 提案内容                                 | 評価              | 理由                                                                                                                  |
| ---------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `migrate resolve --rolled-back` の使用   | ✅ 正しい         | P3009 を解消する唯一の手段                                                                                            |
| 同名 `migration.sql` を修正して再 deploy | ❌ **機能しない** | `--rolled-back` にマークされた migration は `migrate deploy` が永久にスキップする。同ファイルを修正しても実行されない |

**正しいアプローチ:** rolled-back 解消後は、**新しいタイムスタンプで新 migration ファイルを作成**して deploy する必要がある。

## 設計方針・却下した代替案

### 採用: workflow_dispatch + 新 migration 作成

- GHA の `workflow_dispatch` トリガーで `migrate resolve` を一度だけ実行
- 旧 migration ファイルを git から削除（ローカル開発環境で `migrate dev` が失敗しないよう）
- 新タイムスタンプで正しいテーブル名の migration を作成

### 却下: ci.yml への一時追記

- `resolve` ステップを既存 `preview` ジョブに追記する案
- 問題: すでに成功した将来の deploy でも毎回 resolve コマンドが走る（冪等ではあるが冗長）
- `workflow_dispatch` の方がスコープが明確で安全

### 却下: DB への直接接続

- staging DB に直接アクセスして `_prisma_migrations` を操作する案
- 方針: GHA 経由でのみ DB を操作するため却下

## 実装フェーズ

### Phase 1: 変更を staging へ push（GHA に workflow_dispatch を公開）

**変更ファイル:**

| 操作 | パス                                                                              |
| ---- | --------------------------------------------------------------------------------- |
| 追加 | `.github/workflows/resolve-migration.yml`                                         |
| 削除 | `prisma/migrations/20260406112057_add_vote_grade_check_constraints/`              |
| 追加 | `prisma/migrations/20260409000000_fix_vote_grade_check_constraints/migration.sql` |

**`.github/workflows/resolve-migration.yml` 内容:**

```yaml
name: Resolve Failed Migration (one-time use)
on:
  workflow_dispatch:

jobs:
  resolve:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
        with:
          package_json_file: package.json
          run_install: false
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: 'pnpm'
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install
      - name: Resolve failed migration in staging DB
        run: |
          pnpm exec prisma migrate resolve \
            --rolled-back 20260406112057_add_vote_grade_check_constraints
        env:
          DATABASE_URL: ${{ secrets.PREVIEW_DATABASE_URL }}
          DIRECT_URL: ${{ secrets.PREVIEW_DIRECT_URL }}
```

**新 migration SQL:**

```sql
-- VotedGradeCounter.count must never go negative (application guard + DB last line of defense)
ALTER TABLE "votedgradecounter" ADD CONSTRAINT "votedgradecounter_count_non_negative"
  CHECK (count >= 0);

-- VoteGrade.grade must not be PENDING (only non-pending grades are valid votes)
ALTER TABLE "votegrade" ADD CONSTRAINT "votegrade_grade_not_pending"
  CHECK (grade != 'PENDING');

-- VotedGradeCounter.grade must not be PENDING
ALTER TABLE "votedgradecounter" ADD CONSTRAINT "votedgradecounter_grade_not_pending"
  CHECK (grade != 'PENDING');

-- VotedGradeStatistics.grade must not be PENDING (median must be a real grade)
ALTER TABLE "votedgradestatistics" ADD CONSTRAINT "votedgradestatistics_grade_not_pending"
  CHECK (grade != 'PENDING');
```

> この push で preview ジョブが起動するが、staging DB はまだ stuck 状態のため `migrate deploy` は P3009 で失敗する。これは想定内。

### Phase 2: workflow_dispatch を手動トリガー

GitHub Actions UI から操作:

1. リポジトリの Actions タブを開く
2. "Resolve Failed Migration (one-time use)" を選択
3. "Run workflow" → **staging ブランチ**を選択して実行

これにより staging DB の `_prisma_migrations` の対象レコードに `rolled_back_at` がセットされ、P3009 が解消される。

### Phase 3: 失敗した preview ジョブを再実行

GitHub Actions UI から Phase 1 の push で失敗した preview ジョブを "Re-run jobs" で再実行。今度は `migrate deploy` が P3009 なしで通り、新 migration `20260409000000_fix_vote_grade_check_constraints` が適用される。

## 検証

| タイミング     | 確認内容                                                     |
| -------------- | ------------------------------------------------------------ |
| Phase 2 完了後 | `workflow_dispatch` ジョブの終了コードが 0                   |
| Phase 3 完了後 | GHA の "Apply all pending migrations" ステップが成功         |
| Phase 3 完了後 | staging の Vercel デプロイが完了                             |
| Phase 3 完了後 | staging アプリで投票機能が正常動作（CHECK 制約が DB に存在） |

## ローカル開発環境への影響

旧 migration ファイルを git から削除することで、開発者が `git pull` 後に `migrate dev` を実行しても旧 SQL は実行されず、代わりに新 migration が適用される。

ただし、**旧 migration をすでにローカル DB に適用しようとして failed 状態にしている開発者**は別途対応が必要:

```bash
# ローカル DB の stuck 状態を解消
pnpm exec prisma migrate resolve --rolled-back 20260406112057_add_vote_grade_check_constraints

# その後 migrate dev を実行
pnpm exec prisma migrate dev
```

## 事後処理

`resolve-migration.yml` は使い捨て。fix 確認後に削除 PR を出してもよい（再実行しても冪等なので必須ではない）。
