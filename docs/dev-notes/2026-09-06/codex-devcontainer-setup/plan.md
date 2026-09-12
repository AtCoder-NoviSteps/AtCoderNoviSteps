# devcontainer で Claude Code / Codex を安全に共存させる計画

## 概要

devcontainer で Claude Code と Codex のどちらも利用できる状態を維持しつつ、秘密情報・認証状態は分離し、開発規約とproject固有skillは単一ソースから共有する。

本計画の対象は devcontainer、`.claude/settings.json`、`.codex/config.toml`、`AGENTS.md`、共通rules / skills、`CONTRIBUTING.md`、`docs/guides/` の関連文書である。アプリケーション、DB、GitHub → Vercel のデプロイ方式は変更しない。

実装済みの未コミット変更（setup scriptの `@openai/codex` とVS Code拡張 `openai.chatgpt`）は維持する。

## 確定した方針

- Claude Code / Codex の両方を `postCreateCommand` でインストールする。
- 片方のインストール失敗だけで devcontainer の準備全体を止めない。
- CLI を Dockerfile へ移さない。月単位のモデル性能変化に対応しやすくする。
- Codex の Linux sandbox に必要な `bubblewrap` と container runtime 権限は、OpenAI 公式の secure devcontainer 構成を基準に image / compose で用意する。
- RTK は agent 非依存の CLI としてインストールを検証し、失敗を成功扱いにしない。`rtk init` による agent 統合とは別の完了条件として扱う。
- Codex の状態はプロジェクト専用の `~/.codex-devcontainer/AtCoderNoviSteps` に分離する。
- Codexのproject設定はGit管理する `.codex/config.toml` を正本とし、`CODEX_HOME/config.toml` へread-only bind mountして直接適用する。
- `~/.ssh` は mount せず、VS Code Dev Containers の SSH agent forwarding を使う。
- `.env` はローカル実行用として残すが、Docker image には含めず、agent からの読み取りも拒否する。
- rules本文は `docs/guides/agent-rules/`、project固有skillは `.agents/skills` を正本として両agentで共有する。
- planとdev noteは幅による手動改行を入れず、意味上の段落・箇条書き単位で記述してeditorのsoft wrapを使う。
- MCP は導入しない。現在も project / user 設定に MCP server は登録されていない。
- クロスレビューは通常任意とし、大規模または重要な変更だけ必須にする。
- 実装開始には、この計画とは別にユーザーの明示承認が必要である。

## 現状と問題

| 対象              | 現状                                              | 対応                                                 |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------- |
| CLI               | setup script が両CLIを直列に必須インストール      | 各CLIの失敗を分離する                                |
| Codex状態         | 永続化・分離されていない                          | project専用 `CODEX_HOME` をmount                     |
| Codex設定         | repository管理のproject設定がない                 | `.codex/config.toml` を追加                          |
| SSH               | host `~/.ssh` をread-write mount                  | mountを削除しagent forwardingへ移行                  |
| `.env`            | `COPY .` の対象になり得る                         | `.dockerignore` で除外し、agentのreadもdeny          |
| Claude sandbox    | 利用不能時のfail-closedが未設定                   | 明示的な失敗設定を追加                               |
| Superpowers       | project設定で旧marketplaceを有効化                | project設定から削除                                  |
| `AGENTS.md`       | 6,729 bytes。32 KiB上限には余裕があるが手順が重い | 必須事項だけへ縮小                                   |
| Claude rules      | 11ファイル、約43 KiB。Codexから参照できない       | `docs/guides/agent-rules/` を正本として両agentで共有 |
| Claude skills     | 6件、約20 KiB。Codexから利用できない              | 共通skillを `.agents/skills` へ移す                  |
| `architecture.md` | 現行規約と将来案が混在                            | 同じファイル内で明確に分離                           |

ホストの `~/.codex/config.toml` にあるmacOSの絶対pathは、コンテナの `/usr/src/app` のtrust設定には一致しない。また、通常利用とcontainer利用でsession・log・SQLite状態を同時共有する必要もない。このため、hostの `~/.codex` 全体はmountしない。

## 設計

### 1. agentの状態と秘密情報

- host `~/.codex-devcontainer/AtCoderNoviSteps` をcontainer `/home/node/.codex` へmountし、認証、session、log、SQLiteなどの永続状態だけを保持
- `CODEX_HOME=/home/node/.codex`
- host directoryは `0700`、認証ファイルは `0600`
- Codexのproject設定はrepositoryの `.codex/config.toml` を正本とし、`CODEX_HOME/config.toml` へread-only bind mountする（Codexが読むのはCODEX_HOME側だけであるため）。実効設定を原本そのものに固定し、CodexによるUI状態やtrust状態の追記を許可しない。
- API keyやtokenを `containerEnv` やGit管理ファイルへ書かない

`.env` には二段階で対応する。

1. `.dockerignore` で `.env`、`.env.*`、`.claude/settings.local.json`、`.git` をbuild contextから除外する。ただし `.env.example` は残す。
2. `.claude/settings.json` と `.codex/config.toml` のfilesystem permissionで `.env*` のreadをdenyする。

