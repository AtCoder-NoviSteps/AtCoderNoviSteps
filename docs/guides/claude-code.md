# Claude Code 機能ガイド

Claude Code の拡張ポイントの使い分けをまとめる。

## 機能の概要と使い分け

| 機能                      | 場所                    | 読み込みタイミング                                                 | 主な用途                                           |
| ------------------------- | ----------------------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| `CLAUDE.md` / `AGENTS.md` | プロジェクトルート      | セッション開始時・常時                                             | プロジェクト全体の規約・コマンド                   |
| `.claude/rules/*.md`      | `.claude/rules/`        | `paths` 指定なし → 常時、`paths` 指定あり → 対象ファイルを開いた時 | トピック別ルール（コーディングスタイル・テスト等） |
| Skills (`/skill-name`)    | `.claude/skills/`       | 呼び出し時のみ                                                     | 再利用可能なワークフロー手順                       |
| Hooks                     | `.claude/settings.json` | ツール呼び出しイベント時                                           | 自動フォーマット・保護ファイルブロック等の自動処理 |

## 各機能の詳細

### CLAUDE.md / AGENTS.md

- セッション開始時に全文読み込まれる（トークン消費）
- **200行以内を目安**にする
- プロジェクト全体に常に適用したい規約・コマンド一覧・アーキテクチャ概要を置く
- `CLAUDE.md` から `@AGENTS.md` のように別ファイルを読み込める

### `.claude/rules/` ファイル

- フロントマターで `paths` を指定すると、対象ファイルを開いた時だけ読み込まれる（コンテキスト節約）
- `paths` を指定しないと常時読み込まれる（CLAUDE.md と同じ扱い）
- **`globs` は非推奨。`paths` を使う**

```yaml
---
description: Testing rules and patterns
paths:
  - '**/*.test.ts'
  - 'e2e/**'
---
```

適しているもの:

- Linter/Formatter でカバーできない「意思決定ルール」（アーキテクチャ方針、命名判断基準）
- ファイル種別ごとに分けたい規約（テスト、DB、Svelte コンポーネント等）

**このプロジェクトの rules ファイル:**

| ファイル               | スコープ                                                 |
| ---------------------- | -------------------------------------------------------- |
| `coding-style.md`      | 言語レベルの記述スタイル（ブレース・命名・型エイリアス） |
| `testing.md`           | `*.test.ts`, `*.spec.ts`, `e2e/**` のテストパターン      |
| `svelte-components.md` | `*.svelte` コンポーネント設計方針                        |
| `prisma-db.md`         | `prisma/**`, `src/lib/server/**` の DB・サービス層規約   |
| `auth.md`              | 認証関連                                                 |

### Skills（カスタムスラッシュコマンド）

- `/skill-name` で呼び出す再利用可能な手順書
- 呼び出し時のみフル読み込みされるためコンテキストに優しい
- CLAUDE.md に常時書くほどではないが、繰り返し使うワークフローに向く

**ビルトイン skills（`~/.claude/skills/`）:**

| スキル      | 用途                               |
| ----------- | ---------------------------------- |
| `/commit`   | git コミット作成ワークフロー       |
| `/simplify` | 変更済みコードの品質レビュー・改善 |

**本プロジェクトの skills（`.claude/skills/` および superpowers plugin）:**

