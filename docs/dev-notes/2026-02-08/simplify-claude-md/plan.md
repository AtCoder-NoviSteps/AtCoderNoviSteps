# CLAUDE.md 簡素化計画

## 背景

現在の CLAUDE.md（約230行）は `/init` コマンドで生成されたもので、毎セッション読み込まれるためコンテキストを圧迫する。AGENTS.md のベストプラクティスや mizchi 氏のリポジトリ（67〜94行）を参考に、有用性を維持しつつコンテキスト消費を最小化するよう再構成する。

## 方針: AGENTS.md をメインに

- **AGENTS.md**（約50行）: Codex / Claude Code 共通のメイン指示ファイル
- **CLAUDE.md**（約10行）: `@AGENTS.md` で import し、Claude 固有の設定のみ記載
- **`.claude/rules/*.md`**: パス条件付きの詳細ルール（該当ファイル操作時のみ読み込み）

この構成により:

1. 単一の情報源（AGENTS.md）でマルチエージェント対応
2. セッションごとのコンテキスト消費を最小化
3. 詳細ガイダンスはパス条件でオンデマンド読み込み

## 最終構成

```
AGENTS.md                    # メイン（約50行）- Codex/Claude 共通
CLAUDE.md                    # @AGENTS.md を import（約10行）
.claude/
└── rules/
    ├── svelte-components.md # paths: ["src/**/*.svelte"]
    ├── prisma-db.md         # paths: ["prisma/**", "src/lib/server/**"]
    ├── testing.md           # paths: ["**/*.test.ts", "tests/**"]
    └── auth.md              # paths: ["src/lib/server/auth/**"]
.github/instructions/        # 削除（Copilot専用、情報が古い）
```

## AGENTS.md の内容（約50行）

- プロジェクト概要（1〜2行）
- 技術スタック要約（1行）
- 主要コマンド（10行）
- プロジェクト構成（10行）
- 主要な規約（5行）
- 詳細は docs/package.json を参照

## .claude/rules/ のガイドライン

- **各ファイル50行以内**
- **コード例は書かない** — 実際のソースファイルを参照
- **命令形で具体的に** — 「$props() を使用する」のように
- YAML frontmatter でパス条件を指定

## 移行手順

1. AGENTS.md を新規作成（約50行）
2. CLAUDE.md を import のみに縮小（約10行）
3. .claude/rules/ に4ファイル作成
4. .github/instructions/ を削除（8ファイル）
5. CONTRIBUTING.md に Codex 設定案内を追加予定（Codex 導入時に対応）

## CLAUDE.md から削除する項目

- ゲストアカウント情報（`guest`/`Hell0Guest`）→ README.md のみに記載
- 詳細なアーキテクチャ説明 → ソースコード参照
- バージョン番号 → package.json を直接確認
- コード例 → 実際のファイルを参照

---

## .github/instructions/ の有用コンテンツ分析

8ファイルを分析し、移管先を決定した。

### docs/guides/ に移管（人間向けドキュメント）

分析の結果、3ファイルとも移管不要と判断した。

| 元ファイル                     | 当初の移管先                            | 不要の理由                                                                 |
| ------------------------------ | --------------------------------------- | -------------------------------------------------------------------------- |
| source-code.instructions.md    | `docs/guides/naming-conventions.md`     | AGENTS.md の Key Conventions に記載済み                                    |
| authentication.instructions.md | `docs/guides/security-checklist.md`     | 旧ソースの認証フローが実態と乖離。`.claude/rules/auth.md` で基本カバー済み |
| docs.instructions.md           | `docs/guides/documentation-strategy.md` | 参照される見込みが低く、保守コストに見合わない                             |

### .claude/rules/ に圧縮して移管（エージェント向け）

| 元ファイル                    | 有用なセクション                   | 移管先                               |
| ----------------------------- | ---------------------------------- | ------------------------------------ |
| tests.instructions.md         | テスト種別テーブル、カバレッジ目標 | `.claude/rules/testing.md`           |
| ui-components.instructions.md | Svelte 5 Runes の使い方            | `.claude/rules/svelte-components.md` |

### 削除（陳腐化 or 価値低い）