二段階の役割は別である。`.dockerignore` が防ぐのはimage layerへの焼き込みだけで、container内からの参照は防がない。`compose.yaml` は `.:/usr/src/app` をbind mountするため、`.env` はimageに無くてもcontainerのfilesystemには存在する。したがって完了条件の「`.env` がDocker imageへ入らない」はimage配布時の話であり、「agentが読めない」を担保するのは2のdenyだけである。`.git` の除外も同じ理由でsecurity効果はなく、build contextの削減だけを目的とする。

アプリ自身はbind mount経由でローカルの `.env` を利用できる。agent経由で実行したcommandが `.env` を必要とする場合は失敗するため、検証用には秘密を含まないtest環境を使う。

denyの範囲は設定ファイルのscopeに合わせる。`.claude/settings.json` はGit管理されproject scopeで適用されるため、このdevcontainerだけでなくhost clone、Codespaces、cloud agentにも効く。したがってdevcontainerに存在しない秘密でも、それらの環境で実在するものはdenyを維持する。具体的には `~/.ssh` と `secrets/**`、`config/credentials.json`、`*.pem`、`*.key` を残し、Claudeのcredential file（`~/.claude` をmountするため）と `.env*` を追加する。

当初はdevcontainerで実際に公開される秘密だけへ絞る方針だったが、判断の前提がdevcontainer限定である一方で設定の適用範囲はproject全体であり不一致が生じるため、クロスレビューを受けて撤回した。詳細は「クロスレビュー findings」の2を参照。

一方、どの環境でも利用しない `~/.aws`、`~/.npmrc`、`~/.netrc`、`~/.git-credentials`、cloud / package registry tokenは追加しない。GitHub CLIのcredential fileやtokenはruntimeで公開されることを確認できた場合だけdeny / filterする。devcontainer固有の緩和が必要になった場合は、project scopeを広げずに `.claude/settings.local.json` へ置く。

### 2. CLIとsandbox

- Claude Code / Codex はsetup scriptで個別にインストールする。
- 片方の失敗は警告して継続するが、`pnpm install` の失敗は通常どおり停止する。
- Claudeはsandboxを必須にし、利用不能時にunsandboxed実行へfallbackさせない。
- Claudeは `.claude/settings.json`、Codexは `.codex/config.toml` でproject共通のsandbox / permissionを定義する。
- Codexが子processへ渡す環境変数は、devcontainerで実際に利用する変数を基準に必要最小限にする。未使用providerのtoken filterを網羅的に追加しない。

SSH秘密鍵はcontainerへ見せない。hostの `ssh-agent` が動作していれば、Dev Containers拡張が接続を自動転送する。

mountを外した代償として、hostの `ssh-agent` への鍵登録が前提条件になる。従来はmountした鍵ファイルをcontainerから直接読めたため不要だった手順であり、未登録だとcontainer内のGit操作が `Permission denied (publickey)` で失敗する。`ssh-agent` はhost側のプロセスなのでcontainerのrebuildでは再登録は不要で、必要になるのはhost再起動時だけである。手順は `CONTRIBUTING.md` に記載する。

この構成が防ぐのは鍵の複製であり、署名の依頼ではない。SSHの認証protocolには秘密鍵を運ぶmessageが存在しないため、悪意あるserverが要求しても鍵そのものは流れない。流出経路は鍵ファイルを直接読めるprocessが別経路で送り出す場合に限られ、containerに鍵ファイルを置かないことでその経路も塞がる。

一方、転送が有効な間はsocketへ到達できるcontainer内のprocessが署名を依頼できる。containerが侵害された場合、鍵を盗まれることはないが、その間はuserとして認証され得る。ただし複製と違い被害は一時的で、socketが切れた時点で終わる。read-only mountを却下した理由はこの差にある（却下案 4）。

| 方式             | 鍵の複製                      | 署名の依頼       |
| ---------------- | ----------------------------- | ---------------- |
| `~/.ssh` をmount | 可能。mount解除後も悪用が続く | 可能             |
| agent forwarding | 不可能                        | 可能。転送中のみ |

署名依頼そのものを絞る必要が生じた場合は、`ssh-add -c`（署名ごとに確認）や `ssh-add -t <life>`（自動失効）を各利用者の判断で使う。projectとしては強制せず、既定では利便性を採る。

### 3. 指示・rules・skills

`AGENTS.md` は両agent向けの基本指示、`CONTRIBUTING.md` は人間向けの共通workflowとする。詳細なパス別規約は `docs/guides/agent-rules/`、project固有skillは `.agents/skills` を単一ソースとする。

Claude Codeの `.claude/rules` には `paths` frontmatterと共通rules本文への参照だけを置き、`.claude/skills` から `.agents/skills` の正本を参照する。Codexは `.agents/skills` をproject skillとして利用し、`AGENTS.md` のpath対応表に従って、計画・変更前に `docs/guides/agent-rules/` の該当文書を読む。常時適用する規約も `AGENTS.md` から明示する。rules本文やskill本文を製品別に複製しない。`.codex/rules` はcommand実行の許可・確認・禁止を制御する場所であり、開発規約の格納や参照には使わない。

`claude-code.md` / `codex.md` は製品固有設定だけを扱い、`CLAUDE.md` はimport、共通rules / skillsへの参照方法、Claude固有事項に限定する。

