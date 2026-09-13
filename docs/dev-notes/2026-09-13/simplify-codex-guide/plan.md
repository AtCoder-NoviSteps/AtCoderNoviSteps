# Codex設定ガイドの簡素化

## 方針

文書レイヤの `docs/guides/codex.md` を、設定の正本・状態保存・実行権限・動作確認に絞る。既存の `AGENTS.md`、`CONTRIBUTING.md`、Codex設定とdevcontainer設定を確認済み。ユーザーの簡素化指示に従い実施する。

## フェーズ

1. 重複した正本の説明、過去のコピー方式の経緯、共通規約の再説明を削る。
2. trust、永続化、秘密情報保護、sandboxと確認command、SSH / MCP方針を短くまとめる。
3. 原文との意味の対応、参照先、Prettier、`git diff --check` を確認する。検証名は `codex guide consistency check`。文書のみのためunit testは不要。

## 却下案

設定fileへのリンクだけに置き換える案は、利用者に必要な前提と動作確認手順が失われるため採用しない。
