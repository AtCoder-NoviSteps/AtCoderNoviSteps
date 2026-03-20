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

- [ ] `/plugin install superpowers@claude-plugins-official` の書き込み先を確認する
  - `~/.claude/settings.json`（ユーザーレベル・git非追跡）か
    `.claude/settings.json`（プロジェクトレベル・git追跡）かを確認
  - **判断**: ユーザーレベルの場合、複数人チームでは各自インストールが必要になるため
    `.claude/skills/` 手動配置を採用する。プロジェクトレベルなら plugin install を採用。
- [ ] `.coderabbit.yaml` の有無と現在のCodeRabbit CI設定を確認する

## Phase 1: writing-plans 導入

依存: Phase 0 の調査結果が必要

- [ ] **1a**: Phase 0の判断に基づき、以下のいずれかを実施する
  - Option A (plugin install): `/plugin install superpowers@claude-plugins-official`
  - Option B (手動配置): superpowers の writing-plans skill を
    `.claude/skills/writing-plans/` にコピー
- [ ] **1b**: `docs/guides/claude-code.md` のスキル一覧表を更新する
  - writing-plans を追加（用途: 新機能・追加実装の計画生成）
  - `/refactor-plan` との使い分けを明記
    - writing-plans: 実装前の詳細計画生成
    - /refactor-plan: リファクタリング調査チェックリスト
- [ ] **1c**: `AGENTS.md` の実装フロー Step 1 を更新する
  - 変更前: `"Plan with a phased TODO list before starting"`
  - 変更後: writing-plans を使ってplanを生成する旨と、タスク粒度の基準（2-5分単位）を明記

## Phase 2: Rules 強化

依存: Phase 1 完了後（writing-plans との統合を前提に記述するため）

### 2a: AGENTS.md — planレビューチェックリスト追加

実装フロー Step 1 に、plan生成後の自己検証チェックリストを追加する:

```markdown
Plan checklist — verify each task before starting:

- [ ] Which layer does this touch? (routes / types / services / utils / stores / components)
- [ ] Is this one responsibility? If it touches 2+ layers, split into separate tasks
- [ ] Does a types/util/service already exist for this? (search before creating)
- [ ] What is the test for this task? (name it in the task description)
```

### 2b: `coding-style.md` — 命名確認の明示化

planフェーズで行う命名確認ルールを追加する:

- 新ファイル作成前に既存の命名パターンをgrepして確認する
- ルーティング `snake_case` / ディレクトリ `kebab-case` の確認タイミングを明記

### 2c: `svelte-components.md` か `prisma-db.md` — 設計判断フロー追加

planフェーズで参照できるアーキテクチャ判断フローを追加する:

```text
新しいロジックを書く前の確認:
純粋関数か?         → utils/ へ
DB操作か?           → service/ へ
UI表示のみか?       → snippet か component か (svelte-components.md の基準を参照)
ルート固有か共有か? → _utils/ か shared utils/、_types/ or shared types/
```

### 2d: `.claude/skills/refactor-plan/instructions.md` — 粒度チェック追加

"Phase Design Principles" セクションに、planレビュー時の粒度確認を追加する:

- 各タスクが単一責務か確認する
- 「実装 + テスト + コミット」が1タスク内に収まる粒度かを確認する

## Phase 3: CodeRabbit CLI 導入

依存: Phase 2 完了後

- [ ] **3a**: CodeRabbit CLI をインストールする
- [ ] **3b**: `.coderabbit.yaml` を作成する（存在しない場合）または既存設定を見直す
- [ ] **3c**: writing-plans のmilestoneタスクに CodeRabbit CLI 呼び出しを組み込む規約を定義する

**milestone タスクのテンプレート:**

```markdown
## Milestone: Phase N complete

- [ ] Run `cr review` on changed files
- [ ] Address critical/high severity issues before proceeding to next phase
- [ ] Log CodeRabbit comment count (for metrics)
```

**呼び出し頻度の指針:**

- phaseの区切りで実行（毎コミットごとではない）
- critical/high のみ対応、low/info は次のPhaseで判断

> Lefthook pre-commit hookとしての自動化は今回スコープ外。
> コスト・速度のトレードオフを計測した後に検討する。

## Phase 4: CodeRabbit CI ドキュメント整備

依存: Phase 3 完了後

- [ ] **4a**: `docs/guides/claude-code.md` にレビューチェーンの説明を追加する
  - writing-plans → 実装 → CodeRabbit CLI（milestone） → CodeRabbit CI（最終ゲート）
  - 各レイヤーの役割と対応コストの目安を記載
- [ ] **4b**: `.coderabbit.yaml` のルールをPhase 3の設定に合わせて調整する（必要に応じて）

---

## 変更対象ファイル一覧

| ファイル                                                   | Phase  | 変更内容                           |
| ---------------------------------------------------------- | ------ | ---------------------------------- |
| `.claude/settings.json` or `.claude/skills/writing-plans/` | 1a     | writing-plans 追加                 |
| `docs/guides/claude-code.md`                               | 1b, 4a | スキル一覧・レビューチェーン追加   |
| `AGENTS.md`                                                | 1c, 2a | 実装フロー・planチェックリスト更新 |
| `coding-style.md`                                          | 2b     | 命名確認タイミング追加             |
| `svelte-components.md` or `prisma-db.md`                   | 2c     | 設計判断フロー追加                 |
| `.claude/skills/refactor-plan/instructions.md`             | 2d     | 粒度チェック追加                   |
| `.coderabbit.yaml`                                         | 3b, 4b | 新規作成または見直し               |

## 参考

- [superpowers writing-plans skill](https://github.com/obra/superpowers)
- Issue: #3292