`AGENTS.md` に残すもの:

- project固有のarchitecture境界と主要command
- TDD、既存実装の探索、plan承認と実装承認の分離
- planを簡潔に保ちつつ設計判断を省略せず、新機能では主要な関数・interfaceの予定signatureとcomponentのprops・events contractを示す
- service / route / testの重要な規約
- 対象pathに対応する `docs/guides/agent-rules/` の文書を読む手順
- project固有workflowに `.agents/skills` を利用する方針
- クロスレビュー条件

削除・簡素化するもの:

- 一般的な会話姿勢や現行agentに重複する品質論
- 全phase後の必須refactor cycle
- `/session-close` の必須実行
- CodeRabbit findingsの全件転記

共有rules / skillsは次のように整理する。

- `coding-style.md` はplan作成時にも必要なため常時適用を維持する。
- formatter / linterで強制できる書式規則は設定へ移し、文章から減らす。
- `testing.md` はunit test、`testing-e2e.md` はE2Eだけに適用し、共通事項は最小限にする。
- Vitestの `clearMocks` defaultに関する記述はHEAD時点で正しかった（v5 default は `true`）。誤記という当初の前提が誤りだったため、書き換えずに維持する。
- ほぼ未使用で重量級の `session-close` と `refactor-plan` を削除する。
- 維持するproject固有skillは `.agents/skills` へ移し、Claude / Codexの両方から同じ本文を参照する。

Codex固有設定は共通指示・rules・skillsとは分離して次を管理する。

- repositoryの `.codex/config.toml`: project共通のsandbox、permission、必要最小限の環境変数policy
- project専用 `CODEX_HOME`: 認証、session、log、SQLiteなどGit管理しない永続状態
- Codex CLIとVS Code拡張
- `docs/guides/codex.md`: Codex固有のsetupと設定の責務

### Superpowersの扱い

現在はClaude / CodexともPlan mode、Skills、subagent、worktree、review機能を標準で備えるため、Superpowers全体のproject-level自動導入は行わず、`CLAUDE_CODE_PLUGIN_SEED_DIR` も追加しない。チーム品質は `AGENTS.md`、CI、test、クロスレビューで担保し、各利用者の任意導入とする。個別に利用する場合は、標準機能との重複が比較的少ない `systematic-debugging` と `verification-before-completion` を候補にする。

### 4. architecture文書

`docs/guides/architecture.md` は削除せず、同じファイル内を「現在の構成・規約」と「将来案・未実装」に分ける。

修正内容:

- `admin`、`user-profile` など未実装のfeature構成を将来案へ移す。
- `src/lib/services` は意図した現行配置として記載する。
- `_components/`、`_types/`、`_utils/` は、admin page単独の責務かつ認証・認可の事情がある場合のroute colocation例外として明記する。
- すでに反映済みのVitest include設定を将来タスクから現状説明へ移す。
- 現在のdirectory treeと実ファイルが一致することを確認する。

### 5. クロスレビュー

ローカル作業中は必要なときに明示実行する。PR作成前は、AI主導の非軽微な変更または次のいずれかに該当する変更で必須とする。

- 手編集したsource・test・設定が30ファイル以上
- 認証、認可、秘密情報を変更
- DB schema、migration、データ変換を変更
- 共通architectureまたは公開interfaceを変更

誤字修正、formatのみ、生成物、lockfile、snapshotだけの変更は軽微とし、30ファイルの集計からも除外する。

- Codexが計画・実装した場合: Claudeでレビュー
- Claudeが計画・実装した場合: Codexでレビュー
- 他方agentを利用できない場合はCodeRabbitで代用する。利用可能でもtoken残量が厳しい場合の補助にしてよい
- CodeRabbit findingsをplanへ残す場合は `Critical` / `Severe` 相当を優先し、低重要度の全件転記はしない
- findingの修正は自動で行わず、ユーザーが選ぶ

## 却下した代替案

1. **hostの `~/.codex` をそのままmount**: trust pathが一致せず、状態の同時利用も避けたい。
2. **全project共通の `~/.codex-devcontainer`**: 設定は楽だが、trust・session・SQLiteの影響範囲が広い。
3. **CLIをDockerfileへ移す**: image rebuildが必要になり、agentの更新・切替が重くなる。
4. **`~/.ssh` をread-only mount**: writeは防げるが、秘密鍵自体はcontainerから見えるため複製できる。agent forwardingなら複製は不可能で、残るリスクは転送中の署名依頼だけになる。設計 §2 を参照。
5. **Superpowersをimageへseed**: Claude利用者だけが必要な任意機能を全員へ配布することになる。
6. **rules / skills本文をClaude用とCodex用に複製**: 更新先が増えて内容が乖離する。rulesは `docs/guides/agent-rules/`、skillsは `.agents/skills` を単一ソースとし、Claude側は参照だけを持つ。
7. **~~Codex設定を `CODEX_HOME/config.toml` へ初回copy~~（撤回）**: 初回のみのcopyでは既存環境へ更新が反映されず乖離する。実測で `CODEX_HOME` が唯一の読込先と判明した後はsetupごとの上書きcopyを一時採用したが、Codex自身による追記で再び乖離したため、最終的にread-only bind mountへ置き換えた。
8. **~~未使用credentialの包括denyを外す~~（撤回）**: devcontainerに実在しない秘密の列挙は設定を読みにくくすると判断して既存denyを外したが、`.claude/settings.json` はproject scopeで host clone や cloud agent にも適用されるため撤回し、HEAD時点のdenyを復帰させた。
9. **MCPを先行導入**: 現在のCLIと公式連携で足りており、認証・常駐process・供給網リスクだけが増える。
10. **毎回クロスレビュー**: 小変更でもtokenと待ち時間を消費する。
11. **`CODEX_HOME/config.toml` へのcopy**: Codexがcopy先へ動的状態を追記し、Git管理の原本と実効設定が乖離する。
12. **copy後の `chmod 400`**: file ownerであるCodex process自身が権限を戻せるため、書き込み禁止の境界にならない。

