# Codex共通設定の原本への一本化

## 概要と方針

ユーザーの「原本だけで管理して」という実装指示に従い、Git管理する共通設定は `.codex/config.toml` のみとする。過去にコピーした `$CODEX_HOME/config.toml` の共通設定を削除し、個人のmodel設定、trust、TUI状態を保持する。

対象レイヤは開発環境設定と文書。既存のsetup scriptとguideを検索し、コピー処理は既に無いことを確認した。アプリケーションのutil/service追加は不要。検証名は `project config single source validation`。分岐を追加しない設定整理のためtest-firstは省略し、TOMLの構造比較で削除対象と保持対象を検証する。

## フェーズ

1. **低リスク・比較**: 原本とuser configの `approval_policy`、`default_permissions`、`permissions`、`shell_environment_policy` が完全一致することを確認し、それらだけを除いた変更候補を作る。
2. **設定整理**: 元fileが比較時点から変わっていないことを確認して候補を反映する。user configはworkspace外にあるため、書き込みには実行環境の権限昇格を使用する。
3. **検証と文書**: user configの残りの値が全て保持され、原本が不変であることを確認する。guideと既存の検証記録へ結果を反映し、対象文書のformatと差分を検証する。

## 設計理由と却下案

Codexの既存project config layerを利用すればコピー同期は不要である。repository内の追加のlocal設定、コピー処理の復活、恒久的な移行scriptは追加しない。user config全削除はtrustと個人設定まで失うため採用しない。

## 結果

- 共通設定4項目は両fileで完全一致し、候補のTOMLがそれらだけを削除していることを構造比較で確認した。保持対象は `model`、`model_reasoning_effort`、`projects`、`tui`。
- 権限昇格付きで反映を試したが、`/home/node/.codex` がread-onlyのため、一時fileの作成時点で失敗した。user configと原本はいずれも変更されていないことをhashで確認した。
- guideに共通設定の編集・管理先を原本だけとする方針を明記した。Git管理する追加設定や恒久的な移行scriptは作成していない。
- 一回限りの反映scriptを `/tmp/codex-config-cleanup-t67dqage/apply.py` に用意した。原本・user configの変更検出、TOML構造比較、`0600` でのatomic replacement、反映後の検証を行う。元fileの控えと候補は同じprivate temporary directoryにある。
- **2026-09-13 再確認**: user configは検証済み候補とTOML構造が完全一致し、共通設定4項目の重複がなく、model・trust・TUI設定が全て保持されていた。原本のhashも不変。この確認までに外部から変更されており、agentによる書き込み成功とは扱わない。ユーザーの指示により追加のcleanupは行わない。原本への一本化の整理は完了し、CLI / IDEの実効設定の由来の検証は別途未実施。
