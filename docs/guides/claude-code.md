# Claude Code 設定ガイド

共通規約とrules / skillsの利用方法は [AGENTS.md](../../AGENTS.md) を参照する。

## 設定と保存先

- project共通設定は原本 [.claude/settings.json](../../.claude/settings.json) だけで管理し、sandboxとdenyを定義する。個人設定と環境固有の緩和は `.claude/settings.local.json` へ置き、Gitとdocker build contextに含めない。
- `CLAUDE.md` は `AGENTS.md` をimportし、Claude固有の入口だけを定義する。
- `.claude/rules/` は `docs/guides/agent-rules/` の共通本文へのsymlinkで、`paths` frontmatterでpathごとに読み込む。`coding-style.md` は計画時にも必要なため常時適用する。
- `.claude/skills/` は `.agents/skills/` の共通skillへのsymlinkで、project固有workflowを必要な時だけ読み込む。本文をLLM別に複製しない。
- devcontainerではhostの `~/.claude` を `/home/node/.claude`（`CLAUDE_CONFIG_DIR`）へmountし、認証やsessionをrebuild後も保持する。

## 実行権限

sandboxは有効化し、利用できない場合のunsandboxed実行へのfallbackを禁止する。具体的なdeny対象は原本を参照し、`.codex/config.toml` と揃える。denyはsandbox層（`sandbox.filesystem.denyRead`）とRead tool層（`permissions.deny`）の両方へ書く。sandboxはbash経路しか止めない。

`.claude/settings.json` はGit管理されproject scopeで適用されるため、denyはdevcontainerだけでなくhost cloneやcloud agentにも効く。devcontainerに存在しない秘密でも、他環境で実在するものはdenyを外さない。

Linux sandboxには `bubblewrap` を使い、Dockerfileで導入する。SSH秘密鍵はmountせず、hostの `ssh-agent` からDev Containersのagent forwardingを使う。projectのMCP serverは登録しない。

## Skillsとplugin

project固有skillの正本は `.agents/skills/` に置く。Superpowersはproject設定で自動導入せず、必要な利用者だけがuser scopeで導入する。標準のplan / review / subagent機能で足りない場合は、重複の少ない `systematic-debugging` や `verification-before-completion` を個別に検討する。

## 動作確認

設定変更後はdummy secretだけを使って検証し、実credentialの内容は表示しない。`.env` とmountされる認証fileのreadが、bash経路とRead tool経路の両方で拒否されることを確認する。

## 参考

- [Claude Code settings](https://docs.anthropic.com/en/docs/claude-code/settings)
- [Claude Code sandboxing](https://docs.anthropic.com/en/docs/claude-code/sandboxing)