## 実装フェーズ

### Phase 1: 文書とagent規約の整理

対象: `AGENTS.md`、`docs/guides/agent-rules/`、`.agents/skills`、`.claude/rules`、`.claude/skills`、`CONTRIBUTING.md`、`docs/guides/`

- [x] `AGENTS.md` を必須事項とクロスレビュー条件へ縮小し、Codexが対象pathに対応する `docs/guides/agent-rules/` の文書を読む指示と `.agents/skills` の利用方針を追加し、planの機械的な行数基準を削除し、簡潔さ、設計判断の保持、新機能の予定signature、Markdownのsoft wrapを明記する。
- [x] rules本文の正本を `docs/guides/agent-rules/` へ移し、Claude側は `.claude/rules` の薄いpath別エントリから、Codex側は `AGENTS.md` のpath対応表から同じ文書を参照する。unit / E2Eの適用範囲も直す。Vitest `clearMocks` は元の記述が正しいため変更しない。
- [x] 維持するproject固有skillを `.agents/skills` へ移し、Claude側は `.claude/skills` から同じファイルを参照する。`session-close` と `refactor-plan` は削除する。
- [x] `architecture.md` を現状と将来案に分け、実装状況と整合させ、ProviderガイドのClaude専用参照を共通規約へ変更する。
- [x] `CONTRIBUTING.md` に両agent共通の選択利用・PR前reviewを簡潔に記載する。`claude-code.md` はClaude固有設定だけへ縮小し、同程度の `codex.md` を追加する。Superpowersの任意性とCodeRabbit代用も重複なく配置する。
- [x] `CONTRIBUTING.md` に、host側で `ssh-agent` へ鍵を登録する手順とトラブルシューティングを追加する。`~/.ssh` のmountを外した結果、従来は不要だった前提が必要になったため。
- [x] 検証 `agent docs consistency check`: 両agentからのrules / skills参照、frontmatter、link、path、重複、file size、実directoryとの差を確認する。

Phase summary: 現行モデルでも必要なproject固有規約だけを残し、未実装案を失わずに分離する。

### Phase 2: devcontainerの安全性と任意性を改善

対象: `.devcontainer/`、`Dockerfile`、`.dockerignore`、`.claude/settings.json`、`.codex/config.toml`、`.github/workflows/ci.yml`

- [x] project専用 `CODEX_HOME` を認証・session・log・SQLiteの永続状態用として作成・mountする。
- [x] `.codex/config.toml` をGit管理のproject設定として追加し、`.devcontainer/codex-config.toml` の初回copy方式は廃止する。
- [x] `~/.ssh` mountを削除し、SSH agent forwardingへ移行する。
- [x] `.dockerignore` から秘密情報とGit metadataを除外する。
- [x] 両CLIをsetup scriptに残し、各install失敗を非block化する。
- [x] VS CodeのMarkdown設定でsoft wrapを有効にする。
- [x] Claudeのfail-closed設定を追加する。
- [x] CodexのLinux sandbox用に `bubblewrap` とcontainer runtime権限を追加する（「`bubblewrap` 削除判断の撤回」を参照）。
- [x] Claude / Codexで `.env*` とmount・公開されるcredentialのreadをdenyし、project scopeで効く既存denyは維持する。どの環境でも使わないAWS / npm / cloud設定は追加しない。
- [x] projectのSuperpowers marketplace設定を削除する。
- [x] MCP設定を追加しない。
- [x] CIに `pnpm check` job を追加する。当初は計画外だったが、`AGENTS.md` と `CONTRIBUTING.md` が「CI は build / lint / check / unit test」と記述する以上、CI側を合わせる必要があるため計画へ取り込んだ。この変更は Codex が着手し rate limit で中断した分で、`.github/workflows/**` の path rule 確認を経ていない。`svelte-check` は warning では非0終了しないため、現状の 0 errors / 30 warnings では job は通過する。
- [x] 検証 `devcontainer configuration validation`: JSON / TOML / shell構文、project configの読込、permission対象の実在性を確認する。

Phase summary: どちらかのagentが利用不能でも開発環境を作れ、利用時は秘密情報を読めない構成にする。

### Phase 3: clean rebuildと動作確認

対象: devcontainer runtime。アプリコード変更なし。

