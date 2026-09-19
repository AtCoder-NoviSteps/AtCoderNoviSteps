# Survey: #4033 以降に Claude / Codex から commit できない問題

Issue: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/4059

## 症状

- Claude Code / Codex 経由の Bash コマンドがすべて `bwrap: setuid use of bubblewrap is not supported` で失敗する。
- `git commit` だけでなく `gh`・`ls` なども含め、Bash が一切動かない。

## 結論

- Debian stable のセキュリティ更新で bubblewrap 0.12.0 が入り、setuid で bwrap を動かす方式が上流で廃止されていた。
- `Dockerfile` の `chmod u+s /usr/bin/bwrap` がこの廃止済みの使い方に該当し、コンテナの再ビルド後に bwrap が起動直後に終了するようになった。
- 設定ミスというより、上流の方針変更とバージョン未固定の `apt-get install` が重なったことが原因。

```dockerfile
RUN apt-get update \
    && apt-get -y install --no-install-recommends bubblewrap fish \
    && chmod u+s /usr/bin/bwrap \
    && rm -rf /var/lib/apt/lists/*
```

## 根本原因

### 1. bwrap の 2 つの動作方式

| 方式                | 仕組み                                                                       | 現状       |
| ------------------- | ---------------------------------------------------------------------------- | ---------- |
| user namespace 方式 | 一般ユーザーのままカーネルの unprivileged user namespace で namespace を作る | 現在の標準 |
| setuid 方式         | `chmod u+s` で root 権限付きで起動し、その権限で namespace を作る            | 廃止       |

- Claude Code 公式ドキュメントも bubblewrap を "the unprivileged sandboxing tool" と説明している。
- setuid 方式は user namespace が使えない古いカーネル向けの後方互換手段だった。

### 2. 上流 bubblewrap での廃止（公式リリースノート）

- 0.11.2（2026-04）: CVE-2026-41163（setuid で入れた bwrap に ptrace で割り込み、サンドボックス準備処理を乗っ取れる）を受けて setuid を非推奨化した。
  - 新しいビルドオプション `-Dsupport_setuid` の既定値は false で、"Binaries built with this will refuse to run if made setuid."
- 0.12.0（2026-08-26）: setuid 対応を完全に削除した。
  - "This version removes the support for building a setuid bubblewrap. ... basically all modern linux distributions now support unprivileged user namespaces"

今回のエラーは `bubblewrap.c` の `acquire_privs()` から出ている。

```c
/* Are we setuid ? */
if (real_uid != euid)
  {
    /* Historically we supported this, but now we only do user namespaces */
    die ("setuid use of bubblewrap is not supported");
  }
```

- setuid ビットが付いていると実 UID（node）と実効 UID（root）が食い違い、bwrap はそれを検知して即終了する。

### 3. 私たちの環境に入った経路（Debian security tracker）

- 2026-08-27: DSA-6472-1 で trixie-security に `bubblewrap 0.12.0-1~deb13u1` が配信された。
  - 修正対象は CVE-2026-87766（サンドボックス準備中に親ディレクトリのシンボリックリンクをたどり、ホスト側へ書き込めてしまう）。
  - Debian は stable にもかかわらずメジャー更新の 0.12.0 をそのまま入れた（bookworm には修正が大がかりすぎるとして backport されていない）。
- `Dockerfile` は `apt-get install bubblewrap` でバージョンを固定していない。
  - そのため、ビルドした日によって 0.11.x（setuid で動く）と 0.12.0（setuid だと即終了）のどちらが入るかが変わる。

### 4. Bash が全滅する理由（Claude Code 公式ドキュメント）

- Linux では Bash コマンドを 1 つずつ bwrap で包んで実行する。
- `.claude/settings.json` は `allowUnsandboxedCommands: false`（公式ドキュメント上は Strict sandbox mode）。
  - この設定では "every command Claude runs must run sandboxed" となり、サンドボックスの外で再実行する逃げ道がない。
- よって bwrap の起動自体が失敗すると、個別コマンドの許可設定とは無関係にすべての Bash が失敗する。
- Codex も同じ `/usr/bin/bwrap` を使うため、両方同時に影響を受ける。

### 5. setuid が実際に回避していたもの（当初の「setuid は不要」は誤り）

