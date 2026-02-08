# DevContainer で Claude Code を利用するための設定変更

## Context

DevContainer 内で Claude Code (CLI + VSCode 拡張) を利用したい。`pnpm install -g @anthropic-ai/claude-code` を追加するだけでは不十分であり、以下の対応が必要。ファイアウォールは導入せず、認証は `claude login` で行う。

## 「pnpm install -g だけで十分か？」: 不十分な理由

1. **VSCode 拡張が未追加** — エディタ上で Claude Code を使うには `anthropic.claude-code` 拡張が必要
2. **設定の永続化がない** — コンテナ再構築のたびに認証情報・設定が消失する。`~/.claude` をボリュームマウントで永続化すべき
3. **メモリ不足のリスク** — Claude Code は大量メモリを消費。公式は `NODE_OPTIONS=--max-old-space-size=4096` を設定
4. **インストール場所** — ルート `Dockerfile` は複数人で共有しており Claude Code を使わない開発者もいるため変更しない。`postCreateCommand` はコンテナ作成時のみ実行されるため devcontainer 側で制御するのに適切
5. **npm vs pnpm** — グローバルインストールは `npm` が安定（公式も `npm` を使用）

## 公式サンプルとの比較: 取り入れる / 取り入れない

| 公式の要素                               | 判断     | 理由                                               |
| ---------------------------------------- | -------- | -------------------------------------------------- |
| `anthropic.claude-code` 拡張             | **採用** | 必須                                               |
| `~/.claude` ボリュームマウント           | **採用** | `claude login` の認証を永続化                      |
| `CLAUDE_CONFIG_DIR` 環境変数             | **採用** | Claude Code が設定ディレクトリを認識               |
| `NODE_OPTIONS=--max-old-space-size=4096` | **採用** | メモリ不足防止                                     |
| `postCreateCommand` で `npm install -g`  | **採用** | ルート Dockerfile を変更せず devcontainer 側で制御 |
| ファイアウォール (init-firewall.sh)      | 不採用   | 個人開発では過剰                                   |
| zsh + powerline10k                       | 不採用   | 好みの問題。既に fish を導入済み                   |
| git-delta                                | 不採用   | Claude Code に直接関係なし                         |

---

## 変更対象ファイルと内容

### 1. `.devcontainer/devcontainer.json` (修正)

#### (a) postCreateCommand を追加

ルート `Dockerfile` は複数人で共有しているため変更しない。コンテナ作成時のみ実行される `postCreateCommand` で Claude Code をインストール:

```json
"postCreateCommand": "npm install -g @anthropic-ai/claude-code"
```

#### (b) extensions に追加

```json
"anthropic.claude-code"
```

#### (c) mounts に追加（~/.claude をホストからバインドマウント）

ホストの `~/.claude` をバインドマウントで共有。ホスト側で `claude login` した認証情報がコンテナ内でも使える。

```json
"source=${localEnv:HOME}/.claude,target=/home/node/.claude,type=bind,consistency=cached"
```

> **当初は Docker ボリューム (`type=volume`) を使用していたが、コンテナ内での `claude login` が失敗するため変更した。** 詳細は「教訓」セクション参照。

#### (d) containerEnv を追加

compose.yaml の `environment` とは別に、devcontainer 固有の環境変数として設定:

```json
"containerEnv": {
  "NODE_OPTIONS": "--max-old-space-size=4096 --dns-result-order=ipv4first",
  "CLAUDE_CONFIG_DIR": "/home/node/.claude"
}
```

- `--max-old-space-size=4096`: メモリ不足防止（既存の dev server 等にも影響するが、4096MB は開発環境として妥当）
- `--dns-result-order=ipv4first`: コンテナ内で認証が必要な場合の IPv4/IPv6 ミスマッチ対策

---

## 変更しないファイル

- `Dockerfile` — 複数人で共有しているため変更しない。Claude Code のインストールは `postCreateCommand` で制御
- `compose.yaml` — API キーの環境変数追加は不要（`claude login` で認証）
- `init-firewall.sh` — 作成しない（ファイアウォール不採用）

---

## 認証手順（初回のみ）

**ホスト（Mac ターミナル）で実行:**

```bash
npm install -g @anthropic-ai/claude-code  # 未インストールの場合
claude login
```

ホストの `~/.claude` がバインドマウントでコンテナに共有されるため、コンテナ内での追加認証は不要。

## 検証方法

1. `Dev Containers: Rebuild Container` でコンテナをリビルド
2. ターミナルで `claude --version` → バージョンが表示されること
3. `claude login` で認証
4. VSCode のアクティビティバーに Claude Code アイコンが表示されること
5. コンテナを再起動 → `claude --version` で設定が保持されていること

## 教訓

- **CLI インストール ≠ 利用可能**: VSCode 拡張・設定永続化・メモリ設定が揃って初めて実用的になる。公式サンプルを事前に確認すべき
- **共有 Dockerfile に個人ツールを入れない**: `postCreateCommand` で devcontainer 利用者だけに閉じた制御ができる。`postCreateCommand` はコンテナ作成時のみ実行され、再起動のたびには走らない
- **公式サンプルは全部入りなので取捨選択が必要**: ファイアウォール・zsh・git-delta など、Claude Code の動作に直接関係しないものは省いてシンプルに保つ
- **コンテナ内での `claude login` は失敗しやすい**: OAuth コールバックがランダムポートを使うため、コンテナ→ホストのポート転送が間に合わない。さらに IPv4/IPv6 ミスマッチも起きる。対策として、ホストで認証し `~/.claude` をバインドマウントで共有する方式が確実

## 参考

- [Official settings - Claude Code](https://github.com/anthropics/claude-code/tree/main/.devcontainer)