- [x] clean rebuild後にproject依存のinstallと開発server起動を確認する。host側で rebuild し、`pnpm install` 完了と `pnpm dev` によるローカルserver起動を確認した。
- [x] Claude CLI / VS Code拡張とCodex VS Code拡張の起動を個別に確認する。
- [ ] Codex CLIでfresh sessionを開始できることを確認する。現状は `thread/start` 時のsandbox helper初期化に失敗する。
- [x] 片方のCLI install失敗が全体を停止しないことを確認する。
- [x] Codex CLI / IDE拡張がproject専用 `CODEX_HOME` を共有することを確認する。
- [ ] Codex CLI / IDE拡張がrepositoryの `.codex/config.toml` をread-only mount経由でproject設定として読み込むことを確認する。設定は変更済みで、次回rebuild後の実測待ち。
- [x] Claude Code / Codexが同じrules本文とproject固有skillsを利用できることを確認する。Claude側は symlink 解決、Codex側は `codex debug prompt-input` の skill roots で確認した。
- [x] hostの通常の `~/.codex` と `~/.ssh` がcontainerへ公開されていないことを確認する。
- [x] Claudeでdummy secretの `.env` read拒否とsandbox fail-closedを確認する。実際の秘密は表示しない。
- [ ] Codexでdummy secretの `.env` read拒否を確認する。現状はsandbox helper自体が初期化できないため未確認。
- [ ] RTK CLIがPATH上に存在し、`rtk --version` と `rtk gain` が成功することを確認する。現状は `command not found`。
- [x] SSH agent forwarding経由でGitHubへのread-only接続を確認する。container内に秘密鍵が存在しない状態で `ssh -T git@github.com` が認証され、`git ls-remote origin HEAD` が成功した。
- [x] `pnpm format`、`pnpm lint`、`git diff --check` を実行する。

Phase summary: install、永続状態、SSH、sandbox、秘密情報保護を実環境で確認する。

### Phase 3 検証結果

container 内で確認できた項目の実測値。

| 項目                   | 結果                                                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI                    | `claude` は起動確認済み。`codex` はPATH上に存在するがfresh sessionの `thread/start` でsandbox helper初期化に失敗。`rtk` と `coderabbit` はinstall失敗で不在                              |
| VS Code拡張            | `anthropic.claude-code` と `openai.chatgpt` の両方がcontainerにinstall済みで、起動確認済み                                                                                               |
| install失敗の非block化 | `coderabbit` の install が失敗しても他CLIと `pnpm install` は完了。`npm` 失敗を模した `set -euo pipefail` 下の simulation も exit 0                                                      |
| `CODEX_HOME`           | `/home/node/.codex`。`codex doctor` の state / log / goals / memories DB が全て同 directory 下にあり、CLIとIDE拡張が同じ永続状態を共有                                                   |
| project設定の読込      | copy方式では11件 / 8件 / depth 8の読込を確認したが、Codexによる動的追記を許した。read-only bind mountへ変更済みで、次回rebuild後の実測待ち                                                     |
| rules共有              | `.claude/rules` 11件の symlink が全て `docs/guides/agent-rules/` の正本へ解決。Codex側は `AGENTS.md` の path 対応表から同じ正本を読む                                                    |
| skills共有             | `codex debug prompt-input` の skill roots が `r1 = /usr/src/app/.agents/skills` を含み、project固有skill 4件が全て列挙される。Claude側は `.claude/skills` の symlink 4件が同じ正本へ解決 |
| host状態の非公開       | 秘密鍵は不在。`~/.ssh` には検証時に生成された `known_hosts` のみで、rebuildで消える。`~/.codex` はproject専用 directory のみ                                                             |
| SSH agent forwarding   | container内に秘密鍵が無い状態で `ssh -T git@github.com` が認証され、`git ls-remote origin HEAD` が成功                                                                                   |
| `.env` read拒否        | Claudeは拒否を確認済み。Codexはsandbox helper自体が初期化できないため、設定のrule数だけでは機能確認済みと扱わない                                                                        |
| 機械的gate             | `pnpm exec prettier --check`（in-scope分）、`oxlint`、`eslint`、`pnpm check`（0 errors / 30 warnings）、`git diff --check` が通過                                                        |

`pnpm lint` は未追跡かつ本PR範囲外の `docs/dev-notes/2026-08-01/contest-discussion-automation-review/qa.md` 1件だけで失敗する。prettierが整形結果を収束させられないファイルで、本PRのcommit対象に含めないため対応しない。

### SSH agent forwarding の確認結果

container 内に秘密鍵が無い状態（`~/.ssh` は `known_hosts` のみ）で `ssh -T git@github.com` の認証と `git ls-remote origin HEAD` が成功し、設計 §2 の成立条件を満たしている。`git push` は read-only 方針かつ `.claude/settings.json` で deny しているため検証に含めない。

つまずいた点と対処は `CONTRIBUTING.md` の「(SSH で GitHub を利用する場合) ホスト側で鍵を ssh-agent へ登録」に記載した。要点は、`AddKeysToAgent yes` は host で `ssh` を実行したときだけ発火し、container 発の接続では自動登録が起きないこと。host で一度 `ssh -T git@github.com` を実行すれば転送済み socket 経由で container からも見える（rebuild 不要）。

