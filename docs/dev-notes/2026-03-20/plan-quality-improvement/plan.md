# Plan Quality Improvement (#3292)

## Goal

初期planの精度を上げ、実装後の大規模refactorサイクル（現状: 3-4回/PR）を削減する。

## 背景・現状

| 指標                  | 現状        |
| --------------------- | ----------- |
| 大規模refactor        | 3-4回/PR    |
| 中小refactor          | ~10回/PR    |
| CodeRabbit CIコメント | 10-100件/PR |

根本原因: TODOリストの粒度が粗いため、アーキテクチャ違反・責務混在・命名の不統一などが
初期planに混入したまま実装が進む。

## 改善方針

1. **writing-plans** (superpowers plugin) — 2-5分単位の粒度でplanを生成
2. **Rules強化** — planフェーズで参照できる設計判断チェックリストを追加
3. **CodeRabbit CLI** — planのmilestoneで都度レビューを差し込む
4. **CodeRabbit CI** — 現状維持（最終ゲートとして機能）

## レビューチェーン（完成後の姿）

```
writing-plans で plan生成
  → 実装（2-5分タスク単位）
  → milestone到達時に CodeRabbit CLI レビュー
  → PR作成後に CodeRabbit CI（最終ゲート）
```

## 計測指標（最初のタスク適用後に評価）

| 指標                       | 現状     | 目標         |
| -------------------------- | -------- | ------------ |
| 大規模refactor回数/PR      | 3-4回    | 1回以下      |
| 中小refactor回数/PR        | ~10回    | 5回以下      |
| CodeRabbit CIコメント数/PR | 10-100件 | 半減         |
| ccusage                    | 計測開始 | 許容範囲確認 |

---

## .coderabbit.yaml path 設計メモ

### path_filters — 除外ディレクトリの判断基準

自動生成物・ビルド成果物はレビュー対象外とする。

| 除外パス               | 理由                                 |
| ---------------------- | ------------------------------------ |
| `node_modules/**`      | 依存パッケージ（変更不可）           |
| `prisma/migrations/**` | 適用済みマイグレーション（変更禁止） |
| `.pnpm-store/**`       | pnpm キャッシュ                      |
| `pnpm-lock.yaml`       | ロックファイル（手動編集不要）       |
| `.svelte-kit/**`       | SvelteKit ビルド出力（自動生成）     |
| `.vercel/**`           | Vercel デプロイ設定の生成物          |
| `coverage/**`          | テストカバレッジレポート（生成物）   |

### path_instructions — ディレクトリ採否の判断基準

CodeRabbit は `.claude/rules/` を読まない。プロジェクト固有の規約は `path_instructions` で明示しないと検出されない。採用したパスの一覧と各エントリのルールは `.coderabbit.yaml` のコメントを参照。

**`path_instructions` の並び順:**

依存方向（下位層 → 上位層）× TDD（型定義 → テストデータ → 実装）の順で並べる。

```
prisma/**          データモデル定義（最下位。他のすべてが依存する）
src/lib/server/**  DB アクセス層（prisma に直接依存）
src/**/zod/**      バリデーションスキーマ（型から導出）
src/**/types/**    ドメイン型（スキーマ・DB モデルから導出）
src/**/fixtures/** テストデータ（TDD 原則: 型が決まれば実装前にテストを書く）
src/**/services/** ビジネスロジック（型 + DB に依存）
src/**/utils/**    純粋ユーティリティ（依存なし。サービスと同位置だが副作用なし）
src/**/stores/**   状態管理（サービス・ユーティリティを利用）
src/routes/**      ルートハンドラ（サービス + ストアを束ねる）
src/**/*.svelte    UI コンポーネント（最上位。ストア・ルートを消費するのみ）
```

`src/**/components/**` を `src/**/*.svelte` の代わりに使わない理由: Svelte コンポーネントは `.svelte` 拡張子で一意に識別できるため、ディレクトリ名より拡張子 glob の方が漏れがない。

**不採用にしたパス:**

| パス                   | 不採用理由                                                               |
| ---------------------- | ------------------------------------------------------------------------ |
| `src/**/components/**` | `src/**/*.svelte` で完全に包含される。二重指定は冗長                     |
| `src/lib/constants/**` | 命名規則のみで一般ルールで対応可。規約違反頻度が低い                     |
| `src/lib/actions/**`   | フォームアクション固有ルールは `src/routes/**` の rules と重複が多い     |
| `src/lib/clients/**`   | HTTP クライアントの規約違反（Nock 未使用等）は CI テスト失敗で検出される |

## 教訓

1. **`claude plugin install --scope project` を使う**: `--scope project` で `.claude/settings.json`（git追跡）への書き込みが可能。ユーザーレベルインストールは不要。

2. **`rules` ファイルの `paths` 制限に注意**: `svelte-components.md`/`prisma-db.md` は `paths` 指定があり、特定ファイルを開いたときのみロードされる。plan フェーズで常時参照したいルールは `coding-style.md`（paths 制限なし）に置く。

3. **CodeRabbit CLI は npm パッケージなし**: `curl -fsSL https://cli.coderabbit.ai/install.sh | sh` のみ。`devcontainer.json` の `postCreateCommand` に追加してチーム全員に配布する。

4. **plugin のマーケットプレイス名は `plugin@marketplace` 形式**: `obra/superpowers` を追加する場合は `claude plugin marketplace add --scope project https://github.com/obra/superpowers` → `claude plugin install --scope project superpowers@superpowers-dev`。

5. **CodeRabbit CLI の Lefthook pre-commit 自動化は見送り**: コスト・速度のトレードオフを計測してから判断する。milestone ごとに手動実行する運用で開始。

## 参考

- [superpowers writing-plans skill](https://github.com/obra/superpowers)
- [CodeRabbit CLI ドキュメント](https://docs.coderabbit.ai/cli/overview)
- Issue: #3292
