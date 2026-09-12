# Claude Code 設定ガイド

共通の開発規約はルートの `AGENTS.md` を参照する。この文書は Claude Code 固有の設定だけを扱う。

## 読み込む設定

- `CLAUDE.md` は `AGENTS.md` を import し、Claude 固有の入口だけを定義する。
- `.claude/rules/*.md` は `docs/guides/agent-rules/` の共通本文への symlink である。path ごとの補足規約を定義し、`coding-style.md` は計画時にも必要なため常時読み込む。
- `.claude/skills/` は `.agents/skills/` の共通 skill への symlink である。project 固有の繰り返し workflow を必要な時だけ読み込む。
- `.claude/settings.json` は sandbox と deny rules を repository 共通設定として定義する。
- `.claude/settings.local.json` は個人設定であり、Git と Docker build context に含めない。

## sandbox と credential

Claude sandbox は有効化し、sandbox が利用できない場合の unsandboxed fallback を禁止する。workspace 内の `.env*`、mount される Claude credential file、`~/.ssh`、`secrets/**` や `*.pem` などの秘密鍵 pattern は read deny にする。

`.claude/settings.json` は Git 管理され project scope で適用されるため、deny は devcontainer だけでなく host clone や cloud agent にも効く。devcontainer に存在しない秘密でも、他環境で実在するものは deny を外さない。環境固有の緩和は `.claude/settings.local.json` へ置く。

Linux container には sandbox 実行基盤として `bubblewrap` を入れる。設定変更後は dummy secret だけを使って deny を検証し、実 credential の内容を表示しない。

## Skills と Superpowers

project 固有 skill の正本は `.agents/skills/` に置く。Superpowers は project 設定で自動導入せず、必要な利用者だけが user scope で導入する。標準の plan / review / subagent 機能で足りない場合は、重複の少ない `systematic-debugging` や `verification-before-completion` を個別に検討する。

## 参考

- [Claude Code settings](https://docs.anthropic.com/en/docs/claude-code/settings)
- [Claude Code sandboxing](https://docs.anthropic.com/en/docs/claude-code/sandboxing)