### `bubblewrap` 削除判断の撤回

Dockerfile へ sandbox 実行基盤として追加した際、container 内で次の失敗を確認して削除していた。

```text
$ bwrap --unshare-user --dev-bind / / true
bwrap: No permissions to create a new namespace, likely because the kernel does not allow non-privileged user namespaces.
```

compose の web service は Docker 既定の seccomp profile で起動し effective capability を持たないため、unprivileged user namespace を作れない。この実測が示すのは `bubblewrap` が不要ということではなく、container runtime の条件が不足していることである。

OpenAI 公式文書は Linux / WSL2 の sandbox 前提として `bubblewrap` を指定している。OpenAI 公式 Codex repository の secure devcontainer も、非root userでnested sandboxを構築するため、setuid `bubblewrap`、必要なcapability、Docker外側のseccomp / AppArmor緩和を組み合わせている。Codex CLI 0.154.0 は同じ不足によりsandbox helperが初期化できず、`thread/start` に失敗した。VS Code拡張は起動確認済みである。

`approval_policy` はsandbox境界の外へ出る際の確認方針であり、filesystem denyを実装するsandboxの代替にはならない。`danger-full-access` はこのcontainerから見える `.env`、認証情報、SSH agent socketをCodexにも公開するため採用しない。

修正は低riskから順に次のphaseで行う。

1. **文書訂正**: 本節と `docs/guides/codex.md` を公式仕様および実測に合わせる。
2. **sandbox runtime**: Dockerfileへdistribution提供の `bubblewrap` を追加してsetuidを設定し、composeのweb serviceへOpenAI公式構成に必要なcapabilityと `seccomp=unconfined` / `apparmor=unconfined` を追加する。
3. **RTK install検証**: agent非依存のRTK CLIをinstall後にテレメトリーを明示的に無効化し、`rtk --version` と `rtk gain` で検証する。install失敗やテレメトリー無効化の失敗を握りつぶさない。既存の `rtk init -g --auto-patch` はagent統合の設定であり、CLIの導入確認とは分離する。
4. **clean rebuild検証**: rebuild後に `bwrap`、Codex CLIのsandbox command、Codex VS Codeのfresh session、dummy credentialのdeny、`rtk --version`、`rtk gain` を確認する。

却下案:

- `danger-full-access` または `--dangerously-bypass-approvals-and-sandbox`: credential denyの完了条件を満たさない。
- `bubblewrap` のpackage追加だけ: 現在のcontainerでは `unshare --user` が `Operation not permitted` となるためruntime権限の不足が残る。
- RTK install失敗のwarning継続: rebuildが成功したように見えたままCLIが欠落する今回の状態を再発させる。

### `.codex/config.toml` の読込先

**対応済み**。codex-cli 0.154.0 は、repository の `.codex/config.toml` を project 設定として読み込まない。`codex --strict-config doctor` の実測:

| 状態                                        | denied-read rules | glob rules | glob scan max depth |
| ------------------------------------------- | ----------------- | ---------- | ------------------- |
| repository の `.codex/config.toml` のみ     | 0                 | 0          | unbounded           |
| 同じ内容を `$CODEX_HOME/config.toml` へ配置 | 11                | 8          | 8                   |

設定内容自体は妥当で、`CODEX_HOME` に置けば期待どおりの rule 数になる。読み込まれないのは配置場所が理由である。doctor は `config.toml` の探索先を `~/.codex/config.toml` のみと報告し、`[projects."<path>"]` を `-c` で与えても変化しない。binary 内の `ProjectConfig` struct は要素が `trust_level` の1つだけで、repository 直下の `.codex/config.toml` は external agent migration の検出対象としてのみ参照される。

影響は permission 層が既定値のまま無効化されることである。現状の Codex には `.env` の deny が一切効いていない。`approval_policy = "on-request"` も既定値と同じため、実質的に project 固有の防御が存在しない。

却下案 7 は「`CODEX_HOME/config.toml` への初回copyは設定と実行時設定が乖離する」として退けたが、読み込まれる場所がそこだけである以上、方針の再検討が必要だった。当初検討した案:

1. **採用**。`.codex/config.toml` を正本のまま、setup script で `$CODEX_HOME/config.toml` へ copy する。
2. Codex 側の permission 設定を諦め、`approval_policy` の承認と Claude 側 deny のみに依存する。`.codex/config.toml` は削除する。
3. Codex CLI が repository 設定を読む仕様になるまで保留し、既知の制約として記録する。

案1を一時採用したが、Codexがcopy先へtrustとTUI状態を追記し、原本と実効設定が再び乖離した。このためcopyを廃止し、`.codex/config.toml` を `$CODEX_HOME/config.toml` へread-only bind mountする方式へ置き換えた。

旧copy方式での実測:

```bash
install -m 600 .codex/config.toml "${codex_home}/config.toml"   # setup-devcontainer.sh
```

copy 後の `codex --strict-config doctor` は `config.toml parse ok`、denied-read rules 11件、glob rules 8件、glob scan max depth 8 を報告した。copy 前は 0 / 0 / unbounded だった。

