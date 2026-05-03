# RTK導入 & postCreateCommand のシェルスクリプト分離

## Context

現在 `devcontainer.json` の `postCreateCommand` にインライン文字列でツールインストールを記述しており、コメントやエラーハンドリングが書きにくい。AtCoderClans PR #11994 を参考に、以下2点を実施する。

1. `postCreateCommand` をシェルスクリプト `.devcontainer/setup-devcontainer.sh` に分離
2. RTK（Rust Token Killer）をそのスクリプト内でインストール・初期化

## 変更ファイル

- `.devcontainer/devcontainer.json` — features に gh CLI 追加、postCreateCommand を1行に短縮
- `.devcontainer/setup-devcontainer.sh` — 新規作成
- `.claude/settings.json` — gh の不可逆操作を deny に追加
- `CONTRIBUTING.md` — `### AI 支援ツール` セクションに RTK を追記

## 実装内容

### `.devcontainer/setup-devcontainer.sh`（新規）

```bash
#!/bin/bash
set -euo pipefail

# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Install CodeRabbit CLI (continue if fails)
curl -fsSL https://cli.coderabbit.ai/install.sh | sh || echo 'CodeRabbit CLI installation failed, continuing...'

# Install RTK — token optimization proxy for AI coding assistants (60-90% reduction)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh
rtk init -g --auto-patch

# Install project dependencies
pnpm install
```

### `.devcontainer/devcontainer.json`

`features` を追加（コメントアウト済みの行を置き換え）し、`postCreateCommand` を短縮:

```json
"features": {
  "ghcr.io/devcontainers/features/github-cli:1": {}
},
"postCreateCommand": "bash .devcontainer/setup-devcontainer.sh",
```

> gh CLI はコンテナビルド時に root 権限で features が入れるため、`setup-devcontainer.sh`（node ユーザー）では不要。

## 設計上の判断

- `set -euo pipefail` で途中失敗を即停止（デバッグしやすい）
- CodeRabbit CLI は `|| echo ...` で失敗を許容（既存の挙動を維持）
- RTK インストール後 `rtk init -g --auto-patch` でグローバル Claude Code フックを自動パッチ
  - `~/.claude` はボリュームマウントされるため、フック設定はコンテナ再作成後も永続する

### `.claude/settings.json` — `permissions.deny` に追記

`git push` は既存で deny 済み。gh CLI の不可逆操作を追加する:

```json
"Bash(gh pr merge *)",
"Bash(gh pr close *)",
"Bash(gh issue close *)",
"Bash(gh issue delete *)",
"Bash(gh release create *)",
"Bash(gh release delete *)",
"Bash(gh repo delete *)"
```

> `gh pr create` は可逆（close で取り消せる）のため deny 対象外。

### `CONTRIBUTING.md` — `### AI 支援ツール` セクション（71行目付近）

```markdown
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) - AI コーディングアシスタント（VS Code 拡張: `anthropic.claude-code`）
  - [superpowers plugin](https://github.com/obra/superpowers) - `/writing-plans` スキルによる実装前の詳細計画生成
  - [RTK](https://github.com/rtk-ai/rtk) - AI コーディングアシスタント向けトークン最適化プロキシ（60–90% 削減）
```

## 検証

コンテナを再作成して以下を確認:

```bash
which rtk        # rtk が PATH にある
rtk --version    # バージョンが表示される
rtk gain         # トークン削減量が表示される
which gh         # gh が PATH にある
gh --version     # バージョンが表示される
```