| スキル           | 用途                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/writing-plans` | 新機能・追加実装の詳細計画を生成（2-5分単位のタスク分解）。superpowers plugin 提供                                                 |
| `/refactor-plan` | Issue 番号またはパスを渡してリファクタリング計画を出力（実装はしない）                                                             |
| `/session-close` | セッション終了時のルーティン：テスト確認 → plan.md 更新 → rules 候補提示 → 肥大化チェック → 繰り返し指示検出                       |
| `/dep-upgrade`   | ライブラリのメジャーバージョンアップ分析：破壊的変更の整理・本プロジェクトへの影響・新機能提案 → plan.md 生成 → アップグレード実行 |

**`/dep-upgrade` の使い方:**

```
/dep-upgrade <package-name> <old-major> <new-major>
例: /dep-upgrade eslint 9 10
```

実行内容:

1. 公式マイグレーションガイドを WebFetch で取得
2. 破壊的変更を `src/` / 設定ファイルに対して grep し、問題なし / 要対応を分類
3. 同時更新が必要なコンパニオンパッケージを確認（例: `eslint` + `@eslint/js`）
4. 新バージョンで使える機能を推奨度付きで提案
5. `docs/dev-notes/YYYY-MM-DD/{package}-upgrade/plan.md` を生成し、確認後にアップグレードを実行

**`/writing-plans` と `/refactor-plan` の使い分け:**

- `/writing-plans`: 新機能・追加実装の実装前の詳細計画生成（2-5分単位のタスク分解）
- `/refactor-plan`: リファクタリング調査チェックリスト（実装はしない）

**プロジェクトローカルスキルと `Skill` ツールの違い:**

- `Skill` ツール（Claude 内部のツール）はシステムプロンプトに列挙されたビルトインスキルのみ対象
- `.claude/skills/` のプロジェクトローカルスキルは `/skill-name` スラッシュコマンドでのみ起動（Claude Code CLI が直接読み込む）
- `/session-close` などを Claude に `Skill` ツール経由で呼ばせようとしても動作しない

### Hooks

- `PreToolUse` / `PostToolUse` 等のイベントで自動実行されるシェルコマンド
- LLM の判断を介さず**確実に**実行される（deterministic）
- `.claude/settings.json` の `hooks` セクションに設定

適しているもの:

- **コード編集後の自動フォーマット**（PostToolUse: Edit/Write → `pnpm format`）
- 保護すべきファイルへの書き込みブロック
- 通知

> **このプロジェクトでは** Lefthook が pre-commit で Prettier + ESLint を実行するため、
> hooks による PostToolUse フォーマットは必須ではない。
> 編集中にリアルタイムでフォーマットしたい場合のみ hooks を検討する。

## 既存ツールで十分なもの

以下は **Linter / Formatter / CI で既にカバーされている**ため、Claude Code の機能で重複して設定しない:

| 問題                 | 対応ツール                                 |
| -------------------- | ------------------------------------------ |
| コードフォーマット   | Prettier（Lefthook で pre-commit 実行）    |
| 未使用変数・型エラー | ESLint + `pnpm check`（Svelte 型チェック） |
| ブレース強制         | ESLint `curly` ルールで対応可能            |
| import 順序          | ESLint で対応可能                          |

## 作業フロー規約

Claude Code を使ってリファクタリング・機能追加を行う際の標準フロー:

1. **計画**: `/writing-plans` で 2-5 分単位のフェーズ分け TODO を生成する
2. **実装**: プロダクションコード → テスト → `pnpm test:unit` で確認
3. **TODO 更新**: 完了タスクにチェックを入れる
4. **milestone レビュー**: Phase の区切り（独立したゴールと完了条件を持つタスク群が終わった時点）で `coderabbit review --plain` を実行し、critical/high のみ対応する
5. **レビュー**: 実装後に批判的な観点でレビューする（忖度しない。YAGNI / KISS / DRY 違反、過剰な抽象化を指摘する）
6. **教訓整理**: 次回以降も有用な知見を `.claude/rules/` または `docs/guides/` などに記録する
7. **クリーンアップ**: 完了した計画書・古い TODO は削除または要約する

## レビューチェーン

```text
/writing-plans で plan 生成（2-5 分タスク単位）
  → 実装
  → Phase 区切りで coderabbit review --plain（milestone レビュー）
  → PR 作成後に CodeRabbit CI（最終ゲート）
```

| レイヤー            | タイミング        | 対応コスト | 目的                           |
| ------------------- | ----------------- | ---------- | ------------------------------ |
| `/writing-plans`    | 実装前            | 低         | アーキテクチャ違反を事前に防ぐ |
| `coderabbit review` | Phase 区切り      | 中         | critical/high を早期に潰す     |
| CodeRabbit CI       | PR 作成後（自動） | 高         | 最終品質ゲート                 |

**milestone タスクのテンプレート（writing-plans で Phase を締めるとき）:**

```markdown
## Milestone: Phase N complete

- [ ] Run `coderabbit review --plain` on changed files
- [ ] Address critical/high severity issues before next phase
- [ ] Log CodeRabbit comment count (for metrics)
```

> **初回セットアップ**: `coderabbit auth login` でブラウザ認証。devcontainer の `postCreateCommand` でインストール済み。

> severity ごとの対応基準は `.claude/rules/coding-style.md` の "CodeRabbit Review: Severity Triage" を参照。

## 参考

- [Claude Code 公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code)
- [CLAUDE.md の書き方](https://docs.anthropic.com/en/docs/claude-code/memory)
- [Hooks の設定](https://docs.anthropic.com/en/docs/claude-code/hooks)