read-only mount方式では `$CODEX_HOME/config.toml` が原本そのものを参照するため同期操作は不要で、Codexによる追記も拒否される。次回rebuild後にmountのread-only属性とCLI / IDE拡張からの読込を実測する。

### 撤回した `proseWrap: "never"`

soft wrap 方針を formatter で機械的に強制する意図で `.prettierrc` に `proseWrap: "never"` が追加されていたが、本PRの範囲では撤回した。この設定は本計画のどのphaseにも含まれていない。

撤回の理由は影響範囲が意図より広いこと。

- 折り返された文章行を強制的に1行へ結合するため、`.github/ISSUE_TEMPLATE/bug_report.md` の OS / Browser / Version という記入欄が1行に潰れる。追跡済みファイルであり CI の lint job が落ちる。
- Markdown tableのcolumn paddingも同時に無効化するため、既存のdev noteとguideほぼ全てが再整形対象になる。

soft wrap 方針そのものは `AGENTS.md` の規約と devcontainer の `editor.wordWrap` で維持する。formatter での強制は、影響範囲を切り分けた別PRで検討する。

## クロスレビュー findings（1回目）

Claude の `/code-review` による指摘。全件を手元で再現確認し、ユーザーの選択に基づき4件すべて対応した。

### Severe

1. **Vitest `clearMocks` の記述が正しい内容から誤った内容へ反転した** — 修正済み

   `docs/guides/agent-rules/testing.md` は「`clearMocks` の default は `false`」と書いていたが、install 済み vitest 5.0.0 の default は `clearMocks: true`（`defaults` chunk で確認）。`vite.config.ts` でも上書きしていない。HEAD 時点の記述が正しく、Phase 1 の「Vitestの `clearMocks` defaultに関する誤記を修正する」が、誤記でなかった記述を誤記へ書き換えていた。agent が不要な `vi.clearAllMocks()` を追加する方向へ誘導するため、`true` と「`vi.clearAllMocks()` を追加しない」の記述へ戻した。

2. **`.claude/settings.json` の deny 縮小が devcontainer 以外の環境にも適用される** — revert 済み

   `~/.ssh` の `denyRead` と `Read(**/*.pem)`、`Read(**/*.key)`、`Read(**/secrets/**)`、`Read(**/config/credentials.json)` を削除した根拠は「この devcontainer には存在しない / mount しない」だったが、このファイルはproject scopeでcommitされるため、host clone、Codespaces、cloud agentにも適用される。それらの環境では `~/.ssh` が実在する。

   設計 §1 と却下案 8 の方針は devcontainer 限定の前提に立っており、設定の適用範囲と一致しない。削除した5件を戻し、`.env*` と Claude credential file の deny は追加のまま維持した。devcontainer 固有の緩和が必要になった場合は `.claude/settings.local.json` 側へ置く。

### Moderate

3. **`install -d` の失敗が `pnpm install` の実行前に script 全体を止める** — 修正済み

   `set -euo pipefail` 下でこの行だけが非guardであり、同 script の他のinstall行はすべて `|| echo ... continuing` を持っていた。mount の所有者が不一致の場合に exit 1 となり、`postCreateCommand` が中断して `node_modules` のない container が残る。`install -d` と `chmod 600` の両方を非blockにした。書き込み不可pathでの simulation で、修正前は中断、修正後は `pnpm install` へ到達することを確認した。

### Minor

4. **単文 `if` の brace 必須ルールが設定へ移されず消えた** — 復帰済み

   HEAD の `## Syntax` にあった「**Braces**: always for single-statement `if` blocks」が `## Error and Type Clarity` への改称時に落ちていた。`.oxlintrc.json` と `eslint.config.mjs` に `curly` 相当の設定はないため、linter へ移すのではなく文章として戻した。

## クロスレビュー findings（2回目、commit 5d9c78c0 に対して）

Claude による指摘。全件を container 内で実測確認し、ユーザーの選択に基づき対応した。

### Critical

1. **repository の `.codex/config.toml` が読み込まれておらず、Codex の permission 層が無効だった** — 修正済み

   1回目の finding 2 で Claude 側の deny を戻した一方、Codex 側は設定そのものが適用されていなかった。当初はsetup scriptによるcopyで解消し、その後、原本との乖離を防ぐread-only bind mountへ置き換えた。別節「`.codex/config.toml` の読込先」を参照。

### Severe

2. **Claude credential file の deny が sandbox 層だけで Read tool 層に無い** — 修正済み

   `~/.claude/.credentials.json` は `sandbox.filesystem.denyRead` にあるが `permissions.deny` の `Read(...)` には無く、`.env` だけが両層に入っていた。sandbox は bash 経路を止めるが Read tool 経路は止めない。`Read(~/.ssh/**)` と `Read(~/.claude/.credentials.json)` を `permissions.deny` へ追加した。

3. **Codex の deny 対象が Claude 側と非対称** — 修正済み

   `.codex/config.toml` の deny は `.env*` と `~/.codex/auth.json` だけで、mount される `~/.claude/.credentials.json` と workspace 内の `secrets/**`、`config/credentials.json`、`*.pem`、`*.key` が抜けていた。1回目の finding 2 の論拠（committed な設定は host clone や cloud agent にも適用される）は `.codex/config.toml` にも等しく当たるため、Claude 側に合わせて追加した。`codex --strict-config doctor` で denied-read rules 11件、glob rules 8件を確認した。