| ファイル                        | 理由                                                                 |
| ------------------------------- | -------------------------------------------------------------------- |
| global.instructions.md          | 設定ファイル名が古い（`.eslintrc.cjs` → 実際は `eslint.config.mjs`） |
| ci.instructions.md              | 内容が薄い。`.github/workflows/` を見れば十分                        |
| performance-seo.instructions.md | コード例が多いがソースと乖離リスク                                   |
| ui-components.instructions.md   | バージョンテーブルが古い（Tailwind 3.x → 実際は 4.x）、635行は長すぎ |
| authentication.instructions.md  | 認証フロー図が実態と異なる（後述）                                   |

### 認証フロー図の調査結果

instructions に記載の認証フロー:

```
A[ユーザー登録] → B[AtCoder認証コード生成] → C[AtCoder側でコード確認]
→ D[認証ステータス更新] → E[セッション作成] → F[ログイン完了]
```

**実態**:

| ステップ                 | 状態                | 根拠                                                                                      |
| ------------------------ | ------------------- | ----------------------------------------------------------------------------------------- |
| A: ユーザー登録          | ✅ 機能             | Lucia v2 + Prisma で実装済み                                                              |
| B: AtCoder認証コード生成 | ⚠️ 実装済・UI非公開 | `validateApiService.generate()` 存在。ただし `AtCoderUserValidationForm` がコメントアウト |
| C: AtCoder側でコード確認 | ⚠️ 実装済・UI非公開 | `validateApiService.confirm()` 存在                                                       |
| D: 認証ステータス更新    | ⚠️ 実装済・UI非公開 | `validateApiService.validate()` 存在                                                      |
| E: セッション作成        | ✅ 機能             | Lucia v2 のセッション管理                                                                 |
| F: ログイン完了          | ✅ 機能             | `event.locals.user` にセット                                                              |

B〜D は「回答状況が正しく取得されないバグ」のため UI を非公開にしている（`users/edit/+page.svelte` のコメント参照）。

**結論**: 認証フロー図は実態と異なるため、docs への移管は行わず削除する。

---

## Q&A まとめ

### Q: 詳細ドキュメントを docs/guides/ に置くのはどうか？

**A**: エージェントは docs/ を自動で読み込まない。AGENTS.md / CLAUDE.md / .claude/rules/ のみ自動読み込み対象。docs/ にエージェント向け指示を置いても効果がない。

### Q: Codex の Skills と Rules の違いは？

**A**:

- **Skills** = エージェントの能力を拡張（新しいワークフロー、スクリプト）
- **Rules** = コマンドのセキュリティ制御（allow/prompt/forbidden）

Claude Code の `.claude/rules/` はこれらとは異なり、パス条件付きの指示ファイル。

### Q: .agents/skills/ を作成すべきか？

**A**: 現時点では不要。Codex 導入時に再検討。

### Q: AGENTS.md を CLAUDE.md から import vs 内容を複製？

**A**: `@AGENTS.md` で import。単一の情報源で保守性向上。

### Q: 命名規則の `I` prefix は使うか？

**A**: 使わない。実際のコードベースで使用されておらず、モダン TypeScript では非推奨。

### Q: Core Web Vitals 目標値は残すか？

**A**: 削除。performance-seo.instructions.md ごと削除。

### Q: 認証フロー図は docs に移管するか？

**A**: 削除。A, E, F のみ機能しており、B〜D は UI 非公開のため図が実態と異なる。

---

## 参考資料

- [AGENTS.md](https://agents.md/)
- [Manage Claude's memory](https://code.claude.com/docs/en/memory)
- [Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [mizchi/playwright.mbt](https://github.com/mizchi/playwright.mbt/blob/main/AGENTS.md)
- [mizchi/luna.mbt](https://github.com/mizchi/luna.mbt/blob/main/CLAUDE.md)

---

## 教訓

1. **AGENTS.md + CLAUDE.md の分離が効果的**: AGENTS.md（56行）をメインにし、CLAUDE.md（9行）は import のみにすることで、マルチエージェント対応と保守性向上を両立できた
2. **パス条件付きルールでオンデマンド読み込み**: `.claude/rules/` に分離することで、該当ファイル操作時のみ読み込まれ、コンテキスト消費を最小化
3. **古いドキュメントは削除が正解**: `.github/instructions/` は設定ファイル名やバージョンが古く、実態と乖離していた。部分的な移管より全削除の方が安全
4. **認証フロー図は実態と異なっていた**: ドキュメントの図と実装が乖離していたため、移管せず削除。コードが正
5. **コード例はドキュメントに書かない**: 実際のソースファイルを参照させる方が、乖離リスクがなく保守コストも低い
