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

## Phase 0: 事前調査

- [x] `/plugin install superpowers@claude-plugins-official` の書き込み先を確認する
  - `claude plugin install --scope project` で `.claude/settings.json`（プロジェクトレベル）に書き込み可能と判明 → Option A 採用
- [x] `.coderabbit.yaml` の有無と現在のCodeRabbit CI設定を確認する
  - 未存在 → Phase 3b で新規作成

## Phase 1: writing-plans 導入

依存: Phase 0 の調査結果が必要

- [x] **1a**: `claude plugin install --scope project superpowers@superpowers-dev` を実行
  - `.claude/settings.json` にプロジェクトレベルで書き込み済み（git追跡）
  - CodeRabbit CLI は pnpm パッケージなし → curl スクリプトで v0.3.9 をインストール済み
  - `devcontainer.json` の `postCreateCommand` に curl インストールを追加済み
- [x] **1b**: `docs/guides/claude-code.md` のスキル一覧表を更新する
  - writing-plans 追加、`/refactor-plan` との使い分けを明記
- [x] **1c**: `AGENTS.md` の実装フロー Step 1 を更新する
  - `/writing-plans` 使用・2-5分単位のタスク粒度・planチェックリストを明記

## Phase 2: Rules 強化

依存: Phase 1 完了後（writing-plans との統合を前提に記述するため）

### 2a: AGENTS.md — planレビューチェックリスト追加 ✅

Step 1 に自己検証チェックリスト（レイヤー・単一責務・既存コード・テスト名）を追加済み

### 2b: `coding-style.md` — 命名確認の明示化 ✅

新ファイル命名前の grep 確認・`snake_case`/`kebab-case` 確認タイミングを追加済み

### 2c: `coding-style.md` — 設計判断フロー追加 ✅

**変更**: `svelte-components.md`/`prisma-db.md` は `paths` 制限があり plan フェーズに不向きなため、
常時ロードされる `coding-style.md` に "Pre-Implementation Layer Check" テーブルを追加

### 2d: `.claude/skills/refactor-plan/instructions.md` — 粒度チェック追加 ✅

"Phase Design Principles" に単一責務チェック・「実装+テスト+コミット」粒度確認を追加済み

## Phase 3: CodeRabbit CLI 導入

依存: Phase 2 完了後

- [x] **3a**: CodeRabbit CLI v0.3.9 をインストール（`/home/node/.local/bin/coderabbit`）
  - `devcontainer.json` の `postCreateCommand` に curl インストール追加済み
- [x] **3b**: `.coderabbit.yaml` を新規作成（`ja-JP`、`assertive`、path_instructions 設定済み）
- [x] **3c**: writing-plans の milestone タスクテンプレートを `docs/guides/claude-code.md` に定義済み

> Lefthook pre-commit hookとしての自動化は今回スコープ外。
> コスト・速度のトレードオフを計測した後に検討する。

## Phase 4: CodeRabbit CI ドキュメント整備

依存: Phase 3 完了後

- [x] **4a**: `docs/guides/claude-code.md` にレビューチェーンの説明を追加する
- [x] **4b**: `.coderabbit.yaml` のルールは Phase 3b 作成時に反映済み

---

## 変更対象ファイル一覧

| ファイル                                       | Phase      | 変更内容                                             |
| ---------------------------------------------- | ---------- | ---------------------------------------------------- |
| `.claude/settings.json`                        | 1a         | superpowers plugin 追加（writing-plans を含む）      |
| `.devcontainer/devcontainer.json`              | 1a         | postCreateCommand に CodeRabbit CLI インストール追加 |
| `docs/guides/claude-code.md`                   | 1b, 3c, 4a | スキル一覧・レビューチェーン・milestone 規約追加     |
| `AGENTS.md`                                    | 1c, 2a     | 実装フロー・planチェックリスト更新                   |
| `.claude/rules/coding-style.md`                | 2b, 2c     | 命名確認タイミング・設計判断フロー追加               |
| `.claude/skills/refactor-plan/instructions.md` | 2d         | 粒度チェック追加                                     |
| `.coderabbit.yaml`                             | 3b, 4b     | 新規作成                                             |
| `CONTRIBUTING.md`                              | Extra      | AI 支援ツールセクション追加                          |
| `cspell.json`                                  | Extra      | "coderabbit" を辞書に追加                            |

## .coderabbit.yaml path 設計メモ

### path_filters — 除外ディレクトリの判断基準

自動生成物・ビルド成果物はレビュー対象外とする。

| 除外パス | 理由 |
| ------------------------- | --------------------------------------- |
| `node_modules/**` | 依存パッケージ（変更不可） |
| `prisma/migrations/**` | 適用済みマイグレーション（変更禁止） |
| `.pnpm-store/**` | pnpm キャッシュ |
| `pnpm-lock.yaml` | ロックファイル（手動編集不要） |
| `.svelte-kit/**` | SvelteKit ビルド出力（自動生成） |
| `.vercel/**` | Vercel デプロイ設定の生成物 |
| `coverage/**` | テストカバレッジレポート（生成物） |

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

| パス | 不採用理由 |
| ----------------------- | ---------------------------------------------------- |
| `src/**/components/**` | `src/**/*.svelte` で完全に包含される。二重指定は冗長 |
| `src/lib/constants/**` | 命名規則のみで一般ルールで対応可。規約違反頻度が低い |
| `src/lib/actions/**` | フォームアクション固有ルールは `src/routes/**` の rules と重複が多い |
| `src/lib/clients/**` | HTTP クライアントの規約違反（Nock 未使用等）は CI テスト失敗で検出される |

## 教訓

1. **`claude plugin install --scope project` を使う**: `--scope project` で `.claude/settings.json`（git追跡）への書き込みが可能。ユーザーレベルインストールは不要。

2. **`rules` ファイルの `paths` 制限に注意**: `svelte-components.md`/`prisma-db.md` は `paths` 指定があり、特定ファイルを開いたときのみロードされる。plan フェーズで常時参照したいルールは `coding-style.md`（paths 制限なし）に置く。

3. **CodeRabbit CLI は npm パッケージなし**: `curl -fsSL https://cli.coderabbit.ai/install.sh | sh` のみ。`devcontainer.json` の `postCreateCommand` に追加してチーム全員に配布する。

4. **plugin のマーケットプレイス名は `plugin@marketplace` 形式**: `obra/superpowers` を追加する場合は `claude plugin marketplace add --scope project https://github.com/obra/superpowers` → `claude plugin install --scope project superpowers@superpowers-dev`。

## 参考

- [superpowers writing-plans skill](https://github.com/obra/superpowers)
- [CodeRabbit CLI ドキュメント](https://docs.coderabbit.ai/cli/overview)
- Issue: #3292