4. **`bubblewrap` がどちらの agent にも使われていない** — 誤りのため撤回

   CodexのLinux sandboxで使用される。別節「`bubblewrap` 削除判断の撤回」を参照。

### Moderate

5. **`initializeCommand` の `chmod 700` が Windows host でコンテナ作成を止める** — 削除済み

   `initializeCommand` は host のシェル（Windows では cmd.exe）で実行されるため `chmod` が command not found となり、非0終了で container 作成が中断する。setup script 側の `install -d -m 700` が同じことを container 内で行っており冗長だったため、`chmod` を削除した。

6. **`set -u` 下の `${CODEX_HOME}` は `|| echo` で守れない** — 修正済み

   unbound variable はその行で shell 自体が終了するため `||` が発火しない。1回目の finding 3 と同じ「`pnpm install` に到達しない」クラスが経路を変えて残っていた。`codex_home="${CODEX_HOME:-/home/node/.codex}"` を挟んで解消した。

7. **Phase 3 の rules / skills 共有の検証が Claude 側だけだった** — 追加検証済み

   symlink 解決は Claude 側の証跡にすぎなかった。`codex debug prompt-input` の skill roots に `/usr/src/app/.agents/skills` が含まれ、project固有skill 4件が列挙されることを確認して Codex 側も成立を確かめた。

### Minor

8. **`.dockerignore` の `.env` 除外の効果範囲の記述が不正確** — 修正済み

   設計 §1 を書き直し、`.dockerignore` は image への焼き込みだけを防ぎ、bind mount 経由の参照は deny 側でしか防げないことを明記した。`.git` 除外は build context 削減のみが目的である点も追記した。

9. **`CONTRIBUTING.md` の Superpowers の参照リンクが消えていた** — 復帰済み

10. **`CONTRIBUTING.md` の SSH 節が冗長** — 簡素化済み

    OS別の `ssh-add` 表と鍵探索手順を削除し、`~/.ssh/config` の `AddKeysToAgent yes` 方式に一本化した。macOS は `ssh-agent` が launchd で自動起動するため起動操作が不要、Windows はサービスが既定で無効なため初回のみ有効化が必要という差だけを残した。

### 併せて適用した簡素化

- `AGENTS.md` の Architecture 表を layer 一覧の1行へ縮小した。各 layer の制約は `coding-style.md` の layer 表が正本で、3重管理になっていた。
- plan の「SSH agent forwarding の確認結果」を結論と `CONTRIBUTING.md` への参照へ圧縮した。
- `.codex/config.toml` の `".env"` と `"**/.env"` の重複は、glob 実装差への保険である理由をコメントで残した。
- `shell_environment_policy.ignore_default_excludes = false` の扱いは別途報告する。

## 完了条件

- [x] Claude Code / Codexの両方を選択でき、片方のinstall失敗だけでは環境構築が止まらない。両CLIのPATH上での起動と、各install失敗時に後続処理へ進むことを確認済み。
- [x] Codex状態が `~/.codex-devcontainer/AtCoderNoviSteps` に分離される。
- [ ] `.codex/config.toml` がGit管理のCodex project設定の正本であり、`CODEX_HOME/config.toml` へのread-only mountを通じて直接適用される。設定変更済みで、次回rebuild後の実測待ち。
- [x] SSH秘密鍵はcontainerへmountされず、`.env` とproject scopeでdenyしたcredentialをagentが読めない。秘密鍵非mount、SSH agent forwarding、Claude denyに加え、Codexがdeny対象を読み取り不能なmountへ置換することを確認済み。
- [x] `.env` やlocal設定がDocker imageへ入らない。
- [x] SuperpowersとMCPが暗黙に有効化されない。
- [x] `docs/guides/agent-rules/` と `.agents/skills` が単一ソースになり、Claude Code / Codexの両方から利用できる。
- [x] `AGENTS.md`、共通rules / skills、`CONTRIBUTING.md`、関連guideが簡潔で現状と矛盾しない。
- [x] 大規模・重要変更だけクロスレビューが必須になる。
- [ ] Codex CLI / VS Code拡張の両方がLinux sandboxを初期化できる。
- [x] RTK CLIがPATH上に存在し、`rtk --version` と `rtk gain` が成功する。

## 参考資料

- [Codex project instructions (AGENTS.md)](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex skills](https://learn.chatgpt.com/docs/build-skills)
- [Codex command rules](https://learn.chatgpt.com/docs/agent-configuration/rules)
- [Codex project configuration](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Codex permissions](https://learn.chatgpt.com/docs/permissions)
- [Codex environment variables](https://learn.chatgpt.com/docs/config-file/environment-variables)
- [Codex sandbox](https://learn.chatgpt.com/docs/sandboxing)
- [Codex secure devcontainer](https://github.com/openai/codex/blob/main/.devcontainer/README.md)
- [VS Code: Sharing Git credentials](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials)
- [Docker build context](https://docs.docker.com/build/concepts/context/)
- [Claude Code sandboxing](https://code.claude.com/docs/en/sandboxing)