- setuid を外すと、Claude の Bash は `bwrap: Can't mount proc on /proc: Operation not permitted` で失敗するようになった。
- user namespace 方式では、カーネルは既存の `/proc` がすべて見えている場合にしか新しい procfs のマウントを許さない。
- Docker は `/proc/kcore` などをマスク（上書きマウント）しているため、この条件を満たせず EPERM になる。
- setuid 方式では bwrap がコンテナの root 権限（`SYS_ADMIN`）で動くため、この制約を受けずに `/proc` をマウントできていた。
- Claude Code 公式ドキュメントの Troubleshooting にも同じ症状が載っている: "in an unprivileged container, bubblewrap can't mount a fresh `/proc` filesystem ... Set `enableWeakerNestedSandbox` to `true` so the inner sandbox bind-mounts the container's existing `/proc` instead."
- つまり setuid は「コンテナ内で `/proc` をマウントする」ための回避策として機能していた。

## 現環境での確認結果（2026-09-19）

```bash
$ cat /etc/debian_version; bwrap --version
13.6
bubblewrap 0.12.0
```

- Debian 13（trixie）上で bubblewrap 0.12.0 が入っていることを確認した。上記の根本原因と一致する。

## #4034 時点で動いていた理由（推測）

- #4034 のマージは 2026-09-13 で、DSA の配信（2026-08-27）より後。
- PR の作業中（8/27 より前）にビルドしたイメージ、またはビルドキャッシュを使っていたため、setuid 対応の 0.11.x が残っていたと推測している。

## setuid を外した後に出た 2 つのエラー

setuid を外すと、Claude と Codex でそれぞれ別の問題が表に出た。

### Claude: `Can't mount proc on /proc: Operation not permitted`

- 原因は上記 5。コンテナ内で新しい `/proc` をマウントできない。
- 案 A（公式ドキュメントの対処）: `.claude/settings.json` に `sandbox.enableWeakerNestedSandbox: true` を追加する。
  - bwrap は新しい `/proc` をマウントせず、コンテナの `/proc` を bind mount する。
  - 公式ドキュメントの注意書き: "considerably weakens security and should only be used when additional isolation is otherwise enforced." この環境ではコンテナ自体が外側の隔離境界になる。
- 案 B: `compose.yaml` の `security_opt` に `systempaths=unconfined` を追加し、Docker による `/proc` のマスクをやめる。
  - Claude のサンドボックスの強度は保てるが、コンテナ内の全プロセスからマスク対象だった `/proc` のパスが見えるようになる。

### Codex: `Can't write data to file /usr/src/app/.env.example: Bad file descriptor`

- Codex 側の既知の未修正バグ openai/codex#43929: ワークスペース直下で deny ルールにマッチするファイルが 2 つ以上あると、Codex が起動時に失敗する（0.152.1 / 0.153.4 で再現が報告されている）。
- `.codex/config.toml` の `.env` / `.env.*` に、`.env` と `.env.example` の 2 ファイルがマッチしている。
- bwrap の setuid 問題とは別件で、setuid の問題で起動前に止まっていたため今まで見えていなかったと推測している（#4034 の時点で動いていた理由は未確認）。
- 対処候補: 上流の修正を待つか、deny にマッチする実ファイルを 1 つ以下に絞る（例: 秘密情報を含まないテンプレートの `.env.example` を deny 対象から外す）。

## 修正方針

- `Dockerfile` から `&& chmod u+s /usr/bin/bwrap \` の 1 行を削除する（bubblewrap 0.12.0 では setuid 方式自体が使えないため必須）。
- Claude: 案 A または案 B で `/proc` の問題に対処する。
- Codex: openai/codex#43929 への対処を決める。

## 却下した代替案

- `allowUnsandboxedCommands: true` にする: サンドボックスの外での実行を許すことになり、`denyRead` による認証情報の保護が弱まる。
- `sandbox.enabled: false` にする: 同上。原因を直さずに防御を外すだけになる。
- bubblewrap を 0.11.x に固定する: 廃止済みの setuid 方式を延命するだけで、CVE-2026-87766 の修正も受けられなくなる。

## 未確認事項

- 修正後に Claude / Codex の両方で `git commit` が通ることを確認する必要がある。

## 参考

- bubblewrap releases: https://github.com/containers/bubblewrap/releases
- bubblewrap source (`acquire_privs`): https://github.com/containers/bubblewrap/blob/main/bubblewrap.c
- Debian tracker: https://tracker.debian.org/pkg/bubblewrap
- DSA-6472-1: https://security-tracker.debian.org/tracker/DSA-6472-1
- CVE-2026-41163: https://security-tracker.debian.org/tracker/CVE-2026-41163
- CVE-2026-87766: https://security-tracker.debian.org/tracker/CVE-2026-87766
- Claude Code sandboxing: https://code.claude.com/docs/en/sandboxing
- Claude Code settings reference（`sandbox.enableWeakerNestedSandbox`）: https://code.claude.com/docs/en/settings-reference
- openai/codex#43929: https://github.com/openai/codex/issues/43929
